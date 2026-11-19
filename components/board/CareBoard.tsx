import type { BoardTile, MeterRow } from '@/lib/care';

/**
 * 「한눈에」 시트 — 품종 페이지 맨 위(2026-11-19 토스식 판). 숫자 여덟 칸(첫 칸 하루 사료만 먹색으로 강조) →
 * 성향 막대(활동량·털 빠짐·짖음·씹는 힘·더위·추위) → 조심할 점 줄. 칸을 누르면 그 칸의 자세한 설명(#food 등)으로 내려간다.
 */

export function CareBoard({ name, tiles, meters, flags }: { name: string; tiles: BoardTile[]; meters: MeterRow[]; flags: { key: string; text: string }[] }) {
  return (
    <section className="sheet glance" aria-label={`${name} 한눈에 보기`}>
      <h2 className="sheet-title">{name} 한눈에</h2>
      <ul className="gl-grid">
        {tiles.map((t) => (
          <li key={t.key}>
            <a href={t.href} className="gl-tile">
              <span className="gl-label">{t.label}</span>
              <b className="gl-value">{t.value}</b>
              <span className="gl-sub">{t.sub}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="gl-meters">
        {meters.map((m) => (
          <div key={m.label} className="gl-meter">
            <span className="gl-m-label">{m.label}</span>
            <span className="gl-bar" role="img" aria-label={`${m.max}단계 중 ${m.value} — ${m.words}`}>
              <i style={{ width: `${(m.value / m.max) * 100}%` }} />
            </span>
            <span className="gl-m-word">{m.words}</span>
          </div>
        ))}
      </div>
      {flags.length ? (
        <ul className="gl-flags" aria-label="조심할 점">
          {flags.map((f) => (
            <li key={f.key}>{f.text}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
