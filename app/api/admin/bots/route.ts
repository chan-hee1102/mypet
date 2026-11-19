import { isAdmin } from '@/lib/adminAuth';
import type { AdminBots } from '@/lib/admin-types';
import { fetchVisits, pretty, verdictOf } from '@/lib/admin-visits';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPerson, type Kind } from '@/lib/visitor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 봇 수집 — 방문 통계에서 빼는 것들(KOSTOCK 관리자 「봇 수집」 탭과 같은 자리, 2026-11-19).
 * 이름을 밝힌 봇(검색·AI·미리보기), 자동 브라우저(webdriver·헤드리스·위장 크롬), 봇 의심(행동으로 가른 것)을 날짜별로.
 * 막지는 않는다 — 네이버·구글 검색봇을 막으면 검색 유입이 끊긴다. 화면을 열 때·새로고침 때만 부른다(폴링 금지).
 */
const DAY = 86_400_000;
const KST = 9 * 3_600_000;
const DAYS = 14;

const kstMidnight = (ms: number) => {
  const k = ms + KST;
  return k - (k % DAY) - KST;
};
const kstDay = (ms: number) => new Date(ms + KST).toISOString().slice(0, 10);

export async function GET() {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const db = createAdminClient();
  const now = Date.now();
  const from = kstMidnight(now) - (DAYS - 1) * DAY;
  try {
    const rows = await fetchVisits(db, new Date(from).toISOString());
    const days = new Map<string, AdminBots['days'][number]>();
    for (let i = 0; i < DAYS; i++) {
      const d = kstDay(from + i * DAY);
      days.set(d, { day: d, people: 0, bots: 0, suspect: 0, search: 0, ai: 0, preview: 0, auto: 0 });
    }
    const names = new Map<string, { kind: Kind; name: string; visits: number }>();
    const pages = new Map<string, number>();
    const browsers = new Map<string, number>();
    for (const r of rows) {
      const day = days.get(kstDay(Date.parse(r.started_at)));
      if (!day) continue;
      const v = verdictOf(r);
      if (isPerson(v.kind)) {
        day.people++;
        continue;
      }
      if (v.kind === 'suspect') day.suspect++;
      else {
        day.bots++;
        if (v.kind === 'search' || v.kind === 'ai' || v.kind === 'preview' || v.kind === 'auto') day[v.kind]++;
      }
      const nk = `${v.kind}|${v.why}`;
      const n = names.get(nk) ?? { kind: v.kind, name: v.why, visits: 0 };
      n.visits++;
      names.set(nk, n);
      const p = pretty(r.landing);
      pages.set(p, (pages.get(p) ?? 0) + 1);
      const b = r.browser ?? '(기록 전)';
      browsers.set(b, (browsers.get(b) ?? 0) + 1);
    }
    const top = (m: Map<string, number>, n: number) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
    const body: AdminBots = {
      generatedAt: new Date(now).toISOString(),
      days: [...days.values()],
      names: [...names.values()].sort((a, b) => b.visits - a.visits).slice(0, 20),
      pages: top(pages, 12).map(([path, visits]) => ({ path, visits })),
      browsers: top(browsers, 10).map(([name, visits]) => ({ name, visits })),
    };
    return Response.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '읽기 실패' }, { status: 500 });
  }
}
