import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd, type Faq } from '@/components/seo/SeoBits';
import AdultWeightCalc from '@/components/tools/AdultWeightCalc';
import { ORG_REF, PUBLISHED, socialMeta, SOURCES } from '@/lib/breedSeo';
import { breedPath, featuredBreeds, GROWTH_END, growthRatio, type GrowthClass } from '@/lib/growth';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { SITE } from '@/lib/site';

/**
 * 「강아지 다 크면 몇 kg」「성견 몸무게 예측」 계산기 — 품종을 몰라도(믹스견도) 쓸 수 있는 입구.
 * 여기서 품종별 개월별 몸무게 페이지로 내부 링크를 모두 뿌린다(허브 역할).
 */

const URL_PATH = '/tools/adult-weight';
const TITLE = '다 크면 몇 kg? 강아지·고양이 다 큰 몸무게 계산기';
const DESCRIPTION =
  '지금 나이와 몸무게만 넣으면 강아지·고양이가 다 컸을 때 몸무게를 계산해요. 품종을 몰라도, 믹스견도 돼요. 체급별로 언제까지 크는지와 품종별 개월별 몸무게 표도 함께.';
const ANSWER =
  '강아지는 몸집이 작을수록 일찍 다 자라요. 다 큰 몸무게가 6.5kg 미만인 작은 개는 10개월 무렵, 15~30kg은 15~18개월, 45kg 이상 큰 개는 2살 무렵까지 자라요. 고양이는 보통 12개월 무렵, 메인쿤 같은 대형묘는 3~4살까지 자라요. 지금 몸무게를 그 나이의 성장 비율로 나누면 다 큰 몸무게를 어림할 수 있어요.';

const CLASSES: { cls: GrowthClass; label: string; ex: string }[] = [
  { cls: 'I', label: '6.5kg 미만', ex: '말티즈, 포메라니안, 치와와' },
  { cls: 'II', label: '6.5~9kg', ex: '비숑프리제, 퍼그, 미니어처슈나우저' },
  { cls: 'III', label: '9~15kg', ex: '웰시코기, 비글, 시바이누' },
  { cls: 'IV', label: '15~30kg', ex: '진돗개, 보더콜리, 골든리트리버' },
  { cls: 'V', label: '30~45kg', ex: '래브라도리트리버, 저먼셰퍼드' },
  { cls: 'VI', label: '45kg 이상', ex: '그레이트데인, 세인트버나드' },
];

const FAQ: Faq[] = [
  { q: '품종을 모르는 믹스견도 계산할 수 있나요?', a: '네. 지금 몸무게로 체급을 먼저 어림하고, 그 체급의 성장 속도로 다 큰 몸무게를 계산해요. 품종을 알면 품종별 개월별 몸무게 표가 더 정확해요.' },
  { q: '몇 개월부터 계산이 잘 맞나요?', a: '2개월부터 계산할 수 있고, 4개월이 넘으면 오차가 줄어요. 어릴수록 하루하루 변화가 커서 범위를 넓게 보여 드려요.' },
  { q: '발이 크면 크게 자라나요?', a: '발 크기는 참고 정도예요. 같은 품종 안에서도 발 크기와 다 큰 몸무게가 딱 맞지 않아서, 나이와 몸무게로 보는 쪽이 낫습니다.' },
  { q: '고양이는 언제까지 크나요?', a: '대부분 12개월 무렵 거의 다 자라요. 메인쿤, 노르웨이숲, 랙돌 같은 대형묘는 3~4살까지 천천히 자라요.' },
];

export const metadata: Metadata = {
  title: `${TITLE} | mypet`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}${URL_PATH}` },
  robots: NAVER_BING_ONLY,
  ...socialMeta(TITLE, DESCRIPTION, `${SITE.url}${URL_PATH}`),
};

export default function AdultWeightTool() {
  const url = `${SITE.url}${URL_PATH}`;
  const breeds = featuredBreeds();
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
            citation: [{ '@type': 'CreativeWork', name: SOURCES.growth.title, url: SOURCES.growth.url }],
          },
          faqJsonLd([{ q: '강아지는 다 크면 몇 kg이고 언제까지 크나요?', a: ANSWER }, ...FAQ]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '계산기', url: `${SITE.url}/tools` },
            { name: '다 큰 몸무게 계산기', url },
          ]),
        ]}
      />

      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> <Link href="/tools">계산기</Link> <span>›</span> 다 큰 몸무게
      </nav>
      <h1 className="gtitle">강아지 다 크면 몇 kg? 다 큰 몸무게 계산기</h1>
      <p className="gquestion">지금 나이와 몸무게만 넣으면 다 컸을 때 몸무게를 계산해요. 품종을 몰라도, 믹스견도 돼요.</p>

      <AdultWeightCalc />

      <div className="ganswer">
        <div className="ganswer-head">강아지는 다 크면 몇 kg이고 언제까지 크나요?</div>
        <p>{ANSWER}</p>
      </div>

      <section className="bsec">
        <h2>체급별로 성장이 끝나는 시기</h2>
        <div className="gtable-wrap">
          <table className="gtable gtable--fit gtable--num">
            <thead>
              <tr>
                <th>다 큰 몸무게</th>
                <th>성장이 거의 끝나는 때</th>
                <th className="num">6개월에</th>
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((c) => (
                <tr key={c.cls}>
                  <td>
                    <b>{c.label}</b>
                    <br />
                    <span style={{ fontSize: 13, color: 'var(--grey600)' }}>{c.ex}</span>
                  </td>
                  <td>{GROWTH_END[c.cls].label}</td>
                  <td className="num">약 {Math.round(growthRatio(c.cls, 6) * 100)}%</td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>고양이</b>
                  <br />
                  <span style={{ fontSize: 13, color: 'var(--grey600)' }}>코리안숏헤어, 러시안블루</span>
                </td>
                <td>{GROWTH_END.cat.label}</td>
                <td className="num">약 {Math.round(growthRatio('cat', 6) * 100)}%</td>
              </tr>
              <tr>
                <td>
                  <b>대형묘</b>
                  <br />
                  <span style={{ fontSize: 13, color: 'var(--grey600)' }}>메인쿤, 노르웨이숲, 랙돌</span>
                </td>
                <td>{GROWTH_END['cat-large'].label}</td>
                <td className="num">약 {Math.round(growthRatio('cat-large', 6) * 100)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="gnote">
          <Icon name="info" size={14} />
          「6개월에」는 다 큰 몸무게의 몇 %까지 자랐는지예요. 체급 구분은 개 성장 곡선 연구(Salt 외, 2017)를 따랐고, 비율은 mypet이 그 패턴에 맞춰 정한 추정값이에요.
        </p>
      </section>

      <section className="bsec">
        <h2>품종별 개월별 몸무게</h2>
        <p>품종을 알면 품종 표준 체중으로 계산한 개월별 표가 더 정확해요.</p>
        <div className="blinks">
          {breeds.map((b) => (
            <Link key={b.breed_ko} href={breedPath(b.breed_ko, 'growth')}>
              {b.breed_ko} 개월별 몸무게
            </Link>
          ))}
        </div>
      </section>

      <FaqList items={FAQ} />

      <section className="gcta">
        <h2>다 큰 몸무게에 맞춘 급여량까지</h2>
        <p>
          품종, 나이, 몸무게를 적으면 표준 체중과 비교하고 하루 급여량, 접종 일정, 조심할 질환을 리포트로 정리해 드려요. 결제 전에 무료 가이드로 먼저 확인할 수 있어요.
        </p>
        <div className="gcta-btns">
          <Link href="/diagnose" className="btn btn--primary btn--lg">리포트 만들기</Link>
          <Link href="/tools/food" className="btn btn--secondary btn--lg">사료량 계산기</Link>
        </div>
      </section>

      <p className="gdisclaimer">
        <Icon name="info" size={14} /> 일반적인 성장 패턴으로 계산한 예상치예요. <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
      </p>
    </main>
  );
}
