import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * 포트원 V2 웹훅 — 결제 완료 시 서버 대 서버로 호출된다.
 * 사용자가 결제 직후 브라우저를 닫거나 리디렉션이 끊겨도
 * 여기서 finalize를 대신 호출해 "돈은 냈는데 결과가 없는" 상황을 막는다.
 *
 * 보안: 서명 검증 대신 finalize가 포트원 결제조회 API로 상태·금액·결제ID 바인딩을
 * 독립 재검증하므로, 위조 웹훅으로는 어떤 진단도 무료로 만들 수 없다.
 * (웹훅은 트리거일 뿐, 신뢰 근거가 아니다)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const type: string = body?.type ?? '';
    const paymentId: string | undefined = body?.data?.paymentId ?? body?.payment_id;

    // 결제 완료 이벤트만 처리 (취소·가상계좌 등은 무시하고 200)
    if (!paymentId || !/^Transaction\.Paid$/i.test(type)) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    // 우리 결제ID 형식(mypet-{토큰 앞 24자})이 아니면 무시
    const m = /^mypet-([0-9a-f]{24})$/.exec(paymentId);
    if (!m) return NextResponse.json({ ok: true, skipped: true });

    // 토큰 앞 24자로 전체 토큰 조회
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from('diagnoses')
      .select('token, status')
      .like('token', `${m[1]}%`)
      .limit(2);
    if (!rows || rows.length !== 1) return NextResponse.json({ ok: true, skipped: true });
    if (rows[0].status === 'done') return NextResponse.json({ ok: true });

    // finalize 재사용 (검증·선점·생성·멱등 처리 전부 포함)
    const res = await fetch(`${SITE.url}/api/diagnose/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rows[0].token, paymentId }),
    });
    // 생성 실패여도 200 반환 — 포트원 재시도 폭주 방지 (실패 상태는 DB에 기록됨)
    return NextResponse.json({ ok: res.ok });
  } catch (e) {
    console.error('[portone/webhook] error:', e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
