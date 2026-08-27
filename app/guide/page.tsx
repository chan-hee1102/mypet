import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from '@/lib/guides';
import { Icon } from '@/components/icons';
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

      <nav className="gcrumb"><Link href="/">홈</Link> <span>›</span> 정보 가이드</nav>

      <h1 className="gtitle">{TITLE}</h1>
      <p className="gquestion">
        수의사 가이드라인과 188개 품종 데이터를 바탕으로, 보호자가 가장 많이 찾는 질문에 표로 답합니다.
      </p>

      <div className="ghub-grid">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guide/${g.slug}`} className="ghub-card">
            <b>{g.title}</b>
            <span className="ghub-q">{g.question}</span>
            <span className="ghub-go">읽어보기 <Icon name="chevron" size={14} /></span>
          </Link>
        ))}
      </div>

      <section className="gcta">
        <h2>우리 아이 기준으로 정리해 드릴까요?</h2>
        <p>
          위 글들은 일반 기준입니다. 품종·나이·체중을 넣으면 같은 내용을 <b>우리 아이 숫자</b>로 바꿔
          식단·운동·접종 일정까지 한 장으로 정리해 드려요.
        </p>
        <div className="gcta-btns">
          <Link href="/diagnose" className="btn btn--primary btn--lg">맞춤 케어 리포트 받기</Link>
          <Link href="/breed" className="btn btn--secondary btn--lg">품종 가이드 188종</Link>
        </div>
      </section>
    </main>
  );
}
