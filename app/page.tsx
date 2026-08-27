import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'mypet — 우리 아이를 위한 맞춤 케어 보고서',
  description:
    '품종·나이·체중을 입력하면 수의사 가이드라인과 188개 품종 데이터를 기반으로 건강·식단·운동·예방을 한 번에 정리해 드려요. 로그인 없이 바로.',
};

/*
  랜딩 (2026-08-28)

  ⚠️ 이 페이지만 `.lp` 스타일을 쓴다. 사이트의 나머지(진단 폼·리포트·관리자)는
     globals.css 위쪽의 '토스 문법'을 그대로 유지한다.
  ⚠️ 전역 앱바·푸터는 이 경로에서 숨긴다(components/HideOnLanding.tsx).

  ── 톤에 대하여 ────────────────────────────────────────────────────────
  첫 판은 Linktree 문법(형광 라임 + 3px 순검정 테두리 + 이모지)을 그대로 옮겼다가 걷어냈다.
  그건 크리에이터 툴의 언어지 **반려동물 건강 서비스**의 언어가 아니다.
  보호자가 묻는 것은 "재밌나"가 아니라 **"믿고 따라 해도 되나"**다.
  그래서 이모지를 모노라인 아이콘으로, 두꺼운 검정 테두리를 헤어라인으로,
  형광 라임을 딥 포레스트 + 웜 오프화이트로 바꿨다.
  구조(벤토 그리드·색 띠·알약 버튼)는 좋아서 그대로 뒀다.

  히어로 배치는 kostock과 같다 — 글 왼쪽 / 제품 미리보기 오른쪽.
  다만 우리 '제품'은 화면이 아니라 **리포트 한 장**이라 UI 목업 대신 실제 결과물을 보여준다.
*/

/** 리포트가 실제로 담는 것들. 아이콘은 components/icons.tsx의 모노라인 SVG만 쓴다. */
const TILES: { icon: string; tone: string; title: string; desc: string }[] = [
  { icon: 'activity', tone: 'lico--green', title: '건강 상태 정리',
    desc: '품종·나이·체중을 함께 보고 지금 무엇을 챙겨야 하는지 정리해 드려요.' },
  { icon: 'bowl', tone: 'lico--sage', title: '맞춤 식단 · 영양',
    desc: '하루 급여 기준과 이 품종에 맞는 사료·간식 방향을 알려드려요.' },
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
  { n: 2, t: '무료 품종 가이드 확인', d: '결제 전에 품종 특성·주의 질환·금지 음식을 먼저 보여드려요.' },
  { n: 3, t: '맞춤 리포트 받기', d: '우리 아이 기준으로 정리한 전체 리포트를 받고, 링크는 이메일로도 보내드려요.' },
];

export default function LandingPage() {
  return (
    <div className="lp">
      <div className="strip">
        수의사 가이드라인 · <strong>188개 품종 데이터</strong> 기반 — 로그인 없이 바로 시작
      </div>

      <nav className="lnav">
        <div className="lnav-in">
          <Link href="/" className="lnav-logo">
            <span className="lnav-mark"><Icon name="paw" size={17} filled /></span>
            mypet
          </Link>
          <div className="lnav-links">
            <a href="#what">무엇을 받나요</a>
            <a href="#how">어떻게 되나요</a>
            <Link href="/guide">정보 가이드</Link>
            <Link href="/breed">품종 가이드</Link>
          </div>
          <Link href="/diagnose" className="lbtn lbtn--primary lnav-cta">진단 시작</Link>
        </div>
      </nav>

      {/* ── 히어로 ─────────────────────────────────────────────── */}
      <section className="band band--hero">
        <div className="wrap hero">
          <div>
            <span className="ltag"><Icon name="sparkle" size={13} filled /> AI 맞춤 케어 리포트</span>
            <h1 style={{ marginTop: 18 }}>
              우리 아이를 위한<br />맞춤 케어 보고서
            </h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: 520 }}>
              품종·나이·체중만 입력하면, 수의사 가이드라인과 188개 품종 데이터를 바탕으로
              건강·식단·운동·예방까지 한 번에 정리해 드립니다.
            </p>
            <div className="hero-cta">
              <Link href="/diagnose" className="lbtn lbtn--primary lbtn--lg">
                <Icon name="sparkle" size={16} filled /> 무료로 시작하기
              </Link>
              <Link href="/breed" className="lbtn lbtn--ghost lbtn--lg">품종 가이드 먼저 보기</Link>
            </div>
            <p className="hero-note">회원가입 없이 · 무료 가이드를 먼저 확인하고 결정하세요</p>
          </div>

          {/* 실제 리포트 한 장. 세로로 길어 아래를 페이드로 자르고 칩으로 목업이 아님을 밝힌다. */}
          <div className="shot">
            <Image
              src="/report-sample.png"
              alt="mypet 맞춤 케어 보고서 예시 — 건강 상태 요약, 맞춤 식단, 예방접종 일정, 주간 체크리스트"
              width={1024}
              height={1536}
              priority
              sizes="(max-width: 999px) 92vw, 540px"
            />
            <span className="shot-tag">실제 리포트 예시</span>
          </div>
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
            <div className="stat"><b>254</b><span>수의 근거 문서</span></div>
            <div className="stat"><b>60일</b><span>리포트 열람 기간</span></div>
          </div>
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--muted)', maxWidth: 720 }}>
            본 서비스는 일반적인 정보를 제공하며 <strong style={{ color: 'var(--ink-2)' }}>수의사의 진단·진료를 대체하지 않습니다.</strong>{' '}
            이상 징후가 보이면 병원 방문이 먼저입니다.
          </p>
        </div>
      </section>

      {/* ── 마지막 CTA ─────────────────────────────────────────── */}
      <section className="band band--forest">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <h2>우리 아이, 오늘부터 제대로 챙기세요</h2>
          <p className="lead" style={{ marginTop: 15, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            회원가입 없이 3분이면 무료 품종 가이드를 확인할 수 있습니다.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 11, flexWrap: 'wrap', marginTop: 28 }}>
            <Link href="/diagnose" className="lbtn lbtn--primary lbtn--lg">
              <Icon name="sparkle" size={16} filled /> 무료로 시작하기
            </Link>
            <Link href="/find" className="lbtn lbtn--ghost lbtn--lg">이미 받은 리포트 찾기</Link>
          </div>
        </div>
      </section>

      <footer className="lfoot">
        <div className="wrap" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/guide">정보 가이드</Link>
          <Link href="/breed">품종 가이드</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy"><strong>개인정보처리방침</strong></Link>
          <Link href="/refund">환불정책</Link>
          <Link href="/contact">문의</Link>
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted)' }}>
            {SITE.company} · 사업자등록번호 {SITE.bizNo}
          </span>
        </div>
      </footer>
    </div>
  );
}
