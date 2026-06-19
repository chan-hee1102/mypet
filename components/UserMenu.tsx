'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';

/** 헤더 우측 계정 아바타 + 드롭다운. 이메일을 바에 직접 노출하지 않는다. */
export default function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (email.trim()[0] || 'U').toUpperCase();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="usermenu" ref={ref}>
      <button
        className="usermenu-avatar"
        onClick={() => setOpen((o) => !o)}
        aria-label="계정 메뉴"
        aria-expanded={open}
      >
        {initial}
      </button>
      {open && (
        <div className="usermenu-pop" role="menu">
          <div className="usermenu-email">{email}</div>
          <Link href="/pets" className="usermenu-item" onClick={() => setOpen(false)}>
            <Icon name="paw" size={16} filled /> 내 아이
          </Link>
          <Link href="/account" className="usermenu-item" onClick={() => setOpen(false)}>
            <Icon name="user" size={16} /> 계정
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="usermenu-item usermenu-logout">
              <Icon name="lock" size={16} /> 로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
