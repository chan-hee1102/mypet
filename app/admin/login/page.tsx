'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '로그인에 실패했습니다.');
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || '로그인에 실패했습니다.');
      setLoading(false);
    }
  }

  return (
    <main className="container container--narrow">
      <section className="hero">
        <span className="eyebrow"><Icon name="lock" size={14} /> 관리자</span>
        <h1>관리자 로그인</h1>
        <p className="hero-sub">문의·환불 문의를 확인하려면 비밀번호를 입력하세요.</p>
      </section>
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label className="label">비밀번호</label>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
            autoFocus
            required
          />
        </div>
        {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}
        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> 확인 중…</> : '로그인'}
        </button>
      </form>
    </main>
  );
}
