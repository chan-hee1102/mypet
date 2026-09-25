'use client';

import { useEffect, useState } from 'react';
import type { AdminLive, AdminStats, Inquiry, Order } from '@/lib/admin-types';
import { AreaChart } from '../charts/AreaChart';
import { Donut } from '../charts/Donut';
import { Sparkline } from '../charts/Sparkline';
import { AdIcon } from '../icons';
import { ago, Card, CHANNEL_COLOR, CountUp, Delta, dur, Empty, InquiryBadge, KpiCard, OrderBadge, pct, RatioText, Skeleton, won } from '../ui';
import { LiveRow } from './Live';

type Goto = (v: 'orders' | 'live' | 'inbox') => void;

/** 개요 — KPI 6개 · 방문 추이 · 유입 채널 · 최근 주문 · 지금 보는 중 · 새 문의 */
export function Overview({
  stats,
  live,
  orders,
  problems,
  inquiries,
  onOpenOrder,
  onOpenInquiry,
  goto,
}: {
  stats: AdminStats | null;
  live: AdminLive | null;
  orders: Order[] | null;
  problems: Order[];
  inquiries: Inquiry[];
  onOpenOrder: (token: string) => void;
  onOpenInquiry: (id: string) => void;
  goto: Goto;
}) {
  if (!stats) return <OverviewSkeleton />;
  const k = stats.kpi;
  const s = stats.series;
  const engagedNow = pct(k.engaged.cur);
  const engagedPrev = k.engaged.prev ? pct(k.engaged.prev) : null;
  const recentOrders = (orders ?? []).filter((o) => o.status === 'done' || o.pg?.status === 'PAID' || o.status !== 'pending').slice(0, 5);
  const recentInq = inquiries.slice(0, 5);

  return (
    <div className="ad-stack">
      {problems.length ? (
        <div className="ad-alert" role="alert">
          <p className="ad-alert-text" style={{ margin: 0 }}>
            <AdIcon name="alert" size={18} />
            <span>
              결제는 됐는데 리포트가 없는 주문이 <b>{problems.length}건</b> 있어요. 주문을 열어 리포트를 만들고 링크를 보내 주세요.
            </span>
          </p>
          <button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={() => (problems.length === 1 ? onOpenOrder(problems[0].token) : goto('orders'))}>
            {problems.length === 1 ? '그 주문 열기' : '주문 보기'}
          </button>
        </div>
      ) : null}

      <div className="ad-kpis ad-kpis--6">
        <KpiCard label="지금 보는 중" live value={live ? live.online.length : '—'} foot={live ? <span>리포트 만들기 화면 {live.online.filter((v) => v.path.startsWith('/diagnose')).length}명</span> : null} />
        <KpiCard label="방문" value={<CountUp value={k.visits.cur} />} foot={<Delta cur={k.visits.cur} prev={k.visits.prev} unit="회" />}>
          <Sparkline values={s.map((p) => p.visits)} />
        </KpiCard>
        <KpiCard
          label="참여율"
          value={<CountUp value={engagedNow} format={(n) => `${Math.round(n)}%`} />}
          foot={
            <>
              <Delta cur={engagedNow} prev={engagedPrev} mode="pp" />
              <span>체류 중앙값 {dur(k.medianSeconds.cur)}</span>
            </>
          }
        >
          <Sparkline values={s.map((p) => (p.visits ? p.engaged / p.visits : 0))} />
        </KpiCard>
        <KpiCard label="무료 가이드 봄" value={<CountUp value={k.guides.cur} />} foot={<Delta cur={k.guides.cur} prev={k.guides.prev} unit="회" />} />
        <KpiCard label="결제 완료" value={<CountUp value={k.paid.cur} format={(n) => `${Math.round(n)}건`} />} foot={<><Delta cur={k.paid.cur} prev={k.paid.prev} unit="건" /><span>결제창 {k.orders.cur}번 열림</span></>}>
          <Sparkline values={s.map((p) => p.paid)} />
        </KpiCard>
        <KpiCard label="매출" value={<CountUp value={k.revenue.cur} format={(n) => won(Math.round(n))} />} foot={<><Delta cur={k.revenue.cur} prev={k.revenue.prev} unit="원" /><span>방문 대비 결제 {k.conversion.den ? `${Math.round((k.conversion.num / k.conversion.den) * 1000) / 10}%` : '—'}</span></>} />
      </div>

      <div className="ad-row ad-row--8-4">
        <Card
          title="방문 추이"
          action={
            <span className="ad-keys">
              <span className="ad-key">
                <span className="ad-key-line" />
                이번
              </span>
              {stats.days !== 30 ? (
                <span className="ad-key">
                  <span className="ad-key-dash" />
                  이전
                </span>
              ) : null}
              <span className="ad-key">
                <span className="ad-key-dot" />
                결제
              </span>
            </span>
          }
        >
          <ResponsiveArea data={s.map((p) => ({ label: p.label, value: p.visits, prev: p.prevVisits, mark: p.paid }))} />
        </Card>
        <Card title="어디서 왔나">
          {stats.channels.length ? (
            <Donut slices={stats.channels.map((c) => ({ key: c.group, label: c.group, value: c.visits, color: CHANNEL_COLOR[c.group] }))} />
          ) : (
            <Empty icon="live" title="아직 방문이 없어요" />
          )}
          <p className="ad-hint" style={{ marginTop: 16 }}>
            방문 대비 결제 <RatioText r={k.conversion} />
          </p>
        </Card>
      </div>

      <div className="ad-row ad-row--8-4">
        <Card flush title="최근 주문" action={<button type="button" className="ad-link" onClick={() => goto('orders')}>주문 전체 보기</button>}>
          {orders === null ? (
            <div style={{ padding: '0 20px 20px' }}>
              <Skeleton h={180} />
            </div>
          ) : recentOrders.length === 0 ? (
            <Empty icon="orders" title="아직 결제된 주문이 없어요" desc="결제가 끝난 주문이 여기 먼저 보여요. 결제창만 열고 나간 주문은 주문 화면에 있어요." />
          ) : (
            <ul className="ad-list">
              {recentOrders.map((o) => (
                <li key={o.token}>
                  <button type="button" className="ad-rowbtn" onClick={() => onOpenOrder(o.token)}>
                    <OrderBadge o={o} />
                    <span style={{ minWidth: 0 }}>
                      <span className="ad-strong">
                        {o.petName} <span className="ad-muted" style={{ fontWeight: 400 }}>{o.breed ?? (o.species === 'cat' ? '고양이' : '강아지')}</span>
                      </span>
                      <span className="ad-sub">{o.email ?? o.pg?.email ?? '이메일 없음'}</span>
                    </span>
                    <span className="ad-time">{ago(o.paidAt ?? o.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card flush title={`지금 보는 중 ${live?.online.length ?? 0}명`} action={<button type="button" className="ad-link" onClick={() => goto('live')}>실시간 보기</button>}>
          {live && live.online.length ? (
            <ul className="ad-list">
              {live.online.slice(0, 5).map((v) => (
                <LiveRow key={v.key} v={v} />
              ))}
            </ul>
          ) : (
            <Empty icon="live" title="지금은 아무도 없어요" desc="누가 들어오면 15초 안에 보여요." />
          )}
        </Card>
      </div>

      <div className="ad-row ad-row--8-4">
        <Card flush title="새 문의" action={<button type="button" className="ad-link" onClick={() => goto('inbox')}>문의함 전체 보기</button>}>
          {recentInq.length === 0 ? (
            <Empty icon="inbox" title="아직 문의가 없어요" desc="문의하기로 들어온 글이 여기 쌓여요." />
          ) : (
            <ul className="ad-list">
              {recentInq.map((q) => (
                <li key={q.id}>
                  <button type="button" className="ad-rowbtn" onClick={() => onOpenInquiry(q.id)}>
                    <InquiryBadge s={q.status} />
                    <span style={{ minWidth: 0 }}>
                      <span className="ad-strong">
                        {q.category ?? '기타'} <span className="ad-muted" style={{ fontWeight: 400 }}>{q.name ?? q.email}</span>
                      </span>
                      <span className="ad-sub">{q.message.slice(0, 80)}</span>
                    </span>
                    <span className="ad-time">{ago(q.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <KnowledgeCard />
      </div>
    </div>
  );
}

/** 넓은 화면은 300px, 휴대폰은 200px */
export function ResponsiveArea(props: Parameters<typeof AreaChart>[0]) {
  return (
    <>
      <div className="ad-only-md">
        <AreaChart {...props} />
      </div>
      <div className="ad-only-sm">
        <AreaChart {...props} height={200} />
      </div>
    </>
  );
}

/** 지식베이스 — 직접 적은 증상에 답할 때 찾는 근거 문단. 품종·가이드 데이터를 바꾼 뒤에만 다시 적재한다 */
function KnowledgeCard() {
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    fetch('/api/admin/knowledge', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setCount(typeof j.count === 'number' ? j.count : null))
      .catch(() => {});
  }, []);
  const run = async () => {
    setBusy(true);
    setMsg('');
    const r = await fetch('/api/admin/knowledge', { method: 'POST' }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (r?.ok) {
      setCount(j.count ?? null);
      setMsg('다시 적재했어요.');
    } else setMsg(j.error ?? '적재하지 못했어요.');
  };
  return (
    <Card title="지식베이스">
      <p className="ad-kpi-value" style={{ marginTop: 0 }}>
        {count === null ? '—' : count.toLocaleString('ko-KR')}
        <small>문단</small>
      </p>
      <p className="ad-hint">직접 적은 증상에 답할 때 찾아보는 근거예요. 품종·가이드 데이터를 고친 뒤에만 다시 적재하면 돼요.</p>
      <button type="button" className="ad-btn ad-btn--secondary ad-btn--block" style={{ marginTop: 14 }} onClick={run} disabled={busy}>
        {busy ? '적재하는 중' : '다시 적재'}
      </button>
      {msg ? <p className="ad-note">{msg}</p> : null}
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="ad-stack">
      <div className="ad-kpis ad-kpis--6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} h={128} />
        ))}
      </div>
      <div className="ad-row ad-row--8-4">
        <Skeleton h={360} />
        <Skeleton h={360} />
      </div>
    </div>
  );
}
