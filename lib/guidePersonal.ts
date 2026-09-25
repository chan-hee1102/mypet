import { Species } from './types';

/**
 * 1단계 무료 가이드의 "맞춤 체크" 로직.
 * AI 없이 입력값(몸무게·나이·성별·중성화)을 품종 DB 표준값과 대조해
 * 즉시 판정을 만들어 준다 — 일반 챗봇 답변과 차별화되는 개인화 포인트.
 * ⚠️ 문구 원칙: 40~60대가 한 번에 읽히는 쉬운 말. 의료 판단이 아닌 참고 정보이므로
 *   표현은 항상 부드럽게, 병원 안내로 연결.
 * ⚠️ 2026-09-26 말투 정리: 「딱 좋아요」 「확 줄어요」 같은 구어·과장을 걷어내고 사실을 먼저 쓴다.
 *   제목에 「—」를 쓰지 않는다 — 리포트(careCardFromData)가 「제목 — 본문」으로 이어 붙여서
 *   제목 안에 또 있으면 문장이 세 토막 난다.
 *   이 문구는 무료 가이드와 유료 리포트(나이별 관리) 양쪽에 그대로 나간다.
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
      title: `몸무게 ${weight}kg, 표준보다 무거워요`,
      body: `${breedKo}의 표준 체중은 ${lo}~${hi}kg이에요. ${jointRisk ? '관절에 부담이 갈 수 있어요. ' : ''}간식 양부터 줄여 보세요.`,
    };
  }
  if (weight < lo * 0.95) {
    return {
      tone: 'info',
      title: `몸무게 ${weight}kg, 표준보다 가벼워요`,
      body: `${breedKo}의 표준 체중은 ${lo}~${hi}kg이에요. 원래 체구가 작다면 괜찮지만, 최근에 빠졌다면 동물병원에서 확인해 보세요.`,
    };
  }
  /*
    ⚠️ 5% 여유 구간(표준 상한보다 조금 무겁거나 하한보다 조금 가벼움)을 예전엔 「범위 안」이라고 했다.
       바로 아래 문장이 「표준은 2~3.5kg」인데 3.6kg에 「범위 안」이라고 하면 모순이다(사용성 테스트 지적).
  */
  if (weight > hi) {
    return {
      tone: 'ok',
      title: `몸무게 ${weight}kg, 표준 상한을 조금 넘어요`,
      body: `${breedKo}의 표준 체중은 ${lo}~${hi}kg이에요. 체구가 큰 편이면 괜찮은 정도예요. 더 늘지 않게 지켜봐 주세요.`,
    };
  }
  if (weight < lo) {
    return {
      tone: 'ok',
      title: `몸무게 ${weight}kg, 표준 하한보다 조금 가벼워요`,
      body: `${breedKo}의 표준 체중은 ${lo}~${hi}kg이에요. 체구가 작은 편이면 괜찮은 정도예요. 더 빠지지 않는지 지켜봐 주세요.`,
    };
  }
  return {
    tone: 'ok',
    title: `몸무게 ${weight}kg, 표준 범위 안이에요`,
    body: `${breedKo}의 표준 체중은 ${lo}~${hi}kg이에요. 지금 체중을 유지해 주세요.`,
  };
}

/** 생애 단계 케어 포인트 — 사람 나이 환산과 함께, 지금 가장 중요한 것 1가지. */
export function stagePoint(opts: {
  species: Species; months: number; breedKo: string; topDisease?: string; personAge?: number | null; size?: string;
}): PersonalCheck | null {
  const { species, months, breedKo, topDisease, personAge, size } = opts;
  // 노령 시작: 체구가 작을수록 늦다(공개 가이드의 나이 환산표와 같은 기준). 크기를 모르면 7살.
  const seniorAt = size && /초소형|소형/.test(size) ? 120 : size && /중형/.test(size) ? 96 : 84;
  if (!Number.isFinite(months) || months < 0) return null;
  const pa = personAge != null ? ` (사람 나이로 약 ${personAge}살)` : '';
  const dzLine = topDisease ? ` ${breedKo}에게 흔한 ${topDisease}도 함께 살펴 주세요.` : '';
  if (species === 'dog') {
    if (months < 12) return { tone: 'info', title: '성장기예요', body: '예방접종을 제때 맞추고, 사람이나 다른 강아지를 만나는 경험을 쌓아 주세요. 이 시기의 경험이 성격에 오래 남아요.' };
    if (months < seniorAt) return { tone: 'info', title: `성견기예요${pa}`, body: `체중이 늘기 쉬운 시기예요. 체중과 치아를 꾸준히 관리해 주세요.${dzLine}` };
    return { tone: 'warn', title: `노령기예요${pa}`, body: `1년에 두 번 건강검진을 받아 주세요. 신장과 심장 질환은 증상이 늦게 나타나요.${dzLine}` };
  }
  if (months < 12) return { tone: 'info', title: '성장기예요', body: '예방접종과 함께 화장실, 스크래처 습관을 들이는 시기예요.' };
  if (months < 132) return { tone: 'info', title: `성묘기예요${pa}`, body: `체중이 늘기 쉬운 시기예요. 하루 사료량을 정해 두고 한 달에 한 번 체중을 재 보세요.${dzLine}` };
  return { tone: 'warn', title: `노령기예요${pa}`, body: `1년에 두 번 건강검진을 받아 주세요. 고양이는 아픈 티를 잘 내지 않아서 검진으로만 알 수 있는 병이 많아요.${dzLine}` };
}

/** 중성화 안내 — 안 했을 때만, 성별 맞춤. */
export function neuterTip(opts: {
  species: Species; sex?: 'male' | 'female'; neutered?: boolean;
}): PersonalCheck | null {
  const { species, sex, neutered } = opts;
  if (neutered !== false || !sex) return null;
  if (species === 'cat') {
    return sex === 'female'
      ? { tone: 'info', title: '중성화를 하지 않았어요', body: '발정이 반복되면 스트레스가 크고, 나이가 들수록 자궁과 유선 질환 위험이 커져요. 수술 시기를 동물병원과 상담해 보세요.' }
      : { tone: 'info', title: '중성화를 하지 않았어요', body: '수컷 고양이는 소변 스프레이, 영역 다툼, 집 밖으로 나가려는 행동이 잦아요. 수술 시기를 동물병원과 상담해 보세요.' };
  }
  if (sex === 'female') {
    return {
      tone: 'info',
      title: '중성화를 하지 않았어요',
      body: '암컷은 나이가 들수록 자궁과 유선 질환 위험이 커져요. 수술 시기를 동물병원과 상담해 보세요.',
    };
  }
  return {
    tone: 'info',
    title: '중성화를 하지 않았어요',
    body: '수컷은 영역 표시, 가출, 전립선 질환 위험이 있어요. 수술 시기를 동물병원과 상담해 보세요.',
  };
}
