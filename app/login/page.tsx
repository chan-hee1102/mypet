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

/** 오픈 리다이렉트 방지: 단일 슬래시로 시작하는 내부 경로만 허용. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}

/** URL의 error 파라미터(예: 콜백 실패)를 한국어 메시지로. */
function oauthErrorKo(code: string | null): string {
  if (!code) return '';
  if (code === 'auth') return '로그인 처리에 실패했어요. 다시 시도해 주세요.';
  return '로그인 중 오류가 발생했어요. 다시 시도해 주세요.';
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [supabase] = useState(() => createClient());

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const isSignup = mode === 'signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(oauthErrorKo(params.get('error')));
  const [info, setInfo] = useState('');

  function switchMode(m: 'signin' | 'signup') {
    setMode(m);
    setError('');
    setInfo('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (isSignup) {
      if (password.length < 6) {
        setError('비밀번호는 6자 이상이어야 해요.');
        return;
      }
      if (password !== passwordConfirm) {
        setError('비밀번호가 일치하지 않아요.');
        return;
      }
      if (!name.trim()) {
        setError('이름을 입력해 주세요.');
        return;
      }
      const y = Number(birthYear);
      const mo = Number(birthMonth);
      if (!y || y < 1900 || y > 2026 || !mo || mo < 1 || mo > 12) {
        setError('태어난 년도(예: 1990)와 월(1~12)을 올바르게 입력해 주세요.');
        return;
      }
      // 만 14세 미만 가입 차단 (개인정보보호법 제22조의2)
      if (2026 - y < 14) {
        setError('만 14세 이상만 가입할 수 있어요.');
        return;
      }
    }

    setLoading(true);
    try {
      if (!isSignup) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else {
        const birth = `${birthYear}-${String(Number(birthMonth)).padStart(2, '0')}`; // "YYYY-MM"
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim(), birth } },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          // 이메일 인증이 켜져 있는 경우
          setInfo('확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.');
          switchMode('signin');
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
        <h1>{isSignup ? '환영해요' : '다시 오셨네요'}</h1>
        <p className="hero-sub">로그인하고 우리 아이의 케어 기록을 저장·관리하세요.</p>
      </section>

      <div className="card">
        <div className="seg auth-tabs">
          <button type="button" className={`seg-opt ${!isSignup ? 'on' : ''}`} onClick={() => switchMode('signin')}>
            로그인
          </button>
          <button type="button" className={`seg-opt ${isSignup ? 'on' : ''}`} onClick={() => switchMode('signup')}>
            회원가입
          </button>
        </div>

        <form onSubmit={submit}>
          {isSignup && (
            <>
              <div className="field">
                <label className="label">이름</label>
                <input
                  className="input"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동"
                  required
                />
              </div>

              <div className="field">
                <label className="label">태어난 시기</label>
                <div className="row2">
                  <input
                    className="input"
                    type="number"
                    inputMode="numeric"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="년도 (예: 1990)"
                    min={1900}
                    max={2026}
                    required
                  />
                  <input
                    className="input"
                    type="number"
                    inputMode="numeric"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    placeholder="월 (1~12)"
                    min={1}
                    max={12}
                    required
                  />
                </div>
              </div>
            </>
          )}

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
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              minLength={6}
              required
            />
          </div>

          {isSignup && (
            <div className="field">
              <label className="label">비밀번호 확인</label>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력"
                minLength={6}
                required
              />
              {passwordConfirm.length > 0 && password !== passwordConfirm && (
                <p className="hint" style={{ color: 'var(--danger)' }}>비밀번호가 일치하지 않아요.</p>
              )}
            </div>
          )}

          {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}
          {info && <div className="alert alert--ok"><Icon name="check" size={16} /> {info}</div>}

          <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> 처리 중…</> : isSignup ? '회원가입' : '로그인'}
          </button>
        </form>

        <div className="auth-divider"><span>또는</span></div>

        <button type="button" className="btn btn--secondary btn--lg btn--block auth-google" onClick={google}>
          <GoogleLogo size={18} /> Google로 계속하기
        </button>

        <p className="hint center auth-switch">
          {isSignup ? (
            <>이미 계정이 있나요? <button type="button" className="linklike" onClick={() => switchMode('signin')}>로그인</button></>
          ) : (
            <>처음이신가요? <button type="button" className="linklike" onClick={() => switchMode('signup')}>회원가입</button></>
          )}
        </p>
        {!isSignup && (
          <p className="hint center" style={{ marginTop: 4 }}>
            <Link href="/reset-password" className="linklike">비밀번호를 잊으셨나요?</Link>
          </p>
        )}
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
