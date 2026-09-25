'use client';

import { useEffect, useState } from 'react';

export type Slice = { key: string; label: string; value: number; color: string };

/**
 * 도넛 — 가운데 합계, 조각 사이 흰 틈. 범례에 올리면 나머지 조각이 흐려진다.
 * 3% 미만 조각은 「기타」로 합친다(작은 조각은 보이지도 않고 범례만 길게 만든다).
 * 처음 그릴 때 조각이 0에서 제 길이로 자란다(CSS transition — 첫 프레임 뒤에 길이를 넣는다).
 */
export function Donut({ slices, size = 176, thickness = 22, centerLabel = '방문' }: { slices: Slice[]; size?: number; thickness?: number; centerLabel?: string }) {
  const [hot, setHot] = useState<string | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const total = slices.reduce((s, x) => s + x.value, 0);

  const merged: Slice[] = [];
  let small = 0;
  for (const s of slices) {
    if (total && s.value / total < 0.03 && s.key !== '기타') small += s.value;
    else merged.push({ ...s });
  }
  if (small) {
    const etc = merged.find((m) => m.key === '기타');
    if (etc) etc.value += small;
    else merged.push({ key: '기타', label: '기타', value: small, color: 'var(--ch-etc)' });
  }

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = total && merged.filter((m) => m.value > 0).length > 1 ? 2 : 0;
  let acc = 0;

  return (
    <div className="ad-donut">
      <div className="ad-donut-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={merged.map((m) => `${m.label} ${m.value}`).join(', ')}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ad-sunken)" strokeWidth={thickness} />
          {total > 0
            ? merged.map((m) => {
                const len = (m.value / total) * c;
                const dash = Math.max(0, len - gap);
                const offset = -acc;
                acc += len;
                return (
                  <circle
                    key={m.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={m.color}
                    strokeWidth={thickness}
                    strokeDashoffset={offset}
                    strokeDasharray={drawn ? `${dash} ${c - dash}` : `0 ${c}`}
                    opacity={hot && hot !== m.key ? 0.35 : 1}
                  />
                );
              })
            : null}
        </svg>
        <div className="ad-donut-center">
          <b>{hot ? (merged.find((m) => m.key === hot)?.value ?? 0) : total}</b>
          <span>{hot ?? centerLabel}</span>
        </div>
      </div>
      <ul className="ad-legend">
        {merged.map((m) => (
          <li key={m.key}>
            <button type="button" onMouseEnter={() => setHot(m.key)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(m.key)} onBlur={() => setHot(null)}>
              <span className="ad-legend-name">
                <span className="ad-dot" style={{ background: m.color }} />
                <span>{m.label}</span>
              </span>
              <span className="ad-legend-val">
                <b>{m.value}</b>
                <span>{total ? `${Math.round((m.value / total) * 100)}%` : '—'}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
