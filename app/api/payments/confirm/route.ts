import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';

/**
 * 결제 승인 → 잠금 해제 기록. (PG 연동 시 활성화)
 *
 * 사업자등록·통신판매업 신고 후 토스페이먼츠/포트원 키를 발급받으면:
 *  1) 환경변수 PAYMENTS_SECRET_KEY 설정
 *  2) 아래 TODO 부분에 PG 승인 API 호출 + 금액(SITE.pricePerPet) 일치 검증 추가
 *  3) 프론트 Paywall을 실제 결제위젯으로 교체하고, 결제 완료 콜백에서 이 라우트 호출
 *
 * 핵심 원칙(절대 위반 금지):
 *  - 클라이언트가 보낸 "결제 성공"을 신뢰하지 말 것. 반드시 서버에서 PG 승인 API로 재검증.
 *  - 금액이 SITE.pricePerPet 와 일치할 때만 unlock 기록.
 *  - unlocks.payment_key UNIQUE 로 중복결제(이중청구/이중해금) 멱등 보장.
 */
export async function POST(req: Request) {
  // PG 키가 아직 없으므로 비활성화 상태.
  if (!process.env.PAYMENTS_SECRET_KEY) {
    return NextResponse.json(
      { error: '결제 기능 준비 중입니다.', code: 'payments_not_configured' },
      { status: 501 },
    );
  }

  try {
    const { paymentKey, orderId, amount, petId } = await req.json();
    if (!paymentKey || !orderId || !petId) {
      return NextResponse.json({ error: '필수 결제 정보가 없습니다.' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    // 본인 소유 펫 확인
    const { data: pet } = await supabase.from('pets').select('id').eq('id', petId).single();
    if (!pet) return NextResponse.json({ error: '반려동물을 찾을 수 없습니다.' }, { status: 404 });

    // 금액 위변조 방지: 서버가 정한 가격만 인정
    if (Number(amount) !== SITE.pricePerPet) {
      return NextResponse.json({ error: '결제 금액이 올바르지 않습니다.' }, { status: 400 });
    }

    // TODO(PG): 토스페이먼츠 예시 —
    //   const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    //     method: 'POST',
    //     headers: {
    //       Authorization: 'Basic ' + Buffer.from(process.env.PAYMENTS_SECRET_KEY + ':').toString('base64'),
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ paymentKey, orderId, amount }),
    //   });
    //   const pay = await res.json();
    //   if (!res.ok || pay.status !== 'DONE' || pay.totalAmount !== SITE.pricePerPet) {
    //     return NextResponse.json({ error: '결제 검증에 실패했습니다.' }, { status: 402 });
    //   }
    const pay: any = null; // ← PG 승인 응답으로 교체

    // 검증 통과 시에만 잠금 해제 기록 (service_role, payment_key 멱등)
    const admin = createAdminClient();
    const { error } = await admin.from('unlocks').upsert(
      {
        user_id: user.id,
        pet_id: petId,
        amount: SITE.pricePerPet,
        provider: 'toss',
        order_id: orderId,
        payment_key: paymentKey,
        status: 'paid',
        receipt_url: pay?.receipt?.url ?? null,
        raw_response: pay,
      },
      { onConflict: 'pet_id' },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[payments/confirm] error:', e);
    return NextResponse.json({ error: '결제 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
