import Link from 'next/link';
import type { ReactNode } from 'react';
import HomeHero from '@/components/HomeHero';
import { ReportDocument } from '@/components/CareCard';
import { heroSample } from '@/lib/sample';
import { GUIDES } from '@/lib/guides';
import { josa } from '@/lib/josa';

export const metadata = {
  title: 'mypet — 반려동물 맞춤 케어 리포트',
  description:
    '품종·나이·체중을 넣으면 188개 품종 데이터와 수의 지침을 기준으로 하루 급여량, 접종 일정, 조심할 질환, 먹으면 안 되는 음식을 정리해 드려요. 결제 전에 무료 가이드를 먼저 확인할 수 있어요.',
};

// 첫 화면 예시 기록지의 날짜·남은 일수가 오늘 기준으로 맞도록 한 시간마다 다시 만든다.
export const revalidate = 3600;

/*
  랜딩 (2026-09-26 다시 씀 — 「건강수첩」)

  예전 판은 반짝이 아이콘 알약 라벨, 아이콘 타일 6칸, 짙은 녹색 띠 위 번호 카드 3장,
  숫자 카드 4칸으로 이어졌다. 어느 서비스에나 붙일 수 있는 틀이라 우리 것이 아니었다.

  지금 판의 원칙:
    · 첫 화면은 **실제로 나오는 기록지**, 두 번째는 **실제 리포트의 앞부분**을 그대로 보여준다.
      값은 리포트 계산 코드로 뽑는다(지어내지 않는다). 설명보다 물건을 먼저 보여준다
    · 나머지 구역은 조용하게 — 왼쪽 제목 칸, 오른쪽 행으로 된 표. 장식 카드를 쓰지 않는다
    · 「AI」는 실제로 AI가 쓰는 자리(보호자가 직접 적은 증상에 대한 답)에만 붙인다
*/

const SOURCES: { org: string; use: string }[] = [
  { org: 'AKC · FCI · UK Kennel Club', use: '강아지 품종별 표준 체중, 수명, 자주 보고되는 질환' },
  { org: 'TICA · CFA · International Cat Care', use: '고양이 품종 특성과 관리' },
  { org: 'WSAVA · AAHA 백신 지침', use: '예방접종 시작 시기와 추가접종 주기' },
  { org: 'CAPC', use: '심장사상충·구충 예방 주기' },
  { org: 'ASPCA 동물독극물통제센터', use: '먹으면 안 되는 음식과 위험한 이유' },
  { org: 'AAHA · WSAVA 영양 지침', use: '하루 필요 열량 계산식(기초대사량 × 활동계수)' },
];

export default function LandingPage() {
  const dog = heroSample('dog');
  const cat = heroSample('cat');
  const today = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  const d = dog.hero;

  const contents: { k: string; v: ReactNode; ai?: boolean }[] = [
    { k: '하루 급여량', v: <>체중, 나이, 중성화 여부로 계산해요. 예시의 {d.breedKo} {d.weightKg}kg이면 하루 <b>{d.dailyKcal}</b>, 건사료로 {d.dailyGram}이에요.</> },
    { k: '접종·검진 일정', v: <>마지막 접종 달을 적으면 다음 접종 날짜를 계산해요. 모르는 항목은 병원에서 확인할 항목으로 따로 적어 드려요.</> },
    { k: '조심할 질환과 신호', v: <>품종에서 자주 보고되는 질환과, 집에서 알아챌 수 있는 신호. {josa(d.breedKo, '이라면/라면')} {d.risks.join(', ')} 같은 것들이에요.</> },
    { k: '먹으면 안 되는 음식', v: <>{d.toxicCount}가지와 각각 위험한 이유, 먹었을 때 먼저 할 일까지 적어요.</> },
    { k: '관리 포인트', v: <>털과 피부, 산책 시간, 그 품종에서 놓치기 쉬운 관리. 예시의 {josa(d.breedKo, '은/는')} 하루 {dog.card.exercise.walkMinutesPerDay} 산책이 기준이에요.</> },
    { k: '나이별 관리', v: <>지금 나이에 챙길 것과 사람 나이로 환산한 나이를 함께 적어요.</> },
    { k: '주간 체크리스트', v: <>요일별로 표시하는 표예요. 인쇄해서 붙여 두고 쓰기 좋게 만들었어요.</> },
    { k: '증상에 대한 답', v: <>걱정되는 증상을 직접 적으면 가능한 원인과 병원에 가야 할 기준을 정리해요. 적지 않으면 AI를 쓰지 않아요.</>, ai: true },
    { k: '병원에 가야 하는 신호', v: <>바로 병원에 가야 하는 응급 신호를 눈으로 확인할 수 있는 모습으로 적어요.</> },
  ];

  return (
    <main>
      <HomeHero samples={{ dog: dog.hero, cat: cat.hero }} today={today} />

      <section className="home-sec" id="contents">
        <div className="home-sec-in home-sec-in--report">
          <div>
            <h2>리포트에 들어가는 내용</h2>
            <p className="home-sec-intro">검색해서 하나씩 찾던 기준을, 입력한 아이의 숫자로 바꿔 한 번에 모았어요.</p>
            <dl className="contents" style={{ marginTop: 28 }}>
              {contents.map((c) => (
                <div key={c.k} className={`contents-row ${c.ai ? 'contents-row--ai' : ''}`}>
                  <dt>{c.k}</dt>
                  <dd>{c.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className="preview">
            {/* 실제 리포트 컴포넌트를 줄여서 보여 준다 — 캡처 이미지가 아니라서 디자인이 바뀌어도 어긋나지 않는다 */}
            <div className="preview-frame" aria-hidden="true" {...({ inert: '' } as object)}>
              <div className="preview-in">
                <ReportDocument species="dog" petName={d.name} card={dog.card} />
              </div>
            </div>
            <figcaption>
              {d.name}({d.breedKo}, {d.ageYears}살, {d.weightKg}kg)의 예시 리포트 앞부분이에요.{' '}
              <Link href="/sample" className="linklike">예시 리포트 전체 보기</Link>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="home-sec" id="sources">
        <div className="home-sec-in">
          <div>
            <h2>무엇을 근거로 쓰나요</h2>
            <p className="home-sec-intro">리포트의 숫자는 아래 기관의 표와 계산식에서 나와요.</p>
          </div>
          <div>
            <dl className="srcs">
              {SOURCES.map((s) => (
                <div key={s.org}>
                  <dt>{s.org}</dt>
                  <dd>{s.use}</dd>
                </div>
              ))}
            </dl>
            <p className="srcs-note">
              AI는 보호자가 직접 적은 증상에 답할 때만 써요. 그 부분은 리포트 안에 따로 표시해요.
              mypet의 리포트는 일반적인 관리 정보이며, <b>수의사의 진찰과 진료를 대신하지 않아요.</b>
            </p>
          </div>
        </div>
      </section>

      <section className="home-sec" id="guides">
        <div className="home-sec-in">
          <div>
            <h2>정보 가이드</h2>
            <p className="home-sec-intro">리포트 없이도 볼 수 있는 일반 기준이에요.</p>
          </div>
          <div className="linklist linklist--2">
            {GUIDES.map((g) => (
              <Link key={g.slug} href={`/guide/${g.slug}`}>
                <b>{g.title}</b>
                <span>{g.lead}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-sec" id="faq">
        <div className="home-sec-in">
          <div>
            <h2>자주 묻는 질문</h2>
          </div>
          <div className="faq">
            <details>
              <summary>결제한 뒤 창을 닫았어요. 리포트는 어디서 보나요?</summary>
              <p>
                결제할 때 적은 이메일로 리포트 링크를 보내 드려요. 메일이 보이지 않으면 <Link href="/find" className="linklike">리포트 찾기</Link>에서
                휴대폰 번호와 결제 때 정한 다시 찾기 번호 6자리로 다시 찾을 수 있어요. 링크는 60일 동안 열려요.
              </p>
            </details>
            <details>
              <summary>동물병원 진료를 대신할 수 있나요?</summary>
              <p>
                아니요. 품종 표준과 수의 지침으로 계산한 일반적인 관리 정보예요. 이상 증상이 보이면 동물병원 진료가 먼저예요.
              </p>
            </details>
            <details>
              <summary>믹스견이거나 품종을 모르면요?</summary>
              <p>
                말티푸, 폼피츠, 비숑푸들처럼 자주 쓰는 믹스견 이름은 부모 품종을 기준으로 계산해요.
                품종을 모르면 비워 두세요. 강아지·고양이 일반 기준으로 정리해 드려요.
              </p>
            </details>
            <details>
              <summary>환불이 되나요?</summary>
              <p>
                리포트는 결제하면 바로 열리는 디지털 콘텐츠라서, 연 뒤에는 단순 변심에 따른 환불이 제한돼요.
                리포트를 받지 못했거나 내용에 문제가 있으면 환불해 드려요. 자세한 기준은 <Link href="/refund" className="linklike">환불정책</Link>에 있어요.
              </p>
            </details>
            <details>
              <summary>입력한 정보는 어떻게 쓰이나요?</summary>
              <p>
                아이 정보는 리포트를 만드는 데만 써요. 이메일은 리포트 링크를 보내는 데 쓰고,
                휴대폰 번호와 다시 찾기 번호는 원문을 저장하지 않고 되돌릴 수 없게 바꾼 값만 남겨요.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="home-end">
        <div className="home-end-in">
          <div>
            <h2>나이와 체중을 알면 바로 시작할 수 있어요</h2>
            <p>무료 가이드를 먼저 보고 결제할지 정하세요.</p>
          </div>
          <div className="home-end-btns">
            <Link href="/diagnose" className="btn btn--primary btn--lg">무료 가이드 보기</Link>
            <Link href="/find" className="btn btn--secondary btn--lg">리포트 찾기</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
