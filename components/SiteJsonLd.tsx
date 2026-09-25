import { SITE } from '@/lib/site';

/**
 * 사이트 공통 구조화 데이터(JSON-LD) — 구글 리치결과 + 생성형 검색(GPT/제미나이/퍼플렉시티)의
 * 엔티티 이해·인용(GEO/AEO). 레이아웃에서 1회만 렌더한다.
 *
 * 여기서 표현하려는 사실은 두 가지이고, 둘을 섞지 않는 게 이 파일의 요점이다.
 *
 *   1) mypet을 **운영하는 사업자**는 카이랩이다(개인사업자 167-03-03903).
 *      결제가 붙은 서비스라 푸터의 전자상거래법 표기와 여기 값이 어긋나면 안 된다.
 *   2) mypet을 **만든 팀**은 주식회사 팀에이아이팜(TAIF, taif.kr)이다.
 *
 * 그래서 publisher는 카이랩, creator는 TAIF로 나눠서 선언한다.
 * TAIF를 publisher나 parentOrganization으로 쓰면 사업자를 잘못 말하는 게 되므로 금지.
 * taif.kr / kostock.taif.kr도 같은 @id(`https://taif.kr/#org`)를 쓰고 있어서,
 * 이 한 줄로 세 사이트가 "같은 팀이 만든 것들"로 이어진다.
 *
 * 전부 하드코딩 상수만 직렬화한다(사용자 입력 주입 없음 → XSS 없음).
 */
const OPERATOR_ID = `${SITE.url}/#org`;
const APP_ID = `${SITE.url}/#app`;
/** 제작사(법인) 식별자 — taif.kr·kostock.taif.kr과 반드시 같은 문자열이어야 한다. */
const TAIF_ID = 'https://taif.kr/#org';

const GRAPH = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      // 운영 사업자 — 푸터의 전자상거래법 표기와 같은 값이어야 한다.
      '@type': 'Organization',
      '@id': OPERATOR_ID,
      name: SITE.company,
      legalName: SITE.company,
      url: SITE.url,
      email: SITE.email,
      founder: { '@type': 'Person', name: SITE.ceo },
      address: { '@type': 'PostalAddress', addressCountry: 'KR', streetAddress: SITE.address },
      identifier: {
        '@type': 'PropertyValue',
        name: '사업자등록번호',
        value: SITE.bizNo,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE.email,
        telephone: SITE.phone,
        availableLanguage: ['ko'],
      },
    },
    {
      // 제작사 — 여기서는 식별에 필요한 최소 정보만 둔다. 전체 정의는 taif.kr에 있고,
      // 같은 @id라서 검색엔진이 두 곳의 선언을 하나로 합친다.
      '@type': 'Organization',
      '@id': TAIF_ID,
      name: 'TAIF',
      legalName: '주식회사 팀에이아이팜',
      url: 'https://taif.kr',
      identifier: {
        '@type': 'PropertyValue',
        name: '사업자등록번호',
        value: '693-87-03718',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      inLanguage: 'ko-KR',
      publisher: { '@id': OPERATOR_ID },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': APP_ID,
      name: SITE.serviceName,
      url: SITE.url,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      inLanguage: 'ko-KR',
      description:
        '품종·나이·체중을 입력하면 188개 품종 데이터와 수의 지침을 기준으로 하루 급여량, 접종 일정, 조심할 질환, 먹으면 안 되는 음식을 정리한 반려동물 케어 리포트를 만들어 주는 서비스. 강아지·고양이를 지원하며, 수의사의 진단·진료를 대체하지 않는 일반 정보 제공 서비스입니다.',
      offers: { '@type': 'Offer', price: String(SITE.pricePerPet), priceCurrency: 'KRW' },
      creator: { '@id': TAIF_ID },
      publisher: { '@id': OPERATOR_ID },
    },
  ],
};

export default function SiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(GRAPH).replace(/</g, '\\u003c') }}
    />
  );
}
