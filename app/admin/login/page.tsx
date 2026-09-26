'use client';

import { useState, type FormEvent } from 'react';
import { BrandMark } from '@/components/Brand';
import '../admin.css';

/** 관리자 로그인 — 대시보드와 같은 밝은 카드. 에러는 빨강 */
export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || '로그인하지 못했어요.');
      window.location.href = '/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인하지 못했어요.');
      setBusy(false);
    }
  }

  return (
    <main data-admin className="ad ad-login">
      <form className="ad-login-card" onSubmit={submit}>
        <span className="ad-brand" style={{ padding: 0 }}>
          <span style={{ color: 'var(--ad-ink)', display: 'inline-flex' }}>
            <BrandMark size={24} />
          </span>
          mypet
        </span>
        <h1>관리자</h1>
        <p>주문, 방문 분석, 문의함을 봅니다.</p>
        <label className="ad-field-label" htmlFor="pw" style={{ marginTop: 24 }}>
          비밀번호
        </label>
        <input id="pw" className="ad-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required style={{ height: 44 }} />
        <button className="ad-btn ad-btn--primary ad-btn--block" type="submit" disabled={busy || !password} style={{ marginTop: 20, height: 44, fontSize: 15 }}>
          {busy ? '확인 중' : '들어가기'}
        </button>
        <p className="ad-login-err" aria-live="polite">
          {error}
        </p>
      </form>
    </main>
  );
}
