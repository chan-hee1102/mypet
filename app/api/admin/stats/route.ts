import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { CHANNELS, type AdminStats, type Range, type Ratio, type SeriesPoint } from '@/lib/admin-types';
import { clicksOf, fetchVisits, groupOf, isEngaged, openedCheckout, openedGuide, pretty, reachedDiagnose, type VisitRow } from '@/lib/admin-visits';
import { SITE } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 관리자 통계 — 기간 KPI(직전 같은 길이 기간과 비교)·추이·채널·퍼널·버튼·랜딩·이탈·기기·요일×시간.
 *
 * 실시간은 /api/admin/live가 따로 맡는다. 이 라우트는 기간 행을 통째로 읽으므로 **폴링하지 않는다** —
 * 화면을 열 때·기간을 바꿀 때·새로고침 때만(Supabase 무료 대역폭 5GB/월).
 * 하루 수백 방문까지는 행을 읽어 여기서 집계해도 된다. 그보다 커지면 일별 요약 테이블로 옮길 것.
 *
 * ⚠️ 방문 기록은 30일 보관이다(개인정보처리방침 · /api/track purgeOld). 그래서 기간은 오늘·7일·30일뿐이고,
 *    30일은 직전 기간 비교가 없다(이미 지워졌다). 주문은 지우지 않지만 같은 기간 규칙을 따른다.
 */
const DAY = 86_400_000;
const KST = 9 * 3_600_000;

type OrderRow = { status: string; amount: number | null; created_at: string; paid_at: string | null; provider: string | null };

/** KST 자정(그날 0시)의 UTC 시각 */
function kstMidnight(ms: number) {
  const k = ms + KST;
  return k - (k % DAY) - KST;
}
const kstDay = (ms: number) => new Date(ms + KST).toISOString().slice(0, 10);
const ratio = (num: number, den: number): Ratio => ({ num, den });

export async function GET(req: NextRequest) {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const db = createAdminClient();

  const q = Number(req.nextUrl.searchParams.get('days') ?? 7);
  const days = ([1, 7, 30].includes(q) ? q : 7) as Range;
  const now = Date.now();
  const today0 = kstMidnight(now);

  // 이번 기간: 오늘이면 오늘 0시~지금, N일이면 (N-1)일 전 0시~지금
  // 직전 기간: 같은 길이만큼 앞으로 민 구간. 30일은 보관 기간 밖이라 비교 없음
  const from = days === 1 ? today0 : today0 - (days - 1) * DAY;
  const span = now - from;
  const hasPrev = days !== 30;
  const prevFrom = hasPrev ? from - (days === 1 ? DAY : days * DAY) : null;
  const prevTo = prevFrom !== null ? prevFrom + span : null;
  const sinceIso = new Date(prevFrom ?? from).toISOString();

  let all: VisitRow[];
  let orders: OrderRow[];
  try {
    const [v, o] = await Promise.all([
      fetchVisits(db, sinceIso),
      db
        .from('diagnoses')
        .select('status, amount, created_at, paid_at, provider')
        .or(`created_at.gte.${sinceIso},paid_at.gte.${sinceIso}`)
        .limit(5000),
    ]);
    if (o.error) throw new Error(o.error.message);
    all = v;
    orders = (o.data ?? []) as OrderRow[];
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '읽기 실패' }, { status: 500 });
  }
  const { count: stuck } = await db
    .from('diagnoses')
    .select('token', { count: 'exact', head: true })
    .in('status', ['paid', 'generating', 'failed']);

  const t = (r: VisitRow) => Date.parse(r.started_at);
  const inRange = (ms: number, a: number, b: number) => ms >= a && ms < b;
  const cur = all.filter((r) => t(r) >= from);
  const prev = prevFrom !== null && prevTo !== null ? all.filter((r) => inRange(t(r), prevFrom, prevTo)) : null;

  const created = (a: number, b: number) => orders.filter((o) => inRange(Date.parse(o.created_at), a, b));
  // 샌드박스(결제 키 없던 때의 테스트)는 결제·매출에서 뺀다
  const paidIn = (a: number, b: number) => orders.filter((o) => o.paid_at && o.provider !== 'sandbox' && inRange(Date.parse(o.paid_at), a, b));
  const revenue = (rows: OrderRow[]) => rows.reduce((s, o) => s + (o.amount ?? SITE.pricePerPet), 0);
  const end = now + 1;
  const paidCur = paidIn(from, end);
  const paidPrev = prevFrom !== null && prevTo !== null ? paidIn(prevFrom, prevTo) : null;

  const median = (rows: VisitRow[]) => {
    if (!rows.length) return 0;
    const s = rows.map((r) => r.duration_sec).sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
  };
  const ofGroup = (rows: VisitRow[], g: string) => rows.filter((r) => groupOf(r) === g);
  const aiHosts = new Map<string, number>();
  for (const r of ofGroup(cur, 'AI 답변')) {
    let host = r.referrer ?? 'AI 답변';
    try {
      host = new URL(host).hostname.replace(/^www\./, '');
    } catch {
      /* 원문 그대로 */
    }
    aiHosts.set(host, (aiHosts.get(host) ?? 0) + 1);
  }
  const searchCur = ofGroup(cur, '검색');

  const kpi: AdminStats['kpi'] = {
    visits: { cur: cur.length, prev: prev ? prev.length : null },
    engaged: { cur: ratio(cur.filter(isEngaged).length, cur.length), prev: prev ? ratio(prev.filter(isEngaged).length, prev.length) : null },
    medianSeconds: { cur: median(cur), prev: prev ? median(prev) : null },
    guides: { cur: cur.filter(openedGuide).length, prev: prev ? prev.filter(openedGuide).length : null },
    orders: { cur: created(from, end).length, prev: prevFrom !== null && prevTo !== null ? created(prevFrom, prevTo).length : null },
    paid: { cur: paidCur.length, prev: paidPrev ? paidPrev.length : null },
    revenue: { cur: revenue(paidCur), prev: paidPrev ? revenue(paidPrev) : null },
    conversion: ratio(paidCur.length, cur.length),
    search: {
      cur: searchCur.length,
      prev: prev ? ofGroup(prev, '검색').length : null,
      naver: searchCur.filter((r) => r.channel === '네이버').length,
      google: searchCur.filter((r) => r.channel === '구글').length,
    },
    ai: {
      cur: ofGroup(cur, 'AI 답변').length,
      prev: prev ? ofGroup(prev, 'AI 답변').length : null,
      top: [...aiHosts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    },
  };

  // ── 추이 — 오늘이면 시간별(어제 같은 시각과), 아니면 일별(같은 길이만큼 앞선 날과) ──
  const series: SeriesPoint[] = [];
  const bucket = (a: number, b: number) => {
    const rs = all.filter((r) => inRange(t(r), a, b));
    return { visits: rs.length, engaged: rs.filter(isEngaged).length, paid: paidIn(a, b).length };
  };
  if (days === 1) {
    const hourNow = new Date(now + KST).getUTCHours();
    for (let h = 0; h <= hourNow; h++) {
      const a = today0 + h * 3_600_000;
      const b = a + 3_600_000;
      series.push({ t: String(h), label: `${h}시`, ...bucket(a, b), prevVisits: bucket(a - DAY, b - DAY).visits });
    }
  } else {
    for (let i = 0; i < days; i++) {
      const a = from + i * DAY;
      const b = a + DAY;
      const d = new Date(a + KST);
      series.push({
        t: kstDay(a),
        label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
        ...bucket(a, b),
        prevVisits: hasPrev ? bucket(a - days * DAY, b - days * DAY).visits : null,
      });
    }
  }

  // ── 채널 · 세부 출처 ──
  const channels = CHANNELS.map((group) => {
    const rs = ofGroup(cur, group);
    const byHost = new Map<string, number>();
    for (const r of rs) byHost.set(r.channel ?? '직접 유입', (byHost.get(r.channel ?? '직접 유입') ?? 0) + 1);
    return {
      group,
      visits: rs.length,
      engaged: rs.filter(isEngaged).length,
      hosts: [...byHost.entries()].map(([label, visits]) => ({ label, visits })).sort((a, b) => b.visits - a.visits).slice(0, 12),
    };
  }).filter((c) => c.visits > 0);

  const tally = (pick: (r: VisitRow) => string) => {
    const m = new Map<string, number>();
    for (const r of cur) m.set(pick(r), (m.get(pick(r)) ?? 0) + 1);
    return [...m.entries()].map(([label, visits]) => ({ label, visits })).sort((a, b) => b.visits - a.visits).slice(0, 10);
  };
  const landings = tally((r) => pretty(r.landing));
  const exits = tally((r) => pretty(r.exit_path));
  const devices = ['mobile', 'desktop']
    .map((device) => {
      const rs = cur.filter((r) => (r.device ?? 'desktop') === device);
      return { device, visits: rs.length, engaged: rs.filter(isEngaged).length };
    })
    .filter((d) => d.visits > 0);

  // ── 많이 누른 것 — 한 방문에서 같은 걸 여러 번 눌러도 한 번 ──
  const clickMap = new Map<string, number>();
  for (const r of cur) {
    for (const label of new Set(clicksOf(r).map((c) => (c.t ?? '').trim()).filter(Boolean))) {
      clickMap.set(label, (clickMap.get(label) ?? 0) + 1);
    }
  }
  const clicks = [...clickMap.entries()].map(([label, visits]) => ({ label, visits })).sort((a, b) => b.visits - a.visits).slice(0, 12);

  const funnel: AdminStats['funnel'] = [
    { label: '방문', value: cur.length, basis: 'visit' },
    { label: '리포트 만들기 화면', value: cur.filter(reachedDiagnose).length, basis: 'visit' },
    { label: '무료 가이드 보기', value: cur.filter(openedGuide).length, basis: 'visit' },
    { label: '결제 정보 화면', value: cur.filter(openedCheckout).length, basis: 'visit' },
    { label: '결제창 열기', value: created(from, end).length, basis: 'order' },
    { label: '결제 완료', value: paidCur.length, basis: 'order' },
  ];

  // ── 요일×시간 히트맵(KST, 2시간 단위) — 30일에서만 의미가 있다 ──
  let heatmap: number[][] | null = null;
  if (days === 30) {
    heatmap = Array.from({ length: 7 }, () => Array(12).fill(0));
    for (const r of cur) {
      const d = new Date(t(r) + KST);
      heatmap[(d.getUTCDay() + 6) % 7][Math.floor(d.getUTCHours() / 2)] += 1;
    }
  }

  const body: AdminStats = {
    days,
    generatedAt: new Date(now).toISOString(),
    kpi,
    series,
    channels,
    landings,
    exits,
    devices,
    funnel,
    clicks,
    heatmap,
    stuckOrders: stuck ?? 0,
  };
  return Response.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
}
