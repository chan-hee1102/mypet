import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/icons';
import { TagMark } from '@/components/Brand';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'mypet — 반려동물 맞춤 케어 리포트',
  description:
    '품종·나이·몸무게를 알려 주시면 188개 품종 데이터와 수의 지침을 기준으로 하루 급여량, 접종 일정, 조심할 질환, 먹으면 안 되는 음식을 정리해 드려요. 결제 전에 무료 가이드를 먼저 볼 수 있어요.',
};

/*
  랜딩 — 2026-08-28 벤토 판으로 되돌림(2026-09-26).
  같은 날 건강수첩 판 → 토스식 판으로 두 번 바꿨다가, 사장님 평 「기존 디자인이 더 낫다」로 첫 화면만 되돌렸다.
  입력(/diagnose)·리포트·가이드는 토스식 그대로다.

  ⚠️ 이 페이지만 `.lp` 스타일을 쓴다(globals.css 「랜딩 전용 디자인 시스템」). 전역 앱바는
     `body:has(.lp)`로 숨기고 자기 내비를 쓴다. 푸터는 전역 것을 그대로 쓴다 — 사업자 정보 접기가 거기 있다.
  ⚠️ 옛 판에서 그대로 가져오지 않은 것:
     · 히어로 이미지 — 옛 report-sample.png는 AI로 그린 목업이었다(가상의 수의사 이름, 실제 브랜드 사료 추천,
       「3개월 후 +25%」 같은 없는 기능). 지금은 /sample(예시 강아지를 실제 계산 코드로 만든 리포트)을 찍은 것이다.
       리포트 화면이 바뀌면 다시 찍을 것
     · 문구 — 「AI 맞춤」(AI는 보호자가 적은 증상에만 쓴다), 「진단」(수의사가 하는 일), 「수의사 가이드라인」,
       확인할 수 없는 「254 수의 근거 문서」, 무료 가이드에 없는 「주의 질환·금지 음식을 먼저」를 뺐다
*/

/** 리포트가 실제로 담는 것들. 아이콘은 components/icons.tsx의 모노라인 SVG만 쓴다. */
const TILES: { icon: string; tone: string; title: string; desc: string }[] = [
  { icon: 'activity', tone: 'lico--green', title: '건강 상태 정리',
    desc: '품종·나이·체중을 함께 보고 지금 무엇을 챙겨야 하는지 정리해 드려요.' },
  { icon: 'bowl', tone: 'lico--sage', title: '맞춤 식단 · 영양',
    desc: '하루 급여량과 줘도 괜찮은 것, 이 품종 식단에서 주의할 점을 알려드려요.' },
  { icon: 'calendar', tone: 'lico--green', title: '예방접종 · 검진 일정',
    desc: '다음 접종일과 정기 검진 시점을 날짜로 짚어드려요.' },
  { icon: 'alert', tone: 'lico--rose', title: '먹으면 안 되는 음식',
    desc: '초콜릿·포도·자일리톨 등, 왜 위험한지 이유까지 함께 적어요.' },
  { icon: 'scissors', tone: 'lico--sage', title: '털 · 피부 관리',
    desc: '이중모인지, 얼마나 자주 빗어야 하는지는 품종마다 달라요.' },
  { icon: 'check', tone: 'lico--amber', title: '주간 케어 체크리스트',
    desc: '이번 주에 실천할 것을 요일별로 확인하며 관리해요.' },
];

const STEPS = [
  { n: 1, t: '우리 아이 정보 입력', d: '종·품종·나이·체중과 요즘 신경 쓰이는 점을 적어주세요. 회원가입은 없습니다.' },
  { n: 2, t: '무료 가이드 확인', d: '결제 전에 체중 판정과 이 품종에서 먼저 알아 둘 것을 보여드려요.' },
  { n: 3, t: '맞춤 리포트 받기', d: '우리 아이 기준으로 정리한 전체 리포트를 받고, 링크는 이메일로도 보내드려요.' },
];

export default function LandingPage() {
  return (
    <main className="lp">
      <div className="strip">
        수의 지침 · <strong>188개 품종 데이터</strong> 기반 — 로그인 없이 바로 시작
      </div>

      <nav className="lnav">
        <div className="lnav-in">
          <Link href="/" className="lnav-logo" aria-label="mypet 처음으로">
            <span className="lnav-mark"><TagMark size={17} /></span>
            mypet
          </Link>
          <div className="lnav-links">
            <a href="#what">무엇을 받나요</a>
            <a href="#how">어떻게 되나요</a>
            <Link href="/guide">정보 가이드</Link>
            <Link href="/breed">품종 가이드</Link>
          </div>
          <Link href="/diagnose" className="lbtn lbtn--primary lnav-cta">리포트 만들기</Link>
        </div>
      </nav>

      {/* ── 히어로 ─────────────────────────────────────────────── */}
      <section className="band band--hero">
        <div className="wrap hero">
          <div>
            <span className="ltag"><Icon name="paw" size={13} filled /> 품종·나이·체중으로 계산한 리포트</span>
            <h1 style={{ marginTop: 18 }}>
              우리 아이를 위한<br />맞춤 케어 보고서
            </h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: 520 }}>
              품종·나이·체중만 입력하면, 수의 지침과 188개 품종 데이터를 바탕으로
              건강·식단·운동·예방까지 한 번에 정리해 드립니다.
            </p>
            <div className="hero-cta">
              <Link href="/diagnose" className="lbtn lbtn--primary lbtn--lg" data-track="첫 화면에서 시작">
                <Icon name="sparkle" size={16} filled /> 무료로 시작하기
              </Link>
              <Link href="/breed" className="lbtn lbtn--ghost lbtn--lg">품종 가이드 먼저 보기</Link>
            </div>
            <p className="hero-note">
              회원가입 없이 · 무료 가이드를 먼저 확인하고 결정하세요 <span>· 전체 리포트 {SITE.pricePerPet.toLocaleString()}원</span>
            </p>
          </div>

          {/* 실제 리포트 한 장(/sample을 찍은 것). 세로로 길어 아래를 페이드로 자르고, 누르면 전체를 연다. */}
          <Link href="/sample" className="shot" aria-label="예시 리포트 전체 보기">
            <Image
              src="/report-sample.png"
              alt="mypet 케어 리포트 예시 — 포메라니안 3살 3.4kg 강아지의 요약, 하루 식단, 접종 일정"
              width={1120}
              height={2000}
              priority
              sizes="(max-width: 999px) 92vw, 540px"
            />
            <span className="shot-tag">실제 리포트 예시 · 전체 보기</span>
          </Link>
        </div>
      </section>

      {/* ── 무엇을 받나요 ───────────────────────────────────────── */}
      <section className="band band--cream" id="what">
        <div className="wrap">
          <div className="shead">
            <h2>리포트 한 장에 이만큼 담깁니다</h2>
            <p>검색해서 모으던 정보를, 우리 아이 기준으로 한 번에 정리해 드려요.</p>
          </div>
          <div className="grid3">
            {TILES.map((t) => (
              <div key={t.title} className="lcard tile">
                <div className={`lico ${t.tone}`}><Icon name={t.icon} size={21} /></div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 어떻게 되나요 ───────────────────────────────────────── */}
      <section className="band band--forest" id="how">
        <div className="wrap">
          <div className="shead">
            <h2>3분이면 끝납니다</h2>
            <p>결제 전에 무료 가이드를 먼저 보여드려요. 보고 나서 결정하셔도 늦지 않습니다.</p>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <div className="step-n">{s.n}</div>
                <h3>{s.t}</h3>
                <p style={{ marginTop: 9, fontSize: 14.5 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 무엇을 근거로 하나요 ─────────────────────────────────── */}
      <section className="band band--white">
        <div className="wrap">
          <div className="shead">
            <h2>추측이 아니라 근거로 씁니다</h2>
            <p>어디서 온 정보인지 리포트에 함께 적습니다. 확인하실 수 있어야 믿을 수 있으니까요.</p>
          </div>
          <div className="stats">
            <div className="stat"><b>188</b><span>품종 데이터</span></div>
            <div className="stat"><b>AKC · FCI</b><span>공인 품종 표준</span></div>
            <div className="stat"><b>WSAVA</b><span>접종·영양 수의 지침</span></div>
            <div className="stat"><b>60일</b><span>리포트 열람 기간</span></div>
          </div>
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--muted)', maxWidth: 720 }}>
            본 서비스는 일반적인 정보를 제공하며 <strong style={{ color: 'var(--ink-2)' }}>수의사의 진단과 진료를 대체하지 않습니다.</strong>{' '}
            이상 징후가 보이면 병원 방문이 먼저입니다.
          </p>
        </div>
      </section>

      {/* ── 마지막 CTA ─────────────────────────────────────────── */}
      <section className="band band--forest">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <h2>우리 아이, 오늘부터 제대로 챙기세요</h2>
          <p className="lead" style={{ marginTop: 15, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            회원가입 없이 3분이면 무료 가이드를 확인할 수 있습니다.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 11, flexWrap: 'wrap', marginTop: 28 }}>
            <Link href="/diagnose" className="lbtn lbtn--primary lbtn--lg">
              <Icon name="sparkle" size={16} filled /> 무료로 시작하기
            </Link>
            <Link href="/find" className="lbtn lbtn--ghost lbtn--lg">이미 받은 리포트 찾기</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
