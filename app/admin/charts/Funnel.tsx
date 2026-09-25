'use client';

/** 단계 색 — 진할수록 앞 단계. 가장 옅은 단계도 흰 바탕 대비 2:1 이상 */
const STEP_COLORS = ['#0d4639', '#155e4d', '#1f7360', '#2e8872', '#4a9c86', '#6db09c'];

/**
 * 가로 퍼널 — 막대 폭은 첫 단계 대비, 단계 사이에 「앞 단계의 몇 %가 넘어왔나」.
 * 표본이 작으면 %가 크게 흔들리므로 수를 항상 같이 적는다.
 */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="ad-funnel">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const rate = prev ? Math.round((s.value / prev) * 1000) / 10 : null;
        return (
          <li key={s.label}>
            {i > 0 ? <p className="ad-funnel-rate">↓ {rate === null ? '—' : `${rate}%`}</p> : null}
            <div className="ad-funnel-row">
              <span className="ad-funnel-label">{s.label}</span>
              <div className="ad-funnel-track">
                <div
                  className="ad-funnel-fill"
                  style={{ background: STEP_COLORS[Math.min(i, STEP_COLORS.length - 1)], width: `${Math.max(s.value ? 2 : 0, (s.value / top) * 100)}%`, animationDelay: `${i * 60}ms` }}
                />
              </div>
              <span className="ad-funnel-val">{s.value}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
