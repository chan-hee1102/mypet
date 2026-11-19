import type { BoardTile, MeterRow } from '@/lib/care';

/**
 * 「한눈에」 안내판 — 품종 페이지 맨 위 먹색 판(2026-11-19). 공원 안내판처럼 숫자 여덟 칸이 한 장에 모인다.
 * 칸을 누르면 그 칸의 자세한 설명(#food 등)으로 내려간다. 아래 줄은 성향 눈금(●○)과 조심할 점.
 */

export function CareBoard({ name, tiles, meters, flags }: { name: string; tiles: BoardTile[]; meters: MeterRow[]; flags: { key: string; text: string }[] }) {
  return (
    <section className="board" aria-label={`${name} 한눈에 보기`}>
      <div className="board-head">
        <span className="board-pin" aria-hidden="true" />
        <h2>{name} 한눈에</h2>
      </div>
      <ul className="board-grid">
        {tiles.map((t) => (
          <li key={t.key}>
            <a href={t.href} className="board-tile">
              <span className="board-label">{t.label}</span>
              <b className="board-value">{t.value}</b>
              <span className="board-sub">{t.sub}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="board-foot">
        <dl className="meters">
          {meters.map((m) => (
            <div key={m.label} className="meter">
              <dt>{m.label}</dt>
              <dd>
                <span className="meter-dots" role="img" aria-label={`${m.max}칸 중 ${m.value}칸 — ${m.words}`}>
                  {Array.from({ length: m.max }, (_, i) => (
                    <i key={i} className={i < m.value ? 'on' : ''} />
                  ))}
                </span>
                <span className="meter-word">{m.words}</span>
              </dd>
            </div>
          ))}
        </dl>
        {flags.length ? (
          <ul className="board-flags" aria-label="조심할 점">
            {flags.map((f) => (
              <li key={f.key}>{f.text}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
