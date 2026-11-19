'use client';

import type { AdminLive, AdminStats, Inquiry } from '@/lib/admin-types';
import { AreaChart } from '../charts/AreaChart';
import { Donut } from '../charts/Donut';
import { Sparkline } from '../charts/Sparkline';
import { ago, Card, CHANNEL_COLOR, CountUp, Delta, dur, Empty, InquiryBadge, KpiCard, pct, RatioText, Skeleton } from '../ui';
import { SLOTS } from '@/lib/shop';
import { isPerson } from '@/lib/visitor';
import { LiveRow } from './Live';

type Goto = (v: 'shop' | 'presence' | 'inbox') => void;

/** 요약 — KPI 6개 · 방문 추이 · 유입 채널 · 많이 누른 쿠팡 카드 · 지금 보는 중 · 새 문의(2026-11-19 결제·주문을 걷어냄) */
export function Overview({
  stats,
  live,
  inquiries,
  onOpenInquiry,
  goto,
}: {
  stats: AdminStats | null;
  live: AdminLive | null;
  inquiries: Inquiry[];
  onOpenInquiry: (id: string) => void;
  goto: Goto;
}) {
  if (!stats) return <OverviewSkeleton />;
  // 사람만(2026-11-19) — 봇은 「봇 수집」 탭
  const onlinePeople = (live?.online ?? []).filter((v) => isPerson(v.kind));
  const k = stats.kpi;
  const s = stats.series;
  const engagedNow = pct(k.engaged.cur);
  const engagedPrev = k.engaged.prev ? pct(k.engaged.prev) : null;
  const recentInq = inquiries.slice(0, 5);

  return (
    <div className="ad-stack">
      <div className="ad-kpis ad-kpis--6">
        <KpiCard label="지금 보는 중" live value={live ? onlinePeople.length : '—'} foot={live ? <span>품종 안내판 {onlinePeople.filter((v) => v.path.startsWith('/breed/')).length}명</span> : null} />
        <KpiCard label="사람 방문" value={<CountUp value={k.visits.cur} />} foot={<Delta cur={k.visits.cur} prev={k.visits.prev} unit="회" />}>
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
        <KpiCard label="품종 안내판 봄" value={<CountUp value={k.boards.cur} />} foot={<Delta cur={k.boards.cur} prev={k.boards.prev} unit="회" />} />
        <KpiCard label="쿠팡으로 넘어감" value={<CountUp value={k.shop.cur} format={(n) => `${Math.round(n)}회`} />} foot={<><Delta cur={k.shop.cur} prev={k.shop.prev} unit="회" /><span>카드 {k.shopClicks.cur}번 누름</span></>}>
          <Sparkline values={s.map((p) => p.shop)} />
        </KpiCard>
        <KpiCard label="넘어간 비율" value={k.shopRate.den ? `${Math.round((k.shopRate.num / k.shopRate.den) * 1000) / 10}%` : '—'} foot={<span>사람 방문 중 쿠팡 카드를 누른 방문</span>} />
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
                쿠팡
              </span>
            </span>
          }
        >
          <ResponsiveArea data={s.map((p) => ({ label: p.label, value: p.visits, prev: p.prevVisits, mark: p.shop }))} />
        </Card>
        <Card title="어디서 왔나">
          {stats.channels.length ? (
            <Donut slices={stats.channels.map((c) => ({ key: c.group, label: c.group, value: c.visits, color: CHANNEL_COLOR[c.group] }))} />
          ) : (
            <Empty icon="live" title="아직 방문이 없어요" />
          )}
          <p className="ad-hint" style={{ marginTop: 16 }}>
            방문 대비 쿠팡 이동 <RatioText r={k.shopRate} />
          </p>
        </Card>
      </div>

      <div className="ad-row ad-row--8-4">
        <Card flush title="많이 누른 쿠팡 카드" action={<button type="button" className="ad-link" onClick={() => goto('shop')}>쿠팡 링크 보기</button>}>
          {stats.shopTop.length === 0 ? (
            <Empty icon="link" title="아직 누른 카드가 없어요" desc="쿠팡 링크를 넣은 카드가 사이트에 보이면 여기 쌓여요." />
          ) : (
            <ul className="ad-list">
              {stats.shopTop.slice(0, 6).map((t) => (
                <li key={t.id} className="ad-shop-row">
                  <span className="ad-strong">{SLOTS.find((x) => x.id === t.id)?.title ?? t.id}</span>
                  <span className="ad-time">{t.visits}회</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card flush title={`지금 보는 중 ${onlinePeople.length}명`} action={<button type="button" className="ad-link" onClick={() => goto('presence')}>실시간 보기</button>}>
          {onlinePeople.length ? (
            <ul className="ad-list">
              {onlinePeople.slice(0, 5).map((v) => (
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
