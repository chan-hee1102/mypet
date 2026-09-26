import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icons';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd, type Faq } from '@/components/seo/SeoBits';
import FoodCalc from '@/components/tools/FoodCalc';
import {
  adultFeedingRows, adultWord, baseName, breedNotes, gramText, growthFacts, isBigDog, kindOf, nameWithAlias, neighbors, ORG_REF,
  PUBLISHED, puppyFeedingRows, socialMeta, SOURCES, titleName,
} from '@/lib/breedSeo';
import { breedPath, breedSlugOf, featuredBreeds, fmtKg, slugMatches, type BreedRow } from '@/lib/growth';
import { josa } from '@/lib/josa';
import { SITE } from '@/lib/site';

/**
 * 품종별 사료량 — 「말티즈 사료량」「포메 3개월 사료량」「말티즈 사료 몇 g」을 노린다.
 * 다 큰 뒤 숫자는 리포트와 같은 식(lib/energy: RER × 활동계수 ÷ 3.5~4.0kcal/g).
 * 성장기는 다 큰 몸무게 대비 비율로 계수를 서서히 낮춘 mypet 방식(lib/energy growthFactor)이라 화면에 그렇게 밝힌다.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return featuredBreeds().map((b) => ({ slug: breedSlugOf(b.breed_ko) }));
}

const find = (slug: string) => featuredBreeds().find((b) => slugMatches(slug, b.breed_ko));
const kcal = (n: number) => `${Math.round(n / 10) * 10}kcal`;

function copy(b: BreedRow) {
  const f = growthFacts(b)!;
  const name = baseName(b);
  const puppy = puppyFeedingRows(b);
  const adult = adultFeedingRows(b);
  const mid = adult[1];
  const p3 = puppy.find((r) => r.months === 3) ?? puppy[0];
  const aw = adultWord(b);
  const title = `${titleName(b)} 사료량, 하루 몇 g? 개월·체중별 급여량`;
  const description = `다 큰 ${josa(nameWithAlias(b), '은/는')} 하루 ${kcal(mid.neutered.kcal)}, 건사료 ${gramText(mid.neutered)} 안팎(중성화, ${fmtKg(mid.weight)}kg 기준). 2개월부터 ${aw}까지 개월별·체중별 사료량 표와 계산기.`;
  const answer = `다 큰 ${josa(`${name}(중성화, ${fmtKg(mid.weight)}kg)`, '은/는')} 하루 약 ${kcal(mid.neutered.kcal)}, 건사료로 ${gramText(mid.neutered)} 안팎이 시작점이에요. 3개월 무렵에는 ${gramText(p3)} 안팎을 하루 3~4번에 나눠 줘요.`;
  const faq: Faq[] = [
    { q: `${name} 하루 사료량은 얼마인가요?`, a: `중성화한 ${aw} ${fmtKg(mid.weight)}kg 기준 하루 약 ${kcal(mid.neutered.kcal)}, 건사료 ${gramText(mid.neutered)}이에요. 중성화하지 않았다면 ${gramText(mid.intact)}으로 조금 더 필요해요.` },
    { q: `${name} 3개월 사료량은요?`, a: `3개월 예상 몸무게 ${fmtKg(p3.weight)}kg 기준 하루 ${gramText(p3)} 안팎이에요. 성장기에는 몸무게가 빨리 늘어서 한두 주마다 다시 계산해 주세요.` },
    {
      q: '하루 몇 번에 나눠 줘야 하나요?',
      a:
        b.species === 'cat'
          ? '6개월까지는 하루 3~4번, 그 뒤로는 하루 2번 이상이에요. 자율급식을 한다면 하루 총량을 정해 두고 그만큼만 채워 주세요.'
          : `6개월까지는 하루 3~4번, 1살까지는 3번, 다 큰 뒤에는 하루 2번이 무난해요.${isBigDog(f.cls) ? ' 큰 개는 한 번에 몰아 먹이지 말고, 먹은 뒤 1~2시간은 격하게 뛰지 않게 해 주세요(위확장·염전 예방).' : ''}`,
    },
    { q: '간식은 얼마나 줘도 되나요?', a: `하루 열량의 10%까지예요. ${fmtKg(mid.weight)}kg ${josa(name, '이라면/라면')} 하루 ${kcal(mid.neutered.kcal / 10)} 정도이고, 간식을 준 만큼 사료를 덜어 주세요.` },
    { q: '사료를 바꿀 때는 어떻게 하나요?', a: '일주일쯤에 걸쳐 새 사료 비율을 조금씩 늘려요. 한 번에 바꾸면 설사나 구토를 할 수 있어요.' },
  ];
  return { f, name, puppy, adult, title, description, answer, faq };
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const b = find(params.slug);
  if (!b) return {};
  const { title, description } = copy(b);
  const url = `${SITE.url}${breedPath(b.breed_ko, 'food')}`;
  return {
    title: `${title} | mypet`,
    description,
    alternates: { canonical: url },
    ...socialMeta(title, description, url),
  };
}

export default function BreedFoodPage({ params }: { params: { slug: string } }) {
  const b = find(params.slug);
  if (!b) notFound();
  const { f, name, puppy, adult, title, description, answer, faq } = copy(b);
  const url = `${SITE.url}${breedPath(b.breed_ko, 'food')}`;
  const cat = b.species === 'cat';
  const notes = breedNotes(b);

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
            citation: [{ '@type': 'CreativeWork', name: SOURCES.nutrition.title, url: SOURCES.nutrition.url }],
          },
          faqJsonLd([{ q: `${name} 하루 사료량은 얼마인가요?`, a: answer }, ...faq.slice(1)]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '품종 가이드', url: `${SITE.url}/breed` },
            { name: b.breed_ko, url: `${SITE.url}${breedPath(b.breed_ko)}` },
            { name: '사료량', url },
          ]),
        ]}
      />

      <nav className="gcrumb">
        <Link href="/breed">품종 가이드</Link> <span>›</span> <Link href={breedPath(b.breed_ko)}>{b.breed_ko}</Link> <span>›</span> 사료량
      </nav>

      <h1 className="gtitle">{titleName(b)} 사료량</h1>
      <p className="gquestion">{nameWithAlias(b)}에게 하루에 몇 g을 줘야 할까요? 개월별, 체중별 급여량을 표로 정리했어요.</p>

      <nav className="bsub" aria-label={`${name} 정보`}>
        <Link href={breedPath(b.breed_ko)}>성격·질환</Link>
        <Link href={breedPath(b.breed_ko, 'growth')}>개월별 몸무게</Link>
        <Link href={breedPath(b.breed_ko, 'food')} aria-current="page">사료량</Link>
      </nav>

      <div className="ganswer">
        <div className="ganswer-head">{name} 하루 사료량은 얼마인가요?</div>
        <p>{answer}</p>
      </div>

      <section className="bsec">
        <h2>다 큰 {name} 체중별 하루 사료량</h2>
        <div className="gtable-wrap">
          <table className="gtable gtable--fit gtable--num">
            <thead>
              <tr>
                <th>몸무게</th>
                <th className="num">중성화</th>
                <th className="num">안 함</th>
                <th className="num">노령기</th>
              </tr>
            </thead>
            <tbody>
              {adult.map((r) => (
                <tr key={r.weight}>
                  <td>
                    <b>{fmtKg(r.weight)}kg</b>
                  </td>
                  <td className="num">{gramText(r.neutered)}</td>
                  <td className="num">{gramText(r.intact)}</td>
                  <td className="num">{gramText(r.senior)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="gnote">
          <Icon name="info" size={14} />
          건사료 1g이 3.5~4.0kcal라고 보고 계산한 하루 양이에요. 사료마다 열량이 달라서, 아래 계산기에 포장지 열량을 넣으면 그 사료 기준 g으로 바뀌어요.
          {cat ? ' 노령묘는 살이 빠지기 시작하면 병원에서 먼저 확인해 보세요.' : ''}
        </p>
      </section>

      <section className="bsec">
        <h2>
          {name} 개월별 사료량({cat ? '아기 고양이' : '아기 강아지'})
        </h2>
        <div className="gtable-wrap">
          <table className="gtable gtable--fit gtable--num">
            <thead>
              <tr>
                <th>나이</th>
                <th className="num">예상 몸무게</th>
                <th className="num">하루 열량</th>
                <th className="num">건사료</th>
              </tr>
            </thead>
            <tbody>
              {puppy.map((r) => (
                <tr key={r.months}>
                  <td>
                    <b>{r.months}개월</b>
                  </td>
                  <td className="num">{fmtKg(r.weight)}kg</td>
                  <td className="num">{kcal(r.kcal)}</td>
                  <td className="num">{gramText(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="gnote">
          <Icon name="info" size={14} />그 달 예상 몸무게의 가운데 값으로 계산했어요. 실제 몸무게는 <Link href={breedPath(b.breed_ko, 'growth')}>{name} 개월별 몸무게 표</Link>와 비교해 보고,
          계산기에 지금 몸무게를 넣으면 더 정확해요. 성장은 {f.end.label} 거의 끝나요.
        </p>
      </section>

      <section className="bsec">
        <h2>우리 {name} 사료량 계산하기</h2>
        <FoodCalc species={b.species as 'dog' | 'cat'} size={b.size} breedName={name} adultKg={(f.adult.min + f.adult.max) / 2} cls={f.cls} />
      </section>

      {notes.length > 0 && (
        <section className="bsec">
          <h2>{name} 급여에서 특히 챙길 것</h2>
          <ul className="glist">
            {notes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="bsec">
        <h2>이렇게 계산했어요</h2>
        <p>
          쉬는 동안 쓰는 열량(70 × 몸무게의 0.75제곱)에 활동계수를 곱해 하루 필요 열량을 구했어요. 이 방식과 계수는 AAHA(2021) 영양 가이드라인 등
          수의영양학에서 널리 쓰는 값이에요.{' '}
          {cat
            ? '다 큰 뒤에는 중성화 1.2배, 중성화 안 함 1.4배, 노령묘 1.2배예요. 아기 고양이는 2.5배에서 시작해 다 자라 갈수록 1.4배까지 서서히 낮췄어요.'
            : '다 큰 뒤에는 중성화 1.6배, 중성화 안 함 1.8배, 노령기 1.4배예요. 성장기에는 다 큰 몸무게의 40%까지 3배로 잡고 다 자라 갈수록 1.8배까지 서서히 낮췄어요.'}{' '}
          성장기 계수를 몸무게 비율에 맞춰 낮춘 것은 mypet이 정한 방식이고, 다 큰 뒤 계산은 mypet 리포트와 같아요.
        </p>
      </section>

      <FaqList items={faq} />

      <section className="grelated">
        <h2>다른 {kindOf(b)} 사료량</h2>
        <div className="blinks">
          {neighbors(b).map((o) => (
            <Link key={o.breed_ko} href={breedPath(o.breed_ko, 'food')}>
              {baseName(o)} 사료량
            </Link>
          ))}
          <Link href="/tools/food">강아지·고양이 사료량 계산기</Link>
        </div>
      </section>

      <section className="gcta">
        <h2>급여량부터 접종 일정까지 한 번에</h2>
        <p>
          {name}의 나이와 몸무게를 적으면 하루 급여량, 다음 접종일, 조심할 질환, 먹으면 안 되는 음식을 리포트로 정리해 드려요. 결제 전에 무료 가이드로 먼저 확인할 수 있어요.
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
