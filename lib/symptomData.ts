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
 * 증상별 '일반' 안내(무료용). 보호자 참고용·비진단. AI 호출 없이 정적 제공.
 * 정밀 원인·우리 아이 맞춤 조치는 결제(2단계) AI 진단에서.
 */
export const SYMPTOM_INFO: Record<string, { causes: string; vet: string }> = {
  cough: {
    causes: '켄넬코프 등 호흡기 감염, 기관허탈(소형견), 심장질환, 이물·자극이 흔한 원인이에요.',
    vet: '기침이 며칠 이어지거나, 잇몸이 창백·푸르거나, 숨쉬기 힘들어하면 바로 병원에 가세요.',
  },
  gag: {
    causes: '이물·역류, 켄넬코프, 기관 자극 등이 흔한 원인이에요.',
    vet: '반복되거나 토·기력저하가 함께 있으면 진료가 필요해요.',
  },
  vomit: {
    causes: '갑작스러운 식이 변화, 이물 섭취, 위장염, 췌장염, 중독 등이 원인일 수 있어요.',
    vet: '반복적으로 토하거나, 피가 섞이거나, 24시간 이상 지속·기력저하·이물 의심이면 즉시 병원에 가세요.',
  },
  diarrhea: {
    causes: '식이 변화, 기생충, 감염, 스트레스, 식이 알레르기 등이 흔한 원인이에요.',
    vet: '혈변·반복 설사·구토 동반·기력저하·탈수 징후가 있으면 바로 병원에 가세요.',
  },
  tremble: {
    causes: '추위·통증·불안·저혈당, 중독 등 원인이 다양해요.',
    vet: '떨림이 지속되거나 발작처럼 보이거나 기력이 없으면 즉시 병원에 가세요.',
  },
  lethargy: {
    causes: '감염, 통증, 내과 질환 등 다양한 원인이 있을 수 있어요.',
    vet: '24시간 이상 기운이 없거나 먹지 않으면 진료가 필요해요.',
  },
  itch: {
    causes: '알레르기(아토피·식이), 벼룩·진드기 등 외부기생충, 피부 감염이 흔한 원인이에요.',
    vet: '탈모·진물이 생기거나 심하게 긁어 상처가 나면 진료가 필요해요.',
  },
  breathing: {
    causes: '호흡곤란은 심장·폐 질환, 기도 폐색 등 응급 상황일 수 있어요.',
    vet: '⚠️ 숨을 가쁘게 쉬거나 잇몸이 푸르면 즉시 병원에 가야 합니다.',
  },
};
