// 서비스/운영자 정보 단일 출처.
// 2026-11-19 결제(2,900원 리포트)를 걷어내 통신판매 표기 의무는 없어졌지만, 쿠팡 파트너스 수익을 내는 사업자라 운영자 정보는 그대로 밝힌다.

export const SITE = {
  name: 'mypet',
  serviceName: '마이펫 (mypet)',
  url: 'https://mypet.taif.kr',

  // ── 사업자정보 (사업자등록증 기준) ─────────────────────────
  company: '카이랩',
  ceo: '임찬희',
  bizNo: '167-03-03903',
  address: '경기도 남양주시 진접읍 해밀예당1로 49, 1106동 804호(남양휴튼)',
  email: 'service@taif.kr', // 고객문의 (공개 표기)
  phone: '070-7938-5587',
  /** 문의 열람 권한이 있는 관리자 계정(구글 로그인 이메일). /admin 접근 게이트. */
  adminEmail: 'mukkeby99@gmail.com',
  lastUpdated: '2026-11-19',
} as const;

/** 사업자정보가 아직 placeholder인지 (출시 전 경고용) */
export const BUSINESS_INFO_READY = !SITE.company.startsWith('[');
