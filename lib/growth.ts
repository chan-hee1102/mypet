import breedData from './breedKnowledge.json';
import { classForDog, growthRatio, tableMonths, type GrowthClass } from './growthCurve';

export * from './growthCurve';

/** 품종 데이터를 쓰는 쪽(서버 페이지 전용). 브라우저 계산기는 growthCurve만 가져간다 — 품종 JSON이 번들에 실리지 않게. */

/* ───────── 품종 ───────── */

export type BreedRow = {
  breed_ko: string;
  breed_en: string;
  aliases?: string[];
  species: string;
  size?: string;
  weight_kg?: string;
  life_years?: string;
  source_org?: string;
  guide?: {
    traits?: string[];
    grooming?: string[];
    exercise?: string[];
    hereditary?: { name: string; note: string }[];
    cautions?: string[];
  };
};

/**
 * 체급을 몸무게 중간값이 아니라 품종으로 고정하는 곳(2026-09-27 감사).
 * 래브라도(30.5kg)가 30kg 경계를 넘어 골든(29.5kg)과 다른 곡선을 타던 것, 브리티시숏헤어가 3살까지 자라는데 「12개월」로 나오던 것.
 */
const CLASS_OVERRIDE: Record<string, GrowthClass> = {
  래브라도리트리버: 'IV',
  브리티시숏헤어: 'cat-large',
};

export const BREEDS = breedData as BreedRow[];

/** "2.0–3.5", "3.5–11 (미니어처/…)", "15-18" → {min,max} */
export function parseRange(s?: string): { min: number; max: number } | null {
  if (!s) return null;
  const nums = s.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length === 0) return null;
  const min = nums[0];
  const max = nums[1] ?? nums[0];
  return min <= max ? { min, max } : { min: max, max: min };
}

export function breedGrowthClass(b: BreedRow): GrowthClass | null {
  const r = parseRange(b.weight_kg);
  if (!r) return null;
  if (CLASS_OVERRIDE[b.breed_ko]) return CLASS_OVERRIDE[b.breed_ko];
  if (b.species === 'cat') return b.size === '대형' ? 'cat-large' : 'cat';
  return classForDog((r.min + r.max) / 2);
}


export interface GrowthRow {
  months: number;
  min: number;
  max: number;
}

export function breedGrowth(b: BreedRow): { cls: GrowthClass; adult: { min: number; max: number }; rows: GrowthRow[] } | null {
  const adult = parseRange(b.weight_kg);
  const cls = breedGrowthClass(b);
  if (!adult || !cls) return null;
  const rows = tableMonths(cls).map((m) => {
    const r = growthRatio(cls, m);
    return { months: m, min: adult.min * r, max: adult.max * r };
  });
  return { cls, adult, rows };
}

/* ───────── 성장·사료량 전용 페이지를 여는 품종 ─────────
 * 188종 전부에 전용 페이지를 만들면 검색 수요가 없는 품종까지 얇은 페이지가 늘어난다.
 * 국내 양육 수가 많고 「○○ 개월별 몸무게」「○○ 사료량」을 실제로 찾는 품종만 연다. 나머지는 품종 페이지 안의 요약표로.
 */
export const FEATURED_BREEDS: string[] = [
  // 강아지
  // 닥스훈트는 데이터가 미니어처·스탠다드를 섞은 범위(3.5~11kg)라 표가 오해를 부른다 — 품종을 나눠 잡기 전까지 뺀다
  '말티즈', '토이푸들', '포메라니안', '시츄', '치와와', '비숑프리제', '요크셔테리어', '진돗개',
  '웰시코기(펨브로크)', '골든리트리버', '래브라도리트리버', '보더콜리', '시바이누', '사모예드', '비글',
  '미니어처슈나우저', '파피용', '프렌치불도그', '퍼그', '시베리안허스키', '잭러셀테리어', '셰틀랜드시프도그',
  '미니어처핀셔', '이탈리안그레이하운드', '카발리에킹찰스스패니얼', '미니어처푸들', '폼피츠', '말티푸', '말티숑',
  // 믹스견은 표준 체중 폭(5~25kg)이 너무 넓어 성장표가 의미 없다 — 계산기로 보낸다
  // 고양이
  '코리안숏헤어', '페르시안', '러시안블루', '스코티시폴드', '브리티시숏헤어', '벵갈', '먼치킨', '랙돌',
  '노르웨이숲고양이', '메인쿤', '아메리칸숏헤어', '샴', '터키시앙고라', '아비시니안', '믹스/혼혈 고양이',
];

export const findBreed = (name: string) => BREEDS.find((b) => b.breed_ko === name);

/** 표준 체중 최대/최소가 2.2배를 넘으면(믹스견 5~25kg, 도사견 40~90kg…) 개월별 표가 오히려 오해를 부른다 */
export function isWideRange(b: BreedRow): boolean {
  const r = parseRange(b.weight_kg);
  return !!r && r.min > 0 && r.max / r.min > 2.2;
}

/** 공인 품종 표준이 없는 혼합 품종(말티푸·폼피츠·믹스…) */
export const isMixed = (b: BreedRow) => /혼합|믹스|혼혈/.test(`${b.source_org ?? ''}${b.breed_ko}`);
export const isFeatured = (name: string) => FEATURED_BREEDS.includes(name);
export const featuredBreeds = () => FEATURED_BREEDS.map(findBreed).filter((b): b is BreedRow => !!b);

export { breedPath, breedSlugOf, slugMatches } from './breedSlug';
