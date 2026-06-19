'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Icon } from './icons';

/**
 * 로그인 게이트. 로그인 전이면 "로그인 필요" 화면을, 로그인 후엔 children을 보여준다.
 * Supabase 세션 기반 — 로그인/로그아웃 시 자동으로 갱신된다.
 */
export default function AuthGate({ children, featureName }: { children: ReactNode; featureName?: string }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  if (authed === null) return null; // 깜빡임 방지 (로드 중)

  if (!authed) {
    const nextUrl = `/login?next=${encodeURIComponent(pathname || '/')}`;
    return (
      <div className="card gate">
        <div className="gate-ico"><Icon name="lock" size={24} /></div>
        <h2 className="gate-title">로그인이 필요한 기능이에요</h2>
        <p className="gate-desc">
          {featureName ?? '이 기능'}은 로그인 후 이용할 수 있어요.<br />
          기록을 저장하고 우리 아이를 관리해 보세요.
        </p>
        <Link href={nextUrl} className="btn btn--primary btn--lg btn--block">
          <Icon name="paw" size={17} filled /> 로그인하고 시작하기
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
