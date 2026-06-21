'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';

const CATEGORIES = ['결제', '환불', '오류', '제휴', '기타'] as const;

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('기타');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('답변받을 이메일 주소를 정확히 입력해 주세요.');
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
    } catch (err: any) {
      setError(err?.message || '접수에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="container container--narrow">
        <div className="card gate">
          <div className="gate-ico"><Icon name="check" size={24} /></div>
          <h2 className="gate-title">문의가 접수됐어요</h2>
          <p className="gate-desc">
            남겨주신 <b>{email}</b>로 답변드릴게요.<br />
            보통 영업일 기준 1~2일 안에 회신드립니다.
          </p>
          <Link href="/" className="btn btn--primary btn--lg btn--block">
            <Icon name="paw" size={17} filled /> 홈으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow">
      <section className="hero">
        <span className="eyebrow"><Icon name="paw" size={14} filled /> 문의하기</span>
        <h1>도움이 필요하신가요?</h1>
        <p className="hero-sub">
          결제·환불·오류 등 무엇이든 남겨주세요. 답변은 입력하신 이메일로 보내드립니다.
        </p>
      </section>

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label className="label">이름 <span className="opt">선택</span></label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길동" />
        </div>

        <div className="field">
          <label className="label">답변받을 이메일 <span className="req">필수</span></label>
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
          <label className="label">문의 유형</label>
          <div className="seg">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`seg-opt ${category === c ? 'on' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">문의 내용 <span className="req">필수</span></label>
          <textarea
            className="input"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="문의하실 내용을 자세히 적어 주세요. 결제 관련이면 결제 일시·반려동물 이름을 함께 적어주시면 빠릅니다."
          />
        </div>

        {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}

        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> 접수 중…</> : '문의 보내기'}
        </button>

        <p className="hint center" style={{ marginTop: 12 }}>
          또는 이메일로 직접: <a href={`mailto:${SITE.email}`} className="linklike">{SITE.email}</a>
        </p>
      </form>
    </main>
  );
}
