import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd, type Faq } from '@/components/seo/SeoBits';
import FoodCalc from '@/components/tools/FoodCalc';
import { gramText, ORG_REF, PUBLISHED, socialMeta, SOURCES } from '@/lib/breedSeo';
import { dailyFeeding } from '@/lib/energy';
import { breedPath, featuredBreeds } from '@/lib/growth';
import { SITE } from '@/lib/site';

/**
 * 「강아지 사료량 계산기」「고양이 사료 급여량」「강아지 체중별 사료량」을 노린다.
 * 계산은 리포트와 같은 lib/energy. 품종별 사료량 페이지로 가는 허브도 겸한다.
 */

const URL_PATH = '/tools/food';
const TITLE = '강아지·고양이 사료량 계산기, 체중·나이별 하루 급여량';
const DESCRIPTION =
  '몸무게와 나이, 중성화 여부를 넣으면 하루 필요 열량과 건사료 g을 계산해요. 사료 포장지의 kcal/kg을 넣으면 그 사료 기준으로. 체중별 하루 사료량 표와 품종별 사료량도 함께.';
const DOG_W = [1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 30, 40];
const CAT_W = [2, 3, 4, 5, 6, 7, 8];

const FAQ: Faq[] = [
  { q: '포장지 급여량과 계산 결과가 다른데요?', a: '포장지 표는 활동량이 많은 기준으로 넉넉하게 잡은 경우가 많아요. 중성화했거나 실내 생활이 많다면 계산 결과 쪽이 더 맞는 경우가 많고, 체형을 보며 10%씩 조절하면 돼요.' },
  { q: '종이컵으로는 얼마인가요?', a: '종이컵 한 컵(약 180ml)에 건사료가 보통 70~90g 들어가요. 알갱이 크기에 따라 달라서 처음 한 번은 주방 저울로 재 보는 걸 권해요.' },
  { q: '습식사료와 섞어 먹이면요?', a: '습식사료 열량만큼 건사료를 줄여요. 습식 캔에 적힌 kcal를 하루 필요 열량에서 빼고 남은 열량을 건사료로 채우면 돼요.' },
  { q: '다이어트 중이면 얼마나 줄이나요?', a: '목표 체중 기준으로 계산해서 한 번에 크게 줄이지 말고 몇 주에 걸쳐 줄여요. 강아지는 한 주에 체중의 1~2%, 고양이는 0.5~1%씩 빠지는 속도가 안전해요. 고양이는 너무 빨리 굶기면 간에 무리가 가서 더 천천히 줄여요. 시작 전에 병원에서 목표 체중을 정해 두면 좋아요.' },
];

export const metadata: Metadata = {
  title: `${TITLE} | mypet`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}${URL_PATH}` },
  ...socialMeta(TITLE, DESCRIPTION, `${SITE.url}${URL_PATH}`),
};

function WeightTable({ species, weights }: { species: 'dog' | 'cat'; weights: number[] }) {
  return (
    <div className="gtable-wrap">
      <table className="gtable gtable--fit gtable--num">
        <thead>
          <tr>
            <th>몸무게</th>
            <th className="num">하루 열량</th>
            <th className="num">중성화</th>
            <th className="num">안 함</th>
          </tr>
        </thead>
        <tbody>
          {weights.map((w) => {
            const n = dailyFeeding(species, w, 36, true);
            const i = dailyFeeding(species, w, 36, false);
            return (
              <tr key={w}>
                <td>
                  <b>{w}kg</b>
                </td>
                <td className="num">{Math.round(n.kcal / 10) * 10}kcal</td>
                <td className="num">{gramText(n)}</td>
                <td className="num">{gramText(i)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function FoodTool() {
  const url = `${SITE.url}${URL_PATH}`;
  const breeds = featuredBreeds();
  const ex = dailyFeeding('dog', 5, 36, true);
  const answer = `하루 사료량은 몸무게로 쉬는 동안 쓰는 열량(70 × 몸무게의 0.75제곱)을 구하고, 나이와 중성화에 따른 계수를 곱해 정해요. 예를 들어 중성화한 5kg 성견은 하루 약 ${Math.round(ex.kcal / 10) * 10}kcal, 건사료로 ${gramText(ex)}이에요. 성장기는 2~3배로 늘고, 사료마다 열량이 달라 포장지의 kcal/kg으로 나누면 정확해요.`;

  return (
    <main className="container guide">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: TITLE,
            description: DESCRIPTION,
            inLanguage: 'ko',
            datePublished: PUBLISHED,
            dateModified: PUBLISHED,
            mainEntityOfPage: url,
            image: `${SITE.url}/opengraph-image`,
            author: ORG_REF,
            publisher: ORG_REF,
            citation: [{ '@type': 'CreativeWork', name: SOURCES.nutrition.title, url: SOURCES.nutrition.url }],
          },
          faqJsonLd([{ q: '강아지 하루 사료량은 어떻게 계산하나요?', a: answer }, ...FAQ]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '계산기', url: `${SITE.url}/tools` },
            { name: '사료량 계산기', url },
          ]),
        ]}
      />

      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> <Link href="/tools">계산기</Link> <span>›</span> 사료량
      </nav>
      <h1 className="gtitle">강아지·고양이 사료량 계산기</h1>
      <p className="gquestion">몸무게와 나이만 넣으면 강아지·고양이 하루 사료량을 계산해요. 사료 포장지의 열량을 넣으면 그 사료 기준으로 바꿔 줘요.</p>

      <FoodCalc />

      <div className="ganswer">
        <div className="ganswer-head">강아지 하루 사료량은 어떻게 계산하나요?</div>
        <p>{answer}</p>
      </div>

      <section className="bsec">
        <h2>강아지 체중별 하루 사료량</h2>
        <WeightTable species="dog" weights={DOG_W} />
        <p className="gnote">
          <Icon name="info" size={14} />
          1~7살 성견 기준이에요. 건사료 1g을 3.5~4.0kcal로 보고 계산했어요. 1살 전 성장기와 노령기는 위 계산기에 나이를 넣어 보세요.
        </p>
      </section>

      <section className="bsec">
        <h2>고양이 체중별 하루 사료량</h2>
        <WeightTable species="cat" weights={CAT_W} />
        <p className="gnote">
          <Icon name="info" size={14} />
          1~10살 성묘 기준이에요. 아기 고양이는 필요한 열량이 성묘의 2배가 넘어요.
        </p>
      </section>

      <section className="bsec">
        <h2>품종별 사료량</h2>
        <div className="blinks">
          {breeds.map((b) => (
            <Link key={b.breed_ko} href={breedPath(b.breed_ko, 'food')}>
              {b.breed_ko} 사료량
            </Link>
          ))}
        </div>
      </section>

      <FaqList items={FAQ} />

      <section className="gcta">
        <h2>급여량부터 접종 일정까지 한 번에</h2>
        <p>품종, 나이, 몸무게를 적으면 하루 급여량과 다음 접종일, 조심할 질환, 먹으면 안 되는 음식을 리포트로 정리해 드려요. 결제 전에 무료 가이드로 먼저 확인할 수 있어요.</p>
        <div className="gcta-btns">
          <Link href="/diagnose" className="btn btn--primary btn--lg">리포트 만들기</Link>
          <Link href="/tools/adult-weight" className="btn btn--secondary btn--lg">다 큰 몸무게 계산기</Link>
        </div>
      </section>

      <p className="gdisclaimer">
        <Icon name="info" size={14} /> 개체마다 활동량과 대사가 달라요. 계산 결과는 시작점이에요. <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
      </p>
    </main>
  );
}
