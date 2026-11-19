'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 머리 메뉴(2026-11-19 「전문적인 플랫폼처럼」) — 흰 머리 띠 위 글자 메뉴, 지금 보는 곳은 먹색 글씨 + 머리 띠 아래 선에 붙는 밑줄.
 * 오른쪽 끝 돋보기 단추 = 품종 찾기(/breed). 지금 위치는 주소 앞부분으로 가린다(/breed/말티즈 → 품종 안내판). 첫 화면(/)은 아무것도 켜지 않는다.
 * nav-opt(정보 가이드·계산기)는 휴대폰에서 숨긴다(app/globals.css) — 바닥글 링크에 있다.
 */
const ITEMS = [
  { href: '/breed', label: '품종 안내판', match: '/breed' },
  { href: '/start/dog', label: '처음 데려온다면', match: '/start' },
  { href: '/guide', label: '정보 가이드', match: '/guide', opt: true },
  { href: '/tools', label: '계산기', match: '/tools', opt: true },
];

export function SiteNav() {
  const path = usePathname() ?? '/';
  return (
    <>
      <nav className="site-nav" aria-label="주 메뉴">
        {ITEMS.map((it) => {
          const on = path === it.match || path.startsWith(`${it.match}/`);
          return (
            <Link key={it.href} href={it.href} className={it.opt ? 'nav-opt' : undefined} aria-current={on ? 'page' : undefined}>
              {it.label}
            </Link>
          );
        })}
      </nav>
      <Link href="/breed" className="hdr-search" aria-label="품종 찾기" title="품종 찾기">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </Link>
    </>
  );
}
