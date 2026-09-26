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
    if (phone.replace(/\D/g, '').length < 10) { setError('휴대폰 번호를 숫자로 적어 주세요.'); return; }
    if (pin.replace(/\D/g, '').length !== 6) { setError('다시 찾기 번호 6자리를 적어 주세요.'); return; }
    setLoading(true);
    setItems(null);
    try {
      const r = await fetch('/api/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || '찾지 못했어요.');
      setItems(j.items as Item[]);
    } catch (err) {
      setError(friendlyError(err, '찾지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <h1>리포트 찾기</h1>
        <p>결제할 때 적은 휴대폰 번호와, 그때 정한 다시 찾기 번호 6자리를 넣어 주세요.</p>
      </div>

      <form className="card" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="find-phone">휴대폰 번호</label>
          <input id="find-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
        </div>
        <div className="field">
          <label className="label" htmlFor="find-pin">다시 찾기 번호</label>
          <input id="find-pin" className="input" type="tel" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="숫자 6자리" autoComplete="off" />
        </div>
        {error && <div className="alert" role="alert"><Icon name="alert" size={16} /> {error}</div>}
        <button className="btn btn--primary btn--lg btn--block" disabled={loading}>
          {loading ? <><span className="spinner" /> 찾는 중</> : '리포트 찾기'}
        </button>
        <p className="hint">휴대폰 번호와 다시 찾기 번호가 모두 맞을 때만 결과가 나와요. 번호를 정하지 않았다면 결제 때 받은 이메일의 링크로 열 수 있어요. 메일이 안 보이면 <a href="/contact" className="linklike">문의하기</a>로 알려 주세요.</p>
      </form>

      {items && items.length === 0 && (
        <div className="card gate" style={{ marginTop: 14 }}>
          <h2 className="gate-title">맞는 리포트가 없어요</h2>
          <p className="gate-desc" style={{ marginBottom: 0 }}>
            휴대폰 번호나 다시 찾기 번호가 결제 때와 다르면 찾을 수 없어요. 기억나지 않으면 아래 고객문의로 결제할 때 적은 이메일을 알려 주세요.
            확인한 뒤 링크를 보내 드려요.
          </p>
        </div>
      )}

      {items && items.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>찾은 리포트 {items.length}건</h2>
          <div className="linklist">
            {items.map((it) => (
              <Link key={it.token} href={`/r/${it.token}`}>
                <b>{it.name} 케어 리포트</b>
                <span className="num">{it.date}{it.done ? '' : ', 아직 완성되지 않음'}</span>
              </Link>
            ))}
          </div>
          <p className="hint">리포트 링크는 발급일로부터 60일 동안 열려요.</p>
        </section>
      )}
    </main>
  );
}
