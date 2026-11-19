import './globals.css';
import './board.css';
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
import { SiteNav } from '@/components/SiteNav';
import { SHOP_LIVE } from '@/lib/shop';

/*
  2026-11-19 전면 개편 — 「키우기 안내판」. 2,900원 리포트(결제·AI 답변)는 전부 걷어냈다.
  수익은 품종별 준비물 카드의 쿠팡 파트너스 수수료(lib/shop.ts). 대가성 문구는 카드가 있는 페이지 위쪽과 꼬리말에.
  ⚠️ 「AI」라고 부르지 않는다 — 내용은 품종 표준·수의 지침을 사람이 정리한 것이고 숫자는 계산식이다.
*/
const TITLE = '마이펫 — 강아지·고양이 품종별 키우기 안내판';
const DESCRIPTION =
  '강아지 130종·고양이 58종, 품종마다 하루 사료량·산책·빗질·미용·배변·조심할 질환과 준비물을 한 장에 정리했어요.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: '마이펫',
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: '마이펫',
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
    // 구글 서치콘솔 소유확인(속성 https://mypet.taif.kr/, 2026-09-26) — 확인 뒤에도 지우지 말 것
    google: '6I00I70OE7LS_5E0KC2gT3lvy48NDAAZFLymQUgFu2U',
    // 네이버 서치어드바이저 소유확인 · 빙 웹마스터 소유확인(2026-09-27) — 확인 뒤에도 지우지 말 것
    other: {
      'naver-site-verification': 'ce285daa384d1170d4dd8146059fe75ddb5d57a9',
      'msvalidate.01': 'BEDEA6B8C02AFAA25F4D03B262F1C87B',
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        {/*
          본문 서체: Pretendard(SIL OFL — 상업 사용 가능). 한국 앱 화면에서 가장 익숙한 산세리프라
          「토스처럼」 읽히는 기준이 된다. dynamic-subset은 화면에 나온 글자 조각만 받는다(가변 굵기 하나).
        */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <SiteJsonLd />
        <header className="site-header">
          <div className="site-header-in">
            <Link href="/" className="wordmark" aria-label="마이펫 처음으로">
              <Wordmark />
            </Link>
            <SiteNav />
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="site-footer-in">
            <nav className="footer-links" aria-label="사이트 안내">
              <Link href="/breed">품종 안내판</Link>
              <Link href="/start/dog">처음 데려온다면</Link>
              <Link href="/guide">정보 가이드</Link>
              <Link href="/tools">계산기</Link>
              <Link href="/sources">정보 기준</Link>
              <Link href="/terms">이용약관</Link>
              <Link href="/privacy"><strong>개인정보처리방침</strong></Link>
              <ContactWidget />
            </nav>
            {/* 운영자 정보 — 결제를 걷어내 통신판매 표기 의무는 없지만, 쿠팡 파트너스 수익을 내는 사업자라 그대로 밝힌다 */}
            <details className="biz-fold">
              <summary>{SITE.company} 사업자 정보</summary>
              <p className="footer-biz">
                상호 {SITE.company} · 대표 {SITE.ceo} · 사업자등록번호 {SITE.bizNo}
<br />
                {SITE.address}<br />
                {SITE.email}{SITE.phone && <> · {SITE.phone}</>}
              </p>
            </details>
            <p className="footer-note">
              마이펫의 내용은 일반적인 관리 정보이며 수의사의 진찰과 진료를 대신하지 않아요.
              {SHOP_LIVE ? <><br />마이펫은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</> : null}
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
