import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'mypet — 우리 아이를 위한 맞춤 케어 보고서',
  description:
    '사진과 간단한 정보만 입력하면 수의사 가이드라인과 188개 품종 데이터를 기반으로 우리 아이에게 꼭 맞는 관리 방법을 알려드려요. 로그인 없이 바로.',
};

/*
  랜딩 — Bento 디자인 시스템 (2026-08-28 전면 재작성)

  ⚠️ 이 페이지만 `.bento` 스타일을 쓴다. 사이트의 나머지(진단 폼·리포트·관리자)는
     globals.css 위쪽의 '토스 문법'(쿨 뉴트럴 + 무테 카드 + 그림자)을 그대로 유지한다.
     둘은 정반대 언어라 — Bento는 그림자가 없고 두꺼운 검정 테두리가 곧 입체감이다 —
     전역에 풀면 앱 화면이 통째로 깨진다.

  ⚠️ 전역 앱바(layout.tsx)는 이 경로에서 숨긴다(components/SiteHeader.tsx).
     Bento는 떠 있는 알약 내비가 문법이라, 기존 sticky 앱바와 겹치면 둘 다 어색해진다.

  히어로 배치는 코스톡과 같다 — 글 왼쪽 / 제품 미리보기 오른쪽.
  다만 우리 '제품'은 화면이 아니라 **리포트 한 장**이라, 목업 대신 실제 결과물을 보여준다.
  이게 이 서비스에서 가장 설득력 있는 자산이다: 무엇을 받는지 한눈에 보인다.
*/

/** 기능 타일 — 리포트가 실제로 담는 것들. 채움색은 Bento 카드 색을 돌려 쓴다. */
const TILES: { emoji: string; title: string; desc: string; fill: string }[] = [
  { emoji: '💚', title: '건강 상태 분석', desc: '품종·나이·체중을 함께 보고 지금 무엇을 챙겨야 하는지 정리해요.', fill: 'bcard--lime' },
  { emoji: '🍚', title: '맞춤 식단 & 영양', desc: '하루 급여량과 함께, 이 품종에 맞는 사료·간식 기준을 알려드려요.', fill: 'bcard--lav' },
  { emoji: '🛡️', title: '예방접종 일정', desc: '다음 접종일과 정기 검진 시점을 날짜로 짚어드려요.', fill: 'bcard--leaf' },
  { emoji: '⚠️', title: '먹으면 안 되는 음식', desc: '초콜릿·포도·자일리톨… 왜 위험한지까지 함께 적어요.', fill: 'bcard--mustard' },
  { emoji: '✂️', title: '털·피부 관리법', desc: '이중모인지, 얼마나 자주 빗어야 하는지 품종별로 달라요.', fill: 'bcard--forest' },
  { emoji: '📋', title: '주간 케어 체크리스트', desc: '이번 주에 실천할 것들을 요일별로 체크하며 관리해요.', fill: 'bcard--cobalt' },
];

const STEPS = [
  { n: 1, t: '우리 아이 정보 입력', d: '종·품종·나이·체중과 요즘 신경 쓰이는 점을 적어주세요. 회원가입은 없어요.' },
  { n: 2, t: '무료 품종 가이드 확인', d: '결제 전에 품종 특성·주의 질환·먹으면 안 되는 음식을 먼저 보여드려요.' },
  { n: 3, t: '맞춤 리포트 받기', d: '우리 아이에게 맞춘 전체 리포트를 받고, 링크는 이메일로도 보내드려요.' },
];

export default function LandingPage() {
  return (
    <div className="bento">
      <div className="strip">
        수의사 가이드라인 · <strong>188개 품종 데이터</strong> 기반 — 로그인 없이 바로 시작
      </div>

      {/* 떠 있는 알약 내비 */}
      <nav className="bnav">
        <Link href="/" className="bnav-logo">
          <span className="bnav-mark"><Icon name="paw" size={17} /></span>
          mypet
        </Link>
        <div className="bnav-links">
          <a href="#what">무엇을 받나요</a>
          <a href="#how">어떻게 되나요</a>
          <Link href="/breed">품종 가이드</Link>
        </div>
        <Link href="/diagnose" className="bbtn bbtn--lime bnav-cta">진단 시작</Link>
      </nav>

      {/* ── 히어로 ─────────────────────────────────────────────── */}
      <section className="band band--lime">
        <div className="wrap hero">
          <div>
            <span className="btag">✨ AI 맞춤 케어 리포트</span>
            <h1 style={{ marginTop: 18 }}>
              우리 아이를 위한<br />맞춤 케어 보고서
            </h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: 520 }}>
              사진과 간단한 정보만 넣으면, 수의사 가이드라인과 188개 품종 데이터를 바탕으로
              건강·식단·운동·예방까지 한 번에 정리해 드려요.
            </p>
            <div className="hero-cta">
              <Link href="/diagnose" className="bbtn bbtn--lg" style={{ background: '#fff' }}>
                <Icon name="sparkle" size={17} filled /> 무료로 시작하기
              </Link>
              <Link href="/breed" className="bbtn bbtn--ghost bbtn--lg">품종 가이드 먼저 보기</Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 14, fontWeight: 600, opacity: .75 }}>
              회원가입 없이 · 무료 가이드를 먼저 확인하고 결정하세요
            </p>
          </div>

          {/* 실제 리포트 한 장. 세로로 길어 아래를 페이드로 자르고 '전체 보기'를 칩으로 알린다. */}
          <div className="shot">
            <Image
              src="/report-sample.png"
              alt="mypet 맞춤 케어 보고서 예시 — 건강 상태 요약, 맞춤 식단, 예방접종 일정, 주간 체크리스트가 담긴 리포트"
              width={1024}
              height={1536}
              priority
              sizes="(max-width: 999px) 92vw, 560px"
            />
            <span className="shot-tag">실제 리포트 예시</span>
          </div>
        </div>
      </section>

      {/* ── 무엇을 받나요 ───────────────────────────────────────── */}
      <section className="band band--linen" id="what">
        <div className="wrap">
          <div className="shead">
            <h2>리포트 한 장에<br />이만큼 담겨요</h2>
            <p>검색해서 모으던 정보를, 우리 아이 기준으로 한 번에 정리해 드려요.</p>
          </div>
          <div className="grid3">
            {TILES.map((t) => (
              <div key={t.title} className={`bcard tile ${t.fill}`}>
                <div className="tile-ico" aria-hidden>{t.emoji}</div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 어떻게 되나요 ───────────────────────────────────────── */}
      <section className="band band--cobalt" id="how">
        <div className="wrap">
          <div className="shead">
            <h2 style={{ color: '#fff' }}>3분이면 끝나요</h2>
            <p style={{ color: '#fff', opacity: .9 }}>
              결제 전에 무료 가이드를 먼저 보여드려요. 보고 나서 결정하셔도 늦지 않아요.
            </p>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <div className="step-n">{s.n}</div>
                <h3>{s.t}</h3>
                <p style={{ marginTop: 8, fontSize: 15, opacity: .8 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 무엇을 근거로 하나요 ─────────────────────────────────── */}
      <section className="band band--linen">
        <div className="wrap">
          <div className="shead">
            <h2>추측이 아니라<br />근거로 씁니다</h2>
            <p>어디서 온 정보인지 리포트에 함께 적어요. 확인하실 수 있어야 믿을 수 있으니까요.</p>
          </div>
          <div className="stats">
            <div className="stat"><b>188</b><span>품종 데이터</span></div>
            <div className="stat"><b>AKC·FCI</b><span>공인 품종 표준</span></div>
            <div className="stat"><b>254</b><span>수의 근거 문서</span></div>
            <div className="stat"><b>60일</b><span>리포트 열람 기간</span></div>
          </div>
          <p style={{ marginTop: 22, fontSize: 14.5, color: 'var(--sage)', maxWidth: 720 }}>
            본 서비스는 일반적인 정보를 제공하며 <strong>수의사의 진단·진료를 대체하지 않습니다.</strong>
            이상 징후가 보이면 병원 방문이 먼저예요.
          </p>
        </div>
      </section>

      {/* ── 마지막 CTA ─────────────────────────────────────────── */}
      <section className="band band--maroon">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fff' }}>우리 아이,<br />오늘부터 제대로 챙겨요</h2>
          <p className="lead" style={{ color: '#fff', opacity: .9, marginTop: 16, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
            회원가입 없이 3분이면 무료 품종 가이드를 확인할 수 있어요.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
            <Link href="/diagnose" className="bbtn bbtn--lime bbtn--lg">
              <Icon name="sparkle" size={17} filled /> 무료로 시작하기
            </Link>
            <Link href="/find" className="bbtn bbtn--lg" style={{ background: '#fff' }}>이미 받은 리포트 찾기</Link>
          </div>
        </div>
      </section>

      {/* 랜딩 전용 푸터 — 전역 푸터는 layout에 있지만 Bento 띠 아래에 회색 푸터가 붙으면
          색 띠로 끝나는 리듬이 깨진다. 여기서 법적 링크만 검정 테두리 언어로 정리한다. */}
      <footer className="bfoot">
        <div className="wrap" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy"><strong>개인정보처리방침</strong></Link>
          <Link href="/refund">환불정책</Link>
          <Link href="/contact">문의</Link>
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--sage)' }}>
            {SITE.company} · 사업자등록번호 {SITE.bizNo}
          </span>
        </div>
      </footer>
    </div>
  );
}
