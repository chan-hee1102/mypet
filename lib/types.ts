export type Species = 'dog' | 'cat';
export type Sex = 'female' | 'male';

/** RAG 근거 출처 (UI 배지용) */
export type Source = { org: string; title: string | null; url: string | null };

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
  // ── 최근 접종 기록(알면 입력). 케어 일정 계산용. 모르면 비움 → "병원 확인"으로 처리. ──
  lastVaccineCombo?: string; // 종합백신(DHPPL/FVRCP) 마지막 접종 "YYYY-MM"
  lastVaccineRabies?: string; // 광견병 마지막 접종 "YYYY-MM"
  lastHeartworm?: string; // 심장사상충·구충 마지막 투여 "YYYY-MM"
}

/** AI(Claude)가 생성하는 맞춤 케어 카드 */
export interface CareCard {
  /** 종합 소견 — 리포트 맨 위. 보호자 질문에 대한 결론부터. (구버전 카드에는 없음) */
  verdict?: {
    /** now=지금 병원 / soon=2~3일 내 진료 권장 / routine=예방 관리면 충분 */
    urgency: 'now' | 'soon' | 'routine';
    headline: string;
    summary: string;
    todo: string[];
  };
  /** 입력한 증상에 대한 직접 답변. 증상 입력이 없으면 빈 배열. (구버전 카드에는 없음) */
  symptomAnswer?: { causes: string[]; careNow: string[] };
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
  /** RAG로 근거를 활용한 경우 출처 목록 */
  sources?: Source[];
}

/** 무료로 보여주는 미리보기 필드만. 프리미엄 필드는 결제 전 클라이언트로 전송하지 않는다. */
export type PreviewCard = Pick<CareCard, 'photoAnalysis' | 'breedTraits' | 'sources'>;

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
  /** RAG로 근거를 활용한 경우 출처 목록 */
  sources?: Source[];
}
