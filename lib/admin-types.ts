import type { Kind } from './visitor';
/**
 * 관리자 대시보드 API 응답 타입 — 서버(/api/admin/*)와 화면(app/admin)이 같이 쓴다.
 *
 * ⚠️ mypet의 방문 기록은 **탭 단위**다(sessionStorage 난수, IP·쿠키 없음). 「사람 수」를 셀 수단이 없어서
 *    화면의 「방문」은 전부 탭 수다. 같은 사람이 탭을 두 개 열면 두 번으로 센다.
 * 비율은 %가 아니라 분수로 보낸다 — 표본이 작을 때 「1/30 (3.3%)」처럼 분자·분모를 같이 보여 주려고.
 */
export type Ratio = { num: number; den: number };
/** prev = 직전 같은 길이 기간. null이면 보관 기간(방문 30일) 밖이라 비교할 수 없다 */
export type Cmp<T> = { cur: T; prev: T | null };

export const CHANNELS = ['검색', 'AI 답변', '소셜', '직접', '광고', '기타'] as const;
export type Channel = (typeof CHANNELS)[number];

export type Range = 1 | 7 | 30;

export interface SeriesPoint {
  /** 날짜(YYYY-MM-DD) 또는 「오늘」이면 시(0~23) */
  t: string;
  label: string;
  visits: number;
  engaged: number;
  /** 쿠팡 준비물 카드를 누른 방문 */
  shop: number;
  prevVisits: number | null;
}

export interface AdminStats {
  days: Range;
  generatedAt: string;
  kpi: {
    visits: Cmp<number>;
    engaged: Cmp<Ratio>;
    medianSeconds: Cmp<number>;
    /** 품종 안내판을 본 방문 */
    boards: Cmp<number>;
    /** 쿠팡 준비물 카드를 누른 방문(한 방문에서 여러 번 눌러도 한 번) */
    shop: Cmp<number>;
    /** 쿠팡 카드 클릭 수(전부) */
    shopClicks: Cmp<number>;
    /** 쿠팡으로 넘어간 방문 / 방문 */
    shopRate: Ratio;
    search: Cmp<number> & { naver: number; google: number };
    ai: Cmp<number> & { top: string | null };
  };
  series: SeriesPoint[];
  channels: { group: Channel; visits: number; engaged: number; hosts: { label: string; visits: number }[] }[];
  landings: { label: string; visits: number }[];
  exits: { label: string; visits: number }[];
  devices: { device: string; visits: number; engaged: number }[];
  /** 방문 → 품종 안내판 → 쿠팡 카드(전부 방문 기준) */
  funnel: { label: string; value: number }[];
  /** 많이 누른 쿠팡 카드 — 카드 id별 방문 수 */
  shopTop: { id: string; visits: number }[];
  clicks: { label: string; visits: number }[];
  /** [월..일][0~11] 2시간 단위 방문 수(KST). 30일에서만 */
  heatmap: number[][] | null;
  /** 이번 기간에 통계에서 뺀 봇·봇 의심 방문(2026-11-19) */
  botsExcluded: number;
}

export interface LiveVisit {
  key: string;
  path: string;
  landing: string;
  device: string;
  seconds: number;
  pageviews: number;
  clicks: number;
  lastClick: string | null;
  atIso: string;
  /** 처음 들어온 시각 — 「오늘 다녀간 사람」 줄의 시각 */
  startIso: string;
  channel: Channel;
  source: string;
  /** 사람·봇 판정(lib/visitor.ts kindOf)과 그 이유 */
  kind: Kind;
  why: string;
  /** 「크롬 141」·「카카오톡 10」 — 2026-11-19 이전 기록엔 없다 */
  browser: string | null;
}

/** 하루 — 사람(사람+사람 추정) · 이름 밝힌 봇(검색·AI·미리보기·자동 브라우저) · 봇 의심 */
export interface PeopleDay {
  day: string;
  people: number;
  bots: number;
  suspect: number;
}

export interface AdminLive {
  generatedAt: string;
  /** 마지막 신호 90초 안 — 사람·봇 다(화면이 거른다) */
  online: LiveVisit[];
  /** 오늘(KST 0시~) 다녀간 방문 — 최신순, 최대 400 */
  today: LiveVisit[];
  /** 최근 7일 — ?week=1일 때만(1분에 한 번) */
  week: PeopleDay[] | null;
}

/** 봇 수집 탭 — 방문 통계에서 빼는 것들이 무엇이고 무엇을 읽었나 */
export interface AdminBots {
  generatedAt: string;
  days: (PeopleDay & { search: number; ai: number; preview: number; auto: number })[];
  /** 이름별(검색봇 네이버·AI봇 ChatGPT…) — 봇 의심은 이유별 */
  names: { kind: Kind; name: string; visits: number }[];
  /** 봇·의심이 연 첫 화면 */
  pages: { path: string; visits: number }[];
  /** 봇·의심 브라우저 */
  browsers: { name: string; visits: number }[];
}

/** 쿠팡 링크 탭 — 준비물 카드마다 링크가 걸렸나, 몇 품종에 붙나, 최근 14일 몇 번 눌렸나 */
export interface AdminShopSlot {
  id: string;
  species: 'dog' | 'cat';
  cat: string;
  title: string;
  q: string;
  searchUrl: string;
  linked: boolean;
  /** 이 카드가 1~3순위로 붙는 품종 수 */
  breeds: number;
  /** 최근 14일 이 카드를 누른 방문(사람만) */
  clicks: number;
}
export interface AdminShop {
  generatedAt: string;
  slots: AdminShopSlot[];
  /** 지난 14일 품종 안내판 방문(사람) — 링크를 먼저 만들 카드 고르는 데 */
  boardViews: number;
}

export type InquiryStatus = 'open' | 'answered' | 'closed';

export interface Inquiry {
  id: string;
  name: string | null;
  email: string;
  category: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
}
