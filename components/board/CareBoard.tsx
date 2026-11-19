import type { BoardTile, MeterRow } from '@/lib/care';
import { CareIcon, type CareIconName } from './CareIcon';

/**
 * 「한눈에」 시트 — 품종 페이지 맨 위(188종 공통). 첫 화면 미리 보기는 2026-11-19에 뺐다(길어져서 — 첫 화면은 품종 찾기가 일).
 * 2026-11-19 가독성 개편(사장님 「가시성·가독성 뛰어나게」 → 「하나씩 자세하게」):
 *   여덟 줄 — 줄마다 아이콘(아래 칸 머리와 같은 색: #food 연두·#walk 연두·#grooming 분홍·#potty 모래·#health 빨강) + 이름 + 큰 값 +
 *     풀어 쓴 문장(lib/care boardOf detail — 같은 데이터로만 만든다). 하루 사료 줄만 연두 바탕. 컴퓨터 두 줄, 휴대폰 한 줄
 *   성향 — 이어진 막대 대신 5칸(더위·추위는 3칸) 눈금, 말(보통·많은 편)은 진하게
 *   조심할 점 — 작은 제목 + 옅은 주황 줄
 * 줄을 누르면 그 칸의 자세한 설명·준비물(#food 등)로 내려간다.
 */

type Species = 'dog' | 'cat';
const ICON: Record<string, (sp: Species) => CareIconName> = {
  food: () => 'bowl',
  meals: () => 'can',
  walk: (sp) => (sp === 'cat' ? 'wand' : 'leash'),
  brush: () => 'brush',
  trim: () => 'clipper',
  bath: () => 'bottle',
  potty: (sp) => (sp === 'cat' ? 'litter' : 'pad'),
  size: () => 'paw',
};
const secOf = (href: string) => href.split('#')[1] ?? 'food';

export function CareBoard({ name, species = 'dog', tiles, meters, flags }: { name: string; species?: Species; tiles: BoardTile[]; meters: MeterRow[]; flags: { key: string; text: string }[] }) {
  return (
    <section className="sheet glance" aria-label={`${name} 한눈에 보기`}>
      <h2 className="sheet-title">{name} 한눈에</h2>
      <ul className="gl-list">
        {tiles.map((t) => (
          <li key={t.key}>
            <a href={t.href} className={`gl-row shop-ico--${secOf(t.href)}${t.key === 'food' ? ' gl-row--key' : ''}`}>
              <span className="gl-ico">
                <CareIcon name={(ICON[t.key] ?? (() => 'paw'))(species)} size={28} />
              </span>
              <span className="gl-body">
                <span className="gl-label">{t.label}</span>
                <b className="gl-value">{t.value}</b>
                <span className="gl-detail">{t.detail}</span>
              </span>
              <span className="gl-go" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="gl-part">
        <h3 className="gl-h">성향</h3>
        <div className="gl-meters">
          {meters.map((m) => (
            <div key={m.label} className="gl-meter">
              <span className="gl-m-label">{m.label}</span>
              <span className="gl-steps" role="img" aria-label={`${m.max}단계 중 ${m.value} — ${m.words}`} style={{ gridTemplateColumns: `repeat(${m.max}, minmax(0, 1fr))` }}>
                {Array.from({ length: m.max }, (_, i) => (
                  <i key={i} className={i < m.value ? 'on' : undefined} />
                ))}
              </span>
              <b className="gl-m-word">{m.words}</b>
            </div>
          ))}
        </div>
      </div>

      {flags.length ? (
        <div className="gl-part">
          <h3 className="gl-h">조심할 점</h3>
          <ul className="gl-flags">
            {flags.map((f) => (
              <li key={f.key}>{f.text}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
