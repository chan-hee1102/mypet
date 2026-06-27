'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icons';

/** 모바일 전용 하단 탭바 (네이티브 앱 느낌). 데스크톱에선 CSS로 숨김. */
export default function BottomNav({ authed }: { authed: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const accountHref = authed ? '/account' : '/login';
  const accountActive = pathname.startsWith('/account') || pathname.startsWith('/login');
  const homeHref = authed ? '/dashboard' : '/';

  return (
    <nav className="bottomnav" aria-label="하단 메뉴">
      <Link href={homeHref} className={`bn-item ${isActive('/') || pathname.startsWith('/dashboard') ? 'on' : ''}`}>
        <span className="bn-ico"><Icon name="home" size={21} /></span>
        <span className="bn-label">홈</span>
      </Link>
      <Link href="/symptom" className={`bn-item ${isActive('/symptom') ? 'on' : ''}`}>
        <span className="bn-ico"><Icon name="cross" size={21} /></span>
        <span className="bn-label">증상</span>
      </Link>
      <Link href="/diagnose" className="bn-item bn-center" aria-label="진단하기">
        <span className="bn-fab"><Icon name="sparkle" size={22} filled /></span>
      </Link>
      <Link href="/pets" className={`bn-item ${isActive('/pets') ? 'on' : ''}`}>
        <span className="bn-ico"><Icon name="paw" size={21} filled /></span>
        <span className="bn-label">내 아이</span>
      </Link>
      <Link href={accountHref} className={`bn-item ${accountActive ? 'on' : ''}`}>
        <span className="bn-ico"><Icon name="user" size={21} /></span>
        <span className="bn-label">계정</span>
      </Link>
    </nav>
  );
}
