import { NextResponse } from 'next/server';
import { finalizeOrder } from '@/lib/finalizeOrder';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * 결제 확인 후 리포트 생성. (로그인 불필요 — 비밀 토큰으로 식별)
 * 검증·선점·생성·메일은 lib/finalizeOrder.ts — 관리자 「리포트 만들기」도 같은 함수를 쓴다.
 * 응답 코드: 200 완성 · 402 미결제 · 503 결제사 조회 실패 · 500 gen_failed · 504 생성 지연
 */
export async function POST(req: Request) {
  try {
    const { token, paymentId } = await req.json();
    if (!token || typeof token !== 'string') return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 });
    const r = await finalizeOrder(token, typeof paymentId === 'string' ? paymentId : null);
    return NextResponse.json(r.body, { status: r.status });
  } catch (e: any) {
    console.error('[diagnose/finalize] error:', e);
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
