'use client';

import { useEffect, useRef } from 'react';
import type { AdminLive, LiveVisit } from '@/lib/admin-types';
import { AdIcon } from '../icons';
import { ago, Card, CHANNEL_COLOR, dur, Empty, KpiCard, Skeleton } from '../ui';

/** 방문 한 줄 — 새로 나타난 줄은 한 번 옅게 빛난다. wide는 실시간 화면용 5칸 */
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

/** 실시간 — 지금 보는 중(마지막 신호 90초 안) · 최근 24시간 방문. 15초마다 */
export function Live({ live }: { live: AdminLive | null }) {
  if (!live) {
    return (
      <div className="ad-stack">
        <div className="ad-kpis">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} h={110} />
          ))}
        </div>
        <Skeleton h={320} />
      </div>
    );
  }
  const inFlow = live.online.filter((v) => v.path.startsWith('/diagnose')).length;
  const mobile = live.online.filter((v) => v.device === 'mobile').length;
  return (
    <div className="ad-stack">
      <div className="ad-kpis">
        <KpiCard label="지금 보는 중" live value={live.online.length} foot="마지막 신호 90초 안" />
        <KpiCard label="리포트 만들기 화면" value={inFlow} foot="결제까지 갈 수 있는 사람" />
        <KpiCard label="휴대폰" value={mobile} foot={`PC ${live.online.length - mobile}`} />
      </div>
      <Card flush title="지금 보는 중" action={<span className="ad-card-note">15초마다 갱신, {ago(live.generatedAt)}</span>}>
        {live.online.length ? (
          <ul className="ad-list">
            {live.online.map((v) => (
              <LiveRow key={v.key} v={v} wide />
            ))}
          </ul>
        ) : (
          <Empty icon="live" title="지금은 아무도 없어요" desc="누가 들어오면 15초 안에 여기 나타나요." />
        )}
      </Card>
      <Card flush title="최근 24시간 방문">
        {live.recent.length ? (
          <ul className="ad-list">
            {live.recent.map((v) => (
              <LiveRow key={v.key} v={v} wide online={false} />
            ))}
          </ul>
        ) : (
          <Empty icon="live" title="최근 24시간 방문이 없어요" />
        )}
      </Card>
    </div>
  );
}
