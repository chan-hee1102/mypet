import { verifyHub } from '@/lib/hub-auth';
import { SITE } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 방문 요약 — taif.kr 관리자의 「전체 사이트」 탭이 마이펫 카드를 그릴 재료(2026-09-29).
 *
 * 인증은 서명(lib/hub-auth.ts). 주는 건 숫자뿐이다(연락처·결제 정보·경로 없음).
 * 정의는 이 사이트 관리자 화면(api/admin/stats·live)과 같게 맞췄다 — 바꾸면 여기도 같이.
 *   방문     = visits 행(탭 하나) 수. IP를 모으지 않아 사람 수가 아니다 → 단위 「회」
 *   지금 접속 = 마지막 신호 90초 안의 방문
 *   결제     = paid_at이 그날인 주문, 샌드박스(테스트) 제외 · 매출도 같은 주문
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
      .or(NOT_DEV);
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
          .or(NOT_DEV);
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
      .or(NOT_DEV);
    if (mobileError) throw new Error(mobileError.message);

    const [{ data: paidRows, error: paidError }, { count: stuck }] = await Promise.all([
      db.from('diagnoses').select('amount, paid_at, provider').gte('paid_at', new Date(starts[0]).toISOString()).limit(5000),
      // 결제는 됐는데 리포트가 없는 주문 — 관리자 「주문」 화면의 경고와 같은 조건
      db.from('diagnoses').select('token', { count: 'exact', head: true }).in('status', ['paid', 'generating', 'failed']),
    ]);
    if (paidError) throw new Error(paidError.message);
    const paid = ((paidRows ?? []) as { amount: number | null; paid_at: string | null; provider: string | null }[]).filter(
      (o) => o.paid_at && o.provider !== 'sandbox',
    );
    const paidByDay = new Map<string, number>();
    for (const o of paid) {
      const d = kstDay(Date.parse(o.paid_at!));
      paidByDay.set(d, (paidByDay.get(d) ?? 0) + 1);
    }
    const revenue = paid.reduce((s, o) => s + (o.amount ?? SITE.pricePerPet), 0);

    const facts = [{ label: '7일 매출', value: `${revenue.toLocaleString('ko-KR')}원` }];
    if (stuck) facts.push({ label: '확인 필요 주문', value: `${stuck}건` });

    return Response.json(
      {
        generatedAt,
        unit: '회',
        live,
        days: starts.map((a, i) => ({ day: kstDay(a), visitors: counts[i], extra: paidByDay.get(kstDay(a)) ?? 0 })),
        split: [
          { label: '휴대폰', value: mobileToday ?? 0 },
          { label: 'PC·태블릿', value: counts[DAYS - 1] - (mobileToday ?? 0) },
        ],
        extraLabel: '결제',
        facts,
      },
      { headers },
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '읽기 실패' }, { status: 500, headers });
  }
}
