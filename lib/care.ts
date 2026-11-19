import cats from './data/care/cats.json';
import dogs1 from './data/care/dogs-1.json';
import dogs2 from './data/care/dogs-2.json';
import dogs3 from './data/care/dogs-3.json';
import rulesData from './data/care-rules.json';
import { adultFeedingRows, gramText, growthFacts, SOURCES } from './breedSeo';
import { hasBatchim, josa } from './josa';
import { BRUSH_LABEL, COAT_LABEL, FLAG_SHORT, FLAGS, KIBBLE_LABEL, SIZE_LABEL, type CareProfile, type Flag } from './careProfile';
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
  topic: 'register' | 'walk' | 'dangerous' | 'abuse' | 'food' | 'treat' | 'grooming' | 'potty' | 'home' | 'health' | 'rescue';
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

/**
 * 「길에서 데려왔다면」(2026-11-19) — 믹스견·믹스 고양이·코리안숏헤어 안내판에만. 상황 이름(when) + 규칙(care-rules.json, topic rescue).
 * 법 조문은 국가법령정보센터 원문으로 확인(동물보호법 [시행 2026.10.27] 제34·39·40·43·45조, 시행규칙 제14조, 형법 제360조,
 * 고양이 중성화사업 실시 요령 제6조⑧), 수의 지침은 AAFP 2020·WSAVA 2024·AHS·iCatCare 원문.
 * ⚠️ 고양이는 「신고 → 공고 → 입양」 흐름이 아니다 — 스스로 사는 길고양이는 구조·보호 대상이 아니다(시행규칙 제14조①).
 *    잃어버린 집고양이일 때만 신고 흐름. 일반인 신고는 의무가 아니라 「할 수 있다」(제39조①) — 「꼭 신고해야」라고 쓰지 말 것.
 */
const RESCUE: Record<'dog' | 'cat', { when: string; id: string }[]> = {
  dog: [
    { when: '발견한 날', id: 'found-report' },
    { when: '그냥 키우면', id: 'found-keeping-risk' },
    { when: '주인을 못 찾으면', id: 'found-ownership' },
    { when: '첫 검진', id: 'heartworm-test' },
    { when: '접종 기록이 없으면', id: 'unknown-vaccine' },
    { when: '키우게 되면', id: 'dog-registration' },
  ],
  cat: [
    { when: '새끼만 있다면', id: 'kitten-wait-mother' },
    { when: '귀를 보세요', id: 'tnr-eartip' },
    { when: '길고양이라면', id: 'street-cat-not-rescue' },
    { when: '잃어버린 집고양이 같다면', id: 'found-report' },
    { when: '그냥 키우면', id: 'found-keeping-risk' },
    { when: '데려오자마자', id: 'cat-retrovirus-test' },
    { when: '접종 기록이 없으면', id: 'unknown-vaccine' },
  ],
};
const RESCUE_BREEDS = ['믹스견(잡종)', '믹스/혼혈 고양이', '코리안숏헤어'];
export function rescueOf(name: string, species: 'dog' | 'cat') {
  if (!RESCUE_BREEDS.includes(name)) return null;
  return RESCUE[species].map((s) => ({ when: s.when, rule: rulesById(s.id)[0] })).filter((s): s is { when: string; rule: CareRule } => !!s.rule);
}

/* ───────── 한눈에 판 ───────── */

/** sub = 짧은 꼬리말(옛 칸 판·배변 사실에서 씀) · detail = 한눈에 줄마다 붙는 풀어 쓴 문장(2026-11-19 「하나씩 자세하게」) — 둘 다 같은 데이터에서만 만든다 */
export type BoardTile = { key: string; label: string; value: string; sub: string; detail: string; href: string };
/** 끝 글자에 받침이 있나 — 「이라/라」「이에요/예요」 고르기 */
const jong = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
};

const range = ([a, b]: [number, number], unit: string) => (a === b ? `${a}${unit}` : `${a}~${b}${unit}`);

export function feedOf(b: BreedRow) {
  const f = adultFeedingRows(b)[1];
  return f ? { weight: f.weight, kcal: Math.round(f.neutered.kcal / 10) * 10, gram: gramText(f.neutered), gramMid: (f.neutered.gramLo + f.neutered.gramHi) / 2 } : null;
}

/*
  쉬운 말로 바꾸기(2026-11-19 사장님 「종이컵 반 컵씩 아침·저녁 두 번처럼」) — 한눈에 문장은 g·kcal·주 대신 집에 있는 단위로.
  종이컵 한 컵(180ml)에 담기는 건사료는 알갱이에 따라 약 70~100g — 작은 알갱이 80~100·보통 70~90·큰 알갱이 60~80g의 가운데를 쓴다
  (ipuppy.co.kr/52, 수의사 답변 「종이컵 1컵 약 70g」). 정확한 g은 같은 줄의 큰 숫자, 컵은 어림이라 문장에 「약」을 붙인다(2026-11-19 사장님 승인).
*/
export const CUP_GRAM: Record<CareProfile['kibble'], number> = { small: 90, medium: 80, large: 70 };
const CUP_FRAC: [number, string][] = [
  [1 / 4, '4분의 1컵'],
  [1 / 3, '3분의 1컵'],
  [1 / 2, '반 컵'],
  [2 / 3, '3분의 2컵'],
  [3 / 4, '4분의 3컵'],
];
/** 컵 수 → 「반 컵」「1컵 반」 — 1컵 아래는 가까운 분수, 1컵부터는 반 컵 단위 */
export function cupText(cups: number) {
  if (cups < 0.875) return CUP_FRAC.reduce((a, c) => (Math.abs(c[0] - cups) < Math.abs(a[0] - cups) ? c : a))[1];
  const h = Math.round(cups * 2) / 2;
  return Number.isInteger(h) ? `${h}컵` : `${Math.floor(h)}컵 반`;
}
/** 주 → 「한 달에 한 번쯤」「한두 달에 한 번」 — 3주 아래로 시작하면 주 그대로 */
const PAIR: Record<string, string> = { '1-2': '한두', '2-3': '두세', '3-4': '서너' };
export function everyText([a, b]: [number, number]) {
  if (a < 3) return `${a === b ? a : `${a}~${b}`}주에 한 번`;
  const lo = Math.max(1, Math.round(a / 4.3));
  const hi = Math.max(1, Math.round(b / 4.3));
  if (lo === hi) return lo === 1 ? '한 달에 한 번쯤' : lo === 2 ? '두 달에 한 번쯤' : `${lo}달에 한 번쯤`;
  return PAIR[`${lo}-${hi}`] ? `${PAIR[`${lo}-${hi}`]} 달에 한 번` : `${lo}~${hi}달에 한 번`;
}
const r5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
const TIMES: Record<string, string> = { '1-1': '하루 한 번', '1-2': '하루 한두 번', '2-2': '아침저녁', '2-3': '하루 두세 번', '3-3': '하루 세 번' };

export function mealsOf(p: CareProfile) {
  if (p.species === 'cat') return { value: '하루 2~4번', sub: '조금씩 나눠서' };
  return p.sizeClass === 'toy' ? { value: '하루 2~3번', sub: '아기 땐 3~4번' } : { value: '하루 2번', sub: '아기 땐 3~4번' };
}

export function pottyOf(p: CareProfile) {
  if (p.species === 'cat') return { value: '화장실 2개', sub: '한 마리 기준 · 고양이 수+1' };
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
  const small = p.sizeClass === 'toy' || p.sizeClass === 'small';
  const pet = isDog ? '강아지' : '고양이';
  // 사료 — 개는 「한 번에 몇 컵씩 아침저녁」, 고양이는 조금씩 자주 먹어서 「하루 몇 컵을 나눠서」
  const cups = feed ? feed.gramMid / CUP_GRAM[p.kibble] : 0;
  // 산책 — 하루 합계 ÷ 횟수 = 한 번에 걷는 시간(5분 단위)
  const wp = p.walksPerDay;
  const perWalk = wp ? [r5(p.exerciseMin[0] / ((wp[0] + wp[1]) / 2)), r5(p.exerciseMin[1] / ((wp[0] + wp[1]) / 2))] as [number, number] : null;
  const brush = BRUSH_LABEL[p.brushing];
  const BRUSH_WHY: Record<CareProfile['coat'], string> = {
    short: `털이 짧아 ${brush} 빗으면 돼요.`,
    double: `속털이 많이 빠져 ${brush} 빗어요. 털갈이 철엔 매일 빗어요.`,
    long: `털이 길어 잘 엉켜요. ${brush} 빗어 줘요.`,
    silky: `털이 길어 잘 엉켜요. ${brush} 빗어 줘요.`,
    curly: `곱슬털이라 잘 엉켜요. ${brush} 빗어 줘요.`,
    wire: `뻣뻣한 털이라 ${brush} 빗어 줘요.`,
    hairless: '털이 없어요. 빗질 대신 피부를 자주 닦아 줘요.',
  };
  return [
    {
      key: 'food',
      label: '하루 사료',
      value: feed ? feed.gram : '계산기로',
      sub: feed ? `${fmtKg(feed.weight)}kg · 중성화 기준` : '체중으로 계산해요',
      detail: !feed
        ? '몸무게를 넣으면 사료량 계산기가 알려 줘요.'
        : isDog
          ? `한 번에 종이컵 약 ${cupText(cups / 2)}씩, 아침저녁 두 번 줘요.`
          : `하루 종이컵 약 ${cupText(cups)}을 2~4번에 나눠 줘요.`,
      href: '#food',
    },
    {
      key: 'meals',
      label: '끼니',
      value: meals.value,
      sub: meals.sub,
      detail: !isDog
        ? '조금씩 자주 먹어요. 하루 양을 정해 두고 나눠 줘요.'
        : p.sizeClass === 'toy'
          ? '아침저녁 두 번에, 낮에 한 번 더 나눠 줘도 좋아요. 아기 땐 3~4번이에요.'
          : '다 크면 아침저녁 두 번이면 돼요. 아기 땐 3~4번이에요.',
      href: '#food',
    },
    isDog
      ? {
          key: 'walk',
          label: '산책',
          value: wp ? `하루 ${range(wp, '번')}` : '매일',
          sub: `합쳐서 ${range(p.exerciseMin, '분')}`,
          detail: `${wp && perWalk ? `${TIMES[`${wp[0]}-${wp[1]}`] ?? `하루 ${range(wp, '번')}`}, 한 번에 ${range(perWalk, '분')}씩 걸어요.` : `매일 합쳐서 ${range(p.exerciseMin, '분')} 걸어요.`}${p.heat >= 3 ? ' 여름 한낮엔 나가지 않아요.' : ''}`,
          href: '#walk',
        }
      : { key: 'walk', label: '놀이', value: range(p.exerciseMin, '분'), sub: '하루 사냥 놀이 합계', detail: `하루 합쳐서 ${range(p.exerciseMin, '분')}, 몇 번에 나눠 낚싯대 장난감으로 놀아 줘요.`, href: '#walk' },
    {
      key: 'brush',
      label: '빗질',
      value: brush,
      sub: COAT_LABEL[p.coat],
      detail: BRUSH_WHY[p.coat],
      href: '#grooming',
    },
    {
      key: 'trim',
      label: '미용',
      value: p.trimWeeks ? `${range(p.trimWeeks, '주')}마다` : '커트 없음',
      sub: p.trimWeeks ? '전문 미용' : '빗질과 목욕만',
      detail: p.trimWeeks ? `털이 계속 자라서 ${everyText(p.trimWeeks)} 미용실에 가요.` : '미용실 커트는 필요 없어요. 빗질과 목욕이면 돼요.',
      href: '#grooming',
    },
    {
      key: 'bath',
      label: '목욕',
      value: shortCatBath ? '필요할 때만' : `${range(p.bathWeeks, '주')}마다`,
      sub: shortCatBath ? '스스로 그루밍해요' : p.coat === 'hairless' ? '피부 기름 닦기' : '반려동물 전용 샴푸',
      detail: shortCatBath
        ? '혀로 스스로 씻어요. 더러워졌을 때만 씻겨요.'
        : p.coat === 'hairless'
          ? `털이 없어 피부에 기름이 쌓여요. ${everyText(p.bathWeeks)} 씻기고, 물티슈로 자주 닦아 줘요.`
          : `${everyText(p.bathWeeks)} ${pet} 샴푸로 씻겨요.`,
      href: '#grooming',
    },
    {
      key: 'potty',
      label: isDog ? '배변' : '화장실',
      value: potty.value,
      sub: potty.sub,
      detail: !isDog
        ? '한 마리면 화장실 2개, 서로 떨어진 곳에 둬요.'
        : small
          ? '몸이 다 들어가는 일반 패드를 깔아 줘요.'
          : p.sizeClass === 'medium'
            ? '집에선 대형 패드를 쓰고, 산책 때도 많이 봐요.'
            : '주로 산책하면서 봐요. 집엔 대형 패드를 둬요.',
      href: '#potty',
    },
    {
      key: 'size',
      label: '다 큰 몸무게',
      value: b.weight_kg ? `${b.weight_kg}kg` : SIZE_LABEL[p.sizeClass],
      sub: b.life_years ? `수명 ${b.life_years}년` : SIZE_LABEL[p.sizeClass],
      detail: `${isDog ? `${SIZE_LABEL[p.sizeClass]}견` : `체구는 ${SIZE_LABEL[p.sizeClass]}`}${jong(isDog ? '견' : SIZE_LABEL[p.sizeClass]) ? '이에요' : '예요'}.${b.life_years ? ` 보통 ${b.life_years.replace(/[–-]/, '~')}년 살아요.` : ''}`,
      href: '#health',
    },
  ];
}

/* ───────── 믹스견 — 체구 고르기(2026-11-19) ───────── */

/**
 * 믹스견은 5kg부터 25kg 넘게까지 다양해서 숫자 하나(중형)로는 소형 믹스에게 사료량·산책이 크게 틀린다.
 * 그래서 소형·중형·대형 세 벌을 만든다 — 체중 범위만 우리가 정하고, 산책 시간·알갱이 크기는
 * 「같은 체구 품종 안내판들의 중간값」을 그때그때 계산한다(품종 데이터가 바뀌면 같이 따라간다).
 * 2026-11-19 기준 중간값: 소형 30~60분·작은 알갱이, 중형 60~90분·중간, 대형 90~120분·큰 알갱이.
 * 품종 페이지는 세 벌을 다 그리고, 라디오 단추 + CSS(:has)로 고른 것만 보여 준다(app/board.css 「믹스견 체구」).
 */
export const MIX_DOG = '믹스견(잡종)';
export type MixKey = 'small' | 'medium' | 'large';
export type MixSize = { key: MixKey; label: string; range: string; b: BreedRow; p: CareProfile };
const MIX_SIZE_DEF: { key: MixKey; label: string; range: string; weight: string; size: string }[] = [
  { key: 'small', label: '소형', range: '10kg 미만', weight: '3–10', size: '소형' },
  { key: 'medium', label: '중형', range: '10~25kg', weight: '10–25', size: '중형' },
  { key: 'large', label: '대형', range: '25kg 넘게', weight: '25–40', size: '대형' },
];
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mode = <T,>(xs: T[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<T, number>())].sort((a, b) => b[1] - a[1])[0][0];

export function mixSizesOf(b: BreedRow, p: CareProfile): MixSize[] | null {
  if (b.breed_ko !== MIX_DOG) return null;
  const peers = [...careProfiles().values()].filter((q) => q.species === 'dog' && !q.breed.includes('믹스'));
  return MIX_SIZE_DEF.map((d) => {
    const same = peers.filter((q) => q.sizeClass === d.key);
    const r10 = (n: number) => Math.round(n / 10) * 10;
    const exerciseMin: [number, number] = [r10(median(same.map((q) => q.exerciseMin[0]))), r10(median(same.map((q) => q.exerciseMin[1])))];
    return {
      key: d.key,
      label: d.label,
      range: d.range,
      b: { ...b, size: d.size, weight_kg: d.weight },
      p: { ...p, sizeClass: d.key, exerciseMin, kibble: mode(same.map((q) => q.kibble)) },
    };
  });
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

export const flagTexts = (p: CareProfile) => p.flags.map((f: Flag) => ({ key: f, text: FLAGS[f], label: FLAG_SHORT[f].label, group: FLAG_SHORT[f].group }));

/* ───────── 칸별 사실 — 숫자 있는 것만, 품종 데이터로 계산 ─────────
   2026-11-19 순서형 개편: 칸 맨 위 「핵심 한 줄」(keyOf)이 하는 말은 여기서 되풀이하지 않는다. 문장은 줄표 없이 쉬운 말로. */

export function foodFacts(b: BreedRow, p: CareProfile): string[] {
  const feed = feedOf(b);
  const gf = growthFacts(b);
  const out: string[] = [];
  if (feed) out.push(`다 큰 ${fmtKg(feed.weight)}kg, 중성화한 아이 기준으로 하루 약 ${feed.kcal}kcal이에요. 사료마다 열량이 달라서 포장의 급여표와 같이 보세요.`);
  if (feed) out.push(`종이컵(180ml)에 깎아 담으면 ${KIBBLE_LABEL[p.kibble]}는 약 ${CUP_GRAM[p.kibble]}g이에요. 집에 있는 사료를 한 번 저울에 재 보면 정확해요.`);
  if (gf) out.push(`${gf.end.label} 거의 다 자라요. 그때까지는 성장기 사료를 먹여요.`);
  return out;
}

/** 간식 하루 상한(kcal) — 하루 열량의 10%(WSAVA) */
export const treatKcalOf = (b: BreedRow) => {
  const feed = feedOf(b);
  return feed ? Math.max(10, Math.round((feed.kcal * 0.1) / 5) * 5) : null;
};

export function toyFacts(p: CareProfile): string[] {
  const out: string[] = [];
  if (p.chewer >= 4) out.push('봉제나 얇은 고무 장난감은 금방 뜯겨요. 강도 표시가 높고 입보다 큰 걸 골라요.');
  else if (p.chewer <= 2) out.push('부드러운 장난감도 오래 써요. 솜이 보이기 시작하면 삼키기 전에 치워 주세요.');
  else out.push('입에 쏙 들어가 삼킬 수 있는 크기만 피하면 돼요.');
  if (p.species === 'dog' && p.energy >= 4) out.push('산책만으로 모자란 날은 노즈워크나 퍼즐로 머리를 쓰게 해 주세요.');
  if (p.species === 'cat') out.push('사냥 놀이는 짧게 여러 번 하고, 끝날 땐 장난감을 「잡게」 해 주세요.');
  return out;
}

export function walkFacts(p: CareProfile): string[] {
  const out: string[] = [];
  if (p.species === 'dog') {
    if (p.heat >= 3) out.push('더위에 약해요. 여름엔 이른 아침이나 해 진 뒤에 걷고, 한낮 아스팔트는 피해요.');
    if (p.cold >= 3) out.push('추위를 타요. 겨울 산책은 짧게 나눠 하고 옷을 입혀요.');
    if (p.flags.includes('prey') || p.flags.includes('escape')) out.push('뭔가를 쫓아 뛰쳐나가기 쉬워요. 줄은 울타리 있는 곳에서만 풀어 줘요.');
  } else {
    if (p.flags.includes('climber')) out.push('높은 곳을 좋아해요. 캣타워나 선반으로 오를 길을 만들어 주세요.');
    if (p.flags.includes('joint')) out.push('관절이 약할 수 있어요. 높이 뛰어내리지 않게 낮은 단과 계단을 놓아 주세요.');
  }
  return out;
}

export function groomFacts(p: CareProfile): string[] {
  const out: string[] = [];
  if (p.coat === 'hairless') out.push('털이 없어 피부에 기름이 쌓여요. 물티슈로 닦고, 햇볕과 추위도 막아 주세요.');
  out.push('양치는 하루 1번이 가장 좋아요. 주 1번으로는 모자라요. 사람 치약 말고 반려동물용 치약을 써요.');
  return out;
}

export function pottyFacts(p: CareProfile): string[] {
  if (p.species === 'cat') {
    return [`화장실 길이는 코에서 꼬리 시작점까지의 1.5배 넘게 골라요.${p.sizeClass === 'large' ? ' 덩치가 커서 대형 화장실이 필요해요.' : ''} 모래는 3cm쯤 깔고 하루 2번 치워요.`];
  }
  return ['실수한 자리는 냄새까지 지워야 같은 곳에 또 싸지 않아요. 혼내기보다 잘했을 때 바로 칭찬해요.'];
}

export function homeFacts(p: CareProfile): string[] {
  const out: string[] = [];
  if (p.flags.some((f) => f === 'patella' || f === 'back' || f === 'hip' || f === 'joint')) out.push('미끄러운 바닥은 무릎과 허리에 부담이에요. 자주 뛰는 곳에 매트를 깔고 소파·침대엔 계단을 놓아요.');
  if (p.heat >= 3) out.push('더위에 약한 체질이에요. 여름엔 에어컨으로 실내를 시원하게 두고, 차 안에 혼자 두지 않아요.');
  if (p.cold >= 3) out.push('겨울엔 바람이 들지 않는 따뜻한 잠자리를 마련해 주세요.');
  if (p.flags.includes('separation')) out.push('혼자 있는 걸 힘들어할 수 있어요. 짧게 나갔다 오는 연습부터 차근차근 늘려요.');
  if (p.species === 'dog' && p.voice >= 4) out.push('잘 짖는 편이라 공동주택이면 초인종과 발소리에 익숙해지는 연습이 필요해요.');
  if (p.species === 'cat') out.push('창문엔 방묘창을 달아요. 방충망만으로는 밀고 나갈 수 있어요.');
  return out;
}

/* ───────── 순서형 안내(2026-11-19 사장님 「1번 사료 → 2번 산책 … 설명이랑 같이, 자연스럽게 준비물, 밑에 근거」) ─────────
   칸마다: 핵심 한 줄(keyOf) → 그 품종 한두 문장(notes) → 사실(위 *Facts) → 준비물 소개(shopIntro) + 쿠팡 카드 → 근거(sourcesOf).
   ⚠️ shopIntro는 「고르는 기준」과 체구·털·표시에서 나온 사실만 — 효능(「~에 좋아요」「예방」)·최고·최저가 금지(lib/shop.ts 머리말). */

export type StoryKey = { value: string; lines: string[] };
export type StorySource = { label: string; url: string };
const shortName = (n: string) => n.replace(/\s*\([^)]*\)\s*/g, '').trim() || n;

/** 칸 맨 위 큰 글자 한 줄 + 쉬운 문장 — 한눈에 카드(boardOf)와 같은 숫자 */
export function keyOf(sec: string, b: BreedRow, p: CareProfile): StoryKey | null {
  const t = Object.fromEntries(boardOf(b, p).map((x) => [x.key, x]));
  const isDog = p.species === 'dog';
  switch (sec) {
    case 'food':
      return { value: t.food.value === '계산기로' ? '사료량 계산기로' : `하루 ${t.food.value}`, lines: [t.food.detail, t.meals.detail] };
    case 'treat': {
      const k = treatKcalOf(b);
      return { value: k ? `하루 ${k}kcal까지` : '하루 열량의 10% 안', lines: ['간식은 사료 열량의 10% 안에서 줘요. 간식을 준 날은 사료를 그만큼 덜어 줘요.'] };
    }
    case 'walk':
      return { value: isDog ? t.walk.value : `하루 ${t.walk.value}`, lines: [t.walk.detail] };
    case 'grooming':
      return { value: p.coat === 'hairless' ? '피부 닦기' : `${BRUSH_LABEL[p.brushing]} 빗질`, lines: [t.brush.detail, t.trim.detail, t.bath.detail] };
    case 'potty':
      return isDog
        ? { value: t.potty.value, lines: [t.potty.detail] }
        : { value: t.potty.value, lines: ['고양이 수보다 하나 더 둬요. 나란히 붙이지 말고 밥·물과 떨어진 조용한 곳에 나눠 둬요.'] };
    case 'health':
      return b.life_years ? { value: `보통 ${b.life_years.replace(/[–-]/, '~')}년`, lines: [t.size.detail] } : null;
    default:
      return null;
  }
}

/** 준비물 카드 바로 위 한두 문장 — 「이 품종에겐 이런 게 맞아요」를 체구·털·표시로 */
export function shopIntro(sec: string, name: string, p: CareProfile): string {
  const N = shortName(name);
  const has = (...f: Flag[]) => f.some((x) => p.flags.includes(x));
  const small = p.sizeClass === 'toy' || p.sizeClass === 'small';
  const chew = ['약해요', '약한 편이에요', '보통이에요', '센 편이에요', '아주 세요'][p.chewer - 1];
  switch (sec) {
    case 'food':
      return `${josa(N, '은/는')} ${KIBBLE_LABEL[p.kibble]} 사료가 먹기 편해요.${has('obesity') ? ' 살이 잘 찌는 편이라 체중 관리 사료도 함께 보세요.' : ''}${has('bloat') ? ' 허겁지겁 먹지 않게 천천히 먹는 식기를 쓰기도 해요.' : ''}`;
    case 'treat':
      return `작게 쪼개 주기 쉬운 간식이 쓰기 편해요.${has('dental') ? ' 치석이 잘 생기는 편이라 덴탈껌도 함께 보세요.' : ''}`;
    case 'toy':
      return `씹는 힘이 ${chew}. 그래서 이런 장난감이 잘 맞아요.`;
    case 'walk':
      if (p.species === 'cat') return '사냥 흉내를 낼 수 있는 낚싯대 장난감으로 짧게 여러 번 놀아 줘요.';
      if (has('trachea', 'brachy')) return `${has('brachy') ? '코가 짧아 숨이 가빠지기 쉬워서' : '기관 허탈이 보고되는 체구라'} 목을 누르지 않는 가슴줄이 몸에 무리가 덜 가요. 리드줄은 2m 안으로 잡아요.`;
      return small ? '몸이 작아서 가슴을 넓게 받치는 조끼형 가슴줄이 편해요. 리드줄은 2m 안으로 잡아요.' : '어깨 움직임을 막지 않는 Y형 가슴줄이 잘 맞아요. 리드줄은 2m 안으로 잡아요.';
    case 'grooming':
      if (p.coat === 'hairless') return '털 대신 피부를 닦는 용품이 필요해요. 양치 용품도 같이 준비해요.';
      if (p.coat === 'short') return '짧은 털은 고무 빗 하나로도 충분해요. 양치 용품도 같이 준비해요.';
      if (p.coat === 'double') return '빠지는 속털을 걸러 내는 빗이 쓸모 있어요. 양치 용품도 같이 준비해요.';
      if (p.coat === 'wire') return '뻣뻣한 털에 맞는 빗을 써요. 양치 용품도 같이 준비해요.';
      return '털이 길어 엉킨 털을 푸는 빗이 필요해요. 양치 용품도 같이 준비해요.';
    case 'potty':
      if (p.species === 'cat') return '잘 뭉치는 모래와 넉넉한 크기의 화장실을 준비해요.';
      return small ? '몸이 다 들어가는 패드와 배변판을 준비해요.' : '대형 패드와 산책용 배변봉투를 준비해요.';
    case 'home':
      if (has('patella', 'back', 'hip', 'joint')) return '미끄러운 바닥엔 매트를, 소파 앞엔 계단을 두면 관절 부담을 덜 수 있어요.';
      if (p.species === 'cat') return '긁을 곳과 오를 곳이 있어야 가구를 덜 긁어요.';
      return '집에서 편히 쉴 자리를 마련해 줘요.';
    default:
      return '';
  }
}

/** 칸 맨 아래 「근거」 — 품종 자료(AKC·CFA 등) + 그 칸의 수의 지침(care-rules.json, 확인된 것만). 같은 주소는 한 번만 */
export function sourcesOf(sec: string, b: BreedRow, p: CareProfile): StorySource[] {
  const out: StorySource[] = (p.sources ?? []).map((s) => ({ label: `${s.org} ${shortName(b.breed_ko)} 품종 정보`, url: s.url }));
  // 지침은 care-rules.json에서 확인된 것(verified)만, 이름은 짧은 한국어로. WSAVA 간식 안내는 개·고양이 파일이 따로라 종에 맞는 쪽만
  const LABEL: Record<string, string> = {
    'weight-bcs': 'AAHA 급여량 안내',
    'tooth-brushing': 'WSAVA 치아 관리 지침',
    'litter-box-count-size': 'International Cat Care 화장실 안내',
    'cat-scratching': 'International Cat Care 긁기 안내',
    'cat-high-places': 'International Cat Care 집 환경 안내',
  };
  const rule = (...ids: string[]) => rulesById(...ids).map((r) => ({ label: LABEL[r.id] ?? r.ref.split(' — ')[0], url: r.url }));
  const treatRule = rulesById(p.species === 'dog' ? 'toxic-foods' : 'treats-10-percent')[0];
  const add: Record<string, StorySource[]> = {
    food: [{ label: 'WSAVA 영양 지침(열량 계산)', url: SOURCES.nutrition.url }, ...rule('weight-bcs')],
    treat: treatRule ? [{ label: `WSAVA ${p.species === 'dog' ? '강아지' : '고양이'} 간식 안내`, url: treatRule.url }] : [],
    grooming: rule('tooth-brushing'),
    potty: p.species === 'cat' ? rule('litter-box-count-size') : [],
    home: p.species === 'cat' ? rule('cat-scratching', 'cat-high-places') : [],
    health: [
      ...(b.source_url ? [{ label: `${b.source_org ?? ''} ${shortName(b.breed_ko)} 건강 정보`.trim(), url: b.source_url }] : []),
      ...rule('weight-bcs'),
    ],
  };
  const all = [...out, ...(add[sec] ?? [])];
  return all.filter((s, i) => s.url && all.findIndex((x) => x.url === s.url) === i);
}

/**
 * 검색엔진·AI 인용용 한 문단(화면에는 내지 않는다 — 2026-11-19 사장님 「맨 위 숫자 문장은 카드와 겹친다」).
 * meta description과 Article 구조화 데이터 description에만 쓴다. 숫자는 화면 카드(boardOf)와 같은 함수에서 나온다.
 */
export function answerOf(b: BreedRow, p: CareProfile): string {
  const N = shortName(b.breed_ko);
  const t = Object.fromEntries(boardOf(b, p).map((x) => [x.key, x]));
  const tidy = (r: string) => r.replace(/\s*\([^)]*\)\s*/g, '').replace(/\.0(?=\D|$)/g, '').replace(/\s*[–-]\s*/, '~').trim();
  const out: string[] = [];
  const body = [b.weight_kg ? `다 큰 몸무게 ${tidy(b.weight_kg)}kg` : '', b.life_years ? `수명 ${tidy(b.life_years)}년` : ''].filter(Boolean).join(', ');
  if (body) out.push(`${josa(N, '은/는')} ${body}이에요.`);
  if (t.food.value !== '계산기로') out.push(`하루 사료는 ${t.food.value}이고, ${t.food.detail}`);
  out.push(`${p.species === 'dog' ? '산책은' : '놀이는'} ${t.walk.detail}`);
  const groom = `빗질은 ${BRUSH_LABEL[p.brushing]}${p.trimWeeks ? `, 미용은 ${range(p.trimWeeks, '주')}마다` : ''}`;
  out.push(p.coat === 'hairless' ? '털이 없어 빗질 대신 피부를 자주 닦아 줘요.' : `${groom}${hasBatchim(groom) ? '이에요' : '예요'}.`);
  return out.join(' ');
}
