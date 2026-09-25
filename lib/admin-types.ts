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
  paid: number;
  prevVisits: number | null;
}

export interface AdminStats {
  days: Range;
  generatedAt: string;
  kpi: {
    visits: Cmp<number>;
    engaged: Cmp<Ratio>;
    medianSeconds: Cmp<number>;
    guides: Cmp<number>;
    orders: Cmp<number>;
    paid: Cmp<number>;
    revenue: Cmp<number>;
    /** 결제 완료 / 방문 */
    conversion: Ratio;
    search: Cmp<number> & { naver: number; google: number };
    ai: Cmp<number> & { top: string | null };
  };
  series: SeriesPoint[];
  channels: { group: Channel; visits: number; engaged: number; hosts: { label: string; visits: number }[] }[];
  landings: { label: string; visits: number }[];
  exits: { label: string; visits: number }[];
  devices: { device: string; visits: number; engaged: number }[];
  /** 방문 → 결제 완료. 앞 네 단계는 방문(탭), 뒤 두 단계는 주문 기준 */
  funnel: { label: string; value: number; basis: 'visit' | 'order' }[];
  clicks: { label: string; visits: number }[];
  /** [월..일][0~11] 2시간 단위 방문 수(KST). 30일에서만 */
  heatmap: number[][] | null;
  /** 결제 기록은 있는데 리포트가 없는 주문(DB만으로 알 수 있는 것 — 포트원 대조는 주문 화면) */
  stuckOrders: number;
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
  channel: Channel;
  source: string;
}

export interface AdminLive {
  generatedAt: string;
  online: LiveVisit[];
  recent: LiveVisit[];
}

export type OrderStatus = 'pending' | 'paid' | 'generating' | 'done' | 'failed';

/** 포트원 결제 조회 결과 중 화면에 필요한 것 */
export interface OrderPg {
  status: string;
  amount: number | null;
  paidAt: string | null;
  email: string | null;
  phone: string | null;
  name: string | null;
}

export interface Order {
  token: string;
  species: 'dog' | 'cat';
  petName: string;
  breed: string | null;
  status: OrderStatus;
  amount: number | null;
  createdAt: string;
  paidAt: string | null;
  email: string | null;
  mailedAt: string | null;
  /** 결제 키가 없던 때(샌드박스) 만든 테스트 주문 — 매출·결제 수에서 뺀다 */
  test: boolean;
  /** 결제사 조회 — 완성되지 않은 최근 주문만 조회한다. null = 조회 안 함 */
  pg: OrderPg | null;
  pgReason: 'no_secret' | 'not_found' | 'error' | null;
}

export interface OrdersResponse {
  items: Order[];
  generatedAt: string;
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
