import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Disclosure, ShopCards } from '@/components/board/ShopCards';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd } from '@/components/seo/SeoBits';
import { ORG_REF, SOURCES, baseName, socialMeta } from '@/lib/breedSeo';
import { breedPath } from '@/lib/growth';
import { KGS, SEO_UPDATED, adultKo, isSp, spKo, weightCopy, type Sp } from '@/lib/seoPages';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { PAGE_SHOP, hasLive, picksById } from '@/lib/shop';
import { SITE } from '@/lib/site';

/**
 * 체중별 하루 사료량(2026-11-22) — 「5kg 강아지 사료량」「4kg 고양이 사료 몇 g」을 노린다. 품종을 몰라도 몸무게만으로.
 * 숫자는 lib/seoPages weightCopy(→ lib/energy, 품종 사료량 표와 같은 식).
 */
export const dynamicParams = process.env.NODE_ENV === 'development';

export function generateStaticParams() {
  return (['dog', 'cat'] as const).flatMap((species) => KGS[species].map((kg) => ({ species, kg: String(kg) })));
}

const parse = (p: { species: string; kg: string }): [Sp, number] | null => {
  const kg = Number(p.kg);
  return isSp(p.species) && KGS[p.species].includes(kg) ? [p.species, kg] : null;
};
const pathOf = (s: Sp, kg: number) => `/weight/${s}/${kg}`;

export function generateMetadata({ params }: { params: { species: string; kg: string } }): Metadata {
  const v = parse(params);
  if (!v) return {};
  const { title, description } = weightCopy(...v);
  const url = `${SITE.url}${pathOf(...v)}`;
  return { title: `${title}, 몇 g? 종이컵·간식까지 | 마이펫`, description, alternates: { canonical: url }, robots: NAVER_BING_ONLY, ...socialMeta(title, description, url) };
}

const kcal = (n: number) => `${Math.round(n / 10) * 10}kcal`;

export default function WeightPage({ params }: { params: { species: string; kg: string } }) {
  const v = parse(params);
  if (!v) notFound();
  const [s, kg] = v;
  const { title, answer, description, faq, rows, treat, breeds, size } = weightCopy(s, kg);
  const url = `${SITE.url}${pathOf(s, kg)}`;
  const sk = spKo(s);
  const foodKey = s === 'cat' ? 'weight-cat' : size === '소형' ? 'weight-dog-small' : size === '중형' ? 'weight-dog-medium' : 'weight-dog-large';
  const treatKey = s === 'cat' ? 'weight-cat-treat' : kg < 10 ? 'weight-dog-treat-small' : 'weight-dog-treat-large';
  const food = picksById(PAGE_SHOP[foodKey].ids);
  const treats = picksById(PAGE_SHOP[treatKey].ids);
  const live = hasLive(food) || hasLive(treats);
  const list = KGS[s];
  const i = list.indexOf(kg);
  const near = list.slice(Math.max(0, i - 4), i + 5).filter((x) => x !== kg);

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
            citation: [{ '@type': 'CreativeWork', name: SOURCES.nutrition.title, url: SOURCES.nutrition.url }],
          },
          faqJsonLd([{ q: `${kg}kg ${sk} 하루 사료량은요?`, a: answer }, ...faq]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '체중별 사료량', url: `${SITE.url}/weight` },
            { name: `${kg}kg ${sk}`, url },
          ]),
        ]}
      />

      <nav className="gcrumb">
        <Link href="/weight">체중별 사료량</Link> <span>›</span> {sk} <span>›</span> {kg}kg
      </nav>
      <h1 className="gtitle">{title}</h1>
      <p className="gquestion">
        {kg}kg {sk}에게 하루 몇 g을 줘야 할까요? 중성화 여부·나이별 양과 종이컵 환산, 간식 상한까지 정리했어요.
      </p>
      {live ? <Disclosure /> : null}

      <div className="ganswer">
        <div className="ganswer-head">
          {kg}kg {sk} 하루 사료량은요?
        </div>
        <p>{answer}</p>
      </div>

      <section className="bsec">
        <h2>
          {kg}kg {sk} 상태별 하루 사료량
        </h2>
        <div className="gtable-wrap">
          <table className="gtable gtable--fit gtable--num">
            <thead>
              <tr>
                <th>상태</th>
                <th className="num">하루 열량</th>
                <th className="num">건사료</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td>
                    <b>{r.label}</b>
                  </td>
                  <td className="num">{kcal(r.e.kcal)}</td>
                  <td className="num">{r.e.gramLo === r.e.gramHi ? `약 ${r.e.gramLo}g` : `${r.e.gramLo}~${r.e.gramHi}g`}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>간식 하루 상한</b>
                </td>
                <td className="num">{treat}</td>
                <td className="num">하루 열량의 10%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="gnote">
          <Icon name="info" size={14} />
          쉬는 동안 쓰는 열량(70 × 몸무게의 0.75제곱)에 활동계수를 곱하고, 건사료 1g을 3.5~4.0kcal로 보고 나눴어요. {adultKo(s)} 기준이고, 1살 전 아기는{' '}
          <Link href={`/month/${s}/3`}>개월별 표</Link>를 보세요.
        </p>
      </section>

      <section className="bsec">
        <ShopCards level={2} picks={food} label={`${kg}kg ${sk}에게 맞는 ${PAGE_SHOP[foodKey].label}`} />
      </section>

      {breeds.length > 0 && (
        <section className="bsec">
          <h2>다 크면 {kg}kg 안팎인 품종</h2>
          <p>품종을 알면 그 품종의 개월별·체중별 표가 더 정확해요.</p>
          <div className="blinks">
            {breeds.slice(0, 24).map((b) => (
              <Link key={b.breed_ko} href={breedPath(b.breed_ko, 'food')}>
                {baseName(b)} 사료량
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bsec">
        <ShopCards level={2} picks={treats} label={PAGE_SHOP[treatKey].label} />
      </section>

      <FaqList items={faq} />

      <section className="grelated">
        <h2>다른 몸무게도 보기</h2>
        <div className="blinks">
          {near.map((x) => (
            <Link key={x} href={pathOf(s, x)}>
              {x}kg {sk} 사료량
            </Link>
          ))}
          <Link href="/tools/food">사료량 계산기</Link>
        </div>
      </section>

      <section className="gsources">
        <h2>근거 자료</h2>
        <ul>
          <li>
            <span className="gsrc-org">{SOURCES.nutrition.org}</span>
            <a href={SOURCES.nutrition.url} target="_blank" rel="noopener noreferrer nofollow">
              {SOURCES.nutrition.title}
            </a>
          </li>
        </ul>
        <p className="gdisclaimer">
          <Icon name="info" size={14} /> 개체마다 활동량과 대사가 달라요. 표는 시작점이고, 체형을 보며 10%씩 조절하세요. <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
        </p>
      </section>
    </main>
  );
}
