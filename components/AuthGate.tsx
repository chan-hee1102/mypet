'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from './icons';

const KEY = 'mypet_auth';

/**
 * 로그인 게이트. 로그인 전이면 "로그인 필요" 화면을, 로그인 후엔 children을 보여준다.
 * ⚠️ 현재는 localStorage 기반 데모 로그인. 추후 Supabase 인증으로 교체.
 */
export default function AuthGate({ children, featureName }: { children: ReactNode; featureName?: string }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(typeof window !== 'undefined' && localStorage.getItem(KEY) === '1');
  }, []);

  function login() {
    localStorage.setItem(KEY, '1');
    setAuthed(true);
  }

  if (authed === null) return null; // 깜빡임 방지 (로드 중)

  if (!authed) {
    return (
      <div className="card gate">
        <div className="gate-ico"><Icon name="lock" size={24} /></div>
        <h2 className="gate-title">로그인이 필요한 기능이에요</h2>
        <p className="gate-desc">
          {featureName ?? '이 기능'}은 로그인 후 이용할 수 있어요.<br />
          기록을 저장하고 우리 아이를 관리해 보세요.
        </p>
        <button className="btn btn--primary btn--lg btn--block" onClick={login}>
          <Icon name="paw" size={17} filled /> 로그인하고 시작하기
        </button>
        <p className="gate-note">지금은 데모 로그인이에요 · 실제 회원가입·로그인은 곧 추가됩니다.</p>
      </div>
    );
  }

  return <>{children}</>;
}
