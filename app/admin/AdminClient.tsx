'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/Brand';
import type { AdminLive, AdminStats, Inquiry, InquiryStatus, Order, OrderPg, Range } from '@/lib/admin-types';
import { OWNER_KEY } from '@/lib/owner';
import { AdIcon, type AdIconName } from './icons';
import { ago, orderState, Segmented } from './ui';
import { Analytics } from './views/Analytics';
import { Inbox } from './views/Inbox';
import { Live } from './views/Live';
import { Orders, type OrderAction } from './views/Orders';
import { Overview } from './views/Overview';

/**
 * 관리자 대시보드 — taif.kr/admin과 같은 뼈대(2026-09-26).
 *   데스크탑: 왼쪽 사이드바 232px · 태블릿: 아이콘 레일 64px · 휴대폰: 위 바 + 아래 탭
 * 데이터는 네 갈래로 읽는다.
 *   /stats — 기간 집계. 열 때·기간 바꿀 때·새로고침 때만(폴링 금지 — 대역폭)
 *   /live  — 지금 보는 중. 15초마다, 탭이 뒤로 가 있으면 멈춤
 *   /orders — 주문 + 완성 안 된 최근 주문의 결제사 대조. 열 때·조치 뒤
 *   /inquiries — 문의함. 열 때·상태를 바꾼 뒤
 */
type View = 'overview' | 'orders' | 'analytics' | 'live' | 'inbox';
const VIEWS: { key: View; label: string; icon: AdIconName }[] = [
  { key: 'overview', label: '개요', icon: 'overview' },
  { key: 'orders', label: '주문', icon: 'orders' },
  { key: 'analytics', label: '방문 분석', icon: 'chart' },
  { key: 'live', label: '실시간', icon: 'live' },
  { key: 'inbox', label: '문의함', icon: 'inbox' },
];
const TAB_LABEL: Record<View, string> = { overview: '개요', orders: '주문', analytics: '방문', live: '실시간', inbox: '문의' };
const RANGES = [
  [1, '오늘'],
  [7, '7일'],
  [30, '30일'],
] as const;
const LIVE_MS = 15_000;

export function AdminClient() {
  const [view, setView] = useState<View>('overview');
  const [days, setDays] = useState<Range>(7);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [live, setLive] = useState<AdminLive | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [inq, setInq] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [orderSel, setOrderSel] = useState<string | null>(null);
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
  const loadLive = useCallback(async () => {
    try {
      const body = await guard(await fetch('/api/admin/live', { cache: 'no-store' }));
      if (body) setLive(body as AdminLive);
    } catch {
      /* 다음 턴 */
    }
  }, []);
  const loadOrders = useCallback(async () => {
    try {
      const body = await guard(await fetch('/api/admin/orders', { cache: 'no-store' }));
      if (body) setOrders((body as { items: Order[] }).items);
    } catch {
      setErr('주문을 불러오지 못했어요.');
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
    loadOrders();
    loadInq();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadLive();
    }, LIVE_MS);
    return () => clearInterval(timer);
  }, [loadLive, loadOrders, loadInq]);

  const showToast = (text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const onOrderAction: OrderAction = async (token, action, extra) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action, ...extra }),
      });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return { ok: false, message: '다시 로그인해 주세요.' };
      }
      const j = await res.json().catch(() => ({}));
      if (action === 'check') {
        const pg = (j.pg ?? null) as OrderPg | null;
        setOrders((list) => (list ? list.map((o) => (o.token === token ? { ...o, pg, pgReason: pg ? null : (j.pgReason ?? 'error') } : o)) : list));
        return { ok: true, message: pg ? `결제사 상태를 다시 읽었어요.` : j.pgReason === 'not_found' ? '결제사에 결제 기록이 없어요.' : '결제사 조회가 실패했어요.' };
      }
      if (!res.ok) {
        const reason =
          res.status === 402 ? '결제사에서 결제 완료가 확인되지 않아 만들지 않았어요.' : res.status === 503 ? '결제사 조회가 늦어요. 잠시 뒤 다시 눌러 주세요.' : (j.error ?? '처리하지 못했어요.');
        return { ok: false, message: reason };
      }
      await loadOrders();
      loadStats();
      if (action === 'generate') {
        showToast('리포트를 만들었어요.');
        return { ok: true, message: '리포트를 만들었어요. 받는 메일이 없으면 아래에서 링크를 보내 주세요.' };
      }
      showToast(`${j.to ?? ''}로 링크를 보냈어요.`);
      return { ok: true, message: `${j.to ?? ''}로 링크를 보냈어요.` };
    } catch {
      return { ok: false, message: '연결이 끊겼어요. 다시 눌러 주세요.' };
    }
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
    loadLive();
    loadOrders();
    loadInq();
  };

  const problems = (orders ?? []).filter((o) => orderState(o).problem);
  const openCount = inq.filter((i) => i.status === 'open').length;
  const title = VIEWS.find((v) => v.key === view)?.label ?? '';
  const openOrder = (token: string) => {
    setView('orders');
    setOrderSel(token);
  };
  const openInquiry = (id: string) => {
    setView('inbox');
    setInqSel(id);
  };
  const badgeOf = (v: View) => (v === 'orders' && problems.length ? { n: problems.length, warn: true } : v === 'inbox' && openCount ? { n: openCount, warn: false } : null);

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
              <Overview stats={stats} live={live} orders={orders} problems={problems} inquiries={inq} onOpenOrder={openOrder} onOpenInquiry={openInquiry} goto={setView} />
            ) : null}
            {view === 'analytics' ? <Analytics stats={stats} /> : null}
          </div>
          {view === 'orders' ? <Orders items={orders} selected={orderSel} setSelected={setOrderSel} onAction={onOrderAction} /> : null}
          {view === 'live' ? <Live live={live} /> : null}
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
