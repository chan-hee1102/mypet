import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDES, findGuide } from '@/lib/guides';
import GuideBody from '@/components/GuideBody';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';

/**
 * 정보 가이드 상세 — 검색·AI 답변엔진 유입의 본체.
 *
 * 구조가 곧 최적화다:
 *   h1 → **질문** → **결론 한 문단**(answer) → 데이터 표 → FAQ → 출처 → 관련 글 → 서비스 안내
 *
 * 결론을 맨 위에 두는 이유: AI 답변엔진은 글 전체를 요약하지 않고 **질문에 답하는 대목만 떼어 인용**한다.
 * 그 대목이 3번째 스크롤에 있으면 인용되지 않는다. 사람도 마찬가지다 — 답을 먼저 보고 근거를 본다.
 *
 * JSON-LD를 3개 넣는다: Article(글), FAQPage(되묻는 질문), BreadcrumbList(위치).
 * 구글은 FAQ 리치결과를 대부분 접었지만, 구조화된 Q&A는 **AI 답변엔진이 읽는 형식**으로 여전히 유효하다.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = findGuide(params.slug);
  if (!g) return {};
  const url = `${SITE.url}/guide/${g.slug}`;
  return {
    title: `${g.title} | mypet`,
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: url },
    openGraph: { title: g.title, description: g.description, url, type: 'article' },
  };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = findGuide(params.slug);
  if (!g) notFound();

  const url = `${SITE.url}/guide/${g.slug}`;
  const related = g.related.map(findGuide).filter(Boolean);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: g.title,
      description: g.description,
      inLanguage: 'ko',
      mainEntityOfPage: url,
      publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      // 근거로 삼은 원문을 그대로 밝힌다 — 인용될 글의 최소 조건이다.
      citation: g.sources.map((s) => ({ '@type': 'CreativeWork', name: `${s.org} — ${s.title}`, url: s.url })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: g.question, acceptedAnswer: { '@type': 'Answer', text: g.answer } },
        ...g.faq.map((f) => ({
          '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: '정보 가이드', item: `${SITE.url}/guide` },
        { '@type': 'ListItem', position: 3, name: g.title, item: url },
      ],
    },
  ];

  return (
    <main className="container guide">
      {/* JSON.stringify는 "</script>"를 이스케이프하지 않는다. 지금 값은 전부 우리 상수라
          사용자 입력이 닿지 않지만, 나중에 데이터가 늘었을 때를 대비해 여기서 막아둔다. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />

      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> <Link href="/guide">정보 가이드</Link>
      </nav>

      <h1 className="gtitle">{g.title}</h1>
      <p className="gquestion">{g.lead}</p>

      {/* 결론 — AI 답변엔진이 인용하는 자리. 표보다 위에 있어야 한다. */}
      <div className="ganswer">
        <div className="ganswer-head">{g.question}</div>
        <p>{g.answer}</p>
      </div>

      <article className="gbody">
        <GuideBody guide={g} />
      </article>

      <section className="gfaq">
        <h2>자주 묻는 질문</h2>
        {g.faq.map((f) => (
          <details key={f.q} className="gfaq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <section className="gsources">
        <h2>근거 자료</h2>
        <ul>
          {g.sources.map((s) => (
            <li key={s.url}>
              <span className="gsrc-org">{s.org}</span>
              <a href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.title}</a>
            </li>
          ))}
        </ul>
        <p className="gdisclaimer">
          <Icon name="info" size={14} /> 이 글은 일반적인 정보이며 <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
          개체마다 상태가 달라서, 이상 징후가 보이면 병원에 먼저 가 보세요.
        </p>
      </section>

      {related.length > 0 && (
        <section className="grelated">
          <h2>함께 보면 좋은 글</h2>
          <div className="linklist">
            {related.map((r) => (
              <Link key={r!.slug} href={`/guide/${r!.slug}`}>
                <b>{r!.title}</b>
                <span>{r!.lead}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="gcta">
        <h2>우리 아이 숫자로 다시 보고 싶다면</h2>
        <p>
          이 글은 일반 기준이에요. 품종, 나이, 체중을 적으면 같은 기준을 우리 아이 숫자로 바꿔
          급여량, 접종 일정, 조심할 질환까지 리포트로 정리해 드려요. 결제 전에 무료 가이드로 먼저 확인할 수 있어요.
        </p>
        <div className="gcta-btns">
          <Link href="/diagnose" className="btn btn--primary btn--lg">리포트 만들기</Link>
          <Link href="/breed" className="btn btn--secondary btn--lg">품종 가이드 보기</Link>
        </div>
      </section>
    </main>
  );
}
