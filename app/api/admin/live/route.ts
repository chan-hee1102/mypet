import { isAdmin } from '@/lib/adminAuth';
import type { AdminLive, LiveVisit } from '@/lib/admin-types';
import { clicksOf, groupOf, isDev, pretty, VISIT_COLUMNS, type VisitRow } from '@/lib/admin-visits';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 실시간 — 지금 켜둔 방문(마지막 신호 90초 안)과 최근 24시간 방문 25건만 읽는다.
 * 화면이 15초마다 부르므로 기간 전체를 읽는 /stats와 분리했다(대역폭).
 *
 * 「지금」의 근거는 VisitTracker의 30초 심박이다 — 화면이 앞에 있는 동안만 보내므로
 * 탭을 뒤로 보내거나 닫으면 90초 안에 목록에서 빠진다.
 */
const ONLINE_MS = 90_000;

function toLive(r: VisitRow): LiveVisit {
  const cs = clicksOf(r);
  return {
    key: r.visit_key,
    path: pretty(r.exit_path ?? r.landing),
    landing: pretty(r.landing),
    device: r.device ?? 'desktop',
    seconds: r.duration_sec,
    pageviews: r.pageviews,
    clicks: cs.length,
    lastClick: cs.length ? (cs[cs.length - 1].t ?? null) : null,
    atIso: r.last_at,
    channel: groupOf(r),
    source: r.channel ?? '직접 유입',
  };
}

export async function GET() {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const db = createAdminClient();
  const now = Date.now();
  const { data, error } = await db
    .from('visits')
    .select(VISIT_COLUMNS)
    .gte('last_at', new Date(now - 24 * 3_600_000).toISOString())
    .order('last_at', { ascending: false })
    .limit(80);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const rows = ((data ?? []) as VisitRow[]).filter((r) => !isDev(r));
  const online = rows.filter((r) => now - Date.parse(r.last_at) < ONLINE_MS);
  const onlineKeys = new Set(online.map((r) => r.visit_key));
  const body: AdminLive = {
    generatedAt: new Date(now).toISOString(),
    online: online.map(toLive),
    recent: rows.filter((r) => !onlineKeys.has(r.visit_key)).slice(0, 25).map(toLive),
  };
  return Response.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
}
