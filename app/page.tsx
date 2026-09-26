import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';
import { AppJsonLd } from '@/components/SiteJsonLd';

export const metadata = {
  // 한글 이름(마이펫)과 보호자가 검색하는 말(사료량·접종)을 제목 앞쪽에. 영문 브랜드만으로는 걸릴 검색어가 없었다(2026-09-27)
  title: { absolute: '마이펫 mypet | 강아지·고양이 사료량·접종 맞춤 케어 리포트' },
  alternates: { canonical: SITE.url },
  description:
    '품종·나이·몸무게를 알려 주시면 188개 품종 데이터와 수의 지침을 기준으로 하루 급여량, 접종 일정, 조심할 질환, 먹으면 안 되는 음식을 정리해 드려요. 결제 전에 무료 가이드를 먼저 볼 수 있어요.',
};

/*
  랜딩 — 2026-09-26 Wise 문법 판(globals.css 「첫 화면」).
  흐름: 흰 바탕 큰 제목 → 연두 무대 위로 올라오는 실제 리포트 → 기능 → 먹색 띠(과정) → 연두 띠(근거) → 먹색 카드(마무리)

  문구: 보호자가 실제로 묻는 말(「사료는 얼마나, 접종은 언제?」)로 시작한다. 「A가 아니라 B」·「이만큼 담깁니다」 같은
  표어체는 AI가 쓴 글처럼 읽혀서 쓰지 않는다(2026-09-26 사장님 지적). 제목 줄바꿈은 span 단위로만 일어나게 막아 둔다.

  ⚠️ 히어로 이미지는 /sample(예시 강아지를 실제 계산 코드로 만든 리포트)을 찍은 것이다. 리포트 화면이 바뀌면 다시 찍을 것.
  ⚠️ 「AI」는 붙이지 않는다(AI는 보호자가 적은 증상에만 쓴다). 「진단」도 쓰지 않는다(수의사가 하는 일).
*/

/** 리포트가 실제로 담는 것들. 아이콘은 components/icons.tsx의 모노라인 SVG만 쓴다. */
const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: 'bowl', title: '하루 급여량', desc: '몸무게와 나이, 중성화 여부로 하루 열량과 사료 양을 계산해요.' },
  { icon: 'calendar', title: '다음 접종일', desc: '마지막 접종 달을 알려 주시면 다음 날짜를 적어 드려요.' },
  { icon: 'activity', title: '조심할 질환', desc: '이 품종에서 자주 보고되는 질환과, 집에서 알아챌 수 있는 신호예요.' },
  { icon: 'alert', title: '먹으면 안 되는 음식', desc: '초콜릿, 포도, 자일리톨처럼 위험한 음식과 그 이유예요.' },
  { icon: 'scissors', title: '털·피부 관리', desc: '빗질과 목욕을 얼마나 자주 해야 하는지 품종에 맞춰 적어요.' },
  { icon: 'check', title: '주간 체크리스트', desc: '출력해서 붙여 두고 요일마다 표시하는 할 일 목록이에요.' },
];

const STEPS = [
  { t: '정보 입력', d: '종류, 품종, 나이, 몸무게를 적어요. 신경 쓰이는 증상이 있으면 함께 골라요.' },
  { t: '무료 가이드 확인', d: '체중이 표준 범위인지, 이 품종에서 먼저 알아 둘 게 뭔지 바로 볼 수 있어요.' },
  { t: '전체 리포트 받기', d: '결제하면 전체 리포트가 열리고, 링크는 이메일로도 받아요.' },
];

const STATS = [
  { v: '188', k: '품종 데이터' },
  { v: 'AKC · FCI', k: '공인 품종 표준' },
  { v: 'WSAVA', k: '접종·영양 수의 지침' },
  { v: '60일', k: '리포트 열람 기간' },
];

export default function LandingPage() {
  const price = SITE.pricePerPet.toLocaleString();
  return (
    <main className="lp">
      <AppJsonLd />
      <section className="lp-hero">
        <div className="lp-wrap">
          <span className="lp-tag">강아지 · 고양이 188개 품종</span>
          <h1 className="lp-display">
            <span>사료는 얼마나,</span> <span>접종은 언제?</span>
            <br />
            <span>우리 아이 기준으로</span> <span>알려드려요</span>
          </h1>
          <p className="lp-lead">
            품종과 나이, 몸무게만 적으면 돼요.<br />
            조심할 질환과 먹으면 안 되는 음식까지 <span>한 장에 정리해요.</span>
          </p>
          <div className="lp-cta">
            <Link href="/diagnose" className="btn btn--primary btn--lg" data-track="첫 화면에서 시작">무료로 시작하기</Link>
            <Link href="/sample" className="lp-link">예시 리포트 보기</Link>
          </div>
          <p className="lp-note"><span>회원가입 없이 무료 가이드부터 볼 수 있어요</span> <span className="lp-note-price">전체 리포트 {price}원</span></p>
        </div>

        {/* 실제 리포트(/sample을 찍은 것)가 무대 아래 경계에 걸려 올라온다. 누르면 전체를 연다. */}
        <div className="lp-stage">
          <Link href="/sample" className="lp-shot" aria-label="예시 리포트 전체 보기">
            <Image
              src="/report-sample.png"
              alt="mypet 케어 리포트 예시 — 포메라니안 3살 3.4kg 강아지의 요약, 하루 식단, 접종 일정"
              width={1120}
              height={2000}
              priority
              sizes="(max-width: 600px) 92vw, 560px"
            />
            <span className="lp-shot-tag">예시 리포트 전체 보기</span>
          </Link>
        </div>
      </section>

      <section className="lp-sec" id="what">
        <div className="lp-wrap">
          <h2 className="lp-h2">리포트에 이런 게 들어가요</h2>
          <p className="lp-sub">검색해서 하나씩 찾던 내용을 우리 아이 기준으로 모았어요.</p>
          <div className="lp-feats">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feat">
                <span className="lp-ico"><Icon name={f.icon} size={24} /></span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec lp-dark" id="how">
        <div className="lp-wrap">
          <h2 className="lp-h2">이렇게 받아요</h2>
          <p className="lp-sub">입력은 3분이면 끝나요. 결제 전에 무료 가이드부터 보여 드려요.</p>
          <ol className="lp-steps">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <span className="lp-step-n">{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-sec lp-mint">
        <div className="lp-wrap">
          <h2 className="lp-h2">어디서 나온 숫자인지 적어 둬요</h2>
          <p className="lp-sub">품종 표준과 수의 지침으로 계산하고, 리포트에 출처를 함께 적어요.</p>
          <div className="lp-stats">
            {STATS.map((s) => (
              <div key={s.k} className="lp-stat"><b>{s.v}</b><span>{s.k}</span></div>
            ))}
          </div>
          <p className="lp-disclaim">
            mypet의 리포트는 일반적인 관리 정보예요. <strong>수의사의 진단과 진료를 대신하지 않아요.</strong> 이상한 모습이 보이면 병원에 먼저 가 주세요.
          </p>
        </div>
      </section>

      <section className="lp-end">
        <div className="lp-wrap">
          <div className="lp-endcard">
            <h2 className="lp-h2">우리 아이 정보, 지금 넣어 보세요</h2>
            <p>회원가입 없이 3분이면 무료 가이드를 볼 수 있어요.</p>
            <div className="lp-cta">
              <Link href="/diagnose" className="btn btn--primary btn--lg">무료로 시작하기</Link>
              <Link href="/find" className="lp-link">이미 받은 리포트 찾기</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
