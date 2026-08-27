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
  /** 선택한 증상 칩의 id — 검증된 표(SYMPTOM_INFO)로 답하기 위해 구조를 살려 넘긴다.
      예전엔 라벨로 뭉개 notes에 넣어서, 표로 답할 수 있는 것까지 AI에 물어야 했다. */
  symptomIds?: string[];
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
  /** 입력한 증상에 대한 직접 답변 — '판별 기준' 중심. 증상 입력이 없으면 빈 배열. (구버전 카드에는 없음) */
  symptomAnswer?: {
    /** 가능성 높은 순서의 원인 후보 */
    causes: string[];
    /** 지금 집에서 할 조치 (구버전 호환 필드) */
    careNow: string[];
    /** 이런 경우라면 지켜봐도 되는 조건 (시간 기준 포함) — 신규 */
    watchOk?: string[];
    /** 이런 신호가 있으면 바로/빨리 병원 — 신규 */
    goNow?: string[];
    /** 오늘 집에서 확인·관찰할 것 (방법 구체적으로) — 신규 */
    homeCheck?: string[];
    /** 병원 준비: 예상 검사·수의사에게 전달할 요약 문장 — 신규 */
    vetPrep?: { tests: string; script: string };
  };
  /**
   * @deprecated 2026-08-28 폐지 — 사진 분석을 더 이상 하지 않는다.
   * 이미지 토큰은 비싼데 돌아오는 건 "체형이 양호해 보입니다" 수준의 추측이었고,
   * 수의사도 사진만으로 판단하지 않는 것을 우리가 단정할 수는 없다.
   * 옛 리포트에는 이 값이 남아 있어 필드를 지우지 않고 선택으로만 바꾼다(화면은 있으면 그린다).
   */
  photoAnalysis?: {
    breedGuess: string;
    bodyCondition: string;
    coatSkinNotes: string;
    confidence: 'high' | 'medium' | 'low';
  };
  /** 생성일 "YYYY-MM-DD". 저장된 리포트를 나중에 열어도 만든 날짜가 그대로 보이도록 카드에 박아둔다. */
  generatedAt?: string;
  /**
   * 리포트 상단 프로필 — 이름·품종·나이·체중과 거기서 **계산된** 판정들.
   *
   * ⚠️ 왜 카드 안에 넣는가: 리포트를 그리는 3곳(PetForm·ReportClient·SavedReport)에 전부
   *    PetInput을 흘려보내는 대신, 카드가 스스로를 설명하게 했다. 카드는 DB에 저장되는
   *    단위라서, 여기 담아두면 **60일 뒤 다시 열어도 같은 값이 나온다.** 입력값을 따로
   *    들고 다니면 저장·조회 경로마다 유실될 자리가 생긴다.
   * ⚠️ 옛 리포트에는 없으므로 선택 필드다. 없으면 화면이 프로필 블록을 그리지 않는다.
   */
  profile?: {
    breedKo: string;
    breedEn?: string;
    /** "8살 2개월" — 생일을 모르면 없음 */
    ageLabel?: string;
    /** 생애 단계 (성장기/성견기/노령기 등) */
    stage: string;
    /** "남아(중성화)" 같은 표기. 성별을 모르면 없음 */
    sexKo?: string;
    weightKg?: number;
    /** 품종 표준 체중 "2.0–3.5" */
    weightRange?: string;
    /** 표준 범위와 대조한 판정. 체중이나 표준값을 모르면 없음 */
    bodyLabel?: string;
    bodyTone?: 'ok' | 'warn' | 'info';
    /** 품종 체급 (초소형/소형/…) */
    sizeLabel?: string;
    /** 하루 권장 운동량 */
    activityLabel: string;
    /** 종합 소견의 긴급도를 한 단어로 */
    healthLabel: string;
    healthTone: 'now' | 'soon' | 'routine';
    humanAgeYears?: number;
    /** 품종 평균 수명 "12–15" */
    lifeYears?: string;
  };
  /**
   * 예방접종·검진 예정일. **생성 시점에 계산한 날짜만** 담고,
   * D-day는 화면에서 매번 다시 센다(저장된 리포트를 나중에 열어도 맞게 보이도록).
   */
  schedule?: { type: string; title: string; dueDate: string }[];
  /** 이번 주 실천 항목 — 루틴에서 뽑은 짧은 문장. 요일 체크용. */
  weekly?: string[];
  /** 하루 급여 기준 — 체중·나이·중성화로 계산한다. 체중을 모르면 g수 없이 원칙만 남는다. */
  feeding?: { dailyKcal?: string; dailyGram?: string; meals: string; notes: string[] };
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
export type PreviewCard = Pick<CareCard, 'breedTraits' | 'sources'>;

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
