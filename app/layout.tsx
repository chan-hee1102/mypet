import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'mypet — 반려동물 맞춤 케어 리포트',
  description: '사진과 간단한 정보만으로 AI가 만들어주는 반려동물 맞춤 케어 가이드. 강아지·고양이 모두 지원.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
              <Link href="/symptom" className="nav-link">증상 체크</Link>
              {user ? (
                <>
                  <Link href="/pets" className="nav-link">내 아이</Link>
                  <span className="nav-user" title={user.email ?? undefined}>{user.email}</span>
                  <form action="/auth/signout" method="post">
                    <button type="submit" className="nav-link nav-link--btn">로그아웃</button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="nav-link">로그인</Link>
              )}
              <Link href="/create" className="btn btn--primary btn--sm">시작하기</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <b>mypet</b> · AI 반려동물 케어 · 본 서비스는 일반 정보를 제공하며 수의사의 진단·진료를 대체하지 않습니다.
        </footer>
      </body>
    </html>
  );
}
