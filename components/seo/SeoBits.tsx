/** 구조화 데이터 한 덩어리. JSON 안의 「<」를 이스케이프해 </script>로 문서가 끊기지 않게 한다 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
  );
}

export type Faq = { q: string; a: string };

/** FAQ 목록 — 답은 접혀 있어도 HTML에 전부 들어 있다(검색엔진·AI가 읽는다) */
export function FaqList({ items, title = '자주 묻는 질문' }: { items: Faq[]; title?: string }) {
  return (
    <section className="gfaq">
      <h2>{title}</h2>
      {items.map((f) => (
        <details key={f.q} className="gfaq-item">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  );
}

export const faqJsonLd = (items: Faq[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const breadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
});
