'use client';

import { useEffect, useRef } from 'react';
import type { LiveVisit } from '@/lib/admin-types';
import { AdIcon } from '../icons';
import { ago, CHANNEL_COLOR, dur } from '../ui';

/** 방문 한 줄(요약 화면) — 새로 나타난 줄은 한 번 옅게 빛난다. 실시간 접속 화면은 views/Presence의 PersonRow */
export function LiveRow({ v, wide = false, online = true }: { v: LiveVisit; wide?: boolean; online?: boolean }) {
  const first = useRef(true);
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      ref.current?.classList.add('is-new');
    }
  }, []);
  return (
    <li ref={ref} className={`ad-live ${wide ? 'ad-live--wide' : ''}`}>
      <span className={`ad-livedot ${online ? '' : 'ad-livedot--idle'}`} />
      <span className="ad-live-path">
        <AdIcon name={v.device === 'mobile' ? 'phone' : 'desktop'} size={14} />
        <span>{v.path}</span>
      </span>
      {wide ? (
        <>
          <span className="ad-live-src">
            <span className="ad-dot" style={{ background: CHANNEL_COLOR[v.channel] }} />
            <span>
              {v.source}
              {v.lastClick ? `, 마지막 클릭 「${v.lastClick}」` : ''}
            </span>
          </span>
          <span className="ad-live-meta ad-live-dur">
            {dur(v.seconds)}, {v.pageviews}쪽
          </span>
          <span className="ad-live-meta ad-live-time">
            {ago(v.atIso)}
          </span>
        </>
      ) : (
        <>
          <span className="ad-live-meta">{dur(v.seconds)}</span>
          <span className="ad-live-src">
            <span className="ad-dot" style={{ background: CHANNEL_COLOR[v.channel], width: 6, height: 6 }} />
            <span>{v.source}</span>
          </span>
        </>
      )}
    </li>
  );
}
