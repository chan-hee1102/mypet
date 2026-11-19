'use client';

import type { AdminBots } from '@/lib/admin-types';
import { KIND_LABEL } from '@/lib/visitor';
import { BarList } from '../charts/BarList';
import { Card, KpiCard, Skeleton } from '../ui';

/*
 * 봇 수집 — KOSTOCK 관리자 「봇 수집」 탭과 같은 자리(2026-11-19). 방문 통계에서 빼는 것이 무엇이고 무엇을 읽어 갔나.
 *   검색봇·AI봇·미리보기봇 = 브라우저가 스스로 봇이라고 밝힌 것(네이버 Yeti·구글봇·ChatGPT…)
 *   자동 브라우저 = 자동 조종(webdriver)·헤드리스·위장 크롬(UA와 클라이언트 힌트가 어긋남)·너무 낡은 크롬
 *   봇 의심 = 이름은 숨겼지만 행동이 봇(PC · 5초 안 · 화면을 안 만짐 · 닫힘 신호 없음, 해외 시간대)
 * 막지는 않는다 — 검색봇을 막으면 검색 유입이 끊긴다. 통계에서만 뺀다.
 */

const COLORS = { search: '#2f6fdb', ai: '#155e4d', preview: '#c9567f', auto: '#6d5fd3', suspect: '#e9b26a' } as const;
type Seg = keyof typeof COLORS;
const SEGS: Seg[] = ['search', 'ai', 'preview', 'auto', 'suspect'];
/** 스스로 이름을 밝힌 봇(네이버·ChatGPT…)은 이름이 짧고 뜻이 있다. 자동 브라우저·봇 의심은 이유가 길어서 칸 제목엔 종류만 */
const named = (k: string) => k === 'search' || k === 'ai' || k === 'preview';

export function Bots({ data }: { data: AdminBots | null }) {
  if (!data) {
    return (
      <div className="ad-stack">
        <div className="ad-kpis ad-kpis--4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} h={110} />
          ))}
        </div>
        <Skeleton h={240} />
      </div>
    );
  }
  const sum = (k: Seg | 'people') => data.days.reduce((s, d) => s + d[k], 0);
  const bots = SEGS.reduce((s, k) => s + sum(k), 0);
  const people = sum('people');
  const top = data.names[0];
  const max = Math.max(1, ...data.days.map((d) => SEGS.reduce((s, k) => s + d[k], 0) + d.people));

  return (
    <div className="ad-stack">
      <div className="ad-kpis ad-kpis--4">
        <KpiCard label="14일 봇·봇 의심" value={`${bots.toLocaleString('ko-KR')}회`} foot={<span>하루 {Math.round(bots / data.days.length)}회</span>} />
        <KpiCard label="같은 기간 사람" value={`${people.toLocaleString('ko-KR')}회`} foot={<span>하루 {Math.round(people / data.days.length)}회</span>} />
        <KpiCard label="봇 비율" value={`${people + bots ? Math.round((bots / (people + bots)) * 100) : 0}%`} foot={<span>기록된 방문 중</span>} />
        <KpiCard label="가장 많이 온 것" value={top ? (named(top.kind) ? top.name : KIND_LABEL[top.kind]) : '—'} foot={<span>{top ? `${named(top.kind) ? KIND_LABEL[top.kind] : top.name} · ${top.visits.toLocaleString('ko-KR')}회` : ''}</span>} />
      </div>

      <Card
        title="날짜별"
        action={
          <span className="ad-keys">
            {SEGS.map((k) => (
              <span key={k} className="ad-key">
                <span className="ad-key-sq" style={{ background: COLORS[k] }} />
                {KIND_LABEL[k]}
              </span>
            ))}
            <span className="ad-key">
              <span className="ad-key-line" />
              사람
            </span>
          </span>
        }
      >
        <div className="ad-week ad-week--bots">
          {data.days.map((d, i) => {
            const [, m, dd] = d.day.split('-');
            // 14칸이라 휴대폰에선 「11/6」이 서로 겹친다 — 첫 칸과 1일만 월을 붙인다
            const label = i === 0 || dd === '01' ? `${Number(m)}/${Number(dd)}` : String(Number(dd));
            const b = SEGS.reduce((s, k) => s + d[k], 0);
            return (
              <div key={d.day} className="ad-week-col" title={`${d.day} — ${SEGS.map((k) => `${KIND_LABEL[k]} ${d[k]}`).join(' · ')} · 사람 ${d.people}`}>
                <span className="ad-week-num">{b}</span>
                <div className="ad-week-bar">
                  {SEGS.map((k) => (
                    <span key={k} className="ad-week-seg" style={{ height: `${(d[k] / max) * 100}%`, background: COLORS[k] }} />
                  ))}
                  <span className="ad-week-people" style={{ bottom: `${(d.people / max) * 100}%` }} />
                </div>
                <span className="ad-week-day">{label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="ad-row ad-row--7-5">
        <Card title="누가 왔나">
          <BarList
            rows={data.names.map((n) => ({
              key: `${n.kind}|${n.name}`,
              label: n.kind === 'suspect' ? `봇 의심 — ${n.name}` : n.kind === 'auto' ? `자동 브라우저 — ${n.name}` : `${KIND_LABEL[n.kind]} · ${n.name}`,
              value: n.visits,
              dot: COLORS[n.kind as Seg] ?? '#999',
            }))}
            limit={12}
          />
        </Card>
        <Card title="무엇을 읽어 갔나(첫 화면)">
          <BarList rows={data.pages.map((p) => ({ key: p.path, label: p.path, value: p.visits }))} limit={12} />
        </Card>
      </div>
      <Card title="브라우저">
        <BarList rows={data.browsers.map((b) => ({ key: b.name, label: b.name, value: b.visits }))} limit={10} empty="11-19 이후 기록부터 보여요" />
      </Card>
    </div>
  );
}
