import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Disclosure, ShopCards } from '@/components/board/ShopCards';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd } from '@/components/seo/SeoBits';
import { ORG_REF, socialMeta } from '@/lib/breedSeo';
import { breedPath, isFeatured } from '@/lib/growth';
import { SEO_UPDATED, compareCopy, comparePairs, comparePath, compareSlug, findPair, pairsOf, spKo } from '@/lib/seoPages';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { hasLive, picksFor, type Pick } from '@/lib/shop';
import { SITE } from '@/lib/site';

/**
 * 품종 비교(2026-11-22) — 「말티즈 푸들 차이」「코숏 러시안블루 비교」를 노린다. 비슷한 체구의 인기 품종끼리 짝(lib/seoPages comparePairs).
 * 값은 전부 품종 케어 프로필·표준 체중에서(새 사실 없음). 「어느 쪽이 낫다」고 말하지 않고, 다른 점과 「이런 집이라면」만.
 */
export const dynamicParams = process.env.NODE_ENV === 'development';

export function generateStaticParams() {
  return comparePairs().map(([a, b]) => ({ pair: compareSlug(a, b) }));
}

export function generateMetadata({ params }: { params: { pair: string } }): Metadata {
  const v = findPair(params.pair);
  if (!v) return {};
  const { title, description } = compareCopy(...v);
  const url = `${SITE.url}${comparePath(...v)}`;
  return { title: `${title} | 마이펫`, description, alternates: { canonical: url }, robots: NAVER_BING_ONLY, ...socialMeta(title, description, url) };
}

export default function ComparePage({ params }: { params: { pair: string } }) {
  const v = findPair(params.pair);
  if (!v) notFound();
  const [a, b] = v;
  const { A, B, s, rows, answer, fit, title, description, faq, pa, pb } = compareCopy(a, b);
  const url = `${SITE.url}${comparePath(a, b)}`;
  // 두 품종의 사료 카드 — 같은 카드는 한 번만, 3장까지
  const seen = new Set<string>();
  const food: Pick[] = [...picksFor(pa, 'food', 2), ...picksFor(pb, 'food', 2)].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true))).slice(0, 3);
  const live = hasLive(food);
  const more = [...pairsOf(a.breed_ko), ...pairsOf(b.breed_ko)].filter(([x, y]) => compareSlug(x, y) !== compareSlug(a, b));

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
            about: [
              { '@type': 'Thing', name: `${a.breed_ko} (${a.breed_en})` },
              { '@type': 'Thing', name: `${b.breed_ko} (${b.breed_en})` },
            ],
            author: ORG_REF,
            publisher: ORG_REF,
          },
          faqJsonLd([{ q: `${A}와 ${B}는 무엇이 달라요?`, a: answer }, ...faq]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '품종 비교', url: `${SITE.url}/compare` },
            { name: `${A} vs ${B}`, url },
          ]),
        ]}
      />

      <nav className="gcrumb">
        <Link href="/compare">품종 비교</Link> <span>›</span> {spKo(s)} <span>›</span> {A} vs {B}
      </nav>
      <h1 className="gtitle">
        {A} vs {B}, 무엇이 다를까?
      </h1>
      <p className="gquestion">몸무게·수명·털 빠짐·{s === 'dog' ? '짖음' : '울음'}·미용·{s === 'dog' ? '산책' : '놀이'}·사료량을 표 한 장으로 비교했어요.</p>
      {live ? <Disclosure /> : null}

      <div className="ganswer">
        <div className="ganswer-head">
          {A}와 {B}는 무엇이 달라요?
        </div>
        <p>{answer}</p>
      </div>

      <section className="bsec">
        <h2>한눈에 비교</h2>
        <div className="gtable-wrap">
          <table className="gtable gtable--fit">
            <thead>
              <tr>
                <th></th>
                <th>
                  <Link href={breedPath(a.breed_ko)}>{A}</Link>
                </th>
                <th>
                  <Link href={breedPath(b.breed_ko)}>{B}</Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td>
                    <b>{r.label}</b>
                  </td>
                  <td>{r.a}</td>
                  <td>{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="gnote">
          <Icon name="info" size={14} />
          품종의 일반적인 경향이에요. 같은 품종이라도 개체마다 성격과 털 빠짐이 달라요. 하루 사료는 표준 체중 가운데 값, 중성화 기준이에요.
        </p>
      </section>

      {fit.length > 0 && (
        <section className="bsec">
          <h2>이런 집이라면</h2>
          <ul className="glist">
            {fit.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="bsec">
        <ShopCards level={2} picks={food} label={`${A}·${B} 사료`} />
      </section>

      <FaqList items={faq} />

      <section className="grelated">
        <h2>더 보기</h2>
        <div className="blinks">
          <Link href={breedPath(a.breed_ko)}>{A} 키우기</Link>
          <Link href={breedPath(b.breed_ko)}>{B} 키우기</Link>
          {isFeatured(a.breed_ko) && <Link href={breedPath(a.breed_ko, 'growth')}>{A} 개월별 몸무게</Link>}
          {isFeatured(b.breed_ko) && <Link href={breedPath(b.breed_ko, 'growth')}>{B} 개월별 몸무게</Link>}
          {more.slice(0, 6).map(([x, y]) => (
            <Link key={compareSlug(x, y)} href={comparePath(x, y)}>
              {x.breed_ko.replace(/\(.*\)/, '')} vs {y.breed_ko.replace(/\(.*\)/, '')}
            </Link>
          ))}
        </div>
      </section>

      <section className="gsources">
        <h2>근거 자료</h2>
        <ul>
          {[a, b]
            .filter((x) => x.source_url)
            .map((x) => (
              <li key={x.breed_ko}>
                <span className="gsrc-org">{x.source_org}</span>
                <a href={x.source_url} target="_blank" rel="noopener noreferrer nofollow">
                  {x.source_title ?? `${x.breed_ko} 품종 표준`}
                </a>
              </li>
            ))}
        </ul>
        <p className="gdisclaimer">
          <Icon name="info" size={14} /> 품종 표준과 공개 자료를 바탕으로 한 일반 정보예요. <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
        </p>
      </section>
    </main>
  );
}
