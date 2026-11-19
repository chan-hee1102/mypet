import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/SeoBits';
import { CUP_GRAM, careProfiles, careRules } from '@/lib/care';
import { UPDATED } from '@/lib/breedSeo';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';

/**
 * 정보 기준(2026-11-19, 사장님 「챗GPT에 나오도록 AEO·GEO·SEO 전부」) — 사람과 AI 답변엔진이 「믿고 인용해도 되는가」를 판단하는 페이지.
 * 무엇을 근거로 쓰는지(품종 출처 기관·법령·수의 지침), 숫자를 어떻게 계산하는지, 언제 확인했는지, 누가 운영하는지를 한 장에.
 * 숫자(출처 개수·규칙 수·가이드 수)는 데이터에서 그때그때 센다 — 손으로 적으면 데이터와 어긋난다.
 * 가이드 바닥 「정보 기준」·바닥글·llms.txt가 여기로 온다. #cup은 /guide/kibble-cup-grams의 출처 링크.
 */

export const metadata: Metadata = {
  title: { absolute: '마이펫 정보 기준 — 품종 자료·법령·수의 지침과 계산 방법 | 마이펫' },
  description: '마이펫이 품종 안내판과 가이드를 쓸 때 무엇을 근거로 삼는지(AKC·FCI·CFA·TICA, 동물보호법, WSAVA·AAHA 등), 사료량을 어떻게 계산하는지, 언제 확인했는지 밝혀요.',
  alternates: { canonical: `${SITE.url}/sources` },
};

const fmtDate = (d: string) => d.replace(/^(\d+)-(\d+)-(\d+)$/, (_, y, m, dd) => `${y}년 ${Number(m)}월 ${Number(dd)}일`);

export default function SourcesPage() {
  const profiles = [...careProfiles().values()];
  const orgCount = new Map<string, number>();
  for (const p of profiles) for (const org of new Set((p.sources ?? []).map((s) => s.org.replace(/\s*\(.*\)$/, '').replace(/^American Kennel Club$/, 'AKC')))) orgCount.set(org, (orgCount.get(org) ?? 0) + 1);
  const topOrgs = [...orgCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const rules = careRules();
  const laws = rules.filter((r) => r.kind === 'law').length;

  return (
    <main className="tz">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: '마이펫 정보 기준',
          url: `${SITE.url}/sources`,
          inLanguage: 'ko',
          dateModified: UPDATED,
          publisher: { '@id': `${SITE.url}/#org` },
          about: { '@id': `${SITE.url}/#website` },
        }}
      />
      <div className="tz-wrap">
        <nav className="gcrumb">
          <Link href="/">마이펫</Link> <span>›</span> 정보 기준
        </nav>
        <header className="tz-hero">
          <h1>마이펫 정보 기준</h1>
          <p className="tz-lead">
            품종 {profiles.length}종 안내판과 정보 가이드 {GUIDES.length}편을 무엇을 근거로, 어떻게 계산해서 쓰는지 밝혀요. 마지막 확인 {fmtDate(UPDATED)}.
          </p>
        </header>

        <section className="sheet">
          <h2 className="sheet-title">품종 자료</h2>
          <ul className="checks">
            <li>품종마다 체구·털·빗질·미용·운동량·성향은 품종 공인 단체와 수의 기관의 공개 자료를 근거로 정리해요. 품종 페이지 맨 아래에 그 품종의 출처 링크가 있어요.</li>
            <li>
              가장 많이 쓴 출처:{' '}
              {topOrgs.map(([org, n], i) => (
                <span key={org}>
                  {i ? ' · ' : ''}
                  {org} {n}종
                </span>
              ))}
            </li>
            <li>나무위키·개인 블로그 같은 2차 자료는 근거로 쓰지 않아요.</li>
          </ul>
        </section>

        <section className="sheet">
          <h2 className="sheet-title">법령과 수의 지침</h2>
          <ul className="checks">
            <li>
              동물등록·목줄·맹견·유실동물 신고 같은 법 내용 {laws}개는 국가법령정보센터의 현행 조문 원문과 한 줄씩 대조해 적고, 조문 번호와 원문 링크를 함께 둬요.
            </li>
            <li>예방접종·검진·간식·화장실 같은 돌봄 기준 {rules.length - laws}개는 WSAVA·AAHA·AAFP·미국심장사상충학회·International Cat Care·Merck 수의 매뉴얼 같은 기관 원문을 근거로 해요.</li>
            <li>법이 바뀌면(시행일 기준) 해당 내용을 고치고 날짜를 올려요.</li>
          </ul>
        </section>

        <section className="sheet">
          <h2 className="sheet-title">숫자는 이렇게 계산해요</h2>
          <ul className="checks">
            <li>하루 사료량 = 쉬는 동안 쓰는 열량(70 × 몸무게의 0.75제곱) × 활동계수 ÷ 건사료 1g당 3.5~4.0kcal. 다 큰 개는 중성화 1.6·안 함 1.8, 고양이는 1.2·1.4예요(AAHA 영양 가이드라인 등 수의영양학에서 널리 쓰는 값).</li>
            <li>개월별 몸무게는 체급별 성장 곡선(Salt 외 2017, PLOS ONE)에 품종의 다 큰 몸무게를 곱해 구해요. 성장기 사료 계수를 몸무게 비율에 맞춰 낮추는 방식은 마이펫이 정한 것이에요.</li>
            <li>믹스견처럼 체구가 제각각인 경우는 소형·중형·대형을 고를 수 있게 하고, 산책 시간 등은 같은 체구 품종들의 중간값을 써요.</li>
            <li id="cup">
              종이컵(약 180ml) 환산은 어림값이에요 — 작은 알갱이 약 {CUP_GRAM.small}g, 보통 약 {CUP_GRAM.medium}g, 큰 알갱이 약 {CUP_GRAM.large}g으로 잡아요. 사료마다 밀도가 달라
              주방 저울로 한 번 재 보는 게 가장 정확해요.
            </li>
          </ul>
        </section>

        <section className="sheet">
          <h2 className="sheet-title">운영과 광고</h2>
          <ul className="checks">
            <li>마이펫은 {SITE.company}(사업자등록번호 {SITE.bizNo})가 운영하고, TAIF(주식회사 팀에이아이팜)가 만들었어요.</li>
            <li>준비물 카드의 쿠팡 링크로 구매하면 마이펫이 쿠팡 파트너스 활동으로 일정액의 수수료를 받아요. 카드는 품종의 체구·털·성향 데이터로 고르고, 광고비를 받고 넣는 상품은 없어요.</li>
            <li>모든 내용은 일반적인 정보이고 수의사의 진찰과 진료를 대신하지 않아요.</li>
            <li>
              틀린 내용을 발견하면 <a href={`mailto:${SITE.email}`}>{SITE.email}</a>로 알려 주세요. 확인한 뒤 고치고 날짜를 올려요.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
