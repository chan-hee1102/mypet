import { NextResponse } from 'next/server';
import { sendResultMail } from '@/lib/sendResultMail';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCareCard } from '@/lib/careAdvisor';
import { SITE } from '@/lib/site';
import { PetInput } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * 결제 확인 후 리포트 생성. (로그인 불필요 — 비밀 토큰으로 식별)
 *
 * 결제 검증:
 *  - PORTONE_API_SECRET 가 있으면 PortOne 결제 API로 status/amount 재검증(실결제).
 *  - 없으면 "샌드박스(테스트)" 모드로 통과 — 키 발급 전 전체 흐름 확인용.
 *    ⚠️ 실서비스 전 반드시 PortOne 키를 설정해 실제 결제 검증을 켜야 함.
 *
 * 응답 코드의 뜻 (ResultPending·pay/return이 이 구분에 기댄다):
 *  - 200 완성 · 402 결제 이력 없음(진짜 미결제) · 503 결제사 조회 실패(잠시 후 다시)
 *  - 500 gen_failed 생성 실패 · 504 다른 요청이 생성 중인데 오래 걸림
 *  ⚠️ 2026-09-26 전에는 결제사 조회가 타임아웃·5xx여도 402를 줘서, **돈을 낸 사람에게
 *     「아직 결제 전이에요」가 떴다.** 미결제만 402다.
 */
type Verify = { ok: true; provider: string } | { ok: false; status: 402 | 503; error: string };

async function verifyPayment(paymentId: string | null, token: string): Promise<Verify> {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) return { ok: true, provider: 'sandbox' }; // 키 없음 → 테스트 통과

  if (!paymentId) return { ok: false, status: 402, error: 'paymentId 누락' };
  // 결제ID는 클라이언트가 `mypet-${token앞24자}` 규칙으로 생성 — 동일 규칙으로 재계산해
  // 다른 진단의 결제를 재사용하는 공격을 차단한다.
  if (paymentId !== `mypet-${token.slice(0, 24)}`) {
    return { ok: false, status: 402, error: '결제 정보가 이 리포트와 일치하지 않습니다.' };
  }
  try {
    const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${secret}` },
      signal: AbortSignal.timeout(8000), // PG 조회가 행 걸려 함수 전체가 타임아웃되는 것 방지
    });
    // 결제 건 자체가 없다 = 결제창을 열지 않았거나 중간에 닫았다 → 진짜 미결제
    if (res.status === 404) return { ok: false, status: 402, error: '결제 이력이 없습니다.' };
    if (!res.ok) return { ok: false, status: 503, error: '결제사 조회 실패' };
    const pay: any = await res.json();
    if (pay?.status !== 'PAID') return { ok: false, status: 402, error: '결제가 완료되지 않았습니다.' };
    if (Number(pay?.amount?.total) !== SITE.pricePerPet) {
      console.error('[diagnose/finalize] amount mismatch', paymentId, pay?.amount?.total);
      return { ok: false, status: 402, error: '결제 금액이 일치하지 않습니다.' };
    }
    return { ok: true, provider: 'portone' };
  } catch (e) {
    console.error('[diagnose/finalize] PortOne verify error:', e);
    return { ok: false, status: 503, error: '결제 확인이 잠시 늦어지고 있어요.' };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const GEN_FAILED = { error: '리포트를 만들지 못했어요. 결제는 완료됐으니 다시 결제하지 마세요.', code: 'gen_failed' };

export async function POST(req: Request) {
  try {
    const { token, paymentId: rawPaymentId } = await req.json();
    if (!token || typeof token !== 'string') return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 });
    // 결제ID가 안 넘어와도(리디렉션 유실 등) 규칙으로 유도해 복구 가능하게.
    // 검증의 진실은 어차피 포트원 결제조회 API — 유도해도 보안 동일.
    const paymentId: string = rawPaymentId ?? `mypet-${token.slice(0, 24)}`;

    const admin = createAdminClient();
    const { data: dx } = await admin.from('diagnoses').select('*').eq('token', token).maybeSingle();
    if (!dx) return NextResponse.json({ error: '리포트 요청을 찾을 수 없습니다.' }, { status: 404 });

    // 이미 생성됨 → 멱등 반환
    if (dx.status === 'done' && dx.card) return NextResponse.json({ ok: true, token });
    // 좌초 복구: 생성 중 함수가 죽어 'generating'으로 3분 이상 방치된 건은 재시도 허용.
    // paid_at까지 같을 때만 되돌린다 — 동시에 두 요청이 복구를 시작해 둘 다 생성하는 것을 막는다.
    if (dx.status === 'generating' && dx.paid_at && Date.now() - new Date(dx.paid_at as string).getTime() > 3 * 60 * 1000) {
      await admin.from('diagnoses').update({ status: 'paid' })
        .eq('token', token).eq('status', 'generating').eq('paid_at', dx.paid_at);
      dx.status = 'paid';
    }

    // 결제 검증
    const v = await verifyPayment(paymentId, token);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: v.status });

    /*
      생성 선점 (원자적 상태 전이) — 리디렉션 복귀·웹훅·결과 페이지가 동시에 와도 생성은 1번만.
      'failed'도 다시 잡는다: 리포트는 거의 전부 데이터로 만들어서, 실패는 대개 일시적이다
      (결제는 이미 확인됐으니 다시 해 볼 이유가 충분하다).
      ⚠️ 2026-07-07 ~ 2026-09-26: 운영 DB의 status 제약에 'generating'이 없어서 **이 update가
         매번 제약 위반으로 실패했다.** 그런데 error를 보지 않고 「다른 요청이 생성 중」으로
         여겨 34초를 기다린 뒤 504를 줬다. 결제한 사람에게 리포트가 한 건도 만들어지지 않은 원인.
         이제 error는 바로 500으로 올린다(supabase/migrations/20260926_diagnoses_status_generating.sql).
    */
    const { data: claimed, error: claimErr } = await admin
      .from('diagnoses')
      .update({ status: 'generating', provider: v.provider, payment_id: paymentId, paid_at: dx.paid_at ?? new Date().toISOString() })
      .eq('token', token)
      .in('status', ['pending', 'paid', 'failed'])
      .select('token');
    if (claimErr) {
      console.error('[diagnose/finalize] claim error:', claimErr.message);
      return NextResponse.json(GEN_FAILED, { status: 500 });
    }
    if (!claimed || claimed.length === 0) {
      // 다른 요청이 생성 중 → 완료를 기다렸다가 같은 결과 반환 (60초 함수 한도 내에서만)
      for (let i = 0; i < 17; i++) {
        await sleep(2000);
        const { data: cur } = await admin.from('diagnoses').select('status, card').eq('token', token).maybeSingle();
        if (cur?.status === 'done' && cur.card) return NextResponse.json({ ok: true, token });
        if (cur?.status === 'failed') return NextResponse.json(GEN_FAILED, { status: 500 });
      }
      return NextResponse.json({ error: '만드는 데 시간이 걸리고 있어요.' }, { status: 504 });
    }

    // 리포트 생성 (데이터 카드 + 직접 적은 증상이 있을 때만 AI 한 조각)
    const input = dx.input as PetInput;

    let card;
    try {
      card = await generateCareCard(input);
    } catch (genErr: any) {
      console.error('[diagnose/finalize] generation error:', genErr?.message);
      await admin.from('diagnoses').update({ status: 'failed' }).eq('token', token);
      return NextResponse.json(GEN_FAILED, { status: 500 });
    }

    // 저장 + 사진 비움(개인정보 최소화)
    const { error: upErr } = await admin
      .from('diagnoses')
      .update({ card, status: 'done', photo_b64: null })
      .eq('token', token);
    if (upErr) {
      console.error('[diagnose/finalize] save error:', upErr.message);
      await admin.from('diagnoses').update({ status: 'failed' }).eq('token', token);
      return NextResponse.json(GEN_FAILED, { status: 500 });
    }

    /*
      결과 링크를 메일로 보낸다 — 브라우저를 닫았거나 리디렉션이 끊겨도 결과에 닿을 수 있게.
      ⚠️ await하되 실패는 삼킨다. 메일이 안 갔다고 결제 완료 응답을 되돌리면
         이용자는 돈을 냈는데 화면에서도 실패를 보게 된다.
      ⚠️ result_mailed_at으로 중복 발송을 막는다. finalize는 복구 경로에서 여러 번 불릴 수 있다.
    */
    if (dx.buyer_email && !dx.result_mailed_at) {
      const sent = await sendResultMail({
        to: dx.buyer_email as string,
        token,
        petName: (dx.input as { name?: string } | null)?.name ?? null,
      });
      if (sent) {
        await admin.from('diagnoses').update({ result_mailed_at: new Date().toISOString() }).eq('token', token);
      }
    }

    return NextResponse.json({ ok: true, token });
  } catch (e: any) {
    console.error('[diagnose/finalize] error:', e);
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
