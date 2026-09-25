import { isAdmin } from '@/lib/adminAuth';
import type { Order, OrderStatus, OrdersResponse } from '@/lib/admin-types';
import { finalizeOrder } from '@/lib/finalizeOrder';
import { lookupPayment, paymentIdOf } from '@/lib/portone';
import { sendResultMail } from '@/lib/sendResultMail';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 관리자 주문 — 목록(GET)과 주문 하나에 대한 조치(POST).
 *
 * 왜 포트원을 같이 보나: DB의 pending은 「결제창을 열었다」까지만 말해 준다. 2026-07-23 주문처럼
 * **돈은 나갔는데 DB가 pending인 건**은 결제사 기록과 대조해야만 보인다. 그래서 완성되지 않은
 * 최근 주문(90일·최대 25건)만 목록을 열 때 함께 조회한다. 완성된 주문은 받는 메일이 없을 때만 조회한다(호출 절약).
 */
const TOKEN_RE = /^[0-9a-f]{40}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PG_CHECK_DAYS = 90;
const PG_CHECK_MAX = 25;

type Row = {
  token: string;
  species: 'dog' | 'cat';
  input: { name?: string; breed?: string } | null;
  status: OrderStatus;
  amount: number | null;
  created_at: string;
  paid_at: string | null;
  buyer_email: string | null;
  result_mailed_at: string | null;
  provider: string | null;
};

function toOrder(r: Row): Order {
  return {
    token: r.token,
    species: r.species,
    petName: (r.input?.name ?? '').trim() || '(이름 없음)',
    breed: r.input?.breed?.trim() || null,
    status: r.status,
    amount: r.amount,
    createdAt: r.created_at,
    paidAt: r.paid_at,
    email: r.buyer_email,
    mailedAt: r.result_mailed_at,
    test: r.provider === 'sandbox',
    pg: null,
    pgReason: null,
  };
}

export async function GET() {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const db = createAdminClient();
  const { data, error } = await db
    .from('diagnoses')
    .select('token, species, input, status, amount, created_at, paid_at, buyer_email, result_mailed_at, provider')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const items = ((data ?? []) as Row[]).map(toOrder);

  const since = Date.now() - PG_CHECK_DAYS * 86_400_000;
  // 완성 안 된 주문 + 완성됐지만 받는 메일이 없는 실결제 주문(링크를 보낼 주소를 결제사 기록에서 찾으려고)
  const toCheck = items
    .filter((o) => (o.status !== 'done' || (!o.test && !o.email)) && Date.parse(o.createdAt) >= since)
    .slice(0, PG_CHECK_MAX);
  await Promise.all(
    toCheck.map(async (o) => {
      const r = await lookupPayment(paymentIdOf(o.token), 6000);
      if (r.ok) o.pg = r.payment;
      else o.pgReason = r.reason;
    }),
  );

  const body: OrdersResponse = { items, generatedAt: new Date().toISOString() };
  return Response.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
}

/**
 * 조치 — check(결제사 다시 조회) · generate(결제 확인 후 리포트 만들기) · mail(결과 링크 메일 보내기).
 * generate는 이용자 화면과 같은 finalizeOrder를 쓴다 — 결제사에서 PAID·금액이 확인될 때만 만든다.
 */
export async function POST(req: Request) {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? '');
  const action = String(body?.action ?? '');
  if (!TOKEN_RE.test(token)) return Response.json({ error: '주문 번호가 올바르지 않아요.' }, { status: 400 });

  if (action === 'check') {
    const r = await lookupPayment(paymentIdOf(token));
    return Response.json(r.ok ? { pg: r.payment } : { pg: null, pgReason: r.reason });
  }

  if (action === 'generate') {
    const r = await finalizeOrder(token);
    return Response.json(r.body, { status: r.status });
  }

  if (action === 'mail') {
    const db = createAdminClient();
    const { data: dx } = await db
      .from('diagnoses')
      .select('status, card, input, buyer_email')
      .eq('token', token)
      .maybeSingle();
    if (!dx) return Response.json({ error: '주문을 찾을 수 없어요.' }, { status: 404 });
    if (dx.status !== 'done' || !dx.card) return Response.json({ error: '리포트가 아직 없어요. 먼저 리포트를 만들어 주세요.' }, { status: 409 });
    const to = String(body?.to ?? dx.buyer_email ?? '').trim();
    if (!EMAIL_RE.test(to) || to.length > 254) return Response.json({ error: '받는 이메일 주소를 확인해 주세요.' }, { status: 400 });
    const note = typeof body?.note === 'string' ? body.note : null;
    const sent = await sendResultMail({ to, token, petName: (dx.input as { name?: string } | null)?.name ?? null, note });
    if (!sent) return Response.json({ error: '메일을 보내지 못했어요. 메일 설정(RESEND_API_KEY)을 확인해 주세요.' }, { status: 502 });
    const now = new Date().toISOString();
    // 보낸 주소를 남긴다 — 60일 뒤 리포트와 함께 파기(개인정보처리방침 1-②)
    await db.from('diagnoses').update({ result_mailed_at: now, buyer_email: dx.buyer_email ?? to }).eq('token', token);
    return Response.json({ ok: true, mailedAt: now, to });
  }

  return Response.json({ error: '알 수 없는 조치예요.' }, { status: 400 });
}
