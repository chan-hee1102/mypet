import { Species } from './types';

/**
 * 1단계 무료 가이드의 "맞춤 체크" 로직.
 * AI 없이 입력값(몸무게·나이·성별·중성화)을 품종 DB 표준값과 대조해
 * 즉시 판정을 만들어 준다 — 일반 챗봇 답변과 차별화되는 개인화 포인트.
 * ⚠️ 의료 판단이 아닌 참고 정보이므로 표현은 항상 부드럽게, 병원 안내로 연결.
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
  const { name, breedKo, weight, range, jointRisk } = opts;
  if (!weight || !Number.isFinite(weight) || weight <= 0 || !range) return null;
  const [lo, hi] = range;
  const rangeTxt = `${lo}~${hi}kg`;
  if (weight > hi * 1.05) {
    return {
      tone: 'warn',
      title: `몸무게 ${weight}kg — 표준보다 무거워요`,
      body: `${breedKo} 표준은 ${rangeTxt}예요. ${jointRisk ? '이 품종이 조심해야 하는 관절(슬개골)에 부담이 커질 수 있어요. ' : ''}간식 줄이기부터 시작해 보세요.`,
    };
  }
  if (weight < lo * 0.95) {
    return {
      tone: 'info',
      title: `몸무게 ${weight}kg — 표준보다 가벼워요`,
      body: `${breedKo} 표준은 ${rangeTxt}예요. 원래 작은 아이일 수 있지만, 최근에 갑자기 빠졌다면 진료를 권해요.`,
    };
  }
  return {
    tone: 'ok',
    title: `몸무게 ${weight}kg — 표준 범위 안이에요`,
    body: `${breedKo} 표준 ${rangeTxt}에 잘 맞아요. ${name}, 지금처럼만 유지해 주세요.`,
  };
}

/** 생애 단계 케어 포인트 — 단계별 지금 가장 중요한 것 1가지. */
export function stagePoint(opts: {
  species: Species; months: number; breedKo: string; topDisease?: string;
}): PersonalCheck | null {
  const { species, months, breedKo, topDisease } = opts;
  if (!Number.isFinite(months) || months < 0) return null;
  const dz = topDisease ? ` ${breedKo}는 특히 ${topDisease} 신호를 함께 봐주세요.` : '';
  if (species === 'dog') {
    if (months < 12) return { tone: 'info', title: '지금은 성장기(퍼피)', body: `기초접종과 사회화가 가장 중요한 시기예요. 생후 16주까지의 경험이 평생 성격을 만들어요.${dz}` };
    if (months < 84) return { tone: 'info', title: '지금은 성견기', body: `체중과 치아 관리가 핵심이에요. 살이 붙기 시작하면 관절 질환 위험도 같이 올라가요.${dz}` };
    return { tone: 'warn', title: '지금은 노령기', body: `1년에 2번 건강검진을 권해요. 신장·심장 수치는 겉으로 티 나기 전에 먼저 변해요.${dz}` };
  }
  if (months < 12) return { tone: 'info', title: '지금은 아기 고양이', body: `기초접종과 실내 환경 적응이 중요한 시기예요. 화장실·스크래처 습관을 지금 들여 주세요.${dz}` };
  if (months < 132) return { tone: 'info', title: '지금은 성묘기', body: `비만과 치아 관리가 핵심이에요. 하루 사료량을 정해두고 몸무게를 한 달에 한 번 확인해 주세요.${dz}` };
  return { tone: 'warn', title: '지금은 노령묘기', body: `1년에 2번 건강검진을 권해요. 고양이는 아픈 걸 숨겨서, 신장 수치 변화를 검진으로만 알 수 있는 경우가 많아요.${dz}` };
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
      title: '중성화 전 암컷이에요',
      body: '나이가 들수록 자궁축농증·유선종양 위험이 올라가요. 수의사와 시기를 상담해 보세요.',
    };
  }
  return {
    tone: 'info',
    title: '중성화 전 수컷이에요',
    body: '마킹·가출 시도와 전립선 질환 위험이 있어요. 수의사와 시기를 상담해 보세요.',
  };
}
