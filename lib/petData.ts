import { Species } from './types';

/**
 * 검증된 케어 기준 데이터.
 * ⚠️ 안전의 핵심: 독성 음식 같은 '틀리면 위험한 정보'는 AI 생성에 맡기지 않고
 * 여기에 고정한다. 화면의 '절대 NO 음식'은 항상 이 데이터에서 렌더링한다.
 */

export interface FoodItem {
  name: string;
  reason: string;
  severity: 'danger' | 'caution';
}

export const TOXIC_FOODS: Record<Species, FoodItem[]> = {
  dog: [
    { name: '초콜릿·카카오', reason: '테오브로민 중독 — 구토·발작·심장이상', severity: 'danger' },
    { name: '포도·건포도', reason: '소량도 급성 신부전 유발 가능', severity: 'danger' },
    { name: '양파·마늘·파·부추(파속)', reason: '적혈구 파괴 → 빈혈', severity: 'danger' },
    { name: '자일리톨(껌·일부 시럽)', reason: '급격한 저혈당·간손상', severity: 'danger' },
    { name: '마카다미아', reason: '쇠약·떨림·고열', severity: 'danger' },
    { name: '알코올·생빵반죽(이스트)', reason: '중독·위 팽창', severity: 'danger' },
    { name: '카페인(커피·녹차)', reason: '심박이상·발작', severity: 'danger' },
    { name: '익힌 뼈', reason: '쪼개져 소화관 천공 위험', severity: 'caution' },
    { name: '아보카도', reason: '페르신 — 구토·설사', severity: 'caution' },
    { name: '짠 음식·가공육', reason: '나트륨 과다·췌장염 위험', severity: 'caution' },
  ],
  cat: [
    { name: '양파·마늘·파(파속)', reason: '적혈구 파괴 → 빈혈 (개보다 더 민감)', severity: 'danger' },
    { name: '초콜릿·카페인', reason: '테오브로민·카페인 중독', severity: 'danger' },
    { name: '포도·건포도', reason: '신장 손상 가능', severity: 'danger' },
    { name: '알코올·자일리톨', reason: '중독·저혈당', severity: 'danger' },
    { name: '백합 등 일부 식물', reason: '소량도 치명적 신부전 (음식 아니지만 꼭 치워두기)', severity: 'danger' },
    { name: '날생선·과다한 참치', reason: '티아민(B1) 결핍·수은', severity: 'caution' },
    { name: '우유·유제품', reason: '대부분 유당불내성 → 설사', severity: 'caution' },
    { name: '개 사료', reason: '타우린 부족 — 고양이 전용식 필요', severity: 'caution' },
    { name: '생달걀 흰자', reason: '비오틴 흡수 방해', severity: 'caution' },
  ],
};

export const GOOD_FOODS: Record<Species, string[]> = {
  dog: ['익힌 닭가슴살(무염)', '삶은 당근·호박·고구마', '블루베리', '사과(씨 제거)', '플레인 요거트 소량', '깨끗한 물 충분히'],
  cat: ['고양이 전용 사료(타우린 함유)', '익힌 닭고기·흰살생선 소량', '습식사료로 수분 보충', '깨끗한 물 항상 제공'],
};

/** "YYYY-MM" → 나이(개월/표시). 입력이 없거나 형식이 틀리면 null. */
export function computeAge(birth?: string): { label: string; months: number } | null {
  if (!birth || !/^\d{4}-\d{2}$/.test(birth)) return null;
  const [y, m] = birth.split('-').map(Number);
  const now = new Date();
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (months < 0) months = 0;
  const yy = Math.floor(months / 12);
  const mm = months % 12;
  const label = yy > 0 ? `${yy}살 ${mm}개월` : `${mm}개월`;
  return { label, months };
}

/** 생애 단계 (간단 기준) */
export function lifeStage(species: Species, months: number): string {
  if (species === 'dog') {
    if (months < 12) return '퍼피(성장기)';
    if (months < 84) return '성견';
    return '노령견';
  }
  if (months < 12) return '아기 고양이';
  if (months < 132) return '성묘';
  return '노령묘';
}
