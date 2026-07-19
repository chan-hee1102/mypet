'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { friendlyError } from '@/lib/friendlyError';

type Item = { token: string; name: string; date: string; done: boolean };

/** 내 리포트 찾기 — 결제 시 입력한 휴대폰번호 + 다시보기 PIN으로 재조회. */
export default function FindPage() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (phone.replace(/\D/g, '').length < 10) { setError('휴대폰 번호를 입력해 주세요.'); return; }
    if (pin.replace(/\D/g, '').length !== 6) { setError('PIN 숫자 6자리를 입력해 주세요.'); return; }
    setLoading(true);
    setItems(null);
    try {
      const r = await fetch('/api/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || '조회에 실패했어요.');
      setItems(j.items as Item[]);
    } catch (err) {
      setError(friendlyError(err, '조회에 실패했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container container--narrow" style={{ paddingBottom: 40 }}>
      <section className="hero">
        <span className="eyebrow"><Icon name="tag" size={14} /> 결제한 리포트 다시 보기</span>
        <h1>내 리포트 찾기</h1>
        <p className="hero-sub">결제할 때 입력한 <b>휴대폰번호</b>와 <b>다시보기 PIN 6자리</b>를 넣어 주세요.</p>
      </section>

      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label className="label">휴대폰 번호</label>
          <input className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
        </div>
        <div className="field">
          <label className="label">다시보기 PIN</label>
          <input className="input" type="tel" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="숫자 6자리" />
        </div>
        {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}
        <button className="btn btn--primary btn--lg btn--block" disabled={loading}>
          {loading ? '찾는 중…' : '리포트 찾기'}
        </button>
        <p className="hint center" style={{ marginTop: 10 }}>휴대폰번호는 저장돼 있지 않아요 — 입력값이 맞을 때만 결과가 나와요.</p>
      </form>

      {items && items.length === 0 && (
        <div className="card gate" style={{ marginTop: 14 }}>
          <div className="gate-ico"><Icon name="info" size={22} /></div>
          <h2 className="gate-title">일치하는 리포트가 없어요</h2>
          <p className="gate-desc">
            번호나 PIN이 결제 때 입력한 것과 다르면 찾을 수 없어요.<br />
            기억이 안 나면 하단 <b>고객문의</b>로 결제 이메일을 알려주세요 — 확인 후 링크를 보내드려요.
          </p>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-head"><h2 className="card-title">찾은 리포트 {items.length}건</h2></div>
          <div className="find-list">
            {items.map((it) => (
              <Link key={it.token} href={`/r/${it.token}`} className="find-item">
                <span className="find-ico"><Icon name="paw" size={16} filled /></span>
                <span className="find-name">{it.name}</span>
                <span className="find-date">{it.date}</span>
                <span className="find-go">보기 →</span>
              </Link>
            ))}
          </div>
          <p className="hint center" style={{ marginTop: 10 }}>결과 링크는 발급일로부터 60일간 볼 수 있어요.</p>
        </div>
      )}
    </main>
  );
}
