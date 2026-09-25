'use client';

import { useId } from 'react';
import { linear, monotonePath } from './scale';
import { useWidth } from './useWidth';

/** KPI 카드 아래 작은 추이선 — 축 없이 모양만. 마지막 점으로 「지금」을 표시한다 */
export function Sparkline({ values, color = 'var(--ad-ink)', height = 36 }: { values: number[]; color?: string; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const id = `spark-${useId().replace(/:/g, '')}`;
  const max = Math.max(1, ...values);
  const x = linear(0, Math.max(1, values.length - 1), 2, Math.max(4, w - 4));
  const y = linear(0, max, height - 3, 3);
  const pts = values.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = monotonePath(pts);
  const last = pts[pts.length - 1];
  return (
    <div ref={ref} style={{ height, width: '100%' }} aria-hidden="true">
      {w > 0 && values.length > 1 ? (
        <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.16" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line}L${last[0]},${height}L${pts[0][0]},${height}Z`} fill={`url(#${id})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
        </svg>
      ) : null}
    </div>
  );
}
