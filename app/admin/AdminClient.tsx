'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/Brand';
import type { AdminBots, AdminLive, AdminShop, AdminStats, Inquiry, InquiryStatus, PeopleDay, Range } from '@/lib/admin-types';
import { OWNER_KEY } from '@/lib/owner';
import { AdIcon, type AdIconName } from './icons';
import { ago, Segmented } from './ui';
import { Analytics } from './views/Analytics';
import { Bots } from './views/Bots';
import { Inbox } from './views/Inbox';
import { Overview } from './views/Overview';
import { Presence } from './views/Presence';
import { Shop } from './views/Shop';

/**
 * 관리자 대시보드 — taif.kr/admin과 같은 뼈대(2026-09-26).
 * 2026-11-19 메뉴를 KOSTOCK 관리자 순서로: 실시간 접속 · 유입 현황 · 봇 수집 · 쿠팡 링크 · 문의 · 요약(옛 개요).
 *   같은 날 2,900원 리포트를 걷어내며 「주문」 탭은 「쿠팡 링크」(준비물 카드별 링크·클릭)로 바뀌었다.
 *   사장님 「하루 150명 넘게 오는 것 같은데 진짜 사람인지 봇인지」 — 숫자는 사람만, 봇은 「봇 수집」에(lib/visitor.ts).
 *   데스크탑: 왼쪽 사이드바 232px · 태블릿: 아이콘 레일 64px · 휴대폰: 위 바 + 아래 탭
 * 데이터는 네 갈래로 읽는다.
 *   /stats — 기간 집계. 열 때·기간 바꿀 때·새로고침 때만(폴링 금지 — 대역폭)
 *   /live  — 지금 접속·오늘 방문(사람·봇 판정 포함). 15초마다, 탭이 뒤로 가 있으면 멈춤. 7일 집계는 1분에 한 번(?week=1)
 *   /bots  — 봇 수집 14일. 그 탭을 열 때·새로고침 때만
 *   /shop  — 쿠팡 카드별 링크·붙는 품종·14일 클릭. 그 탭을 열 때·새로고침 때만
 *   /inquiries — 문의함. 열 때·상태를 바꾼 뒤
 */
type View = 'presence' | 'analytics' | 'bots' | 'shop' | 'inbox' | 'overview';
const VIEWS: { key: View; label: string; icon: AdIconName }[] = [
  { key: 'presence', label: '실시간 접속', icon: 'live' },
  { key: 'analytics', label: '유입 현황', icon: 'chart' },
  { key: 'bots', label: '봇 수집', icon: 'bot' },
  { key: 'shop', label: '쿠팡 링크', icon: 'link' },
  { key: 'inbox', label: '문의함', icon: 'inbox' },
  { key: 'overview', label: '요약', icon: 'overview' },
];
const TAB_LABEL: Record<View, string> = { presence: '실시간', analytics: '유입', bots: '봇', shop: '쿠팡', inbox: '문의', overview: '요약' };
const RANGES = [
  [1, '오늘'],
  [7, '7일'],
  [30, '30일'],
] as const;
const LIVE_MS = 15_000;

export function AdminClient() {
  const [view, setView] = useState<View>('presence');
  const [days, setDays] = useState<Range>(7);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [live, setLive] = useState<AdminLive | null>(null);
  const [week, setWeek] = useState<PeopleDay[] | null>(null);
  const [bots, setBots] = useState<AdminBots | null>(null);
  const liveTurn = useRef(0);
  const [shop, setShop] = useState<AdminShop | null>(null);
  const [inq, setInq] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [inqSel, setInqSel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 이 브라우저는 운영자 기기 — 공개 페이지를 봐도 방문 통계에 넣지 않는다(lib/owner.ts)
  useEffect(() => {
    try {
      localStorage.setItem(OWNER_KEY, '1');
    } catch {
      /* 저장소 차단 */
    }
  }, []);

  const guard = async (res: Response) => {
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return null;
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((body as { error?: string }).error ?? '불러오지 못했어요.');
      return null;
    }
    setErr('');
    return body;
  };

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const body = await guard(await fetch(`/api/admin/stats?days=${days}`, { cache: 'no-store' }));
      if (body) setStats(body as AdminStats);
    } catch {
      setErr('통계를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [days]);
  const loadLive = useCallback(async (forceWeek = false) => {
    // 7일 집계는 처음과 1분에 한 번(15초 × 4) — 7일치 행을 15초마다 읽지 않게
    const withWeek = forceWeek || liveTurn.current % 4 === 0;
    liveTurn.current += 1;
    try {
      const body = await guard(await fetch(`/api/admin/live${withWeek ? '?week=1' : ''}`, { cache: 'no-store' }));
      if (body) {
        const l = body as AdminLive;
        setLive(l);
        if (l.week) setWeek(l.week);
      }
    } catch {
      /* 다음 턴 */
    }
  }, []);
  const loadBots = useCallback(async () => {
    try {
      const body = await guard(await fetch('/api/admin/bots', { cache: 'no-store' }));
      if (body) setBots(body as AdminBots);
    } catch {
      setErr('봇 기록을 불러오지 못했어요.');
    }
  }, []);
  const loadShop = useCallback(async () => {
    try {
      const body = await guard(await fetch('/api/admin/shop', { cache: 'no-store' }));
      if (body) setShop(body as AdminShop);
    } catch {
      setErr('쿠팡 링크 현황을 불러오지 못했어요.');
    }
  }, []);
  const loadInq = useCallback(async () => {
    try {
      const body = await guard(await fetch('/api/admin/inquiries', { cache: 'no-store' }));
      if (body) setInq((body as { items: Inquiry[] }).items);
    } catch {
      /* 문의함은 다음 새로고침에 */
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    loadLive();
    loadInq();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadLive();
    }, LIVE_MS);
    return () => clearInterval(timer);
  }, [loadLive, loadInq]);

  const showToast = (text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const onInquiryStatus = async (id: string, status: InquiryStatus) => {
    setInq((list) => list.map((i) => (i.id === id ? { ...i, status } : i)));
    const res = await fetch('/api/admin/inquiries', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }).catch(() => null);
    if (!res?.ok) {
      showToast('상태를 바꾸지 못했어요.');
      loadInq();
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/admin/login';
  };
  const refresh = () => {
    loadStats();
    loadLive(true);
    loadInq();
    if (view === 'bots') loadBots();
    if (view === 'shop') loadShop();
  };
  useEffect(() => {
    if (view === 'bots' && !bots) loadBots();
    if (view === 'shop' && !shop) loadShop();
  }, [view, bots, loadBots, shop, loadShop]);

  const openCount = inq.filter((i) => i.status === 'open').length;
  const title = VIEWS.find((v) => v.key === view)?.label ?? '';
  const openInquiry = (id: string) => {
    setView('inbox');
    setInqSel(id);
  };
  const badgeOf = (v: View) => (v === 'inbox' && openCount ? { n: openCount, warn: false } : null);

  return (
    <div data-admin className="ad">
      {/* 사이드바(데스크탑) · 레일(태블릿) */}
      <aside className="ad-side">
        <a href="/admin" className="ad-brand" aria-label="mypet 관리자">
          <span style={{ color: 'var(--ad-ink)', display: 'inline-flex' }}>
            <BrandMark size={24} />
          </span>
          <span className="ad-brand-name">mypet</span>
          <span className="ad-brand-sub">관리자</span>
        </a>
        <nav className="ad-nav" aria-label="관리자 메뉴">
          {VIEWS.map((v) => {
            const b = badgeOf(v.key);
            return (
              <button key={v.key} type="button" title={v.label} aria-current={view === v.key ? 'page' : undefined} className={`ad-nav-item ${view === v.key ? 'is-on' : ''}`} onClick={() => setView(v.key)}>
                <AdIcon name={v.icon} />
                <span className="ad-nav-label">{v.label}</span>
                {b ? <span className={`ad-badge ${b.warn ? 'ad-badge--warn' : ''}`}>{b.n}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="ad-side-foot">
          <a href="/" target="_blank" rel="noopener" className="ad-side-link" title="사이트 보기">
            <AdIcon name="external" size={16} />
            <span>사이트 보기</span>
          </a>
          <button type="button" onClick={logout} className="ad-side-link" title="나가기">
            <AdIcon name="logout" size={16} />
            <span>나가기</span>
          </button>
        </div>
      </aside>

      {/* 휴대폰 위 바 */}
      <header className="ad-top">
        <span className="ad-top-title">
          <span style={{ color: 'var(--ad-ink)', display: 'inline-flex' }}>
            <BrandMark size={22} />
          </span>
          {title}
        </span>
        <span className="ad-top-actions">
          <button type="button" className="ad-iconbtn" onClick={refresh} aria-label="새로고침">
            <AdIcon name="refresh" size={16} className={loading ? 'ad-spin' : ''} />
          </button>
          <button type="button" className="ad-iconbtn" onClick={logout} aria-label="나가기">
            <AdIcon name="logout" size={16} />
          </button>
        </span>
      </header>

      <main className="ad-main">
        <div className="ad-wrap">
          <div className="ad-head">
            <h1 className="ad-h1">{title}</h1>
            {view === 'overview' || view === 'analytics' ? (
              <div className="ad-head-tools">
                <Segmented label="기간" items={RANGES} value={days} onChange={setDays} />
                <button type="button" className="ad-refresh" onClick={refresh}>
                  <AdIcon name="refresh" size={14} className={loading ? 'ad-spin' : ''} />
                  {stats ? `갱신 ${ago(stats.generatedAt)}` : '불러오는 중'}
                </button>
              </div>
            ) : (
              <button type="button" className="ad-refresh" onClick={refresh} style={{ marginLeft: 'auto' }}>
                <AdIcon name="refresh" size={14} /> 새로고침
              </button>
            )}
          </div>

          {err ? <p className="ad-err">{err}</p> : null}

          {/* 기간을 바꾸는 동안엔 스켈레톤 대신 흐리게 — 화면이 튀지 않게 */}
          <div className={`ad-dim ${loading && stats ? 'is-loading' : ''}`}>
            {view === 'overview' ? (
              <Overview stats={stats} live={live} inquiries={inq} onOpenInquiry={openInquiry} goto={setView} />
            ) : null}
            {view === 'analytics' ? <Analytics stats={stats} /> : null}
          </div>
          {view === 'shop' ? <Shop data={shop} /> : null}
          {view === 'presence' ? <Presence live={live} week={week} shopToday={stats?.days === 1 ? stats.kpi.shop.cur : null} /> : null}
          {view === 'bots' ? <Bots data={bots} /> : null}
          {view === 'inbox' ? <Inbox items={inq} selectedId={inqSel} setSelectedId={setInqSel} onStatus={onInquiryStatus} /> : null}
        </div>
      </main>

      {/* 휴대폰 아래 탭 */}
      <nav className="ad-tabs" aria-label="관리자 메뉴">
        {VIEWS.map((v) => {
          const b = badgeOf(v.key);
          return (
            <button key={v.key} type="button" aria-current={view === v.key ? 'page' : undefined} className={`ad-tab ${view === v.key ? 'is-on' : ''}`} onClick={() => setView(v.key)}>
              <span className="ad-tab-ico">
                <AdIcon name={v.icon} size={20} stroke={view === v.key ? 2.1 : 1.8} />
                {b ? <span className={`ad-badge ${b.warn ? 'ad-badge--warn' : ''}`}>{b.n}</span> : null}
              </span>
              {TAB_LABEL[v.key]}
            </button>
          );
        })}
      </nav>

      {toast ? (
        <div className="ad-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
