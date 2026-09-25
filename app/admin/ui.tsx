'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Channel, InquiryStatus, Order, Ratio } from '@/lib/admin-types';
import { AdIcon, type AdIconName } from './icons';

/* ── 색 ─────────────────────────────────────────────────────── */
export const CHANNEL_COLOR: Record<Channel, string> = {
  검색: 'var(--ch-search)',
  'AI 답변': 'var(--ch-ai)',
  소셜: 'var(--ch-social)',
  직접: 'var(--ch-direct)',
  광고: 'var(--ch-ads)',
  기타: 'var(--ch-etc)',
};

/* ── 글자 ───────────────────────────────────────────────────── */
export function ago(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}초 전`;
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}
export function dur(s: number) {
  if (!s) return '0초';
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}분 ${s % 60}초` : `${Math.floor(m / 60)}시간 ${m % 60}분`;
}
export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
export const pct = (r: Ratio) => (r.den ? (r.num / r.den) * 100 : 0);
export const pctText = (r: Ratio) => (r.den ? `${Math.round(pct(r) * 10) / 10}%` : '—');
export function dateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ── 숫자 카운트업 — 첫 로드·기간 변경 때만. 움직임 줄이기 설정이면 바로 바뀐다 ── */
export function CountUp({ value, format = (n: number) => Math.round(n).toLocaleString('ko-KR') }: { value: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    from.current = value;
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || start === value) {
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 600));
      const e = 1 - Math.pow(1 - p, 4);
      setShown(start + (value - start) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(shown)}</>;
}

/* ── 증감 배지 ──────────────────────────────────────────────
   직전 값이 10 미만이면 %가 크게 흔들리므로 절대값(「+2건」)으로 쓴다. 비교 불가면 「비교 없음」 */
export function Delta({ cur, prev, unit = '', mode = 'count' }: { cur: number; prev: number | null; unit?: string; mode?: 'count' | 'pp' }) {
  if (prev === null) return <span className="ad-muted">비교 없음</span>;
  const diff = cur - prev;
  const flat = Math.abs(diff) < 1e-9;
  let text: string;
  if (mode === 'pp') text = `${diff > 0 ? '+' : ''}${Math.round(diff * 10) / 10}%p`;
  else if (prev < 10) text = `${diff > 0 ? '+' : ''}${diff.toLocaleString('ko-KR')}${unit}`;
  else text = `${diff > 0 ? '+' : ''}${Math.round((diff / prev) * 100)}%`;
  const cls = flat ? 'is-flat' : diff > 0 ? 'is-up' : 'is-down';
  return (
    <span className={`ad-delta ${cls}`}>
      <AdIcon name={flat ? 'flat' : diff > 0 ? 'up' : 'down'} size={12} stroke={2.4} />
      {flat ? '변화 없음' : text}
    </span>
  );
}

/** 비율 — 항상 분수와 같이. 분모가 30 미만이면 「표본 적음」 */
export function RatioText({ r }: { r: Ratio }) {
  const small = r.den < 30;
  return (
    <span className="num">
      <span className="ad-muted">
        {r.num} / {r.den}
      </span>{' '}
      <b style={{ fontWeight: small ? 500 : 600 }}>({pctText(r)})</b>
      {small && r.den > 0 ? <span className="ad-tag">표본 적음</span> : null}
    </span>
  );
}

/* ── 카드 ──────────────────────────────────────────────────── */
export function Card({ title, action, children, flush = false, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; flush?: boolean; className?: string }) {
  return (
    <section className={`ad-card ${flush ? 'ad-card--flush' : ''} ${className}`}>
      {title || action ? (
        <div className="ad-card-head">
          {title ? <h3 className="ad-card-title">{title}</h3> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function KpiCard({ label, value, foot, children, live = false, alert = false }: { label: string; value: ReactNode; foot?: ReactNode; children?: ReactNode; live?: boolean; alert?: boolean }) {
  return (
    <div className={`ad-kpi ${alert ? 'ad-kpi--alert' : ''}`}>
      <p className="ad-kpi-label">
        {live ? <span className="ad-livedot" /> : null}
        {label}
      </p>
      <p className="ad-kpi-value">{value}</p>
      {foot ? <div className="ad-kpi-foot">{foot}</div> : null}
      {children ? <div className="ad-kpi-chart">{children}</div> : null}
    </div>
  );
}

export function Segmented<T extends string | number>({ items, value, onChange, label }: { items: readonly (readonly [T, string])[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="ad-seg" role="radiogroup" aria-label={label}>
      {items.map(([v, text]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={v === value} onClick={() => onChange(v)} className={`ad-seg-btn ${v === value ? 'is-on' : ''}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon, title, desc }: { icon: AdIconName; title: string; desc?: ReactNode }) {
  return (
    <div className="ad-empty">
      <span className="ad-empty-ico">
        <AdIcon name={icon} size={16} />
      </span>
      <p className="ad-empty-title">{title}</p>
      {desc ? <p className="ad-empty-desc">{desc}</p> : null}
    </div>
  );
}

export function Skeleton({ h, className = '' }: { h: number; className?: string }) {
  return <div className={`ad-skel ${className}`} style={{ height: h }} />;
}

/* ── 상태 배지 ──────────────────────────────────────────────── */
export const INQUIRY_LABEL: Record<InquiryStatus, string> = { open: '새 문의', answered: '답장함', closed: '종료' };
export function InquiryBadge({ s }: { s: InquiryStatus }) {
  const tone = s === 'open' ? 'new' : s === 'answered' ? 'info' : 'off';
  return <span className={`ad-status ad-status--${tone}`}>{INQUIRY_LABEL[s]}</span>;
}

/**
 * 주문 상태 — DB 상태와 결제사 기록을 합쳐 사람이 할 일을 기준으로 이름을 붙인다.
 * 「결제됨, 리포트 없음」이 이 화면이 잡아내려는 것이다(2026-07-23 사례).
 */
export type OrderState = { label: string; tone: 'ok' | 'bad' | 'warn' | 'off' | 'info'; problem: boolean };
export function orderState(o: Order): OrderState {
  const pg = o.pg?.status;
  if (o.status === 'done') return o.test ? { label: '테스트', tone: 'off', problem: false } : { label: '완료', tone: 'ok', problem: false };
  if (o.status === 'failed') return { label: '생성 실패', tone: 'bad', problem: true };
  if (o.status === 'paid' || o.status === 'generating') {
    const stale = !o.paidAt || Date.now() - Date.parse(o.paidAt) > 5 * 60_000;
    return stale ? { label: '생성 멈춤', tone: 'bad', problem: true } : { label: '만드는 중', tone: 'info', problem: false };
  }
  // pending — 결제사 기록으로 가른다
  if (pg === 'PAID') return { label: '결제됨, 리포트 없음', tone: 'bad', problem: true };
  if (pg === 'CANCELLED' || pg === 'PARTIAL_CANCELLED') return { label: '결제 취소', tone: 'off', problem: false };
  if (pg === 'FAILED') return { label: '결제 실패', tone: 'off', problem: false };
  if (o.pgReason === 'error') return { label: '결제 확인 안 됨', tone: 'warn', problem: false };
  return { label: '결제 전 이탈', tone: 'off', problem: false };
}
export function OrderBadge({ o }: { o: Order }) {
  const s = orderState(o);
  return <span className={`ad-status ad-status--${s.tone}`}>{s.label}</span>;
}
