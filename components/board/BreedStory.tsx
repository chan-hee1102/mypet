import Image from 'next/image';
import type { ReactNode } from 'react';
import type { MeterRow, StoryKey, StorySource } from '@/lib/care';
import type { BreedImage } from '@/lib/breedImage';
import { CareIcon, type CareIconName } from './CareIcon';

/**
 * 품종 페이지 순서형 부품(2026-11-19 사장님 「카드가 한곳에 몰려 있고 누르면 빠진다 → 1번 사료, 2번 산책… 설명과 같이 순서대로」).
 *   BreedPhoto — 맨 위 제목 옆 품종 사진 + 사진 아래 작가·라이선스·원본(CC BY·BY-SA 필수 표기)
 *   Step — 번호 + 칸 이름 + 핵심 한 줄(큰 글자)과 쉬운 문장 → 본문(children) → 근거
 *   Profile — 「이런 아이예요」: 핵심 숫자·성향 카드·조심할 점 이름표(옛 「한눈에」 판의 눈금·표시를 옮김)
 */

export function BreedPhoto({ img, name }: { img: BreedImage; name: string }) {
  return (
    <figure className="bp">
      <div className="bp-frame">
        <Image src={img.src} alt={`${name} 사진`} width={img.w} height={img.h} sizes="(max-width: 767px) 100vw, 320px" priority />
      </div>
      <figcaption className="bp-cap">
        사진{' '}
        <a href={img.sourceUrl} target="_blank" rel="noopener">
          {img.author || '위키미디어 공용'}
        </a>
        {', '}
        {img.licenseUrl ? (
          <a href={img.licenseUrl} target="_blank" rel="noopener license">
            {img.license}
          </a>
        ) : (
          img.license
        )}
      </figcaption>
    </figure>
  );
}

export function Step({ n, id, title, icon, tone, keyLine, sources, children }: { n: number; id: string; title: string; icon: CareIconName; tone: string; keyLine?: ReactNode; sources: StorySource[]; children: ReactNode }) {
  return (
    <section id={id} className="sheet step">
      <header className="step-head">
        <span className="step-n" aria-hidden="true">
          {n}
        </span>
        <h2>{title}</h2>
        <span className={`step-ico shop-ico--${tone}`} aria-hidden="true">
          <CareIcon name={icon} size={30} />
        </span>
      </header>
      {keyLine}
      {children}
      <SourceLine items={sources} />
    </section>
  );
}

/** 자세히 보기 — 품종 이야기·사실 목록·관련 표 링크를 접어 둔다. 자바스크립트 없이 <details>(검색엔진도 접힌 글을 읽는다) */
export function More({ children }: { children: ReactNode }) {
  return (
    <details className="step-more">
      <summary>
        <span className="sm-open">자세히 보기</span>
        <span className="sm-close">접기</span>
      </summary>
      <div className="step-more-body">{children}</div>
    </details>
  );
}

/** 핵심 한 줄 — 큰 숫자 + 쉬운 문장(lib/care keyOf) */
export function KeyLine({ k }: { k: StoryKey | null }) {
  if (!k) return null;
  return (
    <div className="step-key">
      <b>{k.value}</b>
      {k.lines.map((t, i) => (
        <p key={i}>{t}</p>
      ))}
    </div>
  );
}

export function SourceLine({ items }: { items: StorySource[] }) {
  if (!items.length) return null;
  return (
    <p className="step-src">
      <span>근거</span>
      {items.map((s, i) => (
        <span key={s.url}>
          {i ? ', ' : ' '}
          <a href={s.url} target="_blank" rel="noopener">
            {s.label}
          </a>
        </span>
      ))}
    </p>
  );
}

/** 「이런 아이예요」 — 핵심 숫자 4칸 → 성향 카드 6개 → 조심할 점 이름표(건강·관리·생활·법). 성격 문장은 자세히 보기(2026-11-19 사장님 「글이 너무 많다, 핵심만 잘 보이게」) */
export type ProfileSpec = { label: string; value: string };
export type ProfileFlag = { key: string; text: string; label: string; group: 'health' | 'care' | 'life' | 'law' };
const GROUP: { key: ProfileFlag['group']; label: string }[] = [
  { key: 'health', label: '건강' },
  { key: 'care', label: '관리' },
  { key: 'life', label: '생활' },
  { key: 'law', label: '법' },
];

export function Profile({ title, specs, meters, flags, traits }: { title: string; specs: ProfileSpec[]; meters: MeterRow[]; flags: ProfileFlag[]; traits: string[] }) {
  return (
    <section className="sheet pf" aria-labelledby="pf-t">
      <h2 id="pf-t" className="sheet-title">
        {title}
      </h2>
      <dl className="pf-specs">
        {specs.map((x) => (
          <div key={x.label} className="pf-spec">
            <dt>{x.label}</dt>
            <dd>{x.value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="pf-h">성향</h3>
      <div className="pf-meters">
        {meters.map((m) => (
          <div key={m.label} className="pf-meter">
            <div className="pf-m-top">
              <span>{m.label}</span>
              <b>{m.words}</b>
            </div>
            <span className="pf-bar" role="img" aria-label={`${m.label} ${m.max}단계 중 ${m.value}, ${m.words}`} style={{ gridTemplateColumns: `repeat(${m.max}, minmax(0, 1fr))` }}>
              {Array.from({ length: m.max }, (_, i) => (
                <i key={i} className={i < m.value ? 'on' : undefined} />
              ))}
            </span>
          </div>
        ))}
      </div>

      {flags.length ? (
        <>
          <h3 className="pf-h">조심할 점</h3>
          <div className="pf-flags">
            {GROUP.filter((g) => flags.some((f) => f.group === g.key)).map((g) => (
              <div key={g.key} className={`pf-group pf-group--${g.key}`}>
                <span className="pf-g-label">{g.label}</span>
                <ul>
                  {flags
                    .filter((f) => f.group === g.key)
                    .map((f) => (
                      <li key={f.key} title={f.text}>
                        {f.label}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {traits.length || flags.length ? (
        <More>
          {traits.length ? (
            <ul className="checks">
              {traits.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : null}
          {flags.length ? (
            <ul className="checks pf-flag-text">
              {flags.map((f) => (
                <li key={f.key}>{f.text}</li>
              ))}
            </ul>
          ) : null}
        </More>
      ) : null}
    </section>
  );
}
