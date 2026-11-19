import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';

/**
 * 정보 가이드 허브.
 *
 * 역할이 두 가지다:
 *   ① 사람에게는 목차
 *   ② 크롤러에게는 **가이드 8개를 잇는 허브** — 어느 페이지에서도 2클릭 안에 닿게 해서
 *      고아 페이지를 만들지 않는다. 사이트맵에만 있고 링크가 없는 페이지는 색인이 잘 되지 않는다.
 */

const TITLE = '반려동물 정보 가이드';
const DESCRIPTION =
  '강아지·고양이의 금지 음식, 예방접종 시기, 나이 환산, 산책 시간, 품종별 표준 체중, 증상별 병원 기준을 표로 정리했습니다. 수의사 가이드라인과 188개 품종 데이터 기반.';

export const metadata: Metadata = {
  title: `${TITLE} | mypet`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/guide` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE.url}/guide`, type: 'website' },
};

export default function GuideHub() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: 'ko',
    url: `${SITE.url}/guide`,
    hasPart: GUIDES.map((g) => ({
      '@type': 'Article',
      headline: g.title,
      description: g.description,
      url: `${SITE.url}/guide/${g.slug}`,
    })),
  };

  return (
    <main className="container guide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <nav className="gcrumb"><Link href="/">처음</Link> <span>›</span> 정보 가이드</nav>

      <h1 className="gtitle">{TITLE}</h1>
      <p className="gquestion">
        수의사 가이드라인과 188개 품종 데이터를 바탕으로, 보호자가 가장 많이 찾는 질문에 표로 답합니다.
      </p>

      <div className="linklist" style={{ marginTop: 28 }}>
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guide/${g.slug}`}>
            <b>{g.title}</b>
            <span>{g.lead}</span>
          </Link>
        ))}
      </div>

      <h2 style={{ margin: '44px 0 8px', fontSize: 22, letterSpacing: '-.03em' }}>계산기</h2>
      <div className="linklist">
        <Link href="/tools/food">
          <b>사료량 계산기</b>
          <span>몸무게·나이·중성화로 하루 열량과 건사료 g</span>
        </Link>
        <Link href="/tools/adult-weight">
          <b>다 크면 몇 kg? 다 큰 몸무게 계산기</b>
          <span>지금 나이·몸무게로 다 컸을 때 몸무게, 품종별 개월별 몸무게 표</span>
        </Link>
      </div>

      <section className="gcta">
        <h2>우리 아이 품종으로 보고 싶다면</h2>
        <p>강아지 130종·고양이 58종, 품종마다 하루 사료량·산책·빗질·미용·배변과 준비물을 안내판 한 장에 정리했어요.</p>
        <div className="gcta-btns">
          <Link href="/breed" className="btn btn--primary btn--lg">품종 안내판 188종</Link>
          <Link href="/start/dog" className="btn btn--secondary btn--lg">처음 데려온다면</Link>
        </div>
      </section>
    </main>
  );
}
