import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icons';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd, type Faq } from '@/components/seo/SeoBits';
import AdultWeightCalc from '@/components/tools/AdultWeightCalc';
import {
  babyWord, baseName, breedHealth, breedNotes, growthBasisNote, growthCare, growthFacts, growthSources, kindOf, nameWithAlias,
  neighbors, ORG_REF, PUBLISHED, socialMeta, standardNote, titleName,
} from '@/lib/breedSeo';
import { breedPath, breedSlugOf, featuredBreeds, fmtKg, slugMatches, type BreedRow } from '@/lib/growth';
import { josa } from '@/lib/josa';
import { SITE } from '@/lib/site';

/**
 * 품종별 개월별 몸무게(성장표) — 「말티즈 개월별 몸무게」「포메 다 크면 몇 kg」을 노린다.
 * 2026-09-27 조사: 이 검색어의 구글 상위는 커뮤니티 질문 글(82cook·아하)뿐이고 정리된 표가 없었다.
 * 인기 품종(lib/growth FEATURED_BREEDS)만 연다 — 검색 수요가 없는 품종까지 얇은 페이지를 늘리지 않는다.
 * ⚠️ 판정하지 않는다: 「정상」「괜찮아요」 대신 「보통 성장 속도」. 숫자는 mypet 추정값이라서.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return featuredBreeds().map((b) => ({ slug: breedSlugOf(b.breed_ko) }));
}

const find = (slug: string) => featuredBreeds().find((b) => slugMatches(slug, b.breed_ko));

function copy(b: BreedRow) {
  const f = growthFacts(b)!;
  const name = baseName(b);
  const at3 = f.at(3);
  const at6 = f.at(6);
  const title = `${titleName(b)} 개월별 몸무게, 다 크면 몇 kg?`;
  const description = `${josa(nameWithAlias(b), '은/는')} 다 크면 보통 ${f.adultText}, ${f.end.label} 거의 다 자라요. 2개월부터 ${f.lastMonth}개월까지 예상 몸무게 표와 다 큰 몸무게 계산기.`;
  const answer = `${josa(name, '은/는')} 보통 ${f.end.label} 거의 다 자라고, 다 큰 몸무게는 ${f.adultText}이에요. 3개월 ${f.range(at3)}, 6개월 ${f.range(at6)} 안팎이 이 품종의 보통 성장 속도예요(표준 체중으로 계산한 예상 범위).`;
  const faq: Faq[] = [
    { q: `${name} 다 크면 몇 kg인가요?`, a: `표준 체중은 ${f.adultText}이에요. ${standardNote(b)} 부모 체구와 성별에 따라 이 범위를 벗어나기도 해요.` },
    { q: `${josa(name, '은/는')} 몇 개월까지 크나요?`, a: `${f.end.label} 거의 다 자라요. 작은 품종일수록 일찍, 큰 품종일수록 늦게까지 자라요.` },
    { q: `${name} 3개월 몸무게는 보통 얼마인가요?`, a: `3개월 예상 범위는 ${f.range(at3)}이에요. 범위를 조금 벗어나도 체형이 알맞으면 흔한 개체차예요. 2주 넘게 몸무게가 늘지 않으면 병원에서 확인해 보세요.` },
    { q: `${name} 6개월 몸무게는요?`, a: `6개월 예상 범위는 ${f.range(at6)}이에요. 다 큰 몸무게의 ${Math.round((at6.min / f.adult.min) * 100)}% 안팎까지 자란 시기예요.` },
    {
      q: '표보다 가볍거나 무거우면 어떻게 하나요?',
      a: '숫자보다 체형을 먼저 봐요. 갈비뼈가 눈에 보일 만큼 말랐거나 손으로 만져도 갈비뼈가 잘 느껴지지 않으면 급여량을 조절하고, 한 달 사이 체중이 크게 줄거나 늘면 병원에서 확인해 보세요.',
    },
  ];
  return { f, name, title, description, answer, faq };
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const b = find(params.slug);
  if (!b) return {};
  const { title, description } = copy(b);
  const url = `${SITE.url}${breedPath(b.breed_ko, 'growth')}`;
  return {
    title: `${title} 성장표 | mypet`,
    description,
    alternates: { canonical: url },
    ...socialMeta(title, description, url),
  };
}

export default function BreedGrowthPage({ params }: { params: { slug: string } }) {
  const b = find(params.slug);
  if (!b) notFound();
  const { f, name, title, description, answer, faq } = copy(b);
  const url = `${SITE.url}${breedPath(b.breed_ko, 'growth')}`;
  const sources = growthSources(b);
  const notes = breedNotes(b);
  const health = breedHealth(b);

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
            datePublished: PUBLISHED,
            dateModified: PUBLISHED,
            mainEntityOfPage: url,
            image: `${SITE.url}/opengraph-image`,
            about: { '@type': 'Thing', name: `${b.breed_ko} (${b.breed_en})` },
            author: ORG_REF,
            publisher: ORG_REF,
            citation: sources.map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url })),
          },
          faqJsonLd([{ q: `${name} 다 크면 몇 kg이고 언제까지 크나요?`, a: answer }, ...faq]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '품종 가이드', url: `${SITE.url}/breed` },
            { name: b.breed_ko, url: `${SITE.url}${breedPath(b.breed_ko)}` },
            { name: '개월별 몸무게', url },
          ]),
        ]}
      />

      <nav className="gcrumb">
        <Link href="/breed">품종 가이드</Link> <span>›</span> <Link href={breedPath(b.breed_ko)}>{b.breed_ko}</Link> <span>›</span> 개월별 몸무게
      </nav>

      <h1 className="gtitle">{titleName(b)} 개월별 몸무게</h1>
      <p className="gquestion">
        다 크면 몇 kg일까요? {nameWithAlias(b)} {babyWord(b)}의 2개월부터 {f.lastMonth}개월까지 예상 몸무게를 정리했어요.
      </p>

      <nav className="bsub" aria-label={`${name} 정보`}>
        <Link href={breedPath(b.breed_ko)}>성격·질환</Link>
        <Link href={breedPath(b.breed_ko, 'growth')} aria-current="page">개월별 몸무게</Link>
        <Link href={breedPath(b.breed_ko, 'food')}>사료량</Link>
      </nav>

      <div className="ganswer">
        <div className="ganswer-head">{name} 다 크면 몇 kg이고 언제까지 크나요?</div>
        <p>{answer}</p>
      </div>

      <section className="bsec">
        <h2>{name} 개월별 예상 몸무게</h2>
        {f.wide && (
          <p className="gwarn">
            {josa(name, '은/는')} 부모 체구에 따라 다 큰 몸무게가 {f.adultText}으로 크게 달라요. 표는 폭이 넓은 참고용이고, 아래 계산기에 지금 몸무게를 넣어 보는 쪽이 더 정확해요.
          </p>
        )}
        <div className="gtable-wrap">
          <table className="gtable gtable--fit gtable--num">
            <thead>
              <tr>
                <th>나이</th>
                <th className="num">예상 몸무게</th>
                <th className="num">다 큰 몸무게 대비</th>
              </tr>
            </thead>
            <tbody>
              {f.rows.map((r) => (
                <tr key={r.months} className={r.months === f.end.months ? 'hl' : undefined}>
                  <td>
                    <b>{r.months}개월</b>
                    {r.months === f.end.months && <> <span className="gtable-tag">거의 다 큼</span></>}
                  </td>
                  <td className="num">
                    {fmtKg(r.min)}~{fmtKg(r.max)}kg
                  </td>
                  <td className="num">{Math.round((r.min / f.adult.min) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="gnote">
          <Icon name="info" size={14} />
          {name} 표준 체중({f.adultText})에 체급별 성장 속도를 곱한 예상 범위예요. {standardNote(b)} {growthBasisNote(b, f.cls)}
        </p>
      </section>

      <section className="bsec">
        <h2>지금 몸무게로 다 큰 몸무게 계산하기</h2>
        <p>나이와 지금 몸무게를 넣으면 {name} 성장 속도에 맞춰 다 컸을 때 몸무게를 계산해요.</p>
        <AdultWeightCalc species={b.species as 'dog' | 'cat'} cls={f.cls} breedName={name} />
      </section>

      <section className="bsec">
        <h2>{name} 성장기에 챙길 것</h2>
        <ul className="glist">
          {[...notes, ...growthCare(b)].map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p style={{ marginTop: 14 }}>
          개월별 사료량은 <Link href={breedPath(b.breed_ko, 'food')}>{name} 사료량 표</Link>에 정리했어요.
        </p>
      </section>

      {health.diseases.length > 0 && (
        <section className="bsec">
          <h2>{name}에게 자주 보고되는 질환</h2>
          <ul className="bdz">
            {health.diseases.map((h) => (
              <li key={h.name}>
                <b>{h.name}</b>
                {h.note && <span>{h.note}</span>}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 12 }}>
            질환과 성격은 <Link href={breedPath(b.breed_ko)}>{name} 키우기 가이드</Link>에 더 자세히 적었어요.
          </p>
        </section>
      )}

      <section className="bsec">
        <h2>잘 크고 있는지 보는 법</h2>
        <ul className="glist">
          <li>옆구리를 손바닥으로 쓸었을 때 갈비뼈가 살짝 만져지면 알맞은 편이에요. 눈에 보이면 마른 편, 꾹 눌러야 느껴지면 살찐 편이에요.</li>
          <li>위에서 내려다볼 때 갈비뼈 뒤로 허리가 들어가 보여야 해요.</li>
          <li>성장기에는 한두 주에 한 번 같은 시간에 몸무게를 재서 적어 두세요. 표의 범위 안에서 꾸준히 늘면 보통 속도로 크고 있는 거예요.</li>
        </ul>
      </section>

      <FaqList items={faq} />

      <section className="grelated">
        <h2>다른 {kindOf(b)} 개월별 몸무게</h2>
        <div className="blinks">
          {neighbors(b).map((o) => (
            <Link key={o.breed_ko} href={breedPath(o.breed_ko, 'growth')}>
              {baseName(o)} 개월별 몸무게
            </Link>
          ))}
          <Link href="/tools/adult-weight">강아지·고양이 다 큰 몸무게 계산기</Link>
        </div>
      </section>

      <section className="gcta">
        <h2>우리 {name} 기준으로 다시 보고 싶다면</h2>
        <p>
          나이와 몸무게를 적으면 {name} 표준과 비교하고, 급여량과 접종 일정, 조심할 질환까지 리포트로 정리해 드려요. 결제 전에 무료 가이드로 먼저 확인할 수 있어요.
        </p>
        <div className="gcta-btns">
          <Link href={`/diagnose?breed=${encodeURIComponent(b.breed_ko)}&sp=${b.species}`} className="btn btn--primary btn--lg">
            리포트 만들기
          </Link>
          <Link href={breedPath(b.breed_ko)} className="btn btn--secondary btn--lg">
            {name} 성격·질환 보기
          </Link>
        </div>
      </section>

      <section className="gsources">
        <h2>근거 자료</h2>
        <ul>
          {sources.map((s) => (
            <li key={s.url}>
              <span className="gsrc-org">{s.org}</span>
              <a href={s.url} target="_blank" rel="noopener noreferrer nofollow">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="gdisclaimer">
          <Icon name="info" size={14} /> 표준 체중: {b.source_org ?? '공개 품종 자료'}. 표는 일반 정보이고 <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
        </p>
      </section>
    </main>
  );
}
