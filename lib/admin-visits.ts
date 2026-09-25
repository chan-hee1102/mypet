import type { SupabaseClient } from '@supabase/supabase-js';
import type { Channel } from './admin-types';

/** visits 한 행(탭 하나) — schema.sql visits */
export type VisitRow = {
  visit_key: string;
  started_at: string;
  last_at: string;
  referrer: string | null;
  channel: string | null;
  landing: string | null;
  exit_path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  device: string | null;
  pageviews: number;
  duration_sec: number;
  clicks: { t?: string | null; p?: string | null; at?: string | null }[] | null;
};

export const VISIT_COLUMNS =
  'visit_key, started_at, last_at, referrer, channel, landing, exit_path, utm_source, utm_medium, device, pageviews, duration_sec, clicks';

/** 「개발 환경」은 우리 자신이다(lib/inflow.ts) — 집계에 넣지 않는다 */
export const isDev = (r: VisitRow) => r.channel === '개발 환경';

export const clicksOf = (r: VisitRow) => (Array.isArray(r.clicks) ? r.clicks : []);

/** 참여 = 10초 이상 머물렀거나, 두 화면 이상 봤거나, 무언가를 누른 방문 */
export const isEngaged = (r: VisitRow) => r.duration_sec >= 10 || r.pageviews >= 2 || clicksOf(r).length > 0;

const SEARCH = ['네이버', '구글', '다음', '빙'];
const SOCIAL = ['카카오', '인스타그램', '페이스북', '유튜브', '틱톡', '스레드', 'X'];

/**
 * lib/inflow.ts의 세부 채널(네이버·구글·직접 유입·utm 값 …)을 화면의 6갈래로 접는다.
 * utm_source 값은 우리가 붙인 꼬리표라 이름으로 가른다 — 카톡·인스타 인앱은 referrer를 안 보내서 이게 유일한 단서다.
 */
export function groupOf(r: Pick<VisitRow, 'channel' | 'utm_medium'>): Channel {
  const c = r.channel ?? '직접 유입';
  if (c === 'AI 답변') return 'AI 답변';
  if (SEARCH.includes(c)) return '검색';
  if (SOCIAL.includes(c)) return '소셜';
  if (c === '직접 유입' || c === '내부 이동') return '직접';
  if (/cpc|ppc|paid|ads?$|display/i.test(r.utm_medium ?? '')) return '광고';
  const l = c.toLowerCase();
  if (/kakao|insta|facebook|youtube|threads|band|blog|cafe|twitter|tiktok|x\.com/.test(l)) return '소셜';
  if (/naver|google|daum|bing/.test(l)) return '검색';
  return '기타';
}

/** 경로를 사람이 읽게 — 퍼센트 인코딩된 한글을 푼다 */
export function pretty(path: string | null): string {
  if (!path) return '(알 수 없음)';
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/*
  퍼널 단계 판정. 리포트 만들기는 한 주소(/diagnose) 안에서 단계가 바뀌어 주소로는 못 가른다 —
  버튼 클릭 기록으로 가른다. data-track 라벨(DiagnoseForm)과 그 전 버튼 글자를 둘 다 받는다.
*/
export const reachedDiagnose = (r: VisitRow) =>
  (r.landing ?? '').startsWith('/diagnose') || (r.exit_path ?? '').startsWith('/diagnose') || clicksOf(r).some((c) => (c.p ?? '').startsWith('/diagnose'));
export const openedGuide = (r: VisitRow) => clicksOf(r).some((c) => c.t === '무료 가이드 보기' && (c.p ?? '').startsWith('/diagnose'));
export const openedCheckout = (r: VisitRow) => clicksOf(r).some((c) => c.t === '리포트 받기');

/** 기간 행을 전부 읽는다 — PostgREST 기본 상한(1,000행)에 걸리지 않게 1,000행씩 넘겨 가며 */
export async function fetchVisits(db: SupabaseClient, sinceIso: string): Promise<VisitRow[]> {
  const PAGE = 1000;
  const MAX = 30_000;
  const out: VisitRow[] = [];
  for (let from = 0; from < MAX; from += PAGE) {
    const { data, error } = await db
      .from('visits')
      .select(VISIT_COLUMNS)
      .gte('started_at', sinceIso)
      .order('started_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as VisitRow[]));
    if (!data || data.length < PAGE) break;
  }
  return out.filter((r) => !isDev(r));
}
