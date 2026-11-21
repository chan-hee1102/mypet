import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Disclosure, ShopCards } from '@/components/board/ShopCards';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd } from '@/components/seo/SeoBits';
import { ORG_REF, socialMeta } from '@/lib/breedSeo';
import { AGES, AGE_SOURCES, SEO_UPDATED, ageCopy, isSp, spKo, type Sp } from '@/lib/seoPages';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { PAGE_SHOP, hasLive, picksById } from '@/lib/shop';
import { SITE } from '@/lib/site';

/**
 * 나이별 사람 나이(2026-11-22) — 「강아지 10살 사람 나이」「고양이 15살 사람 나이」를 노린다.
 * 환산식은 사람 나이 환산표 가이드와 같은 lib/guidePersonal humanAge, 노령기 기준은 lib/petData seniorStartMonths(사이트 전체와 같은 값).
 */
export const dynamicParams = process.env.NODE_ENV === 'development';

export function generateStaticParams() {
  return (['dog', 'cat'] as const).flatMap((species) => AGES[species].map((y) => ({ species, y: String(y) })));
}

const parse = (p: { species: string; y: string }): [Sp, number] | null => {
  const y = Number(p.y);
  return isSp(p.species) && AGES[p.species].includes(y) ? [p.species, y] : null;
};
const pathOf = (s: Sp, y: number) => `/age/${s}/${y}`;

export function generateMetadata({ params }: { params: { species: string; y: string } }): Metadata {
  const v = parse(params);
  if (!v) return {};
  const { title, description } = ageCopy(...v);
  const url = `${SITE.url}${pathOf(...v)}`;
  return { title: `${title} 체구별 환산·노령기 | 마이펫`, description, alternates: { canonical: url }, robots: NAVER_BING_ONLY, ...socialMeta(title, description, url) };
}

export default function AgePage({ params }: { params: { species: string; y: string } }) {
  const v = parse(params);
  if (!v) notFound();
  const [s, y] = v;
  const { title, answer, description, faq, rows, anySenior } = ageCopy(s, y);
  const url = `${SITE.url}${pathOf(s, y)}`;
  const sk = spKo(s);
  const key = `age-${s}-${anySenior ? 'senior' : 'adult'}`;
  const picks = picksById(PAGE_SHOP[key].ids);
  const live = hasLive(picks);
  const list = AGES[s];
  const i = list.indexOf(y);
  const near = list.slice(Math.max(0, i - 3), i + 4).filter((x) => x !== y);
  const src = AGE_SOURCES[s];

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
            citation: [{ '@type': 'CreativeWork', name: src.title, url: src.url }],
          },
          faqJsonLd([{ q: `${y}살 ${sk}는 사람 나이로 몇 살이에요?`, a: answer }, ...faq]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '나이별 사람 나이', url: `${SITE.url}/age` },
            { name: `${y}살 ${sk}`, url },
          ]),
        ]}
      />

      <nav className="gcrumb">
        <Link href="/age">나이별 사람 나이</Link> <span>›</span> {sk} <span>›</span> {y}살
      </nav>
      <h1 className="gtitle">{title}</h1>
      <p className="gquestion">
        {y}살 {sk}의 사람 나이를 {s === 'dog' ? '체구별로 ' : ''}환산하고, 노령기인지와 이 나이에 챙길 것을 정리했어요.
      </p>
      {live ? <Disclosure /> : null}

      <div className="ganswer">
        <div className="ganswer-head">
          {y}살 {sk}는 사람 나이로 몇 살이에요?
        </div>
        <p>{answer}</p>
      </div>

      <section className="bsec">
        <h2>
          {y}살 {sk} 사람 나이{s === 'dog' ? ' — 체구별' : ''}
        </h2>
        <div className="gtable-wrap">
          <table className="gtable gtable--fit gtable--num">
            <thead>
              <tr>
                <th>{s === 'dog' ? '체구' : '구분'}</th>
                <th className="num">사람 나이</th>
                <th className="num">생애 단계</th>
                <th className="num">하루 사료 예시</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td>
                    <b>{r.label}</b>
                  </td>
                  <td className="num">약 {r.human}살</td>
                  <td className="num">{r.stage}</td>
                  <td className="num">
                    {r.kg}kg · {r.feed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="gnote">
          <Icon name="info" size={14} />
          첫해를 사람 15살, 두 살을 24살로 보고 그 뒤 해마다 {s === 'dog' ? '소형견 4.5살, 중형견 5살, 대형견 6살' : '4살'}씩 더한 대략적인 값이에요. 하루 사료는 중성화 기준이에요.
        </p>
      </section>

      <section className="bsec">
        <h2>
          {y}살 {sk}에게 챙길 것
        </h2>
        <ul className="glist">
          <li>건강검진은 {y >= 7 ? '6개월마다' : '1년에 한 번'} 받아요. 7살이 넘으면 6개월마다로 줄여요.</li>
          <li>몸무게를 한 달에 한 번 같은 시간에 재서 적어 두세요. 갑자기 줄거나 늘면 병원에서 확인해요.</li>
          {anySenior ? <li>나이가 들면 물 마시는 양과 소변·배변 변화가 먼저 나타나는 경우가 많아요. 평소와 다르면 적어 두세요.</li> : null}
          {anySenior ? <li>미끄러운 바닥에 매트를 깔고, 소파·침대 앞에 계단을 두면 관절 부담을 덜 수 있어요.</li> : <li>간식은 하루 열량의 10% 안에서 줘요.</li>}
        </ul>
      </section>

      <section className="bsec">
        <ShopCards level={2} picks={picks} label={PAGE_SHOP[key].label} />
      </section>

      <FaqList items={faq} />

      <section className="grelated">
        <h2>다른 나이도 보기</h2>
        <div className="blinks">
          {near.map((x) => (
            <Link key={x} href={pathOf(s, x)}>
              {x}살 {sk} 사람 나이
            </Link>
          ))}
          <Link href="/guide/dog-age-in-human-years">강아지·고양이 사람 나이 환산표</Link>
          <Link href="/weight">체중별 사료량</Link>
        </div>
      </section>

      <section className="gsources">
        <h2>근거 자료</h2>
        <ul>
          <li>
            <span className="gsrc-org">{src.org}</span>
            <a href={src.url} target="_blank" rel="noopener noreferrer nofollow">
              {src.title}
            </a>
          </li>
        </ul>
        <p className="gdisclaimer">
          <Icon name="info" size={14} /> 사람 나이 환산은 대략적인 값이에요. <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
        </p>
      </section>
    </main>
  );
}
