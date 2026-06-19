'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Icon, GoogleLogo } from '@/components/icons';

/** Supabase 영어 에러 메시지를 한국어로 다듬어준다. */
function toKo(msg?: string): string {
  if (!msg) return '오류가 발생했습니다.';
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (m.includes('user already registered')) return '이미 가입된 이메일이에요. 로그인해 주세요.';
  if (m.includes('password should be at least')) return '비밀번호는 6자 이상이어야 해요.';
  if (m.includes('unable to validate email')) return '이메일 형식을 확인해 주세요.';
  if (m.includes('email not confirmed')) return '이메일 인증이 필요해요. 받은 메일의 링크를 눌러주세요.';
  return msg;
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [supabase] = useState(() => createClient());

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          // 이메일 인증이 켜져 있는 경우
          setInfo('확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.');
          setMode('signin');
        }
      }
    } catch (err: any) {
      setError(toKo(err?.message));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError('');
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) setError(toKo(error.message));
  }

  return (
    <main className="container container--narrow">
      <section className="hero">
        <span className="eyebrow"><Icon name="paw" size={14} filled /> mypet</span>
        <h1>{mode === 'signin' ? '다시 오셨네요' : '환영해요'}</h1>
        <p className="hero-sub">로그인하고 우리 아이의 케어 기록을 저장·관리하세요.</p>
      </section>

      <div className="card">
        <div className="seg auth-tabs">
          <button
            type="button"
            className={`seg-opt ${mode === 'signin' ? 'on' : ''}`}
            onClick={() => { setMode('signin'); setError(''); }}
          >
            로그인
          </button>
          <button
            type="button"
            className={`seg-opt ${mode === 'signup' ? 'on' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            회원가입
          </button>
        </div>

        <button type="button" className="btn btn--secondary btn--lg btn--block auth-google" onClick={google}>
          <GoogleLogo size={18} /> Google로 계속하기
        </button>

        <div className="auth-divider"><span>또는 이메일로</span></div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">이메일</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label className="label">비밀번호</label>
            <input
              className="input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              minLength={6}
              required
            />
          </div>

          {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}
          {info && <div className="alert alert--ok"><Icon name="check" size={16} /> {info}</div>}

          <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> 처리 중…</> : mode === 'signin' ? '로그인' : '회원가입'}
          </button>
        </form>

        <p className="hint center auth-switch">
          {mode === 'signin' ? (
            <>처음이신가요? <button type="button" className="linklike" onClick={() => setMode('signup')}>회원가입</button></>
          ) : (
            <>이미 계정이 있나요? <button type="button" className="linklike" onClick={() => setMode('signin')}>로그인</button></>
          )}
        </p>
      </div>

      <p className="hint center" style={{ marginTop: 16 }}>
        <Link href="/" className="linklike">← 홈으로</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="container container--narrow"><div className="card">불러오는 중…</div></main>}>
      <LoginInner />
    </Suspense>
  );
}
