'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Icon } from './icons';
import { SITE } from '@/lib/site';

const CATEGORIES = ['환불', '결제', '오류', '제휴', '기타'] as const;
type Cat = (typeof CATEGORIES)[number];

export default function ContactWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Cat>('기타');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function openWith(c: Cat) {
    setCategory(c);
    setError('');
    setDone(false);
    setOpen(true);
  }

  // ESC로 닫기 + 열렸을 때 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('답변받을 이메일을 정확히 입력해 주세요.');
      return;
    }
    if (message.trim().length < 5) {
      setError('문의 내용을 조금 더 자세히 적어 주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '접수에 실패했어요.');
      setDone(true);
      setName(''); setMessage('');
    } catch (err: any) {
      setError(err?.message || '접수에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="footer-link-btn" onClick={() => openWith('기타')}>고객문의</button>
      <button type="button" className="footer-link-btn" onClick={() => openWith('환불')}>환불 문의</button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="닫기"><Icon name="cross" size={18} /></button>

            {done ? (
              <div style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
                <div className="gate-ico" style={{ margin: '0 auto 10px' }}><Icon name="check" size={22} /></div>
                <h3 className="modal-title">문의가 접수됐어요</h3>
                <p className="hint" style={{ marginTop: 6 }}>{email}로 답변드릴게요 (영업일 1~2일).</p>
                <button className="btn btn--primary btn--block" style={{ marginTop: 14 }} onClick={() => setOpen(false)}>닫기</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3 className="modal-title">{category === '환불' ? '환불 문의' : '고객문의'}</h3>
                <p className="hint" style={{ marginBottom: 12 }}>답변은 입력하신 이메일로 보내드려요.</p>

                <div className="field">
                  <label className="label">문의 유형</label>
                  <div className="seg seg--wrap">
                    {CATEGORIES.map((c) => (
                      <button key={c} type="button" className={`seg-opt ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>{c}</button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="label">이름 <span className="opt">선택</span></label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길동" />
                </div>
                <div className="field">
                  <label className="label">답변받을 이메일 <span className="req">필수</span></label>
                  <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="field">
                  <label className="label">내용 <span className="req">필수</span></label>
                  <textarea
                    className="input"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={category === '환불'
                      ? '환불 사유와 결제 일시·반려동물 이름을 적어주시면 빠릅니다.'
                      : '문의하실 내용을 자세히 적어 주세요.'}
                  />
                </div>

                {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}

                <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> 접수 중…</> : '문의 보내기'}
                </button>
                <p className="hint center" style={{ marginTop: 10 }}>
                  또는 이메일: <a href={`mailto:${SITE.email}`} className="linklike">{SITE.email}</a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
