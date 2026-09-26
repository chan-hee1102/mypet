'use client';

import { useMemo, useState } from 'react';
import { fmtKg, predictAdult, type GrowthClass } from '@/lib/growthCurve';
import { josa } from '@/lib/josa';
import type { Species } from '@/lib/types';

/**
 * 「다 크면 몇 kg?」 계산기 — 지금 나이·몸무게로 다 큰 몸무게를 추정한다.
 * 품종 페이지에서 쓰면 그 품종의 체급(cls)을 고정해 더 정확하게, 도구 페이지에선 체급을 몸무게로 추정한다.
 * 브라우저에서 계산하므로 growthCurve만 가져온다(품종 JSON을 번들에 싣지 않는다).
 */
export default function AdultWeightCalc({
  species: fixedSpecies,
  cls,
  breedName,
}: {
  species?: Species;
  cls?: GrowthClass | null;
  breedName?: string;
}) {
  const [species, setSpecies] = useState<Species>(fixedSpecies ?? 'dog');
  const [months, setMonths] = useState('');
  const [kg, setKg] = useState('');

  const m = Number(months);
  const w = Number(kg.replace(',', '.'));
  const ready = months !== '' && kg !== '' && Number.isFinite(m) && Number.isFinite(w) && w > 0;
  const tooYoung = ready && m < 2;
  const res = useMemo(() => (ready && !tooYoung ? predictAdult(species, Math.min(m, 36), w, cls) : null), [ready, tooYoung, species, m, w, cls]);
  const grown = res && m >= res.end.months;
  const who = breedName ?? (species === 'dog' ? '강아지' : '고양이');

  return (
    <div className="tool">
      {!fixedSpecies && (
        <div className="field">
          <span className="label">종류</span>
          <div className="seg" role="radiogroup" aria-label="종류">
            {(['dog', 'cat'] as const).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={species === s} className={`seg-opt${species === s ? ' on' : ''}`} onClick={() => setSpecies(s)}>
                {s === 'dog' ? '강아지' : '고양이'}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="tool-row">
        <label className="field">
          <span className="label">지금 나이 (개월)</span>
          <input className="input" inputMode="numeric" placeholder="예) 3" value={months} onChange={(e) => setMonths(e.target.value.replace(/[^\d]/g, '').slice(0, 2))} />
        </label>
        <label className="field">
          <span className="label">지금 몸무게 (kg)</span>
          <input className="input" inputMode="decimal" placeholder="예) 1.4" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.,]/g, '').slice(0, 5))} />
        </label>
      </div>

      <div className="tool-out" aria-live="polite">
        {!ready && <p className="tool-idle">나이와 몸무게를 넣으면 다 컸을 때 몸무게를 바로 계산해요.</p>}
        {tooYoung && <p className="tool-idle">2개월(8주)부터 계산할 수 있어요. 그 전에는 하루하루 변화가 커서 예측이 잘 맞지 않아요.</p>}
        {res && (
          <>
            <p className="tool-kicker">{grown ? `${josa(who, '은/는')} 이미 거의 다 자란 나이예요` : `${josa(who, '이/가')} 다 크면`}</p>
            <p className="tool-big">
              약 {fmtKg(res.est)}kg <span>({fmtKg(res.lo)}~{fmtKg(res.hi)}kg)</span>
            </p>
            <p className="tool-sub">
              {grown ? '지금 몸무게가 다 큰 몸무게에 가까워요. 체형이 적당한지 갈비뼈를 만져 확인해 보세요.' : `성장은 ${res.end.label} 거의 끝나요. 어릴수록 오차가 커서 범위로 보여 드려요.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
