'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import WeightRuler from './WeightRuler';
import { SITE } from '@/lib/site';
import type { Species } from '@/lib/types';

export type { HeroSample } from '@/lib/sample';
import type { HeroSample } from '@/lib/sample';

const TONE_TAG: Record<string, string> = { ok: 'tag--ok', warn: 'tag--warn', info: 'tag--info' };

/*
  첫 화면 — 이 페이지에서 유일하게 힘을 준 곳.
  보호자가 이름을 적으면 오른쪽 기록지의 이름이 바로 바뀌고, 강아지·고양이를 바꾸면
  예시 기록이 다시 채워진다. 「이런 게 나온다」를 설명하는 대신 직접 보여준다.
  ⚠️ 기록지의 값은 예시다(포메라니안 3살 3.4kg 등). 그 사실을 기록지 아래에 적어 둔다.
  ⚠️ 여기서 적은 이름·종류는 /diagnose로 넘겨 다시 적지 않게 한다(DiagnoseForm의 URL 프리필).
  ⚠️ 채움 모션은 CSS라서 첫 화면이 그려질 때 바로 시작한다. 모바일처럼 기록지가 화면 아래에
     있으면 보기도 전에 끝나 버리므로, 그때만 화면에 들어올 때까지 멈춰 둔다(.wait → .is-in).
*/
export default function HomeHero({ samples, today }: { samples: Record<Species, HeroSample>; today: string }) {
  const router = useRouter();
  const [species, setSpecies] = useState<Species>('dog');
  const [name, setName] = useState('');
  const sheetRef = useRef<HTMLElement>(null);
  const s = samples[species];
  const shownName = name.trim() || s.name;

  useEffect(() => {
    const el = sheetRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.8) return;   // 이미 보이는 자리 — CSS 모션이 그대로 돈다
    el.classList.add('wait');
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        el.classList.add('is-in');
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function start(e: FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({ sp: species });
    if (name.trim()) q.set('name', name.trim().slice(0, 30));
    router.push(`/diagnose?${q.toString()}`);
  }

  return (
    <section className="home-hero">
      <div className="home-hero-in">
        <div className="home-copy">
          <h1>품종과 나이, 체중으로 계산한 우리&nbsp;아이 케어 리포트</h1>
          <p className="home-lead">
            하루 급여량과 다음 접종 날짜, 조심할 질환, 먹으면 안 되는 음식을
            188개 품종의 표준값과 수의 지침에 맞춰 리포트 하나에 정리해 드려요.
          </p>

          <form className="home-start" onSubmit={start}>
            <label className="home-start-label" htmlFor="hero-name">아이 이름</label>
            <div className="home-start-row">
              <input
                id="hero-name"
                className="input"
                value={name}
                maxLength={30}
                onChange={(e) => setName(e.target.value)}
                placeholder={`예: ${s.name}`}
                autoComplete="off"
              />
              <div className="seg" role="radiogroup" aria-label="종류">
                {(['dog', 'cat'] as const).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    role="radio"
                    aria-checked={species === sp}
                    className={`seg-opt ${species === sp ? 'on' : ''}`}
                    onClick={() => setSpecies(sp)}
                  >
                    {sp === 'dog' ? '강아지' : '고양이'}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn--primary btn--lg btn--block" type="submit" data-track="첫 화면에서 시작">무료 가이드 보기</button>
            <p className="home-start-note">무료 가이드를 먼저 보고, 결제하면 바로 리포트를 받아요. 링크는 메일로도 보내 드려요.</p>
          </form>
        </div>

        <figure className="sheet home-sheet" ref={sheetRef} aria-label="케어 기록지 예시">
          <div className="sheet-head">
            <b>케어 기록지</b>
            <span>{today}</span>
          </div>
          {/* key를 종류로 두어 강아지↔고양이를 바꿀 때 행이 다시 채워지게 한다 */}
          <div key={species}>
            <div className="sheet-name sheet-in" style={{ ['--i' as string]: 0 }}>
              <strong>
                {shownName}
                {/* 이름을 칠 때마다 밑줄이 한 번 지나간다 — 「적으면 바뀐다」가 보이게 */}
                {name && <span key={name} className="sheet-ink" aria-hidden />}
              </strong>
              <span>{species === 'dog' ? '강아지' : '고양이'}{s.sexKo ? `, ${s.sexKo}` : ''}</span>
            </div>
            <div className="sheet-row sheet-in" style={{ ['--i' as string]: 1 }}>
              <span className="sheet-k">품종</span>
              <span className="sheet-v">{s.breedKo}{s.sizeLabel && <small>{s.sizeLabel}</small>}</span>
            </div>
            <div className="sheet-row sheet-in" style={{ ['--i' as string]: 2 }}>
              <span className="sheet-k">나이</span>
              <span className="sheet-v num">{s.ageYears}살{s.humanAge && <small>사람 나이로 약 {s.humanAge}살</small>}</span>
            </div>
            <div className="sheet-row sheet-row--ruler sheet-in" style={{ ['--i' as string]: 3 }}>
              <div className="sheet-line">
                <span className="sheet-k">체중</span>
                <span className="sheet-v num">
                  {s.weightKg}kg
                  {s.bodyLabel && <span className={`tag ${TONE_TAG[s.bodyTone ?? 'info']}`}>{s.bodyLabel}</span>}
                </span>
              </div>
              {s.range && <WeightRuler key={species} weight={s.weightKg} range={s.range} delayMs={3 * 75 + 520} />}
            </div>
            {s.dailyKcal && (
              <div className="sheet-row sheet-in" style={{ ['--i' as string]: 4 }}>
                <span className="sheet-k">하루 급여량</span>
                <span className="sheet-v num">{s.dailyKcal}{s.dailyGram && <small>건사료 {s.dailyGram}</small>}</span>
              </div>
            )}
            {s.nextVaccine && (
              <div className="sheet-row sheet-in" style={{ ['--i' as string]: 5 }}>
                <span className="sheet-k">다음 접종</span>
                <span className="sheet-v">{s.nextVaccine.title}<small className="num">{s.nextVaccine.dateLabel}, {s.nextVaccine.dday > 0 ? `${s.nextVaccine.dday}일 남음` : '오늘'}</small></span>
              </div>
            )}
            {s.risks.length > 0 && (
              <div className="sheet-row sheet-in" style={{ ['--i' as string]: 6 }}>
                <span className="sheet-k">조심할 질환</span>
                <span className="sheet-v">{s.risks.join(', ')}</span>
              </div>
            )}
            <div className="sheet-row sheet-in" style={{ ['--i' as string]: 7 }}>
              <span className="sheet-k">금지 음식</span>
              <span className="sheet-v">{s.toxicExamples.join(', ')}<small>외 {s.toxicCount - s.toxicExamples.length}가지</small></span>
            </div>
          </div>
          <figcaption className="sheet-foot">
            예시로 채운 기록이에요. 실제 리포트는 입력하신 품종, 나이, 체중으로 계산해요.
          </figcaption>
        </figure>

        <dl className="home-facts">
          <div><dt>리포트</dt><dd>{SITE.pricePerPet.toLocaleString()}원</dd></div>
          <div><dt>다시 보기</dt><dd>60일</dd></div>
          <div><dt>회원가입</dt><dd>없음</dd></div>
        </dl>
      </div>
    </section>
  );
}
