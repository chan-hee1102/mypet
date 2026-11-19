/**
 * 품종별 돌봄 특성 — 키우기 안내판(2026-11-19 개편)의 뼈대. 숫자·등급·표시(flags)는 화면의 「한눈에」 판과
 * 준비물 카드(lib/shop.ts)가 고르는 기준이 되고, notes는 칸마다 그 품종에만 해당하는 한두 문장이다.
 *
 * 데이터는 lib/data/care/*.json(품종 188종). breed는 lib/breedKnowledge.json의 breed_ko와 글자까지 같아야 한다.
 * 출처는 품종 표준 단체(AKC·FCI·UK KC·TICA·CFA·International Cat Care)와 수의 지침(WSAVA·AAHA)만 —
 * 나무위키(CC BY-NC-SA, 비영리 조건)·네이버·블로그 글은 상업 사이트라 쓰지 않는다.
 */

export type Level = 1 | 2 | 3 | 4 | 5;

/** 개: toy 다 큰 체중 4kg 미만 · small 4~10 · medium 10~25 · large 25~45 · giant 45 이상. 고양이: small 3.5 미만 · medium 3.5~6 · large 6 이상 */
export type SizeClass = 'toy' | 'small' | 'medium' | 'large' | 'giant';

export type Coat = 'short' | 'double' | 'long' | 'curly' | 'wire' | 'silky' | 'hairless';

export const FLAGS = {
  patella: '슬개골 탈구가 잘 생겨요',
  hip: '고관절 이형성이 보고돼요',
  back: '허리 디스크(IVDD)를 조심해야 해요',
  trachea: '기관 허탈이 보고돼요 — 목줄보다 가슴줄',
  brachy: '코가 짧은 단두종 — 더위·호흡 조심',
  eyes: '눈이 크거나 돌출돼 다치기 쉬워요',
  tearStain: '눈물 자국이 잘 생겨요',
  ears: '귀가 덮여 있어 외이염이 잦아요',
  skinFold: '피부 주름 사이를 닦아 줘야 해요',
  skin: '피부가 예민한 편이에요',
  dental: '치석·치주질환이 잘 생겨요',
  obesity: '살이 잘 쪄요',
  bloat: '위확장 염전 위험 — 식후 바로 뛰지 않게',
  separation: '혼자 있는 걸 힘들어할 수 있어요',
  prey: '사냥·추격 본능이 강해요 — 리드줄 필수',
  escape: '탈출·땅 파기를 잘해요',
  dangerous: '동물보호법상 맹견이에요',
  drool: '침을 많이 흘려요',
  heart: '심장병이 보고돼요',
  kidney: '신장병이 보고돼요',
  urinary: '방광·요로 질환을 조심해요',
  hairball: '헤어볼이 잘 생겨요',
  climber: '높은 곳을 좋아해요',
  joint: '관절·연골 질환이 보고돼요',
} as const;

export type Flag = keyof typeof FLAGS;

/** 「이런 아이예요」 조심할 점 이름표 — 짧은 이름 + 묶음(건강·관리·생활·법). 긴 문장(FLAGS)은 건강 칸·자세히 보기에 남는다(2026-11-19) */
export const FLAG_SHORT: Record<Flag, { label: string; group: 'health' | 'care' | 'life' | 'law' }> = {
  patella: { label: '슬개골 탈구', group: 'health' },
  hip: { label: '고관절 이형성', group: 'health' },
  back: { label: '허리 디스크', group: 'health' },
  trachea: { label: '기관 허탈', group: 'health' },
  brachy: { label: '짧은 코 호흡', group: 'health' },
  eyes: { label: '눈 다침', group: 'health' },
  tearStain: { label: '눈물 자국', group: 'care' },
  ears: { label: '외이염', group: 'health' },
  skinFold: { label: '주름 사이 관리', group: 'care' },
  skin: { label: '예민한 피부', group: 'health' },
  dental: { label: '치주질환', group: 'health' },
  obesity: { label: '살찌기 쉬움', group: 'health' },
  bloat: { label: '위확장 염전', group: 'health' },
  separation: { label: '분리불안', group: 'life' },
  prey: { label: '강한 사냥 본능', group: 'life' },
  escape: { label: '탈출·땅 파기', group: 'life' },
  dangerous: { label: '법정 맹견', group: 'law' },
  drool: { label: '침 흘림', group: 'care' },
  heart: { label: '심장병', group: 'health' },
  kidney: { label: '신장병', group: 'health' },
  urinary: { label: '요로 질환', group: 'health' },
  hairball: { label: '헤어볼', group: 'care' },
  climber: { label: '높은 곳 좋아함', group: 'life' },
  joint: { label: '관절 질환', group: 'health' },
};

export type CareNotes = {
  /** 사료: 알갱이 크기·급여 횟수·살찌기·소화·성장기 */
  food: string;
  /** 간식: 양·크기·씹는 간식 주의·훈련 보상 */
  treat: string;
  /** 장난감: 씹는 힘·놀이 성향(물어오기·노즈워크·터그·사냥 놀이) */
  toy: string;
  /** 개: 산책·운동 / 고양이: 놀이·운동 */
  walk: string;
  /** 털·미용·목욕·눈·귀 */
  grooming: string;
  /** 개: 배변 훈련·패드 / 고양이: 화장실·모래 */
  potty: string;
  /** 집 환경: 아파트·미끄럼·계단·온도·혼자 있는 시간 */
  home: string;
  /** 건강: 정기 검진에서 볼 것(병명은 「보고돼요」까지, 단정 금지) */
  health: string;
};

export type CareProfile = {
  breed: string;
  species: 'dog' | 'cat';
  sizeClass: SizeClass;
  coat: Coat;
  /** 1 거의 안 빠짐 ~ 5 아주 많이(털갈이 철엔 뭉텅이로) */
  shedding: Level;
  /** 빗질: 매일 · 주 2~3회 · 주 1회 */
  brushing: 'daily' | 'few' | 'weekly';
  /** 전문 미용(커트) 간격(주). 커트가 필요 없는 털이면 null */
  trimWeeks: [number, number] | null;
  /** 목욕 간격(주) */
  bathWeeks: [number, number];
  /** 활동량 1 아주 차분 ~ 5 아주 활발 */
  energy: Level;
  /** 개: 하루 산책·운동 합계(분) / 고양이: 하루 놀이 합계(분) */
  exerciseMin: [number, number];
  /** 개만: 하루 산책 횟수. 고양이는 null */
  walksPerDay: [number, number] | null;
  /** 씹는 힘·파괴력 1 약함 ~ 5 아주 셈 — 장난감 내구성 */
  chewer: Level;
  /** 짖음(개)·울음(고양이) 1 조용 ~ 5 아주 많음 */
  voice: Level;
  /** 더위에 약한 정도 1~3 */
  heat: 1 | 2 | 3;
  /** 추위에 약한 정도 1~3 */
  cold: 1 | 2 | 3;
  /** 알맞은 사료 알갱이 */
  kibble: 'small' | 'medium' | 'large';
  flags: Flag[];
  notes: CareNotes;
  sources: { org: string; url: string }[];
};

export const SIZE_LABEL: Record<SizeClass, string> = { toy: '초소형', small: '소형', medium: '중형', large: '대형', giant: '초대형' };
export const COAT_LABEL: Record<Coat, string> = { short: '단모', double: '이중모', long: '장모', curly: '곱슬털', wire: '뻣뻣한 털', silky: '비단 같은 장모', hairless: '털 없음' };
export const BRUSH_LABEL: Record<CareProfile['brushing'], string> = { daily: '매일', few: '주 2~3번', weekly: '주 1번' };
export const KIBBLE_LABEL: Record<CareProfile['kibble'], string> = { small: '작은 알갱이', medium: '보통 알갱이', large: '큰 알갱이' };
