// 서비스/사업자 정보 단일 출처.
// ⚠️ [대괄호] 항목은 실제 값으로 채우세요.
// 전자상거래법 제10조에 따라 사업자정보는 사이트에 표기해야 합니다.

export const SITE = {
  name: 'mypet',
  serviceName: 'mypet (마이펫)',
  url: 'https://mypet.taif.kr',
  /** 1회 진단 결제 금액(원) — 가격 단일 출처 */
  pricePerPet: 2900,

  // ── 사업자정보 (사업자등록증 기준) ─────────────────────────
  company: '카이랩',
  ceo: '임찬희',
  bizNo: '167-03-03903',
  // 간이과세자는 전자상거래법 시행령 제8조에 따라 통신판매업 신고가 면제될 수 있음.
  // PG(토스/포트원) 심사에서 신고번호를 요구하면 신고 후 '제2026-경기남양주-0000호' 형식으로 채울 것.
  mailOrderNo: '', // 비워두면 표기 생략됨
  // KG이니시스 입점 요건: 상세주소 표기 필요
  address: '경기도 남양주시 진접읍 해밀예당1로 49, 1106동 804호(남양휴튼)',
  email: 'service@taif.kr', // 고객문의 (공개 표기)
  phone: '070-7938-5587', // KG이니시스 입점 요건: 푸터 전화번호 표기
  /** 문의 열람 권한이 있는 관리자 계정(구글 로그인 이메일). /admin 접근 게이트. */
  adminEmail: 'mukkeby99@gmail.com',
  lastUpdated: '2026-06-21',
} as const;

/** 사업자정보가 아직 placeholder인지 (출시 전 경고용) */
export const BUSINESS_INFO_READY = !SITE.company.startsWith('[');
