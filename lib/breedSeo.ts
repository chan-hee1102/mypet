import type { Metadata } from 'next';
import { dailyFeeding } from './energy';
import { breedGrowth, featuredBreeds, fmtKg, GROWTH_END, isMixed, isWideRange, type BreedRow } from './growth';
import { josa } from './josa';
import { seniorStartMonths } from './petData';
import { SITE } from './site';
import type { Species } from './types';

/**
 * 품종 성장·사료량 페이지의 문장과 숫자 — 페이지 파일은 화면만 그리고, 무엇을 말할지는 여기서 정한다.
 * 모든 숫자는 lib/growth(성장표)와 lib/energy(리포트와 같은 열량식)에서 나온다. 여기서 숫자를 새로 만들지 않는다.
 *
 * ⚠️ 출처는 정직하게(2026-09-27 감사): 개 성장 연구(Salt 2017)는 개 페이지에만, 계수표는 「수의영양학에서 널리 쓰는 값」,
 *    성장기 곡선과 개월별 비율은 「mypet이 정한 추정값」이라고 적는다. 판정하는 말투(「정상」「괜찮아요」)는 쓰지 않는다.
 */

export const PUBLISHED = '2026-09-27';
export const ORG_REF = { '@id': `${SITE.url}/#org` };

export const SOURCES = {
  growth: { org: 'PLOS ONE', title: 'Salt 외(2017), Growth standard charts for monitoring bodyweight in dogs of different sizes', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0182064' },
  nutrition: { org: 'WSAVA', title: 'Global Nutrition Guidelines (체형 점수·열량 계산 도구)', url: 'https://wsava.org/global-guidelines/global-nutrition-guidelines/' },
};

export const growthSources = (b: BreedRow) => (b.species === 'dog' ? [SOURCES.growth, SOURCES.nutrition] : [SOURCES.nutrition]);

export const kindOf = (b: BreedRow) => (b.species === 'cat' ? '고양이' : '강아지');
export const adultWord = (b: BreedRow) => (b.species === 'cat' ? '성묘' : '성견');
export const babyWord = (b: BreedRow) => (b.species === 'cat' ? '아기 고양이' : '아기 강아지');

/** 제목에 붙이는 흔한 줄임말 — 검색어가 줄임말로 갈려 있는 품종만 */
const TITLE_ALIAS: Record<string, string> = {
  포메라니안: '포메', 코리안숏헤어: '코숏', 요크셔테리어: '요키', 비숑프리제: '비숑', 미니어처슈나우저: '슈나우저',
  프렌치불도그: '프렌치불독', 카발리에킹찰스스패니얼: '카발리에', 셰틀랜드시프도그: '셸티', 시베리안허스키: '허스키',
  골든리트리버: '골든', 래브라도리트리버: '래브라도', 노르웨이숲고양이: '노르웨이숲', 브리티시숏헤어: '브숏',
};

/** 괄호 설명을 뗀 이름: 「웰시코기(펨브로크)」 → 「웰시코기」 */
export const baseName = (b: BreedRow) => b.breed_ko.replace(/\s*\([^)]*\)\s*/g, '').trim() || b.breed_ko;

/** 제목·h1용: 「포메라니안(포메)」, 「웰시코기」 */
export function titleName(b: BreedRow): string {
  const base = baseName(b);
  const a = TITLE_ALIAS[b.breed_ko];
  return a ? `${base}(${a})` : base;
}

/** 본문용: 「말티즈(몰티즈, 말티)」. 이름에 괄호가 있으면 떼고 붙여 괄호가 두 번 나오지 않게 */
export function nameWithAlias(b: BreedRow): string {
  const base = baseName(b);
  const alias = (b.aliases ?? []).filter((a) => /[가-힣]/.test(a) && a !== base && a !== b.breed_ko).slice(0, 2);
  return alias.length ? `${base}(${alias.join(', ')})` : base;
}

/** 표준 체중이 어디서 왔는지 — 혼합 품종에 「공인 품종 표준」이라고 쓰지 않는다 */
export function standardNote(b: BreedRow): string {
  if (isMixed(b)) return '공인 품종 표준이 없는 혼합 품종이라, 부모 품종의 체구를 기준으로 잡은 범위예요.';
  const org = (b.source_org ?? '').split(/[,·/]/)[0].trim();
  return org ? `${org} 품종 표준을 기준으로 한 범위예요.` : '공개된 품종 표준을 기준으로 한 범위예요.';
}

/** 성장표 아래 근거 문장 — 개와 고양이를 나눈다 */
export function growthBasisNote(b: BreedRow, cls: string): string {
  if (b.species === 'cat') {
    return '고양이는 보통 12개월, 메인쿤 같은 대형묘는 3~4살까지 자라요. 개월별 비율은 흔히 알려진 자묘 성장 기록에 맞춰 mypet이 정한 추정값이에요.';
  }
  const base = '작은 개는 8~12개월, 큰 개는 24개월까지 자란다는 개 성장 곡선 연구(Salt 외, 2017)의 체급 구분을 따랐고, 개월별 비율은 mypet이 정한 추정값이에요.';
  return cls === 'VI' ? `${base} 45kg 이상 체급은 이 연구 범위(40kg까지) 밖이라 mypet 추정만으로 계산했어요.` : base;
}

export function growthFacts(b: BreedRow) {
  const g = breedGrowth(b);
  if (!g) return null;
  const end = GROWTH_END[g.cls];
  const at = (m: number) => g.rows.find((r) => r.months === m) ?? g.rows[g.rows.length - 1];
  const range = (r: { min: number; max: number }) => `${fmtKg(r.min)}~${fmtKg(r.max)}kg`;
  const adult = range(g.adult);
  return { ...g, end, at, range, adultText: adult, lastMonth: g.rows[g.rows.length - 1].months, wide: isWideRange(b) };
}

/** 성장기 사료량 — 그 달 예상 몸무게의 중간값 기준 */
export function puppyFeedingRows(b: BreedRow) {
  const f = growthFacts(b);
  if (!f) return [];
  const sp = b.species as Species;
  const adultMid = (f.adult.min + f.adult.max) / 2;
  return f.rows.map((r) => {
    const w = (r.min + r.max) / 2;
    const e = dailyFeeding(sp, w, r.months, false, b.size, adultMid);
    return { months: r.months, weight: w, kcal: e.kcal, lo: e.gramLo, hi: e.gramHi };
  });
}

/** 다 큰 뒤 체중별 사료량 — 표준 체중 최소·중간·최대 × 중성화/안 함/노령 */
export function adultFeedingRows(b: BreedRow) {
  const f = growthFacts(b);
  if (!f) return [];
  const sp = b.species as Species;
  const ws = [f.adult.min, (f.adult.min + f.adult.max) / 2, f.adult.max];
  const senior = seniorStartMonths(sp, b.size);
  return ws.map((w) => ({
    weight: w,
    neutered: dailyFeeding(sp, w, 36, true, b.size),
    intact: dailyFeeding(sp, w, 36, false, b.size),
    senior: dailyFeeding(sp, w, senior + 12, true, b.size),
  }));
}

export const gramText = (e: { gramLo: number; gramHi: number } | { lo: number; hi: number }) => {
  const lo = 'gramLo' in e ? e.gramLo : e.lo;
  const hi = 'gramHi' in e ? e.gramHi : e.hi;
  return lo === hi ? `약 ${lo}g` : `${lo}~${hi}g`;
};

export const isBigDog = (cls: string) => cls === 'IV' || cls === 'V' || cls === 'VI';

/** 성장기에 챙길 것 — 체급·종류별로 실제로 다른 점만 */
export function growthCare(b: BreedRow): string[] {
  const f = growthFacts(b);
  if (!f) return [];
  if (b.species === 'cat') {
    const base = [
      '생후 6개월까지는 하루 3~4번, 그 뒤로는 하루 2번 이상 나눠 먹여요. 아기 고양이는 한 번에 많이 먹지 못해요.',
      '중성화 뒤에는 필요한 열량이 줄어 살이 붙기 쉬워요. 수술 뒤 한두 달은 체중을 자주 재 보세요.',
      '성장기 고양이는 성묘용이 아니라 키튼(자묘)용 사료가 맞아요. 단백질과 열량이 더 높아요.',
    ];
    if (f.cls === 'cat-large') base.unshift(`${josa(baseName(b), '은/는')} 3~4살까지 천천히 자라는 편이라, 1살에 표준 체중에 못 미치는 경우도 흔해요.`);
    return base;
  }
  const small = f.cls === 'I' || f.cls === 'II';
  const items: string[] = [];
  if (f.cls === 'I') items.push('초소형견 아기 강아지는 저혈당이 오기 쉬워요. 끼니 사이가 길게 벌어지지 않게 하루 3~4번 나눠 먹여요.');
  if (small) items.push('작은 개는 무릎뼈가 빠지는 슬개골 탈구가 흔해요. 미끄러운 바닥에는 매트를 깔고, 높은 곳에서 뛰어내리지 않게 해 주세요.');
  if (isBigDog(f.cls)) {
    items.push('큰 개는 성장기에 너무 빨리 살이 찌면 관절에 무리가 가요. 대형견 성장기용(칼슘·열량이 조절된) 사료를 고르고, 표보다 무겁게 키우지 않는 편이 좋아요.');
    items.push('뼈가 다 자라기 전에는 오래 뛰기, 계단 오르내리기 같은 무리한 운동을 줄여 주세요.');
    items.push('한 번에 몰아 먹이지 말고 나눠 주고, 먹은 뒤 1~2시간은 격하게 뛰지 않게 해 주세요. 큰 개는 위가 부풀어 꼬이는 위확장·염전이 생길 수 있어요.');
  }
  items.push(`성장이 끝나는 ${f.end.label}까지는 성장기용(퍼피) 사료를 먹이고, 그 뒤에 성견용으로 천천히 바꿔요. 중성화 뒤에는 살찌기 쉬워 체형을 보며 양을 줄여요.`);
  return items;
}

/**
 * 품종에만 해당하는 급여·체중 이야기(사람이 쓴 문장). 같은 체중대 품종끼리 페이지가 거의 같아지는 것을 막는 핵심이다
 * (2026-09-27 감사: 토이푸들과 포메라니안 본문 일치도 0.97). 근거가 분명한 것만 적는다.
 */
const BREED_FEED_NOTES: { names: string[]; text: string }[] = [
  { names: ['웰시코기(펨브로크)'], text: '허리가 긴 체형이라 살이 찌면 허리 디스크에 부담이 커요. 성장기부터 날씬하게 키우는 편이 좋아요.' },
  { names: ['골든리트리버', '래브라도리트리버'], text: '고관절 이형성증이 흔한 품종이에요. 성장기에 몸무게가 너무 빨리 늘지 않게 표의 아래쪽 범위로 키우는 편이 관절에 좋아요. 날씬하게 키운 래브라도가 더 오래 살았다는 연구도 있어요.' },
  { names: ['래브라도리트리버', '비글'], text: '식욕이 유난히 강한 품종이라 간식과 사람 음식으로 살이 붙기 쉬워요. 간식은 하루 열량의 10% 안에서, 사료에서 덜어 주세요.' },
  { names: ['퍼그', '프렌치불도그', '시츄', '페르시안'], text: '얼굴이 납작한 품종이라 알갱이를 집어 먹기 어려워할 수 있어요. 납작하거나 작은 알갱이, 얕은 그릇이 먹기 편해요. 더위와 비만에 약해 체중을 넉넉히 늘리지 않는 게 좋아요.' },
  { names: ['시베리안허스키', '사모예드', '보더콜리', '잭러셀테리어'], text: '활동량이 아주 많은 품종이라 운동량에 따라 표보다 열량이 더 필요할 수 있어요. 갈비뼈가 두드러지게 만져지면 조금씩 늘려 주세요.' },
  { names: ['스코티시폴드'], text: '연골 이상(골연골이형성증)이 알려진 품종이라 체중이 늘면 관절에 부담이 커요. 날씬하게 유지해 주세요.' },
  { names: ['먼치킨'], text: '다리가 짧아 체중이 늘면 관절과 허리에 부담이 커요. 높은 곳을 오르내리는 놀이보다 바닥 놀이가 편해요.' },
  { names: ['메인쿤', '노르웨이숲고양이', '랙돌', '브리티시숏헤어'], text: '1살이 넘어도 계속 자라는 편이라, 성묘 사료로 바꾸는 시기는 체형을 보며 병원과 정하면 좋아요.' },
  { names: ['이탈리안그레이하운드'], text: '원래 마른 체형이 정상인 품종이라 갈비뼈가 살짝 보이는 정도가 알맞은 경우가 많아요. 다른 품종 기준으로 살을 찌우지 않게 해 주세요.' },
  { names: ['진돗개', '시바이누'], text: '독립적이고 입이 짧은 개체도 있어요. 잘 안 먹는다고 간식을 늘리기보다 정해진 시간에 주고 20분쯤 뒤 치우는 식으로 습관을 잡아요.' },
];

export function breedNotes(b: BreedRow): string[] {
  return BREED_FEED_NOTES.filter((n) => n.names.includes(b.breed_ko)).map((n) => n.text);
}

/** 품종 데이터의 유전 질환(앞 3개)과 주의점(앞 2개) — 품종마다 다른 내용 */
export function breedHealth(b: BreedRow) {
  return {
    diseases: (b.guide?.hereditary ?? []).slice(0, 3),
    cautions: (b.guide?.cautions ?? []).slice(0, 2),
  };
}

/** 같은 종류 인기 품종 중 자기 뒤로 n개를 돌아가며 — 앞쪽 품종에만 링크가 몰리지 않게 */
export function neighbors(b: BreedRow, n = 8): BreedRow[] {
  const same = featuredBreeds().filter((x) => x.species === b.species);
  const i = same.findIndex((x) => x.breed_ko === b.breed_ko);
  return Array.from({ length: Math.min(n, same.length - 1) }, (_, k) => same[(i + 1 + k) % same.length]);
}

/** openGraph·twitter 공통 — 페이지가 openGraph를 쓰면 레이아웃의 og:image가 통째로 빠져서 여기서 다시 채운다 */
export function socialMeta(title: string, description: string, url: string, type: 'article' | 'website' = 'article'): Pick<Metadata, 'openGraph' | 'twitter'> {
  const images = [{ url: `${SITE.url}/opengraph-image`, width: 1200, height: 630, alt: title }];
  return {
    openGraph: { title, description, url, type, siteName: SITE.name, locale: 'ko_KR', images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((i) => i.url) },
  };
}
