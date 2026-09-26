import { seniorStartMonths } from './petData';
import type { Species } from './types';

/*
 * 하루 필요 열량 — 리포트(careCardFromData.feedingPlan)와 공개 사료량 표·계산기가 **같은 식**을 쓰게 한 곳.
 * 공개 페이지가 따로 계산하면 리포트와 숫자가 갈라진다. 브라우저 계산기도 이 파일만 가져간다(품종 JSON을 끌고 오지 않게).
 *   RER(휴식기 에너지) = 70 × 체중^0.75 kcal/일
 *   MER(하루 필요량)   = RER × 활동계수
 *   건사료 g            = MER ÷ 3.5~4.0 kcal/g (제품마다 달라 범위로)
 */

/**
 * 하루 필요 열량(kcal)과 건사료 g 범위 — 리포트(feedingPlan)와 공개 사료량 표·계산기가 **같은 식**을 쓰게 한 창구.
 * 공개 페이지가 따로 계산하면 리포트와 숫자가 갈라진다.
 */
export function dailyFeeding(
  species: Species, weightKg: number, months?: number | null, neutered?: boolean, size?: string | null,
  /** 다 큰 몸무게(예상). 주면 1살 전 강아지는 월령 계단 대신 성장 정도(growthFactor)로 계산한다 */
  adultKg?: number | null,
): { kcal: number; gramLo: number; gramHi: number } {
  // 성장기 = 1살 전, 또는 1살이 넘어도 다 큰 몸무게의 90%에 못 미친 대형견·대형묘(메인쿤은 3~4살까지 자란다)
  const growing = !!adultKg && adultKg > 0 && typeof months === 'number' && (months < 12 || weightKg / adultKg < 0.9);
  const factor = growing ? growthFactor(species, weightKg / adultKg!) : activityFactor(species, months, neutered, size);
  const kcal = 70 * Math.pow(weightKg, 0.75) * factor;
  return { kcal, gramLo: Math.round(kcal / 4.0 / 5) * 5, gramHi: Math.round(kcal / 3.5 / 5) * 5 };
}

/**
 * 성장기 계수 — 강아지는 다 큰 몸무게의 40%까지 3.0, 90%에서 1.8까지(고양이는 2.5 → 1.4) 서서히 낮춘다.
 * 월령 계단(4개월 전 3.0, 뒤 2.0)은 공개 표에서 「3개월 250kcal → 4개월 200kcal」처럼 자라는데 덜 먹는 모양이 나왔다(2026-09-27).
 * 필요 열량은 성장 중반에 가장 크고 다 자랄수록 성견 유지량(중성화 전 1.8)으로 내려온다는 영양학의 곡선을 따른 것.
 * ⚠️ 리포트(careCardFromData)는 아직 다 큰 몸무게를 넘기지 않아 월령 계단 그대로다. 맞출지는 사장님 결정 대기.
 */
export function growthFactor(species: Species, p: number): number {
  // 고양이: 2.5(자묘)에서 1.4(중성화 전 성묘)로. 12개월에 2.5 → 1.4로 뚝 떨어지던 계단을 없앤다
  const [start, end] = species === 'cat' ? [2.5, 1.4] : [3.0, 1.8];
  if (p <= 0.4) return start;
  if (p >= 0.9) return end;
  return start - ((start - end) * (p - 0.4)) / 0.5;
}

/**
 * 활동계수 — 성장기가 가장 크고, 중성화하면 대사가 떨어져 작아진다.
 * (AAHA·WSAVA 영양 가이드라인에서 통용되는 값. 실제 필요량은 개체차가 커서 체형을 보며 조절해야 한다)
 */
export function activityFactor(species: Species, months?: number | null, neutered?: boolean, size?: string | null): number {
  const m = typeof months === 'number' ? months : null;
  const senior = m !== null && m >= seniorStartMonths(species, size); // 단계 이름과 같은 기준
  if (species === 'cat') {
    if (m !== null && m < 12) return 2.5;         // 자묘
    // 노령묘: 1.1이었다가 1.2로(2026-09-27 수의 감수). 12살 넘으면 소화 효율이 떨어져 오히려 더 필요할 수 있고, 살이 빠지면 병원 신호다
    if (senior) return 1.2;
    return neutered ? 1.2 : 1.4;
  }
  if (m !== null && m < 4) return 3.0;            // 어린 자견
  if (m !== null && m < 12) return 2.0;           // 자견
  if (senior) return 1.4;                         // 노령견
  return neutered ? 1.6 : 1.8;
}
