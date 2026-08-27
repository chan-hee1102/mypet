import { createAdminClient } from '@/lib/supabase/admin';
import { prettyPath } from '@/lib/inflow';

/**
 * 관리자 「유입 현황」 — 몇 명이 왔고, 어디서 왔고, 뭘 눌렀고, 어디서 나갔나.
 *
 * ⚠️ 서버 컴포넌트다. visits는 RLS로 잠겨 있어 service_role로만 읽힌다
 *    (브라우저에서 직접 조회할 수 없다 — 그러라고 잠근 것이다).
 *
 * ⚠️ 「개발 환경」 채널은 우리 자신이다(lib/inflow.ts). 지우지 않고 **따로 세어 보여준다** —
 *    조용히 빼면 나중에 '왜 합계가 안 맞지'를 다시 조사하게 된다.
 */

type Visit = {
  visit_key: string;
  started_at: string;
  referrer: string | null;
  channel: string | null;
  landing: string | null;
  exit_path: string | null;
  device: string | null;
  pageviews: number;
  duration_sec: number;
  clicks: { t?: string; p?: string; at?: string }[] | null;
};

const DAYS = 14;

function fmtTime(ts: string): string {
  try {
    return new Date(ts).toLocaleString('ko-KR', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ts; }
}

/** 초 → '3분 12초'. 0이면 '—' (체류를 못 받은 방문이라 0과 구분해 적는다). */
function fmtDur(sec: number): string {
  if (!sec) return '—';
  if (sec < 60) return `${sec}초`;
  return `${Math.floor(sec / 60)}분 ${sec % 60}초`;
}

/** 값별 개수를 많은 순으로. 빈 값은 하나로 모은다. */
function tally(rows: Visit[], pick: (v: Visit) => string | null, empty: string) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = pick(r) || empty;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Table({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="hint">아직 기록이 없어요.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.slice(0, 12).map(([label, n]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: '0 0 42%', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </span>
              {/* 막대는 '비율'만 보여준다 — 눈금 없이 길이만으로 서로 비교하게 */}
              <span aria-hidden style={{ flex: 1, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <span style={{ display: 'block', width: `${total ? (n / total) * 100 : 0}%`, height: '100%', background: '#7c6cf0' }} />
              </span>
              <b style={{ flex: '0 0 44px', textAlign: 'right' }}>{n}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function TrafficPanel() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - DAYS * 24 * 3600_000).toISOString();

  const { data } = await admin
    .from('visits')
    .select('visit_key, started_at, referrer, channel, landing, exit_path, device, pageviews, duration_sec, clicks')
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(500);

  const all = (data ?? []) as Visit[];
  // 우리 발자국은 합계에서 뺀다. 몇 건이었는지는 아래에 따로 적는다.
  const dev = all.filter((v) => v.channel === '개발 환경');
  const rows = all.filter((v) => v.channel !== '개발 환경');

  const todayKst = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const today = rows.filter((v) => new Date(new Date(v.started_at).getTime() + 9 * 3600_000).toISOString().slice(0, 10) === todayKst);

  const mobile = rows.filter((v) => v.device === 'mobile').length;
  const avgSec = rows.length ? Math.round(rows.reduce((n, v) => n + (v.duration_sec || 0), 0) / rows.length) : 0;

  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-head">
          <h2 className="card-title">최근 {DAYS}일</h2>
          <p className="card-desc">
            방문 <b>{rows.length}</b>회 · 오늘 <b>{today.length}</b>회 ·
            모바일 <b>{rows.length ? Math.round((mobile / rows.length) * 100) : 0}%</b> ·
            평균 체류 <b>{fmtDur(avgSec)}</b>
            {dev.length > 0 && <> · <span className="hint">개발 환경 {dev.length}회 제외</span></>}
          </p>
        </div>
      </div>

      <Table title="어디서 왔나 (유입 채널)" rows={tally(rows, (v) => v.channel, '직접 유입')} total={rows.length} />
      <Table title="어느 화면으로 들어왔나" rows={tally(rows, (v) => prettyPath(v.landing), '(알 수 없음)')} total={rows.length} />
      <Table title="어디서 나갔나 (이탈 화면)" rows={tally(rows, (v) => prettyPath(v.exit_path), '(알 수 없음)')} total={rows.length} />

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">최근 방문 30건</h2>
          <p className="card-desc">각 줄을 누르면 그 사람이 무엇을 눌렀는지 순서대로 보여요.</p>
        </div>
        {rows.length === 0 ? (
          <p className="hint">아직 방문 기록이 없어요.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.slice(0, 30).map((v) => {
              const clicks = Array.isArray(v.clicks) ? v.clicks : [];
              return (
                <details key={v.visit_key} style={{ borderTop: '1px solid #eee', paddingTop: 6 }}>
                  <summary style={{ cursor: 'pointer', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
                    <b>{v.channel ?? '직접 유입'}</b>
                    <span>{prettyPath(v.landing)}</span>
                    <span className="hint">
                      {v.device === 'mobile' ? '📱' : '💻'} {v.pageviews}쪽 · {fmtDur(v.duration_sec)} · 클릭 {clicks.length}
                    </span>
                    <span className="hint" style={{ marginLeft: 'auto' }}>{fmtTime(v.started_at)}</span>
                  </summary>
                  <div style={{ padding: '6px 0 4px 12px' }}>
                    {v.referrer && (
                      <p className="hint" style={{ wordBreak: 'break-all' }}>
                        유입 원문: {v.referrer}
                      </p>
                    )}
                    <p className="hint">이탈 화면: {prettyPath(v.exit_path)}</p>
                    {clicks.length === 0 ? (
                      <p className="hint">기록된 클릭이 없어요.</p>
                    ) : (
                      <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                        {clicks.map((c, i) => (
                          <li key={i} style={{ fontSize: 13 }}>
                            {c.t || '(이름 없음)'}
                            {c.p && <span className="hint"> → {prettyPath(c.p)}</span>}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
