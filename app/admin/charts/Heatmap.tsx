'use client';

import { useState } from 'react';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const SHADES = ['#eef1ef', '#cfe6dc', '#9fcdb9', '#62a88f', '#2f8069', '#155e4d'];

/**
 * 요일×시간 히트맵(KST, 2시간 단위 12칸) — 정사각 칸.
 * 12칸이라 375px 휴대폰에서도 가로로 넘치지 않는다.
 */
export function Heatmap({ grid }: { grid: number[][] }) {
  const [hot, setHot] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(1, ...grid.flat());
  const shade = (v: number) => (v === 0 ? SHADES[0] : SHADES[Math.min(SHADES.length - 1, 1 + Math.floor((v / max) * (SHADES.length - 1.001)))]);
  return (
    <div>
      <div className="ad-heat">
        <span />
        {Array.from({ length: 12 }, (_, h) => (
          <span key={h} className="ad-heat-h">
            {h % 3 === 0 ? h * 2 : ''}
          </span>
        ))}
        {grid.map((row, d) => [
          <span key={`l${d}`} className="ad-heat-d">
            {DAYS[d]}
          </span>,
          ...row.map((v, h) => (
            <button
              key={`${d}-${h}`}
              type="button"
              aria-label={`${DAYS[d]}요일 ${h * 2}~${h * 2 + 2}시 ${v}회`}
              onMouseEnter={() => setHot({ d, h })}
              onMouseLeave={() => setHot(null)}
              onClick={() => setHot({ d, h })}
              className={`ad-heat-cell ${hot?.d === d && hot?.h === h ? 'is-on' : ''}`}
              style={{ background: shade(v) }}
            />
          )),
        ])}
      </div>
      <div className="ad-heat-foot">
        <span className="num">{hot ? `${DAYS[hot.d]}요일 ${hot.h * 2}~${hot.h * 2 + 2}시, ${grid[hot.d][hot.h]}회` : '칸에 올리면 숫자가 보여요'}</span>
        <span className="ad-heat-scale">
          적음
          {SHADES.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
          많음
        </span>
      </div>
    </div>
  );
}
