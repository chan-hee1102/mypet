import { verifyHub } from '@/lib/hub-auth';
import { linkOf, SLOTS } from '@/lib/shop';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 방문 요약 — taif.kr 관리자의 「전체 사이트」 탭이 마이펫 카드를 그릴 재료(2026-09-29).
 *
 * 인증은 서명(lib/hub-auth.ts). 주는 건 숫자뿐이다(연락처·결제 정보·경로 없음).
 * 정의는 이 사이트 관리자 화면(api/admin/stats·live)과 같게 맞췄다 — 바꾸면 여기도 같이.
 *   방문     = 사람으로 본 visits 행(kind human·likely — 2026-11-19부터 봇·봇 의심은 뺀다, lib/visitor.ts). IP를 모으지 않아 단위는 「회」
 *   지금 접속 = 마지막 신호 90초 안의 방문
 *   쿠팡 이동 = 그날 시작한 사람 방문 중 준비물 카드(data-track 「쿠팡:」)를 누른 방문(2026-11-19 — 결제를 걷어내고 바꿨다)
 * 「개발 환경」 유입은 우리 자신이라 뺀다(lib/admin-visits isDev와 같은 규칙).
 *
 * ?live=1 이면 지금 접속만 읽는다 — taif 화면이 30초마다 부른다.
 */
const DAY = 86_400_000;
const KST = 9 * 3_600_000;
const DAYS = 7;
const ONLINE_MS = 90_000;
// 채널이 비어 있는 행도 살려야 해서 neq만 쓰면 안 된다(SQL에서 NULL <> 값 은 참이 아니다)
const NOT_DEV = 'channel.is.null,channel.neq."개발 환경"';
/** 사람으로 본 방문만 — 판정 전 행(kind null)은 빼지 않는다(마이그레이션 직후 잠깐) */
const PEOPLE = 'kind.is.null,kind.in.(human,likely)';

const kstMidnight = (ms: number) => {
  const k = ms + KST;
  return k - (k % DAY) - KST;
};
const kstDay = (ms: number) => new Date(ms + KST).toISOString().slice(0, 10);

export async function GET(req: Request) {
  if (!verifyHub(req, 'mypet:summary')) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const liveOnly = new URL(req.url).searchParams.get('live') === '1';
  const db = createAdminClient();
  const now = Date.now();
  const headers = { 'Cache-Control': 'private, no-store' };

  try {
    const { count: online, error: liveError } = await db
      .from('visits')
      .select('visit_key', { count: 'exact', head: true })
      .gte('last_at', new Date(now - ONLINE_MS).toISOString())
      .or(NOT_DEV)
      .or(PEOPLE);
    if (liveError) throw new Error(liveError.message);
    const live = { now: online ?? 0, note: null };
    const generatedAt = new Date(now).toISOString();
    if (liveOnly) return Response.json({ generatedAt, live }, { headers });

    // 날짜별 방문 수 — 행을 받지 않고 개수만(1,000행 상한에 안 걸리게, 전송량도 0에 가깝게)
    const today0 = kstMidnight(now);
    const starts = Array.from({ length: DAYS }, (_, i) => today0 - (DAYS - 1 - i) * DAY);
    const counts = await Promise.all(
      starts.map(async (a) => {
        const { count, error } = await db
          .from('visits')
          .select('visit_key', { count: 'exact', head: true })
          .gte('started_at', new Date(a).toISOString())
          .lt('started_at', new Date(a + DAY).toISOString())
          .or(NOT_DEV)
      .or(PEOPLE);
        if (error) throw new Error(error.message);
        return count ?? 0;
      }),
    );

    // 오늘 방문 중 휴대폰 — 나머지는 PC·태블릿
    const { count: mobileToday, error: mobileError } = await db
      .from('visits')
      .select('visit_key', { count: 'exact', head: true })
      .gte('started_at', new Date(today0).toISOString())
      .eq('device', 'mobile')
      .or(NOT_DEV)
      .or(PEOPLE);
    if (mobileError) throw new Error(mobileError.message);

    // 쿠팡 이동 — 클릭 칸만 읽는다(7일 사람 방문, 1,000행씩)
    const shopByDay = new Map<string, number>();
    for (let from = 0; from < 20_000; from += 1000) {
      const { data, error } = await db
        .from('visits')
        .select('started_at, clicks')
        .gte('started_at', new Date(starts[0]).toISOString())
        .or(NOT_DEV)
        .or(PEOPLE)
        .order('started_at', { ascending: true })
        .range(from, from + 999);
      if (error) throw new Error(error.message);
      for (const r of (data ?? []) as { started_at: string; clicks: { t?: string | null }[] | null }[]) {
        if (Array.isArray(r.clicks) && r.clicks.some((c) => (c.t ?? '').startsWith('쿠팡:'))) {
          const d = kstDay(Date.parse(r.started_at));
          shopByDay.set(d, (shopByDay.get(d) ?? 0) + 1);
        }
      }
      if (!data || data.length < 1000) break;
    }
    const shopWeek = [...shopByDay.values()].reduce((a, b) => a + b, 0);
    const linked = SLOTS.filter((x) => linkOf(x.id)).length;
    const facts = [
      { label: '7일 쿠팡 이동', value: `${shopWeek}회` },
      { label: '링크 걸린 카드', value: `${linked}/${SLOTS.length}` },
    ];

    return Response.json(
      {
        generatedAt,
        unit: '회',
        live,
        days: starts.map((a, i) => ({ day: kstDay(a), visitors: counts[i], extra: shopByDay.get(kstDay(a)) ?? 0 })),
        split: [
          { label: '휴대폰', value: mobileToday ?? 0 },
          { label: 'PC·태블릿', value: counts[DAYS - 1] - (mobileToday ?? 0) },
        ],
        extraLabel: '쿠팡 이동',
        facts,
      },
      { headers },
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '읽기 실패' }, { status: 500, headers });
  }
}
