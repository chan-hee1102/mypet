import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';
import ContactWidget from '@/components/ContactWidget';

const DESCRIPTION =
  '사진과 간단한 정보만 입력하면 AI가 품종·나이에 맞춘 케어 진단을 만들어 드립니다. 강아지·고양이 모두 지원, 로그인 없이 바로.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: 'mypet — 반려동물 맞춤 AI 케어 진단',
  description: DESCRIPTION,
  applicationName: 'mypet',
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: 'mypet',
    title: 'mypet — 반려동물 맞춤 AI 케어 진단',
    description: DESCRIPTION,
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'mypet — 반려동물 맞춤 AI 케어 진단',
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <header className="appbar">
          <div className="appbar-inner">
            <Link href="/" className="brand">
              <span className="brand-mark">
                <Icon name="paw" size={17} filled />
              </span>
              <span className="brand-name">
                my<span>pet</span>
              </span>
            </Link>
            <nav className="appbar-nav">
              <Link href="/diagnose" className="btn btn--primary btn--sm">진단하기</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <nav className="footer-links">
            <Link href="/terms">이용약관</Link>
            <Link href="/privacy"><strong>개인정보처리방침</strong></Link>
            <Link href="/refund">환불정책</Link>
            <ContactWidget />
          </nav>
          <p className="footer-biz">
            {SITE.company} · 대표 {SITE.ceo} · 사업자등록번호 {SITE.bizNo}
            {SITE.mailOrderNo && <> · 통신판매업신고 {SITE.mailOrderNo}</>}<br />
            {SITE.address} · {SITE.email}
          </p>
          <p className="footer-note">
            <b>mypet</b> · AI 반려동물 케어 · 본 서비스는 일반 정보를 제공하며 수의사의 진단·진료를 대체하지 않습니다.
          </p>
        </footer>
      </body>
    </html>
  );
}
