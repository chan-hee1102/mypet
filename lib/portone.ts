/**
 * 포트원(V2) 결제 조회 — 결제 확인(finalize)과 관리자 주문 화면이 같이 쓴다.
 *
 * 결제ID는 클라이언트가 `mypet-{토큰 앞 24자}` 규칙으로 만든다. 서버도 같은 규칙으로 다시 계산해
 * 다른 주문의 결제를 가져다 쓰는 것을 막는다.
 */

export const paymentIdOf = (token: string) => `mypet-${token.slice(0, 24)}`;

/** 관리자 화면에 보여 줄 만큼만 추린 결제 정보 */
export interface PgPayment {
  status: string;              // READY · PAID · FAILED · CANCELLED · PARTIAL_CANCELLED …
  amount: number | null;
  paidAt: string | null;
  email: string | null;
  phone: string | null;        // 가운데를 가린 값
  name: string | null;
}

export type PgLookup =
  | { ok: true; payment: PgPayment }
  | { ok: false; reason: 'no_secret' | 'not_found' | 'error' };

function maskPhone(p: unknown): string | null {
  if (typeof p !== 'string' || !p) return null;
  const d = p.replace(/\D/g, '');
  if (d.length < 8) return '***';
  return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
}

export async function lookupPayment(paymentId: string, timeoutMs = 8000): Promise<PgLookup> {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) return { ok: false, reason: 'no_secret' };
  try {
    const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${secret}` },
      signal: AbortSignal.timeout(timeoutMs), // PG 조회가 걸려 함수 전체가 타임아웃되지 않게
      cache: 'no-store',
    });
    // 결제 건 자체가 없다 = 결제창을 열지 않았거나 중간에 닫았다
    if (res.status === 404) return { ok: false, reason: 'not_found' };
    if (!res.ok) return { ok: false, reason: 'error' };
    const p: any = await res.json();
    const name = typeof p?.customer?.name === 'string' ? p.customer.name : p?.customer?.name?.full ?? null;
    return {
      ok: true,
      payment: {
        status: String(p?.status ?? 'UNKNOWN'),
        amount: Number.isFinite(Number(p?.amount?.total)) ? Number(p.amount.total) : null,
        paidAt: typeof p?.paidAt === 'string' ? p.paidAt : null,
        email: typeof p?.customer?.email === 'string' ? p.customer.email : null,
        phone: maskPhone(p?.customer?.phoneNumber),
        name: typeof name === 'string' ? name : null,
      },
    };
  } catch (e) {
    console.error('[portone] lookup error:', e instanceof Error ? e.message : e);
    return { ok: false, reason: 'error' };
  }
}
