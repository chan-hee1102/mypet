// 서비스/사업자 정보 단일 출처.
// ⚠️ [대괄호] 항목은 사업자등록·통신판매업 신고 후 실제 값으로 채우세요.
// 전자상거래법 제10조에 따라 사업자정보는 사이트에 표기해야 합니다.

export const SITE = {
  name: 'mypet',
  serviceName: 'mypet (마이펫)',
  url: 'https://mypet.taif.kr',
  /** 마리당 1회 결제 금액(원) — 가격 단일 출처 */
  pricePerPet: 3900,

  // ── 사업자정보 (등록 후 채우기) ─────────────────────────────
  company: '[상호/법인명]',
  ceo: '[대표자명]',
  bizNo: '[사업자등록번호]',
  mailOrderNo: '[통신판매업신고번호]',
  address: '[사업장 주소]',
  email: '[고객문의 이메일]',
  phone: '[고객센터 전화번호]',
  lastUpdated: '2026-06-19',
} as const;

/** 사업자정보가 아직 placeholder인지 (출시 전 경고용) */
export const BUSINESS_INFO_READY = !SITE.company.startsWith('[');
