import './globals.css';
import './legacy.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import ContactWidget from '@/components/ContactWidget';
import { Analytics } from '@vercel/analytics/react';
import { Suspense } from 'react';
import VisitTracker from '@/components/VisitTracker';
import SiteJsonLd from '@/components/SiteJsonLd';
import { Wordmark } from '@/components/Brand';

/*
  ⚠️ 「AI 진단」이라고 부르지 않는다. 리포트는 품종 데이터와 수의 지침에서 **계산**해 만들고,
     AI(Gemini)는 보호자가 직접 적은 증상에 답할 때만 쓴다(lib/careAdvisor.ts).
     「진단」도 쓰지 않는다 — 진단은 수의사가 하는 일이다.
*/
const TITLE = 'mypet — 반려동물 맞춤 케어 리포트';
const DESCRIPTION =
  '품종·나이·체중을 넣으면 188개 품종 데이터와 수의 지침을 기준으로 하루 급여량, 접종 일정, 조심할 질환, 먹으면 안 되는 음식을 정리해 드려요. 강아지·고양이 모두, 회원가입 없이.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'mypet',
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: 'mypet',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  verification: {
    // 네이버 서치어드바이저 소유확인
    other: { 'naver-site-verification': 'ce285daa384d1170d4dd8146059fe75ddb5d57a9' },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* 본문 서체: IBM Plex Sans KR — 숫자가 또렷하고 기록지다운 단정함이 있다 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <SiteJsonLd />
        <header className="site-header">
          <div className="site-header-in">
            <Link href="/" className="wordmark" aria-label="mypet 처음으로">
              <Wordmark />
            </Link>
            <nav className="site-nav" aria-label="주 메뉴">
              <Link href="/guide" className="nav-opt">정보 가이드</Link>
              <Link href="/breed" className="nav-opt">품종 가이드</Link>
              <Link href="/find" className="nav-find">리포트 찾기</Link>
              <Link href="/diagnose" className="btn btn--primary btn--sm">리포트 만들기</Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="site-footer-in">
            <nav className="footer-links" aria-label="사이트 안내">
              <Link href="/guide">정보 가이드</Link>
              <Link href="/breed">품종 가이드</Link>
              <Link href="/find">리포트 찾기</Link>
              <Link href="/terms">이용약관</Link>
              <Link href="/privacy"><strong>개인정보처리방침</strong></Link>
              <Link href="/refund">환불정책</Link>
              <ContactWidget />
            </nav>
            {/* 전자상거래법상 신원정보 — 공정위 지침에 따라 '연결 화면(토글)' 제공 방식 사용 */}
            <details className="biz-fold">
              <summary>{SITE.company} 사업자 정보</summary>
              <p className="footer-biz">
                상호 {SITE.company} · 대표 {SITE.ceo} · 사업자등록번호 {SITE.bizNo}
                {SITE.mailOrderNo && <> · 통신판매업신고 {SITE.mailOrderNo}</>}<br />
                {SITE.address}<br />
                {SITE.email}{SITE.phone && <> · {SITE.phone}</>}
              </p>
            </details>
            <p className="footer-note">
              mypet의 리포트는 일반적인 관리 정보이며 수의사의 진찰과 진료를 대신하지 않아요.
            </p>
          </div>
        </footer>
        <Analytics />
        {/* 방문 기록(유입·클릭·이탈). 쿠키를 만들지 않는다 — components/VisitTracker.tsx 주석 참고.
            useSearchParams를 쓰므로 Suspense로 감싼다(없으면 전체 페이지가 CSR로 떨어진다). */}
        <Suspense fallback={null}><VisitTracker /></Suspense>
      </body>
    </html>
  );
}
