'use client';

import { useMemo, useState } from 'react';
import { dailyFeeding } from '@/lib/energy';
import { predictAdult, type GrowthClass } from '@/lib/growthCurve';
import type { Species } from '@/lib/types';

/**
 * 사료량 계산기 — 리포트와 같은 식(lib/energy)으로 하루 열량과 건사료 g을 낸다.
 * 사료 포장지의 열량(kcal/kg)을 넣으면 범위가 아니라 그 사료 기준 g으로 바꿔 준다.
 */
export default function FoodCalc({
  species: fixedSpecies,
  size,
  breedName,
  defaultKg,
  adultKg,
  cls,
}: {
  species?: Species;
  /** 품종 크기(초소형·소형…) — 노령 시작 나이가 달라진다 */
  size?: string | null;
  breedName?: string;
  defaultKg?: number;
  /** 품종의 다 큰 몸무게(중간값) — 성장기 계산에 쓴다. 없으면 나이·몸무게로 추정한다 */
  adultKg?: number;
  cls?: GrowthClass | null;
}) {
  const [species, setSpecies] = useState<Species>(fixedSpecies ?? 'dog');
  const [kg, setKg] = useState(defaultKg ? String(defaultKg) : '');
  const [age, setAge] = useState('');
  const [unit, setUnit] = useState<'m' | 'y'>('y');
  const [neutered, setNeutered] = useState(true);
  const [kcalPerKg, setKcalPerKg] = useState('');

  const w = Number(kg.replace(',', '.'));
  const a = Number(age);
  const months = age === '' ? null : unit === 'y' ? a * 12 : a;
  const ready = kg !== '' && Number.isFinite(w) && w > 0 && months !== null && Number.isFinite(months);
  const res = useMemo(() => {
    if (!ready) return null;
    // 1살 전에는 다 큰 몸무게 대비 지금 몸무게로 계수를 정한다(표와 같은 식)
    const adult = months! < 12 ? adultKg ?? (months! >= 2 ? predictAdult(species, months!, w, cls).est : undefined) : undefined;
    return dailyFeeding(species, w, months, neutered, size, adult);
  }, [ready, species, w, months, neutered, size, adultKg, cls]);
  // 국내 포장지는 「380kcal/100g」으로 적힌 경우가 많다 — 200~600이면 100g당 값으로 보고 10배 한다
  const raw = Number(kcalPerKg);
  const per100g = raw >= 200 && raw < 700;
  const density = per100g ? raw * 10 : raw;
  const exact = res && density >= 2000 && density <= 6000 ? Math.round((res.kcal / density) * 1000) : null;
  const meals =
    species === 'cat'
      ? '하루 2회 이상 나눠서 (자율급식이면 하루 총량만 정해 두기)'
      : months !== null && months < 6
        ? '하루 3~4회로 나눠서'
        : months !== null && months < 12
          ? '하루 3회로 나눠서'
          : '하루 2회로 나눠서';

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
          <span className="label">몸무게 (kg)</span>
          <input className="input" inputMode="decimal" placeholder="예) 3.2" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.,]/g, '').slice(0, 5))} />
        </label>
        <div className="field">
          <span className="label">나이</span>
          <div className="tool-age">
            <input className="input" inputMode="numeric" placeholder={unit === 'y' ? '예) 3' : '예) 4'} aria-label="나이" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, '').slice(0, 2))} />
            <div className="seg" role="radiogroup" aria-label="나이 단위">
              {(
                [
                  ['y', '살'],
                  ['m', '개월'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={unit === v} className={`seg-opt${unit === v ? ' on' : ''}`} onClick={() => setUnit(v)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {(months === null || months >= 12) && (
        <div className="field">
          <span className="label">중성화</span>
          <div className="seg" role="radiogroup" aria-label="중성화">
            {(
              [
                [true, '했어요'],
                [false, '안 했어요'],
              ] as const
            ).map(([v, l]) => (
              <button key={l} type="button" role="radio" aria-checked={neutered === v} className={`seg-opt${neutered === v ? ' on' : ''}`} onClick={() => setNeutered(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="field">
        <span className="label">사료 열량 (선택, 포장지의 kcal/kg 또는 kcal/100g)</span>
        <input className="input" inputMode="numeric" placeholder="예) 3800" value={kcalPerKg} onChange={(e) => setKcalPerKg(e.target.value.replace(/[^\d]/g, '').slice(0, 4))} />
      </label>

      <div className="tool-out" aria-live="polite">
        {!res && <p className="tool-idle">몸무게와 나이를 넣으면 {breedName ? `${breedName} ` : ''}하루 사료량을 바로 계산해요.</p>}
        {res && (
          <>
            <p className="tool-kicker">
              {unit === 'y' ? `${age}살` : `${age}개월`}
              {species === 'dog' ? (months! < 12 ? ' 아기 강아지' : ' 성견') : months! < 12 ? ' 아기 고양이' : ' 성묘'} 기준, 하루 필요 열량 약 {Math.round(res.kcal / 10) * 10}kcal
            </p>
            <p className="tool-big">
              {exact ? `이 사료로 하루 약 ${exact}g` : res.gramLo === res.gramHi ? `건사료 하루 약 ${res.gramLo}g` : `건사료 하루 ${res.gramLo}~${res.gramHi}g`}
            </p>
            <p className="tool-sub">
              {meals}. 간식은 하루 {Math.round(res.kcal / 10 / 5) * 5}kcal(전체의 10%)를 넘지 않게, 준 만큼 사료를 덜어 주세요.
              {exact ? (per100g ? ' 입력한 열량은 100g당 값으로 보고 계산했어요.' : '') : ' 사료마다 열량이 달라 범위로 보여 드려요. 포장지 열량을 넣으면 정확한 g으로 바뀌어요.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
