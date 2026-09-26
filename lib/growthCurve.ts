import type { Species } from './types';

/**
 * 개월별 예상 몸무게(성장표) — 품종 성장 페이지·사료량 페이지·「다 크면 몇 kg」 계산기가 함께 쓴다.
 *
 * ── 근거와 한계 ─────────────────────────────────────────────
 * 체급 구분은 WALTHAM 성장 표준 연구(Salt 외, PLOS ONE 2017)의 다섯 체급을 그대로 쓴다:
 *   I <6.5kg · II 6.5~9 · III 9~15 · IV 15~30 · V 30~40(이 앱은 45kg 이상을 VI로 따로 둔다).
 * 연구의 결론은 「작은 개는 8~12개월에 다 자라고, 큰 개는 24개월까지 자란다」.
 * 아래 비율표(성체 체중 대비 %)는 그 패턴과 품종별 알려진 성장 기록에 맞춰 **mypet이 정한 추정값**이다.
 * 연구의 백분위 수치를 옮긴 것이 아니다 — 화면에도 「예상 범위」로만 적는다.
 *
 * ⚠️ 표의 범위 = 품종 표준 체중(최소~최대) × 그 달의 비율. 개체차가 커서 이 범위를 벗어나도 병은 아니다.
 *    판단은 체형(갈비뼈가 만져지는지)으로 하라고 페이지마다 같이 적는다.
 */

export type GrowthClass = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'cat' | 'cat-large';

/** 개월 → 성체 체중 대비 비율 */
const TABLE: Record<GrowthClass, [number, number][]> = {
  I: [[2, 0.3], [3, 0.46], [4, 0.6], [5, 0.72], [6, 0.82], [7, 0.88], [8, 0.93], [9, 0.96], [10, 0.98], [12, 1]],
  II: [[2, 0.28], [3, 0.43], [4, 0.56], [5, 0.68], [6, 0.78], [7, 0.85], [8, 0.9], [9, 0.94], [10, 0.97], [12, 1]],
  III: [[2, 0.27], [3, 0.41], [4, 0.54], [5, 0.65], [6, 0.75], [7, 0.82], [8, 0.87], [9, 0.91], [10, 0.94], [12, 0.98], [14, 1]],
  IV: [[2, 0.22], [3, 0.36], [4, 0.48], [5, 0.6], [6, 0.69], [7, 0.76], [8, 0.82], [9, 0.87], [10, 0.9], [12, 0.95], [15, 0.98], [18, 1]],
  V: [[2, 0.2], [3, 0.33], [4, 0.44], [5, 0.55], [6, 0.64], [7, 0.71], [8, 0.77], [9, 0.82], [10, 0.86], [12, 0.91], [15, 0.96], [18, 0.99], [24, 1]],
  VI: [[2, 0.13], [3, 0.22], [4, 0.32], [5, 0.42], [6, 0.52], [7, 0.59], [8, 0.66], [9, 0.72], [10, 0.77], [12, 0.85], [15, 0.92], [18, 0.96], [24, 1]],
  cat: [[2, 0.22], [3, 0.33], [4, 0.45], [5, 0.55], [6, 0.65], [7, 0.72], [8, 0.78], [9, 0.83], [10, 0.88], [12, 0.95], [15, 1]],
  // 메인쿤·노르웨이숲 같은 대형묘는 3~4살까지 천천히 자란다
  'cat-large': [[2, 0.14], [3, 0.21], [4, 0.29], [5, 0.36], [6, 0.43], [8, 0.54], [10, 0.63], [12, 0.7], [15, 0.78], [18, 0.85], [24, 0.93], [36, 1]],
};

/** 성장이 거의 끝나는 개월 수(화면 문장용) */
export const GROWTH_END: Record<GrowthClass, { months: number; label: string }> = {
  I: { months: 10, label: '10개월 무렵' },
  II: { months: 12, label: '12개월 무렵' },
  III: { months: 14, label: '12~14개월 무렵' },
  IV: { months: 18, label: '15~18개월 무렵' },
  V: { months: 24, label: '18~24개월 무렵' },
  VI: { months: 24, label: '2살 무렵' },
  cat: { months: 12, label: '12개월 무렵' },
  'cat-large': { months: 36, label: '3~4살 무렵' },
};

export const CLASS_LABEL: Record<GrowthClass, string> = {
  I: '성견 6.5kg 미만 체급',
  II: '성견 6.5~9kg 체급',
  III: '성견 9~15kg 체급',
  IV: '성견 15~30kg 체급',
  V: '성견 30~45kg 체급',
  VI: '성견 45kg 이상 체급',
  cat: '일반 체구 고양이',
  'cat-large': '대형묘',
};

export function classForDog(adultKg: number): GrowthClass {
  if (adultKg < 6.5) return 'I';
  if (adultKg < 9) return 'II';
  if (adultKg < 15) return 'III';
  if (adultKg < 30) return 'IV';
  if (adultKg < 45) return 'V';
  return 'VI';
}

/** 그 달의 성체 대비 비율(표 사이는 직선 보간, 마지막 달 뒤는 1) */
export function growthRatio(cls: GrowthClass, months: number): number {
  const t = TABLE[cls];
  if (months <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    const [m1, r1] = t[i];
    if (months <= m1) {
      const [m0, r0] = t[i - 1];
      return r0 + ((r1 - r0) * (months - m0)) / (m1 - m0);
    }
  }
  return 1;
}

/** 표에 보일 개월들 — 체급의 성장이 끝나는 달까지 */
export function tableMonths(cls: GrowthClass): number[] {
  return TABLE[cls].map(([m]) => m);
}

export const fmtKg = (kg: number) => (kg >= 20 ? `${Math.round(kg)}` : kg >= 10 ? `${Math.round(kg * 2) / 2}` : `${Math.round(kg * 10) / 10}`);

/**
 * 「다 크면 몇 kg?」 — 지금 몸무게 ÷ 그 달의 비율. 품종을 모르면 체급을 추정하며 세 번 고친다.
 * 오차: 어릴수록 크다(4개월 전 ±20%, 그 뒤 ±10%).
 */
export function predictAdult(species: Species, months: number, kg: number, cls?: GrowthClass | null) {
  let c: GrowthClass = cls ?? (species === 'cat' ? 'cat' : 'II');
  if (!cls && species === 'dog') {
    for (let i = 0; i < 3; i++) c = classForDog(kg / growthRatio(c, months));
  }
  const ratio = growthRatio(c, months);
  const est = kg / ratio;
  const err = months < 4 ? 0.2 : 0.1;
  return { cls: c, est, lo: est * (1 - err), hi: est * (1 + err), done: ratio >= 0.999, end: GROWTH_END[c] };
}

