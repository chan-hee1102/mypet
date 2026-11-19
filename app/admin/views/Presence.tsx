'use client';

import { useState } from 'react';
import type { AdminLive, LiveVisit, PeopleDay } from '@/lib/admin-types';
import { isPerson, KIND_LABEL } from '@/lib/visitor';
import { AdIcon } from '../icons';
import { Card, CHANNEL_COLOR, dur, Empty, KpiCard, Skeleton } from '../ui';

/*
 * 실시간 접속 — KOSTOCK 관리자 「실시간 접속」과 같은 읽는 순서(2026-11-19 사장님 「코스톡처럼, 진짜 사람인지 봇인지」):
 *   오늘 다녀간 사람 → 최근 7일(사람 · 봇 · 봇 의심) → 지금 접속 중 → 오늘 다녀간 사람 목록.
 * 숫자는 전부 「사람」(사람 + 사람 추정)이다. 봇·봇 의심은 「봇도 보기」를 켜야 목록에 나오고, 자세한 건 「봇 수집」 탭.
 * 판정과 이유는 줄마다(lib/visitor.ts kindOf) — 「화면을 만졌어요」「PC · 5초 안 · 닫힘 신호 없음」「검색봇 · 네이버」.
 */

const KST = 9 * 3_600_000;
const kstDay = (ms: number) => new Date(ms + KST).toISOString().slice(0, 10);
const hm = (iso: string) => new Date(Date.parse(iso) + KST).toISOString().slice(11, 16);

/** 판정 알약 — 사람은 초록, 사람 추정은 옅은 초록, 봇은 회색, 봇 의심은 주황 */
export function KindChip({ v }: { v: Pick<LiveVisit, 'kind' | 'why'> }) {
  const tone = v.kind === 'human' ? 'ok' : v.kind === 'likely' ? 'new' : v.kind === 'suspect' ? 'warn' : 'off';
  const label = v.kind === 'search' || v.kind === 'ai' || v.kind === 'preview' ? `${KIND_LABEL[v.kind]} · ${v.why}` : KIND_LABEL[v.kind];
  return (
    <span className={`ad-status ad-status--${tone === 'new' ? 'info' : tone}`} title={v.why}>
      {label}
    </span>
  );
}

function PersonRow({ v, online }: { v: LiveVisit; online: boolean }) {
  const bot = !isPerson(v.kind);
  return (
    <li className={`ad-live ad-live--who ${bot ? 'is-bot' : ''}`}>
      <span className={`ad-livedot ${online ? '' : 'ad-livedot--idle'}`} />
      <span className="ad-live-path">
        <AdIcon name={v.device === 'mobile' ? 'phone' : 'desktop'} size={14} />
        <span>{v.path}</span>
      </span>
      <span className="ad-live-meta">{online ? `${dur(v.seconds)}째` : hm(v.startIso)}</span>
      <span className="ad-live-src">
        <KindChip v={v} />
        <span className="ad-dot" style={{ background: CHANNEL_COLOR[v.channel] }} />
        <span>
          {v.source}
          {v.browser ? ` · ${v.browser}` : ''}
          {` · ${dur(v.seconds)}, ${v.pageviews}쪽`}
          {v.clicks ? ` · ${v.clicks}번 누름` : ''}
          {v.kind !== 'search' && v.kind !== 'ai' && v.kind !== 'preview' ? ` · ${v.why}` : ''}
        </span>
      </span>
    </li>
  );
}

/** 최근 7일 — 날짜마다 사람(진초록) · 봇(회색) · 봇 의심(주황) 쌓은 막대 */
function WeekBars({ week }: { week: PeopleDay[] }) {
  const max = Math.max(1, ...week.map((d) => d.people + d.bots + d.suspect));
  const today = kstDay(Date.now());
  return (
    <div className="ad-week" role="img" aria-label={`최근 7일 사람 ${week.map((d) => d.people).join(', ')}명`}>
      {week.map((d) => {
        const total = d.people + d.bots + d.suspect;
        const h = (n: number) => `${(n / max) * 100}%`;
        const [, m, dd] = d.day.split('-');
        return (
          <div key={d.day} className={`ad-week-col ${d.day === today ? 'is-today' : ''}`} title={`${d.day} — 사람 ${d.people} · 봇 ${d.bots} · 봇 의심 ${d.suspect}`}>
            <span className="ad-week-num">{d.people}</span>
            <div className="ad-week-bar">
              <span className="ad-week-seg is-suspect" style={{ height: h(d.suspect) }} />
              <span className="ad-week-seg is-bot" style={{ height: h(d.bots) }} />
              <span className="ad-week-seg is-people" style={{ height: h(d.people) }} />
            </div>
            <span className="ad-week-day">
              {Number(m)}/{Number(dd)}
            </span>
            <span className="ad-week-sub">{total ? `봇 ${d.bots + d.suspect}` : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

const PAGE = 40;

export function Presence({ live, week, shopToday }: { live: AdminLive | null; week: PeopleDay[] | null; shopToday: number | null }) {
  const [showBots, setShowBots] = useState(false);
  const [more, setMore] = useState(PAGE);
  if (!live) {
    return (
      <div className="ad-stack">
        <div className="ad-kpis ad-kpis--4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} h={110} />
          ))}
        </div>
        <Skeleton h={220} />
        <Skeleton h={320} />
      </div>
    );
  }
  const people = live.today.filter((v) => isPerson(v.kind));
  const botsToday = live.today.length - people.length;
  const onlinePeople = live.online.filter((v) => isPerson(v.kind));
  const onlineShown = showBots ? live.online : onlinePeople;
  const todayShown = showBots ? live.today : people;
  // 오늘 쿠팡으로 넘어간 방문 — 오늘 목록의 사람 중 「쿠팡:」 카드를 누른 방문(서버가 준 오늘 통계가 있으면 그걸 쓴다)
  const shopNow = shopToday ?? people.filter((v) => v.lastClick?.startsWith('쿠팡:')).length;
  const ratio = live.today.length ? Math.round((people.length / live.today.length) * 100) : 0;

  const toggle = (
    <label className="ad-switch">
      <input type="checkbox" checked={showBots} onChange={(e) => setShowBots(e.target.checked)} />
      <span>봇도 보기</span>
    </label>
  );

  return (
    <div className="ad-stack">
      <div className="ad-kpis ad-kpis--4">
        <KpiCard label="오늘 다녀간 사람" value={people.length} foot={<span>봇·봇 의심 {botsToday}회는 뺐어요</span>} />
        <KpiCard label="지금 접속" live value={onlinePeople.length} foot={<span>봇 {live.online.length - onlinePeople.length} 따로 · 90초 안 신호</span>} />
        <KpiCard label="오늘 쿠팡 이동" value={`${shopNow}회`} foot={<span>준비물 카드를 누른 방문</span>} />
        <KpiCard label="사람 비율" value={`${ratio}%`} foot={<span>오늘 기록 {live.today.length}회 중</span>} />
      </div>

      <Card
        title="최근 7일"
        action={
          <span className="ad-keys">
            <span className="ad-key">
              <span className="ad-key-sq is-people" />
              사람
            </span>
            <span className="ad-key">
              <span className="ad-key-sq is-bot" />
              봇
            </span>
            <span className="ad-key">
              <span className="ad-key-sq is-suspect" />
              봇 의심
            </span>
          </span>
        }
      >
        {week ? <WeekBars week={week} /> : <Skeleton h={180} />}
      </Card>

      <Card flush title={`지금 접속 중 ${onlinePeople.length}명`} action={toggle}>
        {onlineShown.length ? (
          <ul className="ad-list">
            {onlineShown.map((v) => (
              <PersonRow key={v.key} v={v} online />
            ))}
          </ul>
        ) : (
          <Empty icon="live" title="지금은 아무도 없어요" desc={live.online.length ? `봇 ${live.online.length}개만 있어요. 「봇도 보기」를 켜면 보여요.` : '누가 들어오면 15초 안에 여기 나타나요.'} />
        )}
      </Card>

      <Card flush title={`오늘 다녀간 사람 ${people.length}명`} action={toggle}>
        {todayShown.length ? (
          <>
            <ul className="ad-list">
              {todayShown.slice(0, more).map((v) => (
                <PersonRow key={v.key} v={v} online={false} />
              ))}
            </ul>
            {todayShown.length > more ? (
              <button type="button" className="ad-more" onClick={() => setMore((n) => n + PAGE)}>
                {todayShown.length - more}개 더 보기
              </button>
            ) : null}
          </>
        ) : (
          <Empty icon="people" title="오늘은 아직 사람이 없어요" desc={botsToday ? `봇·봇 의심 ${botsToday}회만 왔어요.` : undefined} />
        )}
      </Card>
    </div>
  );
}
