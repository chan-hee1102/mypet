import cats from './data/care/cats.json';
import dogs1 from './data/care/dogs-1.json';
import dogs2 from './data/care/dogs-2.json';
import dogs3 from './data/care/dogs-3.json';
import rulesData from './data/care-rules.json';
import { adultFeedingRows, gramText, growthFacts } from './breedSeo';
import { BRUSH_LABEL, COAT_LABEL, FLAGS, KIBBLE_LABEL, SIZE_LABEL, type CareProfile, type Flag } from './careProfile';
import { fmtKg, type BreedRow } from './growth';

/**
 * 키우기 안내판의 계산 — 품종 돌봄 데이터(lib/data/care/*.json)와 기존 품종 데이터(breedKnowledge)·열량식(lib/energy)을 묶어
 * 「한눈에」 판의 숫자와 칸별 사실 목록을 만든다. 서버 전용 — 품종 데이터 전체(약 400KB)를 싣으므로 클라이언트 컴포넌트에서 가져오지 말 것.
 * 데이터는 fs가 아니라 import로 싣는다 — 요청 때 도는 API(관리자 쿠팡 링크)에서도 배포 묶음에 확실히 들어가게. 품종 파일을 늘리면 아래 목록에 더할 것.
 *
 * 숫자 규칙(출처는 lib/data/care-rules.json에 조문·지침 링크와 같이):
 *   하루 사료 = lib/energy 열량식(RER×계수, 다 큰 중간 체중·중성화) ÷ 3.5~4.0kcal/g
 *   간식 = 하루 열량의 10% 이내(WSAVA 영양 지침)
 *   고양이 화장실 = 고양이 수 + 1개, 크기는 몸길이의 1.5배(International Cat Care)
 */

let profiles: Map<string, CareProfile> | null = null;

/** 품종 이름 → 돌봄 데이터 */
export function careProfiles(): Map<string, CareProfile> {
  if (profiles) return profiles;
  profiles = new Map([...dogs1, ...dogs2, ...dogs3, ...cats].map((p) => [p.breed, p as CareProfile]));
  return profiles;
}
export const careOf = (name: string): CareProfile | null => careProfiles().get(name) ?? null;

export type CareRule = {
  id: string;
  kind: 'law' | 'care';
  species: 'dog' | 'cat' | 'both';
  topic: 'register' | 'walk' | 'dangerous' | 'abuse' | 'food' | 'treat' | 'grooming' | 'potty' | 'home' | 'health';
  title: string;
  body: string;
  penalty?: string;
  ref: string;
  url: string;
  effective?: string;
  verified: boolean;
};

const RULES = (rulesData as CareRule[]).filter((r) => r.verified);
export const careRules = (): CareRule[] => RULES;
export const rulesFor = (species: 'dog' | 'cat', ...topics: CareRule['topic'][]) =>
  careRules().filter((r) => (r.species === species || r.species === 'both') && topics.includes(r.topic));
/** id 순서 그대로(없는 id·확인 안 된 항목은 빠진다) */
export const rulesById = (...ids: string[]) => ids.map((id) => careRules().find((r) => r.id === id)).filter((r): r is CareRule => !!r);

/** 품종 안내판 칸마다 붙일 법 조문·지침 — 맹견·단두종·아메리칸불리는 따로 */
export function rulesForBreed(name: string, p: CareProfile): Partial<Record<'walk' | 'health' | 'home', CareRule[]>> {
  if (p.species === 'cat') {
    return { health: rulesById('cat-registration-optional', 'lily-toxic-cat'), home: rulesById('abuse-heat-cold') };
  }
  const walk = p.flags.includes('dangerous')
    ? rulesById('dangerous-dog-walk', 'dangerous-dog-permit', 'dangerous-dog-insurance', 'dangerous-dog-no-entry', 'dangerous-dog-education')
    : rulesById('walk-leash-2m', 'walk-apartment-common-area', 'walk-id-tag', 'walk-poop-pickup');
  if (name === '아메리칸불리') walk.unshift(...rulesById('american-bully-status'));
  const health = rulesById('dog-registration', 'dog-deworming', ...(p.flags.includes('brachy') ? ['heatstroke-brachycephalic'] : []));
  return { walk, health };
}

/* ───────── 한눈에 판 ───────── */

export type BoardTile = { key: string; label: string; value: string; sub: string; href: string };

const range = ([a, b]: [number, number], unit: string) => (a === b ? `${a}${unit}` : `${a}~${b}${unit}`);

export function feedOf(b: BreedRow) {
  const f = adultFeedingRows(b)[1];
  return f ? { weight: f.weight, kcal: Math.round(f.neutered.kcal / 10) * 10, gram: gramText(f.neutered) } : null;
}

export function mealsOf(p: CareProfile) {
  if (p.species === 'cat') return { value: '하루 2~4번', sub: '조금씩 나눠서' };
  return p.sizeClass === 'toy' ? { value: '하루 2~3번', sub: '아기 땐 3~4번' } : { value: '하루 2번', sub: '아기 땐 3~4번' };
}

export function pottyOf(p: CareProfile) {
  if (p.species === 'cat') return { value: '화장실 2개', sub: '한 마리 기준 · 고양이 수 + 1' };
  if (p.sizeClass === 'toy' || p.sizeClass === 'small') return { value: '일반형 패드', sub: '몸이 다 들어가는 크기' };
  if (p.sizeClass === 'medium') return { value: '대형 패드', sub: '바깥 배변도 많이 해요' };
  return { value: '바깥 배변 위주', sub: '실내는 대형 패드' };
}

export function boardOf(b: BreedRow, p: CareProfile): BoardTile[] {
  const feed = feedOf(b);
  const meals = mealsOf(p);
  const potty = pottyOf(p);
  const isDog = p.species === 'dog';
  const shortCatBath = !isDog && p.bathWeeks[0] >= 12;
  return [
    { key: 'food', label: '하루 사료', value: feed ? feed.gram : '계산기로', sub: feed ? `${fmtKg(feed.weight)}kg · 중성화 기준` : '체중으로 계산해요', href: '#food' },
    { key: 'meals', label: '끼니', value: meals.value, sub: meals.sub, href: '#food' },
    isDog
      ? { key: 'walk', label: '산책', value: p.walksPerDay ? `하루 ${range(p.walksPerDay, '번')}` : '매일', sub: `합쳐서 ${range(p.exerciseMin, '분')}`, href: '#walk' }
      : { key: 'walk', label: '놀이', value: range(p.exerciseMin, '분'), sub: '하루 사냥 놀이 합계', href: '#walk' },
    { key: 'brush', label: '빗질', value: BRUSH_LABEL[p.brushing], sub: COAT_LABEL[p.coat], href: '#grooming' },
    { key: 'trim', label: '미용', value: p.trimWeeks ? `${range(p.trimWeeks, '주')}마다` : '커트 없음', sub: p.trimWeeks ? '전문 미용' : '빗질과 목욕만', href: '#grooming' },
    { key: 'bath', label: '목욕', value: shortCatBath ? '필요할 때만' : `${range(p.bathWeeks, '주')}마다`, sub: shortCatBath ? '스스로 그루밍해요' : p.coat === 'hairless' ? '피부 기름 닦기' : '반려동물 전용 샴푸', href: '#grooming' },
    { key: 'potty', label: isDog ? '배변' : '화장실', value: potty.value, sub: potty.sub, href: '#potty' },
    { key: 'size', label: '다 큰 몸무게', value: b.weight_kg ? `${b.weight_kg}kg` : SIZE_LABEL[p.sizeClass], sub: b.life_years ? `수명 ${b.life_years}년` : SIZE_LABEL[p.sizeClass], href: '#health' },
  ];
}

export type MeterRow = { label: string; value: number; max: number; words: string };
export function metersOf(p: CareProfile): MeterRow[] {
  const five = ['아주 적어요', '적은 편', '보통', '많은 편', '아주 많아요'];
  const three = ['덜 타요', '조금 타요', '많이 타요'];
  return [
    { label: '활동량', value: p.energy, max: 5, words: ['아주 차분', '차분한 편', '보통', '활발한 편', '아주 활발'][p.energy - 1] },
    { label: '털 빠짐', value: p.shedding, max: 5, words: five[p.shedding - 1] },
    { label: p.species === 'dog' ? '짖음' : '울음', value: p.voice, max: 5, words: five[p.voice - 1] },
    { label: '씹는 힘', value: p.chewer, max: 5, words: ['약해요', '약한 편', '보통', '센 편', '아주 세요'][p.chewer - 1] },
    { label: '더위 타는 정도', value: p.heat, max: 3, words: three[p.heat - 1] },
    { label: '추위 타는 정도', value: p.cold, max: 3, words: three[p.cold - 1] },
  ];
}

export const flagTexts = (p: CareProfile) => p.flags.map((f: Flag) => ({ key: f, text: FLAGS[f] }));

/* ───────── 칸별 사실 — 숫자 있는 것만, 품종 데이터로 계산 ───────── */

export function foodFacts(b: BreedRow, p: CareProfile): string[] {
  const feed = feedOf(b);
  const gf = growthFacts(b);
  const out: string[] = [];
  if (feed) out.push(`다 큰 ${fmtKg(feed.weight)}kg·중성화 기준 하루 약 ${feed.kcal}kcal, 건사료로 ${feed.gram}이에요. 사료마다 열량이 달라 포장의 급여표와 같이 보세요.`);
  out.push(`알갱이는 ${KIBBLE_LABEL[p.kibble]}가 먹기 편해요. ${mealsOf(p).value}로 나눠 주세요.`);
  if (gf) out.push(`${gf.end.label} 거의 다 자라요 — 그때까지는 성장기 사료를 먹여요.`);
  return out;
}

export function treatFacts(b: BreedRow): string[] {
  const feed = feedOf(b);
  return feed
    ? [`간식은 하루 열량의 10% 안 — 약 ${Math.max(10, Math.round((feed.kcal * 0.1) / 5) * 5)}kcal까지예요. 간식을 준 날은 사료를 그만큼 덜어 주세요.`]
    : ['간식은 하루 열량의 10% 안에서 주세요. 간식을 준 날은 사료를 그만큼 덜어 주세요.'];
}

export function toyFacts(p: CareProfile): string[] {
  const out: string[] = [];
  if (p.chewer >= 4) out.push('씹는 힘이 세요 — 봉제·얇은 고무는 금방 뜯겨요. 강도 표시가 높고 입보다 큰 장난감을 골라요.');
  else if (p.chewer <= 2) out.push('씹는 힘이 약한 편이라 부드러운 장난감도 오래 써요. 솜이 보이면 삼키기 전에 치워 주세요.');
  else out.push('씹는 힘은 보통이에요. 장난감은 입에 쏙 들어가 삼킬 수 있는 크기만 피하면 돼요.');
  if (p.species === 'dog' && p.energy >= 4) out.push('활동량이 많아요 — 산책만으로 모자란 날은 노즈워크·퍼즐로 머리를 쓰게 해 주세요.');
  if (p.species === 'cat') out.push('사냥 놀이는 짧게 여러 번 나눠 하고, 끝날 땐 장난감을 「잡게」 해 주세요.');
  return out;
}

export function walkFacts(p: CareProfile): string[] {
  const out: string[] = [];
  if (p.species === 'dog') {
    out.push(`하루 ${p.walksPerDay ? range(p.walksPerDay, '번') : ''} 합쳐서 ${range(p.exerciseMin, '분')} 걷고 놀아요.`.replace('하루  ', '하루 '));
    if (p.flags.includes('trachea') || p.flags.includes('brachy')) out.push('목줄 대신 가슴줄을 써요 — 목을 누르면 숨이 가빠지기 쉬워요.');
    if (p.heat >= 3) out.push('더위에 약해요 — 여름엔 이른 아침이나 해 진 뒤에 걷고, 한낮 아스팔트는 피해요.');
    if (p.cold >= 3) out.push('추위를 타요 — 겨울 산책은 짧게 나눠 하고 옷을 입혀요.');
    if (p.flags.includes('prey') || p.flags.includes('escape')) out.push('뭔가를 쫓아 뛰쳐나가기 쉬워요 — 줄을 풀어 주는 건 울타리 있는 곳에서만요.');
  } else {
    out.push(`하루 합쳐서 ${range(p.exerciseMin, '분')} 놀아 주세요 — 몇 번으로 나눠도 돼요.`);
    if (p.flags.includes('climber')) out.push('높은 곳을 좋아해요 — 캣타워나 선반으로 오를 길을 만들어 주세요.');
    if (p.flags.includes('joint')) out.push('관절이 약할 수 있어요 — 높이 뛰어내리지 않게 낮은 단과 계단을 놓아 주세요.');
  }
  return out;
}

export function groomFacts(p: CareProfile): string[] {
  const out = [`빗질은 ${BRUSH_LABEL[p.brushing]}${p.coat === 'double' ? ' — 털갈이 철엔 매일' : ''} 해 주세요.`];
  if (p.trimWeeks) out.push(`털이 계속 자라요 — ${range(p.trimWeeks, '주')}마다 미용이 필요해요.`);
  if (p.coat === 'hairless') out.push('털이 없어 피부에 기름이 쌓여요 — 물티슈로 닦고 목욕을 자주 해요. 햇볕과 추위도 막아 주세요.');
  out.push('양치는 하루 1번이 가장 좋아요 — 주 1번으로는 모자라요. 사람 치약 말고 반려동물용 치약을 써요.');
  return out;
}

export function pottyFacts(p: CareProfile): string[] {
  if (p.species === 'cat') {
    return [
      '화장실은 고양이 수보다 하나 더(한 마리면 두 개) — 나란히 붙이지 말고 밥·물과 떨어진 조용한 곳에 나눠 둬요.',
      `길이는 코에서 꼬리 시작점까지의 1.5배 넘게${p.sizeClass === 'large' ? ' — 덩치가 커서 대형 화장실이 필요해요' : ''}. 모래는 3cm쯤 깔고 하루 2번 치워요.`,
    ];
  }
  const s = pottyOf(p);
  return [`${s.value}${p.species === 'dog' && (p.sizeClass === 'toy' || p.sizeClass === 'small') ? '가 맞아요' : '예요'} — ${s.sub}.`, '실수한 자리는 냄새까지 지워야 같은 곳에 또 싸지 않아요. 혼내기보다 잘했을 때 바로 칭찬해요.'];
}

export function homeFacts(p: CareProfile): string[] {
  const out: string[] = [];
  if (p.flags.some((f) => f === 'patella' || f === 'back' || f === 'hip' || f === 'joint')) out.push('미끄러운 바닥은 무릎·허리에 부담이에요 — 자주 뛰는 곳에 매트를 깔고 소파·침대엔 계단을 놓아요.');
  if (p.heat >= 3) out.push('더위에 약한 체질이에요 — 여름엔 에어컨으로 실내를 시원하게 두고, 차 안에 혼자 두지 않아요.');
  if (p.cold >= 3) out.push('겨울엔 바람이 들지 않는 따뜻한 잠자리를 마련해 주세요.');
  if (p.flags.includes('separation')) out.push('혼자 있는 걸 힘들어할 수 있어요 — 짧게 나갔다 오는 연습부터 차근차근 늘려요.');
  if (p.species === 'dog' && p.voice >= 4) out.push('잘 짖는 편이라 공동주택이면 초인종·발소리에 익숙해지는 연습이 필요해요.');
  if (p.species === 'cat') out.push('창문엔 방묘창을 달아요 — 방충망만으로는 밀고 나갈 수 있어요.');
  return out;
}
