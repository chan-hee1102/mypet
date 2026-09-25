'use client';

import { useEffect, useId, useState } from 'react';
import { linear, monotonePath, niceMax, shortNum, ticksOf } from './scale';
import { useWidth } from './useWidth';

export type AreaPoint = {
  label: string;
  value: number;
  prev?: number | null;
  /** 이 칸의 사건(결제 완료) 수 — 0보다 크면 선 위에 점 */
  mark?: number;
};

/**
 * 영역 차트 — 이번 기간(실선+옅은 면)과 직전 기간(회색 점선)을 겹친다.
 * 마우스를 올리면 세로 보조선·점·툴팁, 휴대폰은 누른 칸에 고정된다.
 * 선은 왼쪽부터 가림막을 걷어 그린다. 가림막 폭은 JS로 늘린다 — clipPath 안 사각형의 CSS 애니메이션은
 * 크롬이 중간 프레임에서 다시 그리지 않아 선이 반쯤 잘린 채 멈췄다(2026-09-26 캡처).
 */
export function AreaChart({ data, height = 300, unit = '회', markLabel = '결제' }: { data: AreaPoint[]; height?: number; unit?: string; markLabel?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, '');
  const [reveal, setReveal] = useState(0);
  const drawKey = data.map((d) => d.value).join(',');
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReveal(1);
      return;
    }
    setReveal(0);
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 800));
      setReveal(1 - Math.pow(1 - p, 4));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [drawKey]);

  const pad = { t: 12, r: 12, b: 28, l: 36 };
  const iw = Math.max(0, w - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const hasPrev = data.some((d) => d.prev !== null && d.prev !== undefined);
  const max = niceMax(Math.max(1, ...data.map((d) => Math.max(d.value, d.prev ?? 0))));
  const x = linear(0, Math.max(1, data.length - 1), pad.l, pad.l + iw);
  const y = linear(0, max, pad.t + ih, pad.t);
  const cur: [number, number][] = data.map((d, i) => [x(i), y(d.value)]);
  const prev: [number, number][] = hasPrev ? data.map((d, i) => [x(i), y(d.prev ?? 0)]) : [];
  const line = monotonePath(cur);
  const area = cur.length > 1 ? `${line}L${cur[cur.length - 1][0]},${pad.t + ih}L${cur[0][0]},${pad.t + ih}Z` : '';
  const every = Math.max(1, Math.ceil(data.length / 7));
  const h = hover !== null ? data[hover] : null;

  const pick = (clientX: number, rect: DOMRect) => {
    if (!data.length) return;
    const i = Math.round(((clientX - rect.left - pad.l) / Math.max(1, iw)) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  return (
    <div ref={ref} className="ad-chart" style={{ height }}>
      {w > 0 ? (
        <svg
          width={w}
          height={height}
          onMouseMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setHover(null)}
          onTouchStart={(e) => pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          role="img"
          aria-label={`추이 ${data.length}칸, 최댓값 ${Math.max(0, ...data.map((d) => d.value))}${unit}`}
        >
          <defs>
            <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#155e4d" stopOpacity="0.16" />
              <stop offset="1" stopColor="#155e4d" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`reveal-${gid}`}>
              <rect x={0} y={0} width={w * reveal} height={height} />
            </clipPath>
          </defs>

          {ticksOf(max).map((tk) => (
            <g key={tk}>
              <line x1={pad.l} x2={pad.l + iw} y1={y(tk)} y2={y(tk)} stroke="var(--ad-grid)" strokeWidth={1} />
              <text x={pad.l - 8} y={y(tk)} dy="0.32em" textAnchor="end" className="ad-axis">
                {shortNum(tk)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % every === 0 || i === data.length - 1 ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="ad-axis">
                {d.label}
              </text>
            ) : null,
          )}

          <g clipPath={`url(#reveal-${gid})`}>
            {hasPrev ? <path d={monotonePath(prev)} fill="none" stroke="var(--ch-prev)" strokeWidth={1.5} strokeDasharray="4 4" /> : null}
            {area ? <path d={area} fill={`url(#fill-${gid})`} /> : null}
            <path d={line} fill="none" stroke="var(--ad-ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {data.map((d, i) => (d.mark ? <circle key={i} cx={x(i)} cy={y(d.value)} r={4.5} fill="#fff" stroke="var(--ad-ink)" strokeWidth={2} /> : null))}
          </g>

          {h && hover !== null ? (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--ad-border2)" strokeWidth={1} />
              {hasPrev && h.prev !== null && h.prev !== undefined ? <circle cx={x(hover)} cy={y(h.prev)} r={3.5} fill="#fff" stroke="var(--ch-prev)" strokeWidth={2} /> : null}
              <circle cx={x(hover)} cy={y(h.value)} r={4} fill="var(--ad-ink)" stroke="#fff" strokeWidth={2} />
            </g>
          ) : null}
        </svg>
      ) : null}

      {h && hover !== null && w > 0 ? (
        <div className="ad-tip" style={x(hover) > w - 170 ? { right: w - x(hover) + 12 } : { left: x(hover) + 12 }}>
          <p className="ad-tip-title">{h.label}</p>
          <p className="ad-tip-row">
            <span className="ad-key">
              <span className="ad-dot" style={{ background: 'var(--ad-ink)' }} />
              이번
            </span>
            <b>
              {h.value}
              {unit}
            </b>
          </p>
          {hasPrev && h.prev !== null && h.prev !== undefined ? (
            <p className="ad-tip-row">
              <span className="ad-key">
                <span className="ad-key-dash" />
                이전
              </span>
              <span className="num">
                {h.prev}
                {unit}
              </span>
            </p>
          ) : null}
          {h.mark ? (
            <p className="ad-tip-mark">
              {markLabel} {h.mark}건
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
