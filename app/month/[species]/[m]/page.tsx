import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Disclosure, ShopCards } from '@/components/board/ShopCards';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd } from '@/components/seo/SeoBits';
import { ORG_REF, PUBLISHED, SOURCES, socialMeta } from '@/lib/breedSeo';
import { breedPath, fmtKg } from '@/lib/growth';
import { MONTHS, SEO_UPDATED, babyKo, isSp, mealsOf, monthBreedRows, monthCopy, spKo, type Sp } from '@/lib/seoPages';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { PAGE_SHOP, hasLive, picksById } from '@/lib/shop';
import { SITE } from '@/lib/site';

/**
 * 개월별 몸무게·사료량(2026-11-22) — 「강아지 3개월 몸무게」「아기 고양이 4개월 사료량」을 노린다.
 * 품종을 몰라도 「다 크면 몇 kg」 줄로 찾고, 인기 품종 표로 바로 비교한다. 숫자는 lib/seoPages(→ lib/energy·growthCurve).
 */
export const dynamicParams = process.env.NODE_ENV === 'development';

export function generateStaticParams() {
  return (['dog', 'cat'] as const).flatMap((species) => MONTHS.map((m) => ({ species, m: String(m) })));
}

const parse = (p: { species: string; m: string }): [Sp, number] | null => {
  const m = Number(p.m);
  return isSp(p.species) && MONTHS.includes(m) ? [p.species, m] : null;
};
const pathOf = (s: Sp, m: number) => `/month/${s}/${m}`;

export function generateMetadata({ params }: { params: { species: string; m: string } }): Metadata {
  const v = parse(params);
  if (!v) return {};
  const { title, description } = monthCopy(...v);
  const url = `${SITE.url}${pathOf(...v)}`;
  return { title: `${title} — 품종별 표 | 마이펫`, description, alternates: { canonical: url }, robots: NAVER_BING_ONLY, ...socialMeta(title, description, url) };
}

export default function MonthPage({ params }: { params: { species: string; m: string } }) {
  const v = parse(params);
  if (!v) notFound();
  const [s, m] = v;
  const { title, answer, description, faq, rows } = monthCopy(s, m);
  const breeds = monthBreedRows(s, m);
  const url = `${SITE.url}${pathOf(s, m)}`;
  const sk = spKo(s);
  const food = picksById(PAGE_SHOP[s === 'dog' ? 'month-dog-food' : 'month-cat-food'].ids);
  const kit = picksById(PAGE_SHOP[s === 'dog' ? 'month-dog-kit' : 'month-cat-kit'].ids);
  const live = hasLive(food) || hasLive(kit);
  const i = MONTHS.indexOf(m);

  return (
    <main className="container guide">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description,
            inLanguage: 'ko',
            datePublished: SEO_UPDATED,
            dateModified: SEO_UPDATED,
            mainEntityOfPage: url,
            image: `${SITE.url}/opengraph-image`,
            author: ORG_REF,
            publisher: ORG_REF,
            citation: [SOURCES.nutrition, ...(s === 'dog' ? [SOURCES.growth] : [])].map((x) => ({ '@type': 'CreativeWork', name: x.title, url: x.url })),
          },
          faqJsonLd([{ q: `${m}개월 ${sk} 몸무게와 사료량은요?`, a: answer }, ...faq]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '개월별 몸무게·사료량', url: `${SITE.url}/month` },
            { name: `${m}개월 ${sk}`, url },
          ]),
        ]}
      />

      <nav className="gcrumb">
        <Link href="/month">개월별 몸무게·사료량</Link> <span>›</span> {sk} <span>›</span> {m}개월
      </nav>
      <h1 className="gtitle">{title}</h1>
      <p className="gquestion">
        {m}개월 {babyKo(s)}는 몇 kg이고 하루에 몇 g을 먹을까요? 다 큰 몸무게별, 인기 품종별로 정리했어요.
      </p>
      {live ? <Disclosure /> : null}

      <nav className="bsub" aria-label="개월 고르기">
        {MONTHS.map((x) => (
          <Link key={x} href={pathOf(s, x)} aria-current={x === m ? 'page' : undefined}>
            {x}개월
          </Link>
        ))}
      </nav>

      <div className="ganswer">
        <div className="ganswer-head">
          {m}개월 {sk} 몸무게와 사료량은요?
        </div>
        <p>{answer}</p>
      </div>

      <section className="bsec">
        <h2>
          {m}개월 {sk} 다 큰 몸무게별 표
        </h2>
        <div className="gtable-wrap">
          <table className="gtable gtable--fit gtable--num">
            <thead>
              <tr>
                <th>다 크면</th>
                <th className="num">지금 몸무게</th>
                <th className="num">다 큰 몸무게 대비</th>
                <th className="num">하루 사료</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td>
                    <b>{r.label.replace('다 크면 ', '')}</b>
                  </td>
                  <td className="num">약 {fmtKg(r.weight)}kg</td>
                  <td className="num">{Math.round(r.ratio * 100)}%</td>
                  <td className="num">{r.gram}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="gnote">
          <Icon name="info" size={14} />
          체급마다 자라는 속도가 달라 같은 {m}개월이라도 다 큰 몸무게 대비 비율이 달라요. 하루 사료는 건사료 1g을 3.5~4.0kcal로 보고 계산했고, 하루 {mealsOf(s, m)}에 나눠 줘요.
        </p>
      </section>

      <section className="bsec">
        <ShopCards level={2} picks={food} label={PAGE_SHOP[s === 'dog' ? 'month-dog-food' : 'month-cat-food'].label} />
      </section>

      {breeds.length > 0 && (
        <section className="bsec">
          <h2>
            인기 품종 {m}개월 몸무게·사료량
          </h2>
          <div className="gtable-wrap">
            <table className="gtable gtable--fit gtable--num">
              <thead>
                <tr>
                  <th>품종</th>
                  <th className="num">{m}개월 예상 몸무게</th>
                  <th className="num">하루 사료</th>
                </tr>
              </thead>
              <tbody>
                {breeds.map((r) => (
                  <tr key={r.b.breed_ko}>
                    <td>
                      <Link href={breedPath(r.b.breed_ko, 'growth')}>
                        <b>{r.name}</b>
                      </Link>
                    </td>
                    <td className="num">{r.range}</td>
                    <td className="num">{r.gram}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gnote">
            <Icon name="info" size={14} />
            품종 표준 체중에 체급별 성장 속도를 곱한 예상 범위예요. 품종 이름을 누르면 2개월부터 다 클 때까지 개월별 표가 나와요.
          </p>
        </section>
      )}

      <section className="bsec">
        <ShopCards level={2} picks={kit} label={PAGE_SHOP[s === 'dog' ? 'month-dog-kit' : 'month-cat-kit'].label} />
      </section>

      <FaqList items={faq} />

      <section className="grelated">
        <h2>다른 달도 보기</h2>
        <div className="blinks">
          {i > 0 && <Link href={pathOf(s, MONTHS[i - 1])}>← {MONTHS[i - 1]}개월 {sk}</Link>}
          {i < MONTHS.length - 1 && <Link href={pathOf(s, MONTHS[i + 1])}>{MONTHS[i + 1]}개월 {sk} →</Link>}
          <Link href={pathOf(s === 'dog' ? 'cat' : 'dog', m)}>
            {m}개월 {spKo(s === 'dog' ? 'cat' : 'dog')}
          </Link>
          <Link href={`/guide/${s}-vaccine-schedule`}>{sk} 예방접종 시기</Link>
          <Link href="/tools/adult-weight">다 큰 몸무게 계산기</Link>
          <Link href="/tools/food">사료량 계산기</Link>
        </div>
      </section>

      <section className="gsources">
        <h2>근거 자료</h2>
        <ul>
          {[SOURCES.nutrition, ...(s === 'dog' ? [SOURCES.growth] : [])].map((x) => (
            <li key={x.url}>
              <span className="gsrc-org">{x.org}</span>
              <a href={x.url} target="_blank" rel="noopener noreferrer nofollow">
                {x.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="gdisclaimer">
          <Icon name="info" size={14} /> 표는 시작점이에요. 체형을 보며 10%씩 조절하고, <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
        </p>
      </section>
    </main>
  );
}
