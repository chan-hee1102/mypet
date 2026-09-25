'use client';

import type { ReactNode } from 'react';

export type BarRow = {
  key: string;
  label: ReactNode;
  value: number;
  /** 값 옆 보조 표시 */
  sub?: ReactNode;
  /** 라벨 앞 점 색 */
  dot?: string;
  onClick?: () => void;
  active?: boolean;
};

/**
 * 가로 막대 목록 — 라벨 뒤에 옅은 막대가 깔린다.
 * 막대 길이는 첫 행(최댓값) 대비, 오른쪽 %는 합계 대비 비중.
 */
export function BarList({ rows, total, limit = 8, empty = '아직 기록이 없어요' }: { rows: BarRow[]; total?: number; limit?: number; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const sum = total ?? rows.reduce((s, r) => s + r.value, 0);
  if (rows.length === 0) return <p className="ad-empty-desc" style={{ textAlign: 'center', padding: '24px 0', margin: 0 }}>{empty}</p>;
  return (
    <ul className="ad-bars">
      {rows.slice(0, limit).map((r, i) => {
        const inner = (
          <>
            <span className="ad-bar-fill" aria-hidden="true" style={{ width: `${(r.value / max) * 100}%`, animationDelay: `${i * 30}ms` }} />
            <span className="ad-bar-label">
              {r.dot ? <span className="ad-dot" style={{ background: r.dot }} /> : null}
              <span>{r.label}</span>
            </span>
            <span className="ad-bar-val">
              {r.sub ? <span className="ad-bar-sub">{r.sub}</span> : null}
              <b>{r.value}</b>
              <span className="ad-bar-pct">{sum ? `${Math.round((r.value / sum) * 100)}%` : '—'}</span>
            </span>
          </>
        );
        return (
          <li key={r.key}>
            {r.onClick ? (
              <button type="button" onClick={r.onClick} aria-pressed={!!r.active} className={`ad-bar ${r.active ? 'is-on' : ''}`}>
                {inner}
              </button>
            ) : (
              <div className="ad-bar">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
