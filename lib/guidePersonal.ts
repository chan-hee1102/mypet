import { Species } from './types';

/**
 * 1단계 무료 가이드의 "맞춤 체크" 로직.
 * AI 없이 입력값(몸무게·나이·성별·중성화)을 품종 DB 표준값과 대조해
 * 즉시 판정을 만들어 준다 — 일반 챗봇 답변과 차별화되는 개인화 포인트.
 * ⚠️ 문구 원칙: 40~60대가 한 번에 읽히는 쉬운 말. 의료 판단이 아닌 참고 정보이므로
 *   표현은 항상 부드럽게, 병원 안내로 연결.
 */

export type CheckTone = 'ok' | 'warn' | 'info';
export type PersonalCheck = { tone: CheckTone; title: string; body: string };

/** "2.0–3.5" / "3.5–11 (…)" 형태에서 [min,max] 추출. 실패 시 null. */
export function parseWeightRange(weightKg?: string): [number, number] | null {
  if (!weightKg) return null;
  const nums = (weightKg.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (nums.length < 2 || nums[0] <= 0 || nums[1] < nums[0]) return null;
  return [nums[0], nums[1]];
}

/** 사람 나이 환산(대략). AVMA 차트 근사 — 크기별 노화 속도 반영. */
export function humanAge(species: Species, months: number, size?: string): number | null {
  if (!Number.isFinite(months) || months < 0) return null;
  const years = months / 12;
  if (years <= 1) return Math.round(15 * years);
  if (years <= 2) return Math.round(15 + 9 * (years - 1));
  const rate =
    species === 'cat' ? 4 :
    size && /대형|초대형/.test(size) ? 6 :
    size && /중형/.test(size) ? 5 : 4.5;
  return Math.round(24 + (years - 2) * rate);
}

/** 몸무게 판정 — 품종 표준 범위와 대조. */
export function weightCheck(opts: {
  name: string; breedKo: string; weight?: number; range: [number, number] | null;
  jointRisk?: boolean;
}): PersonalCheck | null {
  const { breedKo, weight, range, jointRisk } = opts;
  if (!weight || !Number.isFinite(weight) || weight <= 0 || !range) return null;
  const [lo, hi] = range;
  if (weight > hi * 1.05) {
    return {
      tone: 'warn',
      title: `몸무게 ${weight}kg — 조금 무거워요`,
      body: `${breedKo}는 ${lo}~${hi}kg이 적당해요. ${jointRisk ? '무릎에 무리가 갈 수 있으니 ' : ''}간식부터 조금 줄여 보세요.`,
    };
  }
  if (weight < lo * 0.95) {
    return {
      tone: 'info',
      title: `몸무게 ${weight}kg — 가벼운 편이에요`,
      body: `${breedKo}는 보통 ${lo}~${hi}kg이에요. 원래 작은 아이면 괜찮지만, 갑자기 빠진 거라면 병원에 가보세요.`,
    };
  }
  return {
    tone: 'ok',
    title: `몸무게 ${weight}kg — 딱 좋아요`,
    body: `${breedKo}는 ${lo}~${hi}kg이 적당한데, 그 안에 들어요. 지금처럼만 유지해 주세요.`,
  };
}

/** 생애 단계 케어 포인트 — 사람 나이 환산과 함께, 지금 가장 중요한 것 1가지. */
export function stagePoint(opts: {
  species: Species; months: number; breedKo: string; topDisease?: string; personAge?: number | null;
}): PersonalCheck | null {
  const { species, months, breedKo, topDisease, personAge } = opts;
  if (!Number.isFinite(months) || months < 0) return null;
  const pa = personAge != null ? `사람 나이로 약 ${personAge}살` : null;
  const dz = topDisease ? ` ${breedKo}는 ${topDisease}도 같이 봐주세요.` : '';
  if (species === 'dog') {
    if (months < 12) return { tone: 'info', title: '아직 아기예요 (성장기)', body: `예방접종과, 다른 사람·강아지를 만나보는 경험이 제일 중요한 때예요. 지금 경험이 평생 성격을 만들어요.` };
    if (months < 84) return { tone: 'info', title: pa ? `${pa} — 한창때예요` : '한창때예요 (성견기)', body: `슬슬 살이 붙는 시기예요. 몸무게와 이빨만 잘 챙겨도 병원 갈 일이 확 줄어요.${dz}` };
    return { tone: 'warn', title: pa ? `${pa} — 노령기예요` : '노령기예요', body: `1년에 2번은 건강검진을 받아 주세요. 신장·심장은 아프기 전까지 티가 안 나요.${dz}` };
  }
  if (months < 12) return { tone: 'info', title: '아직 아기예요', body: `예방접종과 화장실·스크래처 습관 들이기가 제일 중요한 때예요.` };
  if (months < 132) return { tone: 'info', title: pa ? `${pa} — 한창때예요` : '한창때예요 (성묘기)', body: `살찌기 쉬운 시기예요. 하루 사료량을 정해두고, 한 달에 한 번 몸무게를 재보세요.${dz}` };
  return { tone: 'warn', title: pa ? `${pa} — 노령기예요` : '노령기예요', body: `1년에 2번은 건강검진을 받아 주세요. 고양이는 아픈 걸 숨겨서, 검진으로만 알 수 있는 병이 많아요.${dz}` };
}

/** 중성화 안내 — 안 했을 때만, 성별 맞춤. */
export function neuterTip(opts: {
  species: Species; sex?: 'male' | 'female'; neutered?: boolean;
}): PersonalCheck | null {
  const { sex, neutered } = opts;
  if (neutered !== false || !sex) return null;
  if (sex === 'female') {
    return {
      tone: 'info',
      title: '중성화를 아직 안 했어요',
      body: '암컷은 나이 들수록 자궁·유선(가슴) 질환 위험이 커져요. 병원에서 시기를 상담해 보세요.',
    };
  }
  return {
    tone: 'info',
    title: '중성화를 아직 안 했어요',
    body: '수컷은 마킹·가출 버릇과 전립선 질환 위험이 있어요. 병원에서 시기를 상담해 보세요.',
  };
}
