import { Species } from './types';

/**
 * 증상 체커 데이터.
 * ⚠️ 안전 핵심: emergency=true 증상은 선택만으로 '즉시 병원'을 강제한다(AI가 못 낮춤).
 */
export interface SymptomOption {
  id: string;
  label: string;
  emergency?: boolean;
}

// 흔하고 자주 있는 증상만 노출 (그 외 응급 증상은 설명란 + 사진 + 키워드 스캔으로 처리)
export const SYMPTOMS: SymptomOption[] = [
  { id: 'cough', label: '기침을 해요' },
  { id: 'gag', label: '켁켁거리거나 구역질해요' },
  { id: 'vomit', label: '토해요' },
  { id: 'diarrhea', label: '설사를 해요' },
  { id: 'tremble', label: '몸을 벌벌 떨어요' },
  { id: 'lethargy', label: '기운이 없고 잘 안 먹어요' },
  { id: 'itch', label: '자꾸 긁고 가려워해요' },
  { id: 'breathing', label: '숨을 가쁘게 쉬어요 / 헐떡여요', emergency: true },
];

// 자유 입력에서 응급 키워드(안전망)
const EMERGENCY_KEYWORDS = [
  '호흡곤란', '숨을 못', '숨을 안', '헐떡', '발작', '경련', '쓰러', '의식', '청색',
  '파래', '파랗', '보라', '잇몸이 하', '창백', '피를 토', '각혈', '혈변', '피 섞',
  '배가 부풀', '배가 빵빵', '소변을 못', '오줌을 못', '중독', '삼켰', '먹였',
];

/** 선택 증상 또는 설명에 응급 신호가 있으면 true → urgency=emergency 강제 */
export function detectEmergency(selectedIds: string[], text: string): boolean {
  if (selectedIds.some((id) => SYMPTOMS.find((s) => s.id === id)?.emergency)) return true;
  const t = text || '';
  return EMERGENCY_KEYWORDS.some((k) => t.includes(k));
}

export function symptomLabels(ids: string[]): string {
  return ids
    .map((id) => SYMPTOMS.find((s) => s.id === id)?.label)
    .filter(Boolean)
    .join(', ');
}

export function speciesKo(species: Species): string {
  return species === 'dog' ? '강아지' : '고양이';
}

/**
 * 증상별 '일반' 안내(무료 가이드·리포트·공개 가이드 표가 함께 쓴다). 보호자 참고용·비진단. AI 호출 없음.
 * ⚠️ 2026-09-26 문장 정리: 「창백·푸르거나」 같은 명사 나열과 이모지를 풀어 쓰고, 해요체로 맞췄다.
 * ⚠️ 고양이에게 다른 원인이 흔한 증상은 SYMPTOM_INFO_CAT에 따로 둔다 — 예전엔 고양이 리포트에도
 *    켄넬코프·기관허탈(개 질환)이 나왔다. 화면에서는 symptomInfo(id, species)로 꺼낼 것.
 */
export const SYMPTOM_INFO: Record<string, { causes: string; vet: string }> = {
  cough: {
    causes: '켄넬코프 같은 호흡기 감염, 소형견에 흔한 기관허탈, 심장 질환, 먼지나 이물질 자극이 흔한 원인이에요.',
    vet: '기침이 며칠 이어지거나, 잇몸이 창백하거나 푸르스름하거나, 숨쉬기 힘들어하면 바로 병원에 가세요.',
  },
  gag: {
    causes: '이물질이나 위 내용물 역류, 켄넬코프, 기관 자극이 흔한 원인이에요.',
    vet: '계속 반복되거나 구토, 기운 없음이 함께 있으면 병원에서 진료를 받아 보세요.',
  },
  vomit: {
    causes: '갑작스럽게 바꾼 사료, 이물질을 삼킨 경우, 위장염, 췌장염, 중독이 원인일 수 있어요.',
    vet: '반복해서 토하거나, 피가 섞이거나, 24시간 넘게 이어지거나, 기운이 없거나, 무언가를 삼킨 것 같으면 바로 병원에 가세요.',
  },
  diarrhea: {
    causes: '사료 변화, 기생충, 감염, 스트레스, 음식 알레르기가 흔한 원인이에요.',
    vet: '피가 섞인 변, 반복되는 설사, 구토가 함께 있거나, 기운이 없고 물을 못 마시면 바로 병원에 가세요.',
  },
  tremble: {
    causes: '추위, 통증, 불안, 저혈당, 중독처럼 원인이 다양해요.',
    vet: '떨림이 계속되거나, 발작처럼 보이거나, 기운이 없으면 바로 병원에 가세요.',
  },
  lethargy: {
    causes: '감염, 통증, 내과 질환처럼 여러 원인이 있을 수 있어요.',
    vet: '하루 넘게 기운이 없거나 먹지 않으면 병원에서 진료를 받아 보세요.',
  },
  itch: {
    causes: '아토피나 음식 알레르기, 벼룩이나 진드기 같은 외부 기생충, 피부 감염이 흔한 원인이에요.',
    vet: '털이 빠지거나 진물이 나거나, 심하게 긁어 상처가 생기면 병원에서 진료를 받아 보세요.',
  },
  breathing: {
    causes: '숨을 가쁘게 쉬는 것은 심장이나 폐 질환, 기도가 막힌 응급 상황일 수 있어요.',
    vet: '숨을 가쁘게 쉬거나 잇몸이 푸르스름하면 바로 병원에 가세요.',
  },
};

/** 고양이에게는 원인이 다른 증상만 덮어쓴다. 없는 증상은 SYMPTOM_INFO를 그대로 쓴다. */
export const SYMPTOM_INFO_CAT: Record<string, { causes: string; vet: string }> = {
  cough: {
    causes: '고양이의 기침은 천식 같은 기관지 질환, 호흡기 감염, 심장사상충, 먼지나 이물질 자극이 흔한 원인이에요. 헤어볼을 토하려는 동작과 헷갈리기 쉬워요.',
    vet: '기침이 며칠 이어지거나, 입을 벌리고 숨을 쉬거나, 잇몸이 푸르스름하면 바로 병원에 가세요.',
  },
  gag: {
    causes: '헤어볼, 급하게 먹은 사료, 이물질이 흔한 원인이에요.',
    vet: '헛구역질만 반복하고 아무것도 나오지 않거나, 밥을 먹지 않으면 병원에서 진료를 받아 보세요.',
  },
  breathing: {
    causes: '고양이는 평소 입을 벌리고 숨을 쉬지 않아요. 입을 벌리고 헐떡이는 것 자체가 심장이나 폐 질환의 응급 신호일 수 있어요.',
    vet: '입을 벌리고 숨을 쉬거나, 쉬고 있는데도 숨이 빠르거나, 잇몸이 푸르스름하면 바로 병원에 가세요.',
  },
};

/** 종에 맞는 증상 안내를 꺼낸다. */
export function symptomInfo(id: string, species: Species): { causes: string; vet: string } | undefined {
  return (species === 'cat' ? SYMPTOM_INFO_CAT[id] : undefined) ?? SYMPTOM_INFO[id];
}
