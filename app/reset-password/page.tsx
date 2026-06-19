'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/icons';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  // 복구 링크를 타고 오면 세션이 생긴다 → 새 비밀번호 설정 모드.
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setHasSession(!!data.user));
  }, [supabase]);

  async function sendResetEmail(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setInfo('재설정 링크를 이메일로 보냈어요. 메일의 링크를 눌러 새 비밀번호를 설정하세요.');
    } catch (err: any) {
      setError(err?.message || '메일 발송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function setNewPassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setInfo('비밀번호가 변경됐어요. 홈으로 이동합니다.');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || '변경에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  if (hasSession === null) {
    return <main className="container container--narrow"><div className="card">불러오는 중…</div></main>;
  }

  return (
    <main className="container container--narrow">
      <section className="hero">
        <span className="eyebrow"><Icon name="lock" size={14} /> 비밀번호</span>
        <h1>{hasSession ? '새 비밀번호 설정' : '비밀번호 재설정'}</h1>
        <p className="hero-sub">
          {hasSession ? '새로 사용할 비밀번호를 입력하세요.' : '가입한 이메일로 재설정 링크를 보내드려요.'}
        </p>
      </section>

      <div className="card">
        {hasSession ? (
          <form onSubmit={setNewPassword}>
            <div className="field">
              <label className="label">새 비밀번호</label>
              <input className="input" type="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상" minLength={6} required />
            </div>
            <div className="field">
              <label className="label">새 비밀번호 확인</label>
              <input className="input" type="password" autoComplete="new-password" value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="다시 입력" minLength={6} required />
            </div>
            {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}
            {info && <div className="alert alert--ok"><Icon name="check" size={16} /> {info}</div>}
            <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> 처리 중…</> : '비밀번호 변경'}
            </button>
          </form>
        ) : (
          <form onSubmit={sendResetEmail}>
            <div className="field">
              <label className="label">이메일</label>
              <input className="input" type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}
            {info && <div className="alert alert--ok"><Icon name="check" size={16} /> {info}</div>}
            <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> 보내는 중…</> : '재설정 링크 받기'}
            </button>
          </form>
        )}

        <p className="hint center auth-switch">
          <Link href="/login" className="linklike">← 로그인으로</Link>
        </p>
      </div>
    </main>
  );
}
