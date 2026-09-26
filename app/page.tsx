import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'mypet — 반려동물 맞춤 케어 리포트',
  description:
    '품종·나이·몸무게를 알려 주시면 188개 품종 데이터와 수의 지침을 기준으로 하루 급여량, 접종 일정, 조심할 질환, 먹으면 안 되는 음식을 정리해 드려요. 결제 전에 무료 가이드를 먼저 볼 수 있어요.',
};

/*
  랜딩 — 2026-09-26 Wise 문법 판(globals.css 「첫 화면」).
  같은 날 건강수첩 → 토스식 → 8월 벤토 판 되돌림을 거쳐, 사장님이 Wise 스타일 가이드로 사이트 전체를 바꾸라고 했다.
  흐름: 흰 바탕의 아주 큰 제목 → 연두 무대 위로 올라오는 실제 리포트 → 기능 → 먹색 띠(과정) → 연두 띠(근거) → 먹색 카드(마무리)

  ⚠️ 히어로 이미지는 /sample(예시 강아지를 실제 계산 코드로 만든 리포트)을 찍은 것이다. 리포트 화면이 바뀌면 다시 찍을 것.
     8월 판의 옛 이미지는 AI로 그린 목업(가상의 수의사, 실제 브랜드 사료, 없는 예측 수치)이라 쓰지 않는다.
  ⚠️ 「AI」는 붙이지 않는다(AI는 보호자가 적은 증상에만 쓴다). 「진단」도 쓰지 않는다(수의사가 하는 일).
*/

/** 리포트가 실제로 담는 것들. 아이콘은 components/icons.tsx의 모노라인 SVG만 쓴다. */
const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: 'activity', title: '건강 상태 정리', desc: '품종·나이·체중을 함께 보고 지금 무엇을 챙겨야 하는지 정리해 드려요.' },
  { icon: 'bowl', title: '하루 식단', desc: '하루 급여량과 줘도 괜찮은 것, 이 품종 식단에서 주의할 점을 알려드려요.' },
  { icon: 'calendar', title: '접종·검진 일정', desc: '다음 접종일과 정기 검진 시점을 날짜로 짚어드려요.' },
  { icon: 'alert', title: '먹으면 안 되는 음식', desc: '초콜릿·포도·자일리톨 등, 왜 위험한지 이유까지 함께 적어요.' },
  { icon: 'scissors', title: '털·피부 관리', desc: '이중모인지, 얼마나 자주 빗어야 하는지는 품종마다 달라요.' },
  { icon: 'check', title: '주간 체크리스트', desc: '이번 주에 실천할 것을 요일별로 표시하며 관리해요.' },
];

const STEPS = [
  { t: '우리 아이 정보 입력', d: '종·품종·나이·체중과 요즘 신경 쓰이는 점을 적어 주세요. 회원가입은 없어요.' },
  { t: '무료 가이드 확인', d: '결제 전에 체중 판정과 이 품종에서 먼저 알아 둘 것을 보여 드려요.' },
  { t: '맞춤 리포트 받기', d: '우리 아이 기준으로 정리한 전체 리포트를 받고, 링크는 이메일로도 보내 드려요.' },
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
      <section className="lp-hero">
        <div className="lp-wrap">
          <span className="lp-tag">188개 품종 데이터 · 수의 지침 기반</span>
          <h1 className="lp-display">우리 아이 맞춤<br />케어 리포트</h1>
          <p className="lp-lead">
            품종·나이·체중만 입력하면 하루 급여량, 접종 일정, 조심할 질환, 먹으면 안 되는 음식까지 한 장에 정리해 드려요.
          </p>
          <div className="lp-cta">
            <Link href="/diagnose" className="btn btn--primary btn--lg" data-track="첫 화면에서 시작">무료로 시작하기</Link>
            <Link href="/breed" className="lp-link">품종 가이드 먼저 보기</Link>
          </div>
          <p className="lp-note">회원가입 없이 · 무료 가이드를 먼저 보고 결정하세요 <span>· 전체 리포트 {price}원</span></p>
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
            <span className="lp-shot-tag">실제 리포트 예시 · 전체 보기</span>
          </Link>
        </div>
      </section>

      <section className="lp-sec" id="what">
        <div className="lp-wrap">
          <h2 className="lp-h2">리포트 한 장에<br />이만큼 담깁니다</h2>
          <p className="lp-sub">검색해서 하나씩 모으던 기준을, 우리 아이 숫자로 바꿔 한 번에 정리해 드려요.</p>
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
          <h2 className="lp-h2">3분이면 끝나요</h2>
          <p className="lp-sub">결제 전에 무료 가이드를 먼저 보여 드려요. 보고 나서 결정하셔도 늦지 않아요.</p>
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
          <h2 className="lp-h2">추측이 아니라<br />근거로 씁니다</h2>
          <p className="lp-sub">어디서 온 정보인지 리포트에 함께 적어요. 확인하실 수 있어야 믿을 수 있으니까요.</p>
          <div className="lp-stats">
            {STATS.map((s) => (
              <div key={s.k} className="lp-stat"><b>{s.v}</b><span>{s.k}</span></div>
            ))}
          </div>
          <p className="lp-disclaim">
            mypet의 리포트는 일반적인 관리 정보이며 <strong>수의사의 진단과 진료를 대신하지 않아요.</strong> 이상 징후가 보이면 병원 방문이 먼저예요.
          </p>
        </div>
      </section>

      <section className="lp-end">
        <div className="lp-wrap">
          <div className="lp-endcard">
            <h2 className="lp-h2">우리 아이,<br />오늘부터 제대로 챙기세요</h2>
            <p>회원가입 없이 3분이면 무료 가이드를 확인할 수 있어요.</p>
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
