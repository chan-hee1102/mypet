import links from './data/coupang-links.json';
import type { CareProfile } from './careProfile';

/**
 * 준비물 카드 — 품종마다 상품을 고르지 않고 「특징 묶음」에 건다(2026-11-19 개편).
 * 체구·털·표시(flags)를 보고 칸마다 점수가 높은 카드 2~3장을 붙인다. 상품 40~80개만 링크를 만들면 188종에 다 붙는다.
 *
 * 링크: lib/data/coupang-links.json { 카드 id: 쿠팡 파트너스 링크 }. 링크가 없는 카드는 운영 화면에 나오지 않는다
 *   (개발 화면에서는 「링크 준비 중」으로 보인다 — 디자인 확인용). 쿠팡 페이지를 긁어 오지 않는다 — 이름·이미지·가격을 우리가 저장하지 않는다.
 *   쿠팡 API(최종 승인 = 누적 판매 15만 원 뒤)가 열리면 같은 id에 실제 상품(이미지·이름)을 붙인다.
 *
 * ⚠️ 문구 규칙(표시광고법·추천보증 심사지침): pick은 「고르는 기준」(사실)만 쓴다. 효능(「~에 좋아요」「예방」「개선」)·최저가·최고 표현 금지.
 *    카드가 있는 페이지는 위쪽과 카드 묶음 위에 대가성 문구를 낸다(components/ShopCards.tsx).
 */

export type ShopCat = 'food' | 'treat' | 'toy' | 'walk' | 'grooming' | 'potty' | 'home';

export type ShopIcon =
  | 'bag' | 'can' | 'bowl' | 'slowBowl' | 'bone' | 'chew' | 'tube' | 'nose' | 'rope' | 'ring' | 'plush' | 'ball' | 'puzzle'
  | 'wand' | 'kicker' | 'tunnel' | 'harness' | 'leash' | 'poopBag' | 'tag' | 'vest' | 'muzzle' | 'brush' | 'comb' | 'rake'
  | 'rubber' | 'bottle' | 'clipper' | 'tooth' | 'wipe' | 'pad' | 'tray' | 'spray' | 'fence' | 'mat' | 'stairs' | 'bed'
  | 'coolMat' | 'crate' | 'cam' | 'tower' | 'wheel' | 'hammock' | 'litter' | 'box' | 'scratcher' | 'fountain' | 'house'
  | 'window' | 'heater' | 'clothes' | 'carrier' | 'leaf';

type P = CareProfile;
export type Slot = {
  id: string;
  species: 'dog' | 'cat';
  cat: ShopCat;
  title: string;
  /** 고르는 기준 — 사실만 */
  pick: string;
  /** 쿠팡 검색어(관리자 화면이 검색 주소를 만들어 준다) */
  q: string;
  icon: ShopIcon;
  /** 0이면 안 붙인다. 클수록 먼저 */
  score: (p: P) => number;
};

const has = (p: P, ...f: P['flags']) => f.some((x) => p.flags.includes(x));
const small = (p: P) => p.sizeClass === 'toy' || p.sizeClass === 'small';
const mid = (p: P) => p.sizeClass === 'medium';
const big = (p: P) => p.sizeClass === 'large' || p.sizeClass === 'giant';
const longish = (p: P) => ['long', 'curly', 'silky', 'double'].includes(p.coat);

export const SLOTS: Slot[] = [
  // ── 강아지 · 사료 ──
  { id: 'dog-food-puppy-small', species: 'dog', cat: 'food', title: '소형견 퍼피 사료', pick: '작은 알갱이에 「성장기」나 「퍼피」 표시가 있는 것', q: '소형견 퍼피 사료', icon: 'bag', score: (p) => (small(p) ? 6 : 0) },
  { id: 'dog-food-adult-small', species: 'dog', cat: 'food', title: '소형견 성견 사료', pick: '작은 알갱이에 「성견」 표시가 있는 것', q: '소형견 성견 사료', icon: 'bag', score: (p) => (small(p) ? 7 : 0) },
  { id: 'dog-food-puppy-medium', species: 'dog', cat: 'food', title: '중형견 퍼피 사료', pick: '보통 알갱이에 「성장기」 표시가 있는 것', q: '중형견 퍼피 사료', icon: 'bag', score: (p) => (mid(p) ? 6 : 0) },
  { id: 'dog-food-adult-medium', species: 'dog', cat: 'food', title: '중형견 성견 사료', pick: '보통 알갱이에 「성견」 표시가 있는 것', q: '중형견 성견 사료', icon: 'bag', score: (p) => (mid(p) ? 7 : 0) },
  { id: 'dog-food-puppy-large', species: 'dog', cat: 'food', title: '대형견 퍼피 사료', pick: '「대형견 성장기」 표시가 있는 것 — 포장에서 확인', q: '대형견 퍼피 사료', icon: 'bag', score: (p) => (big(p) ? 7 : 0) },
  { id: 'dog-food-adult-large', species: 'dog', cat: 'food', title: '대형견 성견 사료', pick: '큰 알갱이에 「성견」 표시가 있는 것', q: '대형견 성견 사료', icon: 'bag', score: (p) => (big(p) ? 6 : 0) },
  { id: 'dog-food-senior', species: 'dog', cat: 'food', title: '노령견 사료', pick: '「노령견」 표시 — 소형견은 8살, 대형견은 6살 무렵부터 보는 보호자가 많아요', q: '노령견 사료', icon: 'bag', score: () => 2 },
  { id: 'dog-food-light', species: 'dog', cat: 'food', title: '체중 관리 사료', pick: '「라이트」·「체중 관리」 표시, 100g당 열량이 낮은 것', q: '강아지 체중관리 사료', icon: 'bag', score: (p) => (has(p, 'obesity') ? 8 : 0) },
  { id: 'dog-food-slowbowl', species: 'dog', cat: 'food', title: '천천히 먹는 식기', pick: '바닥에 홈이 파인 식기 — 허겁지겁 먹는 아이용', q: '강아지 슬로우 식기', icon: 'slowBowl', score: (p) => (has(p, 'bloat') ? 9 : has(p, 'obesity') ? 5 : 0) },

  // ── 강아지 · 간식 ──
  { id: 'dog-treat-training', species: 'dog', cat: 'treat', title: '훈련용 작은 간식', pick: '한 알이 작고 열량이 낮은 것 — 하루 열량의 10% 안에서', q: '강아지 훈련용 간식', icon: 'bone', score: () => 6 },
  { id: 'dog-treat-dental-small', species: 'dog', cat: 'treat', title: '소형견 덴탈껌', pick: '포장에 적힌 체중 범위가 우리 아이에게 맞는 크기', q: '소형견 덴탈껌', icon: 'chew', score: (p) => (small(p) ? (has(p, 'dental') ? 8 : 5) : 0) },
  { id: 'dog-treat-dental-large', species: 'dog', cat: 'treat', title: '중·대형견 덴탈껌', pick: '포장에 적힌 체중 범위가 우리 아이에게 맞는 크기', q: '대형견 덴탈껌', icon: 'chew', score: (p) => (small(p) ? 0 : has(p, 'dental') ? 8 : 5) },
  { id: 'dog-treat-longchew', species: 'dog', cat: 'treat', title: '오래 씹는 간식', pick: '통째로 삼킬 수 없는 크기 — 씹는 동안은 곁에서 지켜보기', q: '대형견 오래 씹는 간식', icon: 'chew', score: (p) => (p.chewer >= 4 ? 7 : 0) },
  { id: 'dog-treat-single', species: 'dog', cat: 'treat', title: '단일 원료 동결건조 간식', pick: '원료가 한 가지인 것 — 먹고 탈이 난 재료를 찾기 쉬워요', q: '강아지 동결건조 간식', icon: 'bone', score: (p) => (has(p, 'skin') ? 7 : 3) },

  // ── 강아지 · 장난감 ──
  { id: 'dog-toy-nose', species: 'dog', cat: 'toy', title: '노즈워크 매트', pick: '천 사이에 간식을 숨겨 냄새로 찾게 하는 매트', q: '강아지 노즈워크 매트', icon: 'nose', score: (p) => (has(p, 'prey', 'separation') ? 8 : 6) },
  { id: 'dog-toy-tug', species: 'dog', cat: 'toy', title: '터그 로프', pick: '양 끝을 잡고 당기는 놀이용 — 손을 다치지 않을 길이', q: '강아지 터그 로프', icon: 'rope', score: (p) => (p.energy >= 3 && p.sizeClass !== 'toy' ? 5 : 0) },
  { id: 'dog-toy-tough', species: 'dog', cat: 'toy', title: '튼튼한 고무 장난감', pick: '씹는 힘이 센 아이용 — 강도 표시가 높고 입보다 큰 것', q: '강아지 튼튼한 고무 장난감', icon: 'ring', score: (p) => (p.chewer >= 4 ? 9 : p.chewer === 3 ? 4 : 0) },
  { id: 'dog-toy-plush', species: 'dog', cat: 'toy', title: '작은 봉제 장난감', pick: '소리 나는 작은 봉제 — 솜이 보이기 시작하면 치워 주세요', q: '소형견 봉제 장난감', icon: 'plush', score: (p) => (small(p) && p.chewer <= 3 ? 6 : 0) },
  { id: 'dog-toy-ball', species: 'dog', cat: 'toy', title: '던지기 공', pick: '입에 쏙 들어가지 않는 크기 — 삼킬 수 없는 공', q: '강아지 공 장난감', icon: 'ball', score: (p) => (p.energy >= 4 && !small(p) ? 7 : p.energy >= 4 ? 4 : 0) },
  { id: 'dog-toy-puzzle', species: 'dog', cat: 'toy', title: '퍼즐 급식기', pick: '굴리거나 밀어서 사료를 꺼내 먹는 장난감', q: '강아지 퍼즐 장난감', icon: 'puzzle', score: (p) => (has(p, 'separation', 'obesity') ? 7 : p.energy >= 4 ? 5 : 2) },

  // ── 강아지 · 산책 ──
  { id: 'dog-walk-vest', species: 'dog', cat: 'walk', title: '조끼형 가슴줄', pick: '목을 누르지 않고 가슴을 넓게 받치는 것', q: '소형견 조끼형 하네스', icon: 'harness', score: (p) => (has(p, 'trachea', 'brachy') ? 10 : small(p) ? 7 : 0) },
  { id: 'dog-walk-yharness', species: 'dog', cat: 'walk', title: 'Y형 가슴줄', pick: '앞다리 어깨 움직임을 막지 않는 Y자 모양', q: '중대형견 Y형 하네스', icon: 'harness', score: (p) => (!small(p) ? (has(p, 'brachy', 'trachea') ? 9 : 7) : 0) },
  { id: 'dog-walk-leash', species: 'dog', cat: 'walk', title: '리드줄(2m 이하)', pick: '외출할 땐 2m 이내 — 자동줄은 2m에서 잠가 쓰기', q: '강아지 리드줄 2m', icon: 'leash', score: (p) => (has(p, 'prey', 'escape') ? 8 : 5) },
  { id: 'dog-walk-poopbag', species: 'dog', cat: 'walk', title: '배변봉투와 케이스', pick: '리드줄에 달 수 있는 케이스 — 배설물 수거는 법적 의무예요', q: '강아지 배변봉투 케이스', icon: 'poopBag', score: () => 4 },
  { id: 'dog-walk-tag', species: 'dog', cat: 'walk', title: '인식표', pick: '보호자 이름·연락처·동물등록번호를 새길 수 있는 것', q: '강아지 인식표', icon: 'tag', score: () => 3 },
  { id: 'dog-walk-coolvest', species: 'dog', cat: 'walk', title: '쿨조끼', pick: '물에 적셔 입히는 것 — 한낮 산책을 피하는 게 먼저예요', q: '강아지 쿨조끼', icon: 'vest', score: (p) => (p.heat >= 3 ? 8 : 0) },
  { id: 'dog-walk-coat', species: 'dog', cat: 'walk', title: '겨울 패딩', pick: '배와 가슴까지 덮는 것', q: '강아지 패딩', icon: 'clothes', score: (p) => (p.cold >= 3 ? 8 : 0) },
  { id: 'dog-walk-muzzle', species: 'dog', cat: 'walk', title: '바스켓 입마개', pick: '입을 벌려 숨 쉬고 물을 마실 수 있는 바구니형', q: '대형견 바스켓 입마개', icon: 'muzzle', score: (p) => (has(p, 'dangerous') ? 12 : 0) },

  // ── 강아지 · 미용 ──
  { id: 'dog-groom-slicker', species: 'dog', cat: 'grooming', title: '슬리커 브러시', pick: '가는 핀이 촘촘한 빗 — 엉킨 털을 풀 때', q: '강아지 슬리커 브러시', icon: 'brush', score: (p) => (longish(p) ? (p.brushing === 'daily' ? 9 : 7) : 0) },
  { id: 'dog-groom-comb', species: 'dog', cat: 'grooming', title: '일자 콤', pick: '빗질 끝에 엉킨 곳이 남았는지 확인하는 빗', q: '강아지 일자 콤', icon: 'comb', score: (p) => (['curly', 'silky', 'long'].includes(p.coat) ? 7 : 0) },
  { id: 'dog-groom-rake', species: 'dog', cat: 'grooming', title: '속털 빗', pick: '빠진 속털을 걷어 내는 갈퀴형 빗 — 털갈이 철에', q: '강아지 언더코트 빗', icon: 'rake', score: (p) => (p.coat === 'double' && p.shedding >= 4 ? 9 : p.coat === 'double' ? 6 : 0) },
  { id: 'dog-groom-rubber', species: 'dog', cat: 'grooming', title: '고무 브러시', pick: '짧은 털 사이 죽은 털을 걷어 내는 고무 빗', q: '강아지 고무 브러시', icon: 'rubber', score: (p) => (p.coat === 'short' ? 8 : 0) },
  { id: 'dog-groom-strip', species: 'dog', cat: 'grooming', title: '스트리핑 빗', pick: '뻣뻣한 털을 손질하는 도구 — 처음엔 미용사에게 방법을 배우기', q: '강아지 스트리핑 나이프', icon: 'comb', score: (p) => (p.coat === 'wire' ? 8 : 0) },
  { id: 'dog-groom-shampoo', species: 'dog', cat: 'grooming', title: '저자극 강아지 샴푸', pick: '반려견 전용에 향이 약한 것', q: '강아지 저자극 샴푸', icon: 'bottle', score: (p) => (has(p, 'skin', 'skinFold') || p.coat === 'hairless' ? 8 : 4) },
  { id: 'dog-groom-nail', species: 'dog', cat: 'grooming', title: '발톱깎이', pick: '발 크기에 맞는 크기 — 분홍 혈관 앞까지만', q: '강아지 발톱깎이', icon: 'clipper', score: () => 4 },
  { id: 'dog-groom-tooth', species: 'dog', cat: 'grooming', title: '강아지 칫솔·치약', pick: '삼켜도 되는 반려견 전용 치약, 입에 맞는 칫솔 크기', q: '강아지 칫솔 치약', icon: 'tooth', score: (p) => (has(p, 'dental') ? 9 : 5) },
  { id: 'dog-groom-eye', species: 'dog', cat: 'grooming', title: '눈가 닦는 거즈', pick: '눈물이 고이는 눈가를 닦는 반려동물용', q: '강아지 눈물 자국 거즈', icon: 'wipe', score: (p) => (has(p, 'tearStain', 'eyes') ? 8 : 0) },
  { id: 'dog-groom-ear', species: 'dog', cat: 'grooming', title: '귀 세정제', pick: '반려견 전용 — 면봉은 귀 안쪽 깊이 넣지 않기', q: '강아지 귀 세정제', icon: 'bottle', score: (p) => (has(p, 'ears') ? 8 : 0) },
  { id: 'dog-groom-fold', species: 'dog', cat: 'grooming', title: '주름 닦는 물티슈', pick: '주름 사이를 닦은 뒤 마른 수건으로 말려 주기', q: '강아지 주름 물티슈', icon: 'wipe', score: (p) => (has(p, 'skinFold') ? 9 : 0) },

  // ── 강아지 · 배변 ──
  { id: 'dog-potty-pad', species: 'dog', cat: 'potty', title: '배변패드 일반형', pick: '몸이 패드 안에 다 들어가는 크기', q: '강아지 배변패드', icon: 'pad', score: (p) => (small(p) ? 8 : 0) },
  { id: 'dog-potty-padwide', species: 'dog', cat: 'potty', title: '배변패드 대형', pick: '몸이 패드 안에 다 들어가는 넓은 것', q: '대형 배변패드', icon: 'pad', score: (p) => (small(p) ? 0 : 7) },
  { id: 'dog-potty-tray', species: 'dog', cat: 'potty', title: '배변판', pick: '패드를 끼워 찢거나 밀리지 않게 잡아 주는 판', q: '강아지 배변판', icon: 'tray', score: (p) => (big(p) ? 0 : 5) },
  { id: 'dog-potty-odor', species: 'dog', cat: 'potty', title: '배변 냄새 탈취제', pick: '반려동물용 — 실수한 자리에 냄새가 남으면 또 싸기 쉬워요', q: '반려동물 탈취제', icon: 'spray', score: () => 4 },
  { id: 'dog-potty-fence', species: 'dog', cat: 'potty', title: '실내 울타리', pick: '배변 자리와 잠자리를 나눠 주는 높이', q: '강아지 울타리', icon: 'fence', score: (p) => (big(p) ? 2 : 3) },

  // ── 강아지 · 집 ──
  { id: 'dog-home-mat', species: 'dog', cat: 'home', title: '미끄럼 방지 매트', pick: '거실·복도처럼 자주 뛰는 바닥에 까는 것', q: '강아지 미끄럼방지 매트', icon: 'mat', score: (p) => (has(p, 'patella', 'hip', 'back', 'joint') ? 10 : small(p) ? 5 : 3) },
  { id: 'dog-home-stairs', species: 'dog', cat: 'home', title: '강아지 계단', pick: '소파·침대 높이에 맞고 디딤판이 넓은 것', q: '강아지 계단', icon: 'stairs', score: (p) => (has(p, 'back') ? 10 : has(p, 'patella') && small(p) ? 8 : 0) },
  { id: 'dog-home-bed', species: 'dog', cat: 'home', title: '방석', pick: '몸을 쭉 펴고 누울 수 있는 크기', q: '강아지 방석', icon: 'bed', score: (p) => (big(p) ? 3 : 5) },
  { id: 'dog-home-orthobed', species: 'dog', cat: 'home', title: '두꺼운 메모리폼 방석', pick: '두께가 있는 메모리폼에 몸을 쭉 펴고 누울 크기', q: '대형견 메모리폼 방석', icon: 'bed', score: (p) => (big(p) || has(p, 'hip', 'joint') ? 7 : 0) },
  { id: 'dog-home-coolmat', species: 'dog', cat: 'home', title: '쿨매트', pick: '여름 실내용 — 에어컨으로 온도를 먼저 맞추기', q: '강아지 쿨매트', icon: 'coolMat', score: (p) => (p.heat >= 3 ? 8 : 0) },
  { id: 'dog-home-crate', species: 'dog', cat: 'home', title: '켄넬·하우스', pick: '안에서 일어서고 돌 수 있는 크기', q: '강아지 켄넬', icon: 'crate', score: (p) => (has(p, 'separation') ? 7 : 4) },
  { id: 'dog-home-cam', species: 'dog', cat: 'home', title: '반려동물 홈캠', pick: '외출 중 휴대폰으로 볼 수 있는 것', q: '반려동물 홈캠', icon: 'cam', score: (p) => (has(p, 'separation') ? 8 : 0) },

  // ── 고양이 · 사료 ──
  { id: 'cat-food-kitten', species: 'cat', cat: 'food', title: '키튼 사료', pick: '1살 전까지 — 「성장기」나 「키튼」 표시가 있는 것', q: '키튼 사료', icon: 'bag', score: () => 6 },
  { id: 'cat-food-adult', species: 'cat', cat: 'food', title: '성묘 사료', pick: '「성묘」 또는 「전 연령」 표시가 있는 것', q: '성묘 사료', icon: 'bag', score: () => 7 },
  { id: 'cat-food-wet', species: 'cat', cat: 'food', title: '습식 캔·파우치', pick: '수분이 많은 습식 — 물을 적게 마시는 아이에게', q: '고양이 습식 캔', icon: 'can', score: (p) => (has(p, 'kidney', 'urinary') ? 9 : 6) },
  { id: 'cat-food-senior', species: 'cat', cat: 'food', title: '노령묘 사료', pick: '「노령묘」 표시 — 10살 무렵부터 보는 보호자가 많아요', q: '노령묘 사료', icon: 'bag', score: () => 2 },
  { id: 'cat-food-light', species: 'cat', cat: 'food', title: '체중 관리 사료', pick: '「라이트」·「체중 관리」 표시, 100g당 열량이 낮은 것', q: '고양이 체중관리 사료', icon: 'bag', score: (p) => (has(p, 'obesity') ? 8 : 0) },
  { id: 'cat-food-bowl', species: 'cat', cat: 'food', title: '높이 있는 식기', pick: '목을 덜 숙이게 받침이 있고 넓고 얕은 그릇', q: '고양이 높이 식기', icon: 'bowl', score: (p) => (has(p, 'brachy') ? 8 : 3) },

  // ── 고양이 · 간식 ──
  { id: 'cat-treat-lick', species: 'cat', cat: 'treat', title: '짜 먹는 간식', pick: '하루 열량의 10% 안에서 — 한두 개면 충분해요', q: '고양이 짜먹는 간식', icon: 'tube', score: () => 6 },
  { id: 'cat-treat-freeze', species: 'cat', cat: 'treat', title: '동결건조 간식', pick: '원료가 한 가지인 것 — 먹고 탈이 난 재료를 찾기 쉬워요', q: '고양이 동결건조 간식', icon: 'bone', score: (p) => (has(p, 'skin') ? 7 : 5) },
  { id: 'cat-treat-dental', species: 'cat', cat: 'treat', title: '고양이 덴탈 간식', pick: '바삭하게 씹히는 크기 — 양치를 대신하지는 않아요', q: '고양이 덴탈 간식', icon: 'chew', score: (p) => (has(p, 'dental') ? 7 : 3) },

  // ── 고양이 · 장난감 ──
  { id: 'cat-toy-wand', species: 'cat', cat: 'toy', title: '낚싯대 장난감', pick: '사냥하듯 쫓게 — 놀고 나면 줄은 치워 두기', q: '고양이 낚싯대 장난감', icon: 'wand', score: (p) => (p.energy >= 4 ? 9 : 7) },
  { id: 'cat-toy-kicker', species: 'cat', cat: 'toy', title: '쿠션 킥 인형', pick: '앞발로 안고 뒷발로 차기 좋은 길쭉한 인형', q: '고양이 킥 인형', icon: 'kicker', score: () => 5 },
  { id: 'cat-toy-track', species: 'cat', cat: 'toy', title: '공 트랙 장난감', pick: '혼자서도 굴리며 노는 것', q: '고양이 공 트랙', icon: 'ball', score: (p) => (has(p, 'separation') ? 7 : 4) },
  { id: 'cat-toy-puzzle', species: 'cat', cat: 'toy', title: '퍼즐 급식기', pick: '앞발로 사료를 꺼내 먹는 장난감', q: '고양이 퍼즐 급식기', icon: 'puzzle', score: (p) => (has(p, 'obesity') ? 8 : p.energy >= 4 ? 6 : 3) },
  { id: 'cat-toy-tunnel', species: 'cat', cat: 'toy', title: '고양이 터널', pick: '숨었다 튀어나오며 노는 접이식', q: '고양이 터널', icon: 'tunnel', score: (p) => (p.energy >= 3 ? 5 : 2) },
  { id: 'cat-toy-nip', species: 'cat', cat: 'toy', title: '캣닢·마따따비', pick: '반응하는 고양이가 많지만 안 하는 아이도 있어요', q: '캣닢', icon: 'leaf', score: () => 3 },

  // ── 고양이 · 놀이·운동(walk 칸) ──
  { id: 'cat-play-tower', species: 'cat', cat: 'walk', title: '캣타워', pick: '천장 가까이 오를 수 있는 높이 — 벽이나 천장에 고정', q: '고양이 캣타워', icon: 'tower', score: (p) => (has(p, 'joint') ? 0 : has(p, 'climber') ? 10 : 7) },
  { id: 'cat-play-towerbig', species: 'cat', cat: 'walk', title: '대형묘 캣타워', pick: '발판이 넓고 기둥이 굵어 흔들리지 않는 것', q: '대형묘 캣타워', icon: 'tower', score: (p) => (p.sizeClass === 'large' ? 9 : 0) },
  { id: 'cat-play-towerlow', species: 'cat', cat: 'walk', title: '낮은 캣타워·계단', pick: '단 높이가 낮고 디딤판이 넓은 것', q: '고양이 계단 낮은 캣타워', icon: 'stairs', score: (p) => (has(p, 'joint') ? 10 : 0) },
  { id: 'cat-play-wheel', species: 'cat', cat: 'walk', title: '캣휠', pick: '지름이 넓고 바닥이 미끄럽지 않은 것', q: '캣휠', icon: 'wheel', score: (p) => (p.energy >= 5 && !has(p, 'joint') ? 8 : 0) },
  { id: 'cat-play-hammock', species: 'cat', cat: 'walk', title: '창문 해먹', pick: '창밖을 볼 수 있게 붙이는 것 — 고정 하중 확인', q: '고양이 창문 해먹', icon: 'hammock', score: (p) => (has(p, 'joint') ? 0 : 5) },

  // ── 고양이 · 미용 ──
  { id: 'cat-groom-comb', species: 'cat', cat: 'grooming', title: '고양이 일자 콤', pick: '촘촘한 쪽과 성긴 쪽이 같이 있는 빗', q: '고양이 일자 콤', icon: 'comb', score: (p) => (['long', 'silky'].includes(p.coat) ? 9 : 0) },
  { id: 'cat-groom-slicker', species: 'cat', cat: 'grooming', title: '고양이 슬리커 브러시', pick: '핀 끝이 둥글게 처리된 것', q: '고양이 슬리커 브러시', icon: 'brush', score: (p) => (['long', 'silky', 'double'].includes(p.coat) ? 7 : 0) },
  { id: 'cat-groom-rubber', species: 'cat', cat: 'grooming', title: '고무 브러시', pick: '짧은 털 사이 죽은 털을 걷어 내는 고무 빗', q: '고양이 고무 브러시', icon: 'rubber', score: (p) => (p.coat === 'short' ? 8 : 0) },
  { id: 'cat-groom-deshed', species: 'cat', cat: 'grooming', title: '죽은 털 빗', pick: '빠진 속털을 걷어 내는 빗 — 털갈이 철에', q: '고양이 죽은털 빗', icon: 'rake', score: (p) => (p.shedding >= 4 ? 8 : 0) },
  { id: 'cat-groom-nail', species: 'cat', cat: 'grooming', title: '고양이 발톱깎이', pick: '작은 가위형 — 분홍 혈관 앞까지만', q: '고양이 발톱깎이', icon: 'clipper', score: () => 4 },
  { id: 'cat-groom-tooth', species: 'cat', cat: 'grooming', title: '고양이 칫솔·치약', pick: '삼켜도 되는 반려묘 전용 치약, 머리가 작은 칫솔', q: '고양이 칫솔 치약', icon: 'tooth', score: (p) => (has(p, 'dental') ? 9 : 5) },
  { id: 'cat-groom-eye', species: 'cat', cat: 'grooming', title: '눈가 닦는 거즈', pick: '눈물이 고이는 눈가를 닦는 반려동물용', q: '고양이 눈물 자국 거즈', icon: 'wipe', score: (p) => (has(p, 'tearStain', 'eyes', 'brachy') ? 8 : 0) },
  { id: 'cat-groom-shampoo', species: 'cat', cat: 'grooming', title: '고양이 저자극 샴푸', pick: '반려묘 전용에 향이 약한 것', q: '고양이 저자극 샴푸', icon: 'bottle', score: (p) => (p.coat === 'hairless' ? 10 : p.coat === 'curly' || has(p, 'skin') ? 6 : 0) },
  { id: 'cat-groom-wipe', species: 'cat', cat: 'grooming', title: '반려동물 물티슈', pick: '피부 기름을 닦아 내는 무향 물티슈', q: '반려동물 물티슈 무향', icon: 'wipe', score: (p) => (p.coat === 'hairless' ? 9 : 0) },
  { id: 'cat-groom-ear', species: 'cat', cat: 'grooming', title: '고양이 귀 세정제', pick: '반려묘 전용 — 면봉은 귀 안쪽 깊이 넣지 않기', q: '고양이 귀 세정제', icon: 'bottle', score: (p) => (p.coat === 'hairless' || has(p, 'ears') ? 7 : 0) },

  // ── 고양이 · 화장실 ──
  { id: 'cat-potty-bento', species: 'cat', cat: 'potty', title: '벤토나이트 모래', pick: '잘 뭉치고 먼지가 적다고 적힌 것', q: '벤토나이트 고양이 모래', icon: 'litter', score: () => 7 },
  { id: 'cat-potty-tofu', species: 'cat', cat: 'potty', title: '두부 모래', pick: '가벼운 식물성 — 변기에 버려도 되는지는 제품 표시를 확인', q: '두부 모래', icon: 'litter', score: () => 5 },
  { id: 'cat-potty-boxbig', species: 'cat', cat: 'potty', title: '대형 화장실', pick: '몸길이의 1.5배 넘는 넉넉한 크기', q: '고양이 대형 화장실', icon: 'box', score: (p) => (p.sizeClass === 'large' ? 10 : longish(p) ? 6 : 4) },
  { id: 'cat-potty-boxlow', species: 'cat', cat: 'potty', title: '입구 낮은 화장실', pick: '턱이 낮아 다리에 부담이 덜한 것', q: '입구 낮은 고양이 화장실', icon: 'box', score: (p) => (has(p, 'joint') ? 10 : 0) },
  { id: 'cat-potty-mat', species: 'cat', cat: 'potty', title: '모래 매트', pick: '발에 묻은 모래를 털어 주는 홈 있는 매트', q: '고양이 모래 매트', icon: 'mat', score: (p) => (longish(p) ? 6 : 3) },

  // ── 고양이 · 집 ──
  { id: 'cat-home-scratchv', species: 'cat', cat: 'home', title: '세로형 스크래처', pick: '몸을 쭉 펴고 긁을 수 있는 높이에 흔들리지 않는 것', q: '고양이 세로 스크래처', icon: 'scratcher', score: () => 7 },
  { id: 'cat-home-fountain', species: 'cat', cat: 'home', title: '고양이 정수기', pick: '흐르는 물을 좋아하는 고양이가 많아요 — 필터 교체가 쉬운 것', q: '고양이 정수기', icon: 'fountain', score: (p) => (has(p, 'kidney', 'urinary') ? 9 : 5) },
  { id: 'cat-home-hide', species: 'cat', cat: 'home', title: '숨숨집', pick: '몸을 숨기고 쉴 수 있는 지붕 있는 집', q: '고양이 숨숨집', icon: 'house', score: () => 4 },
  { id: 'cat-home-screen', species: 'cat', cat: 'home', title: '방묘창·방묘문', pick: '창문과 현관으로 나가지 않게 막는 것', q: '방묘창', icon: 'window', score: (p) => (has(p, 'escape') || p.energy >= 4 ? 7 : 4) },
  { id: 'cat-home-heat', species: 'cat', cat: 'home', title: '온열 방석', pick: '과열 방지 기능이 있는 반려동물용', q: '고양이 온열 방석', icon: 'heater', score: (p) => (p.cold >= 3 ? 9 : 0) },
  { id: 'cat-home-clothes', species: 'cat', cat: 'home', title: '고양이 옷', pick: '얇고 신축성 있는 것 — 털 없는 아이의 보온용', q: '스핑크스 고양이 옷', icon: 'clothes', score: (p) => (p.coat === 'hairless' ? 8 : 0) },
  { id: 'cat-home-carrier', species: 'cat', cat: 'home', title: '이동장', pick: '위가 열려 병원에서 꺼내기 쉬운 것', q: '고양이 이동장', icon: 'carrier', score: () => 3 },
];

const LINKS = links as Record<string, string>;

/** 이 카드에 쿠팡 파트너스 링크가 있나 */
export const linkOf = (id: string): string | null => {
  const u = LINKS[id];
  return typeof u === 'string' && /^https:\/\/(link\.coupang\.com|coupa\.ng)\//.test(u) ? u : null;
};

/** 쿠팡 링크가 하나라도 걸렸나 — 꼬리말 대가성 문구를 낼지(가입 전엔 거짓 문구가 되지 않게) */
export const SHOP_LIVE = Object.keys(LINKS).some((k) => linkOf(k));

/** 관리자가 링크를 만들 때 여는 쿠팡 검색 주소 */
export const searchUrl = (q: string) => `https://www.coupang.com/np/search?q=${encodeURIComponent(q)}`;

/** 개발 화면(또는 SHOP_PREVIEW=1로 빌드한 검수용)에선 링크 없는 카드도 보여 준다. 운영은 링크 있는 카드만 */
const SHOW_EMPTY = process.env.NODE_ENV === 'development' || process.env.SHOP_PREVIEW === '1';

export type Pick = Slot & { url: string | null };

/** 이 품종·이 칸의 카드 — 점수 높은 순으로 n장 */
export function picksFor(p: P, cat: ShopCat, n = 3): Pick[] {
  return rankFor(p, cat)
    .map((s) => ({ ...s, url: linkOf(s.id) }))
    .filter((s) => s.url || SHOW_EMPTY)
    .slice(0, n);
}

/** 링크와 상관없이 이 품종·이 칸에 맞는 카드 순위(관리자 「쿠팡 링크」 탭이 어떤 카드부터 링크를 만들지 고를 때) */
export function rankFor(p: P, cat: ShopCat): Slot[] {
  return SLOTS.filter((s) => s.species === p.species && s.cat === cat)
    .map((s) => ({ s, sc: s.score(p) }))
    .filter((x) => x.sc > 0)
    .sort((a, b) => b.sc - a.sc)
    .map(({ s }) => s);
}

/** 이 페이지에 실제로 걸린 쿠팡 링크가 하나라도 있나 — 대가성 문구를 낼지 */
export const hasLive = (picks: Pick[]) => picks.some((x) => x.url);

/** id 목록 그대로(처음 데려온다면 페이지처럼 품종이 없는 곳) — 링크 규칙은 picksFor와 같다 */
export function picksById(ids: string[]): Pick[] {
  return ids
    .map((id) => SLOTS.find((s) => s.id === id))
    .filter((s): s is Slot => !!s)
    .map((s) => ({ ...s, url: linkOf(s.id) }))
    .filter((s) => s.url || SHOW_EMPTY);
}
