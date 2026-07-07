import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCareCard } from '@/lib/careAdvisor';
import { SITE } from '@/lib/site';
import { PetInput } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * 결제 확인 후 진단 생성. (로그인 불필요 — 비밀 토큰으로 식별)
 *
 * 결제 검증:
 *  - PORTONE_API_SECRET 가 있으면 PortOne 결제 API로 status/amount 재검증(실결제).
 *  - 없으면 "샌드박스(테스트)" 모드로 통과 — 키 발급 전 전체 흐름 확인용.
 *    ⚠️ 실서비스 전 반드시 PortOne 키를 설정해 실제 결제 검증을 켜야 함.
 */
async function verifyPayment(paymentId: string | null, token: string): Promise<{ ok: boolean; provider: string; error?: string }> {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) return { ok: true, provider: 'sandbox' }; // 키 없음 → 테스트 통과

  if (!paymentId) return { ok: false, provider: 'portone', error: 'paymentId 누락' };
  // 결제ID는 클라이언트가 `mypet-${token앞24자}` 규칙으로 생성 — 동일 규칙으로 재계산해
  // 다른 진단의 결제를 재사용하는 공격을 차단한다.
  if (paymentId !== `mypet-${token.slice(0, 24)}`) {
    return { ok: false, provider: 'portone', error: '결제 정보가 이 진단과 일치하지 않습니다.' };
  }
  try {
    const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${secret}` },
    });
    const pay: any = await res.json();
    if (!res.ok) return { ok: false, provider: 'portone', error: 'PG 조회 실패' };
    const paid = pay?.status === 'PAID';
    const amount = pay?.amount?.total;
    if (!paid || Number(amount) !== SITE.pricePerPet) {
      return { ok: false, provider: 'portone', error: '결제 상태/금액 불일치' };
    }
    return { ok: true, provider: 'portone' };
  } catch (e) {
    console.error('[diagnose/finalize] PortOne verify error:', e);
    return { ok: false, provider: 'portone', error: '결제 검증 오류' };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  try {
    const { token, paymentId } = await req.json();
    if (!token) return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 });

    const admin = createAdminClient();
    const { data: dx } = await admin.from('diagnoses').select('*').eq('token', token).maybeSingle();
    if (!dx) return NextResponse.json({ error: '진단 요청을 찾을 수 없습니다.' }, { status: 404 });

    // 이미 생성됨 → 멱등 반환
    if (dx.status === 'done' && dx.card) return NextResponse.json({ ok: true, token });
    if (dx.status === 'failed') {
      return NextResponse.json(
        { error: '진단 생성에 실패했습니다. 결제는 완료됐으니 고객센터로 문의해 주세요.', code: 'gen_failed' },
        { status: 500 },
      );
    }

    // 결제 검증
    const v = await verifyPayment(paymentId ?? null, String(token));
    if (!v.ok) return NextResponse.json({ error: v.error || '결제 검증 실패' }, { status: 402 });

    // 생성 선점 (원자적 상태 전이) — 리디렉션 복귀와 웹훅이 동시에 도착해도 AI 생성은 1번만.
    const { data: claimed } = await admin
      .from('diagnoses')
      .update({ status: 'generating', provider: v.provider, payment_id: paymentId ?? null, paid_at: new Date().toISOString() })
      .eq('token', token)
      .in('status', ['pending', 'paid'])
      .select('token');
    if (!claimed || claimed.length === 0) {
      // 다른 요청이 생성 중 → 완료를 기다렸다가 같은 결과 반환
      for (let i = 0; i < 25; i++) {
        await sleep(2000);
        const { data: cur } = await admin.from('diagnoses').select('status, card').eq('token', token).maybeSingle();
        if (cur?.status === 'done' && cur.card) return NextResponse.json({ ok: true, token });
        if (cur?.status === 'failed') {
          return NextResponse.json(
            { error: '진단 생성에 실패했습니다. 결제는 완료됐으니 고객센터로 문의해 주세요.', code: 'gen_failed' },
            { status: 500 },
          );
        }
      }
      return NextResponse.json({ error: '생성이 오래 걸리고 있어요. 잠시 후 결과 링크를 새로고침해 주세요.' }, { status: 504 });
    }

    // AI 진단 생성 (RAG 품종 프로필 + 수의 근거 주입)
    const input = dx.input as PetInput;
    const image = dx.photo_b64 ? { data: dx.photo_b64 as string, mediaType: (dx.photo_mime as string) || 'image/jpeg' } : null;

    let card;
    try {
      card = await generateCareCard(input, image);
    } catch (genErr: any) {
      console.error('[diagnose/finalize] generation error:', genErr?.message);
      await admin.from('diagnoses').update({ status: 'failed' }).eq('token', token);
      return NextResponse.json(
        { error: '진단 생성에 실패했습니다. 결제는 완료됐으니 고객센터로 문의해 주세요.', code: 'gen_failed' },
        { status: 500 },
      );
    }

    // 저장 + 사진 비움(개인정보 최소화)
    const { error: upErr } = await admin
      .from('diagnoses')
      .update({ card, status: 'done', photo_b64: null })
      .eq('token', token);
    if (upErr) return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 });

    return NextResponse.json({ ok: true, token });
  } catch (e: any) {
    console.error('[diagnose/finalize] error:', e);
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
