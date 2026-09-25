'use client';

import { useState } from 'react';
import type { AdminStats } from '@/lib/admin-types';
import { BarList } from '../charts/BarList';
import { Donut } from '../charts/Donut';
import { Funnel } from '../charts/Funnel';
import { Heatmap } from '../charts/Heatmap';
import { AdIcon } from '../icons';
import { Card, CHANNEL_COLOR, Empty, pctText, Segmented, Skeleton } from '../ui';
import { ResponsiveArea } from './Overview';

const METRICS = [
  ['visits', '방문'],
  ['engaged', '참여 방문'],
  ['paid', '결제'],
] as const;
type Metric = (typeof METRICS)[number][0];

const DEVICE_LABEL: Record<string, string> = { mobile: '휴대폰', desktop: 'PC' };
const DEVICE_COLOR = ['#155e4d', '#2f6fdb'];

/** 카톡·인스타 인앱 브라우저는 referrer를 안 보낸다 — 공유 링크에 출처 꼬리표를 붙여야 채널이 잡힌다 */
const SHARE_LINKS = [
  ['카카오톡', 'kakao'],
  ['인스타그램', 'instagram'],
  ['네이버 블로그', 'blog'],
  ['밴드', 'band'],
] as const;

function ShareLinks() {
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <ul className="ad-share">
      {SHARE_LINKS.map(([name, src]) => {
        const url = `https://mypet.taif.kr/?utm_source=${src}`;
        return (
          <li key={src}>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(url).then(() => {
                  setCopied(src);
                  setTimeout(() => setCopied(null), 1500);
                });
              }}
            >
              <span>
                <b>{name}</b> <span className="ad-muted">{url.replace('https://', '')}</span>
              </span>
              <AdIcon name={copied === src ? 'check' : 'copy'} size={14} className={copied === src ? '' : 'ad-muted'} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** 방문 분석 — 추이 · 채널(세부 출처까지) · 결제까지 가는 길 · 많이 누른 것 · 첫 화면 · 나간 화면 · 기기 · 요일×시간 */
export function Analytics({ stats }: { stats: AdminStats | null }) {
  const [metric, setMetric] = useState<Metric>('visits');
  const [openCh, setOpenCh] = useState<string | null>(null);
  if (!stats) {
    return (
      <div className="ad-stack">
        <Skeleton h={380} />
        <div className="ad-row ad-row--7-5">
          <Skeleton h={300} />
          <Skeleton h={300} />
        </div>
      </div>
    );
  }
  const s = stats.series;
  const visits = stats.kpi.visits.cur;
  const direct = stats.channels.find((c) => c.group === '직접')?.visits ?? 0;
  const mostlyDirect = visits >= 5 && direct / visits >= 0.8;
  const deviceTotal = stats.devices.reduce((a, d) => a + d.visits, 0);
  const opened = stats.channels.find((c) => c.group === openCh);

  return (
    <div className="ad-stack">
      <Card title="추이" action={<Segmented label="지표" items={METRICS} value={metric} onChange={setMetric} />}>
        <ResponsiveArea
          unit={metric === 'paid' ? '건' : '회'}
          data={s.map((p) => ({ label: p.label, value: p[metric], prev: metric === 'visits' ? p.prevVisits : null, mark: metric === 'paid' ? 0 : p.paid }))}
        />
      </Card>

      {mostlyDirect ? (
        <Card
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <AdIcon name="link" size={15} /> 유입이 대부분 「직접」으로 잡혀요
            </span>
          }
        >
          <p className="ad-hint" style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ad-t2)' }}>
            카카오톡·인스타그램 안에서 연 링크는 어디서 왔는지 알려 주지 않아요. 공유할 땐 아래 링크를 눌러 복사해 쓰시면 다음부터 채널별로 나뉘어 보여요.
          </p>
          <ShareLinks />
        </Card>
      ) : null}

      <div className="ad-row ad-row--7-5">
        <Card title="유입 채널" action={<span className="ad-card-note">눌러서 세부 출처 보기</span>}>
          <BarList
            total={visits}
            rows={stats.channels.map((c) => ({
              key: c.group,
              label: c.group,
              value: c.visits,
              dot: CHANNEL_COLOR[c.group],
              sub: `참여 ${pctText({ num: c.engaged, den: c.visits })}`,
              active: openCh === c.group,
              onClick: () => setOpenCh(openCh === c.group ? null : c.group),
            }))}
          />
          {opened ? (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ad-border)' }}>
              <p className="ad-box-title">{opened.group}, 세부 출처</p>
              <BarList total={opened.visits} rows={opened.hosts.map((h) => ({ key: h.label, label: h.label, value: h.visits }))} />
            </div>
          ) : null}
        </Card>
        <Card title="채널 비중">
          {stats.channels.length ? (
            <Donut slices={stats.channels.map((c) => ({ key: c.group, label: c.group, value: c.visits, color: CHANNEL_COLOR[c.group] }))} />
          ) : (
            <Empty icon="live" title="아직 방문이 없어요" />
          )}
        </Card>
      </div>

      <div className="ad-row ad-row--7-5">
        <Card title="결제까지 가는 길">
          <Funnel steps={stats.funnel.map((f) => ({ label: f.label, value: f.value }))} />
          <p className="ad-hint" style={{ marginTop: 12 }}>
            앞 네 단계는 방문 기준, 결제창 열기와 결제 완료는 주문 기준이에요. 리포트 만들기는 한 주소 안에서 단계가 바뀌어서 버튼 기록으로 셉니다.
          </p>
        </Card>
        <Card title="많이 누른 것" action={<span className="ad-card-note">한 방문에 한 번씩</span>}>
          {stats.clicks.length ? (
            <BarList total={visits} limit={10} rows={stats.clicks.map((c) => ({ key: c.label, label: c.label, value: c.visits }))} />
          ) : (
            <Empty icon="click" title="아직 누른 기록이 없어요" />
          )}
        </Card>
      </div>

      <div className="ad-row ad-row--7-5">
        <Card title="첫 화면">
          <BarList total={visits} rows={stats.landings.map((l) => ({ key: l.label, label: l.label, value: l.visits }))} />
        </Card>
        <Card title="마지막으로 본 화면">
          <BarList total={visits} rows={stats.exits.map((l) => ({ key: l.label, label: l.label, value: l.visits }))} />
        </Card>
      </div>

      <div className="ad-row ad-row--5-7">
        <Card title="기기">
          {stats.devices.length ? (
            <>
              <div className="ad-devbar">
                {stats.devices.map((d, i) => (
                  <span key={d.device} style={{ width: `${deviceTotal ? (d.visits / deviceTotal) * 100 : 0}%`, background: DEVICE_COLOR[i % 2] }} />
                ))}
              </div>
              <ul className="ad-list" style={{ marginTop: 12 }}>
                {stats.devices.map((d, i) => (
                  <li key={d.device} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="ad-dot" style={{ background: DEVICE_COLOR[i % 2] }} />
                      {DEVICE_LABEL[d.device] ?? d.device}
                    </span>
                    <span className="num ad-muted" style={{ display: 'flex', gap: 12 }}>
                      <span>
                        <b style={{ color: 'var(--ad-t1)' }}>{d.visits}</b>회
                      </span>
                      <span>참여 {pctText({ num: d.engaged, den: d.visits })}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty icon="desktop" title="아직 방문이 없어요" />
          )}
        </Card>
        <Card title="요일 × 시간">
          {stats.heatmap ? <Heatmap grid={stats.heatmap} /> : <Empty icon="grid" title="30일에서 보여요" desc="짧은 기간은 칸이 거의 비어 의미가 없어서 30일에서만 그려요." />}
        </Card>
      </div>
    </div>
  );
}
