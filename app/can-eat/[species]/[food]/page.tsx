import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Disclosure, ShopCards } from '@/components/board/ShopCards';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd } from '@/components/seo/SeoBits';
import { ORG_REF, socialMeta } from '@/lib/breedSeo';
import { VERDICT, findFood, foodPath, foodsFor } from '@/lib/foodSafety';
import { SEO_UPDATED, isSp, spKo, type Sp } from '@/lib/seoPages';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { PAGE_SHOP, hasLive, picksById } from '@/lib/shop';
import { SITE } from '@/lib/site';
import { josa } from '@/lib/josa';

/**
 * 「강아지 포도 먹어도 되나요?」 음식별 페이지(2026-11-22). 자료와 원칙은 lib/foodSafety.
 * 맨 위 결론(verdict) → 왜 → 증상 → 줄 때는/먹었다면 → 다른 종은 → 출처. 출처는 그 음식 원문 링크 그대로.
 */
export const dynamicParams = process.env.NODE_ENV === 'development';

export function generateStaticParams() {
  return (['dog', 'cat'] as const).flatMap((species) => foodsFor(species).map((f) => ({ species, food: f.slug })));
}

const parse = (p: { species: string; food: string }) => {
  if (!isSp(p.species)) return null;
  const f = findFood(p.food);
  return f && f[p.species].verdict ? ([p.species, f] as const) : null;
};

const titleOf = (s: Sp, name: string) => `${spKo(s)} ${name} 먹어도 되나요?`;

export function generateMetadata({ params }: { params: { species: string; food: string } }): Metadata {
  const v = parse(params);
  if (!v) return {};
  const [s, f] = v;
  const side = f[s];
  const title = titleOf(s, f.name);
  const description = `${side.answer} ${side.why}`.slice(0, 150);
  const url = `${SITE.url}${foodPath(s, f.slug)}`;
  return { title: `${title} ${VERDICT[side.verdict!].word} — 이유·증상·먹었을 때 | 마이펫`, description, alternates: { canonical: url }, robots: NAVER_BING_ONLY, ...socialMeta(title, description, url) };
}

export default function CanEatPage({ params }: { params: { species: string; food: string } }) {
  const v = parse(params);
  if (!v) notFound();
  const [s, f] = v;
  const side = f[s];
  const vd = VERDICT[side.verdict!];
  const sk = spKo(s);
  const other: Sp = s === 'dog' ? 'cat' : 'dog';
  const os = f[other];
  const title = titleOf(s, f.name);
  const url = `${SITE.url}${foodPath(s, f.slug)}`;
  const key = s === 'dog' ? 'can-eat-dog' : 'can-eat-cat';
  const picks = picksById(PAGE_SHOP[key].ids);
  const live = hasLive(picks);
  const same = foodsFor(s).filter((x) => x.slug !== f.slug && x[s].verdict === side.verdict).slice(0, 10);
  const faq = [
    ...f.aliases
      .filter((a) => a !== f.name)
      .slice(0, 3)
      .map((a) => ({ q: `${sk} ${a} 먹어도 돼요?`, a: `${side.answer}` })),
    ...(side.ifEaten ? [{ q: `${sk}가 ${josa(f.name, '을/를')} 먹었으면 어떻게 해요?`, a: side.ifEaten }] : []),
    ...(os.verdict ? [{ q: `${spKo(other)}는 ${f.name} 먹어도 돼요?`, a: os.answer }] : []),
  ];

  return (
    <main className="container guide">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description: side.answer,
            inLanguage: 'ko',
            datePublished: SEO_UPDATED,
            dateModified: SEO_UPDATED,
            mainEntityOfPage: url,
            image: `${SITE.url}/opengraph-image`,
            author: ORG_REF,
            publisher: ORG_REF,
            citation: f.sources.map((x) => ({ '@type': 'CreativeWork', name: x.title, url: x.url })),
          },
          faqJsonLd([{ q: title, a: `${side.answer} ${side.why}` }, ...faq]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '먹어도 되나요', url: `${SITE.url}/can-eat` },
            { name: title, url },
          ]),
        ]}
      />

      <nav className="gcrumb">
        <Link href="/can-eat">먹어도 되나요</Link> <span>›</span> {sk} <span>›</span> {f.name}
      </nav>
      <h1 className="gtitle">{title}</h1>
      <p className="gquestion">
        <span className={vd.cls}>{vd.word}</span>
      </p>
      {live ? <Disclosure /> : null}

      <div className="ganswer">
        <div className="ganswer-head">{title}</div>
        <p>{side.answer}</p>
      </div>

      <section className="bsec">
        <h2>왜 그런가요?</h2>
        <p>{side.why}</p>
      </section>

      {side.symptoms.length > 0 && (
        <section className="bsec">
          <h2>먹었을 때 보일 수 있는 증상</h2>
          <ul className="glist">
            {side.symptoms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {side.howTo ? (
        <section className="bsec">
          <h2>줄 때는 이렇게</h2>
          <p>{side.howTo}</p>
        </section>
      ) : null}

      {side.ifEaten ? (
        <section className="bsec">
          <h2>이미 먹었다면</h2>
          <p>{side.ifEaten}</p>
          <p className="gnote">
            <Icon name="info" size={14} />
            무엇을, 언제, 얼마나 먹었는지 적어 두고 포장지가 있으면 챙기세요. 수의사 지시 없이 억지로 토하게 하지 마세요.
          </p>
        </section>
      ) : null}

      {os.verdict ? (
        <section className="bsec">
          <h2>{spKo(other)}는요?</h2>
          <p>
            <span className={VERDICT[os.verdict].cls}>{VERDICT[os.verdict].short}</span> {os.answer}{' '}
            <Link href={foodPath(other, f.slug)}>{spKo(other)} {f.name} 자세히</Link>
          </p>
        </section>
      ) : null}

      <section className="bsec">
        <ShopCards level={2} picks={picks} label={PAGE_SHOP[key].label} />
      </section>

      {faq.length > 0 && <FaqList items={faq} />}

      <section className="grelated">
        <h2>
          {sk}에게 {vd.word === '먹으면 안 돼요' ? '주면 안 되는' : vd.short === '조심' ? '조심해야 하는' : '줘도 되는'} 다른 음식
        </h2>
        <div className="blinks">
          {same.map((x) => (
            <Link key={x.slug} href={foodPath(s, x.slug)}>
              {sk} {x.name}
            </Link>
          ))}
          <Link href="/can-eat">음식 전체 보기</Link>
          <Link href={`/guide/${s}-toxic-foods`}>{sk}가 먹으면 안 되는 음식 표</Link>
        </div>
      </section>

      <section className="gsources">
        <h2>근거 자료</h2>
        <ul>
          {f.sources.map((x) => (
            <li key={x.url}>
              <span className="gsrc-org">{x.org}</span>
              <a href={x.url} target="_blank" rel="noopener noreferrer nofollow">
                {x.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="gdisclaimer">
          <Icon name="info" size={14} /> 일반적인 정보예요. 먹은 양과 몸 상태에 따라 다르니 걱정되면 바로 동물병원에 연락하세요. <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
        </p>
      </section>
    </main>
  );
}
