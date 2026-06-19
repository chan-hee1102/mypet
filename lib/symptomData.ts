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
