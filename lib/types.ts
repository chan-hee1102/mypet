export type Species = 'dog' | 'cat';
export type Sex = 'female' | 'male';

/** 사용자가 폼에 입력하는 값 */
export interface PetInput {
  name: string;
  species: Species;
  breed?: string;
  birth?: string; // "YYYY-MM"
  sex?: Sex;
  neutered?: boolean;
  weightKg?: number;
  notes?: string;
}

/** AI(Claude)가 생성하는 맞춤 케어 카드 */
export interface CareCard {
  photoAnalysis: {
    breedGuess: string;
    bodyCondition: string;
    coatSkinNotes: string;
    confidence: 'high' | 'medium' | 'low';
  };
  breedTraits: { summary: string; healthRisks: string[] };
  grooming: { summary: string; cautions: string[] };
  exercise: { summary: string; walkMinutesPerDay: string; cautions: string[] };
  /** AI의 맥락형 음식 조언. '절대 금지 독성식품'은 코드의 검증 데이터로 별도 표시한다. */
  food: { goodFoods: string[]; cautionFoods: string[] };
  ageCare: { stage: string; tips: string[] };
  routine: { bath: string; walk: string; grooming: string };
  redFlags: string[];
}

/** 무료로 보여주는 미리보기 필드만. 프리미엄 필드는 결제 전 클라이언트로 전송하지 않는다. */
export type PreviewCard = Pick<CareCard, 'photoAnalysis' | 'breedTraits'>;

/** 증상 체커 입력 */
export interface SymptomInput {
  species: Species;
  petName?: string;
  symptomIds: string[];
  description?: string;
  duration?: string;
}

/** 증상 체커 결과 (응급도 트리아지) */
export interface SymptomTriage {
  urgency: 'emergency' | 'soon' | 'monitor';
  headline: string;
  possibleCauses: string[];
  homeCare: string[];
  vetSigns: string[];
  note: string;
}
