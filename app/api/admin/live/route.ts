import { isAdmin } from '@/lib/adminAuth';
import type { AdminLive, LiveVisit, PeopleDay } from '@/lib/admin-types';
import { clicksOf, fetchVisits, groupOf, isDev, pretty, verdictOf, VISIT_COLUMNS, type VisitRow } from '@/lib/admin-visits';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPerson } from '@/lib/visitor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 실시간 접속 — KOSTOCK 관리자 「실시간 접속」과 같은 읽는 순서(2026-11-19):
 *   오늘 다녀간 사람 → 최근 7일(사람 · 봇 · 봇 의심) → 지금 접속 중 → 오늘 다녀간 방문 목록.
 * 줄마다 사람·봇 판정과 이유를 싣는다(lib/visitor.ts) — 화면이 「봇도 보기」로 거른다.
 * 15초마다 불린다. 7일 집계는 ?week=1일 때만(화면이 1분에 한 번) — 7일치 행을 15초마다 읽지 않게.
 *
 * 「지금」의 근거는 VisitTracker의 30초 심박이다 — 화면이 앞에 있는 동안만 보내므로
 * 탭을 뒤로 보내거나 닫으면 90초 안에 목록에서 빠진다.
 */
const ONLINE_MS = 90_000;
const DAY = 86_400_000;
const KST = 9 * 3_600_000;
const TODAY_MAX = 400;

const kstMidnight = (ms: number) => {
  const k = ms + KST;
  return k - (k % DAY) - KST;
};
const kstDay = (ms: number) => new Date(ms + KST).toISOString().slice(0, 10);

function toLive(r: VisitRow): LiveVisit {
  const cs = clicksOf(r);
  const v = verdictOf(r);
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
    startIso: r.started_at,
    channel: groupOf(r),
    source: r.channel ?? '직접 유입',
    kind: v.kind,
    why: v.why,
    browser: r.browser ?? null,
  };
}

export async function GET(req: Request) {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const db = createAdminClient();
  const now = Date.now();
  const today0 = kstMidnight(now);
  const withWeek = new URL(req.url).searchParams.get('week') === '1';

  try {
    // 오늘 시작했거나 지금도 신호가 오는 방문(어제 밤에 열어 둔 탭 포함)
    const { data, error } = await db
      .from('visits')
      .select(VISIT_COLUMNS)
      .or(`started_at.gte.${new Date(today0).toISOString()},last_at.gte.${new Date(now - ONLINE_MS).toISOString()}`)
      .order('started_at', { ascending: false })
      .limit(TODAY_MAX + 50);
    if (error) throw new Error(error.message);
    const rows = ((data ?? []) as VisitRow[]).filter((r) => !isDev(r));

    let week: PeopleDay[] | null = null;
    if (withWeek) {
      const from = today0 - 6 * DAY;
      const all = await fetchVisits(db, new Date(from).toISOString());
      const by = new Map<string, PeopleDay>();
      for (let i = 0; i < 7; i++) {
        const d = kstDay(from + i * DAY);
        by.set(d, { day: d, people: 0, bots: 0, suspect: 0 });
      }
      for (const r of all) {
        const row = by.get(kstDay(Date.parse(r.started_at)));
        if (!row) continue;
        const k = verdictOf(r).kind;
        if (isPerson(k)) row.people++;
        else if (k === 'suspect') row.suspect++;
        else row.bots++;
      }
      week = [...by.values()];
    }

    const body: AdminLive = {
      generatedAt: new Date(now).toISOString(),
      online: rows.filter((r) => now - Date.parse(r.last_at) < ONLINE_MS).map(toLive),
      today: rows.filter((r) => Date.parse(r.started_at) >= today0).slice(0, TODAY_MAX).map(toLive),
      week,
    };
    return Response.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '읽기 실패' }, { status: 500 });
  }
}
