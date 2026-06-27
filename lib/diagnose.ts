import breedData from './breedKnowledge.json';
import { Species } from './types';

type Hereditary = { name: string; note: string };
type Guide = {
  summary?: string;
  traits?: string[];
  grooming?: string[];
  exercise?: string[];
  hereditary?: Hereditary[];
  cautions?: string[];
};

const BREEDS = breedData as Array<{
  breed_ko: string;
  breed_en: string;
  aliases?: string[];
  species: string;
  size?: string;
  weight_kg?: string;
  life_years?: string;
  content?: string;
  guide?: Guide;
  source_org?: string;
  source_title?: string;
  source_url?: string;
}>;

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/** 품종 매칭 — 정확 일치 우선, 그 다음 포함관계. 느슨한 짧은 별칭 substring 오매칭 방지. */
function matchBreed(species: Species, breed?: string | null) {
  if (!breed) return null;
  const base = norm(breed.split(/[(,/·]/)[0]);
  if (base.length < 2) return null;
  const pool = BREEDS.filter((b) => b.species === species);
  for (const b of pool) {
    if (norm(b.breed_ko) === base || norm(b.breed_en) === base) return b;
    if ((b.aliases || []).some((a) => norm(a) === base)) return b;
  }
  for (const b of pool) {
    const ko = norm(b.breed_ko);
    if (ko.includes(base) || base.includes(ko)) return b;
  }
  return null;
}

export type Teaser = { breedMatched: string | null; breedEn?: string; lifeYears?: string; size?: string; sourceOrg?: string };
export function buildTeaser(species: Species, breed?: string | null): Teaser {
  const hit = matchBreed(species, breed);
  if (!hit) return { breedMatched: null };
  return { breedMatched: hit.breed_ko, breedEn: hit.breed_en, lifeYears: hit.life_years, size: hit.size, sourceOrg: hit.source_org };
}

/** 1단계 무료 일반 가이드 — 항목별 구조. */
export type BreedGuide = {
  matched: boolean;
  breedKo?: string;
  breedEn?: string;
  size?: string;
  weightKg?: string;
  lifeYears?: string;
  summary?: string;
  traits?: string[];
  grooming?: string[];
  exercise?: string[];
  hereditary?: Hereditary[];
  cautions?: string[];
  sourceOrg?: string;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
};

/** content를 문장 단위로 분리(폴백용). */
function splitSentences(content: string): string[] {
  return (content || '')
    .split(/(?<=다\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && !/참고용|진단을 대체|진단을 대신/.test(s));
}

export function getBreedGuide(species: Species, breed?: string | null): BreedGuide {
  const hit = matchBreed(species, breed);
  if (!hit) return { matched: false };

  const common = {
    matched: true as const,
    breedKo: hit.breed_ko,
    breedEn: hit.breed_en,
    size: hit.size,
    weightKg: hit.weight_kg,
    lifeYears: hit.life_years,
    sourceOrg: hit.source_org,
    sourceTitle: hit.source_title ?? null,
    sourceUrl: hit.source_url ?? null,
  };

  // 구조화 guide가 있으면 그대로 사용
  if (hit.guide && hit.guide.summary) {
    return {
      ...common,
      summary: hit.guide.summary,
      traits: hit.guide.traits ?? [],
      grooming: hit.guide.grooming ?? [],
      exercise: hit.guide.exercise ?? [],
      hereditary: hit.guide.hereditary ?? [],
      cautions: hit.guide.cautions ?? [],
    };
  }

  // 폴백: 문장 분리 후 키워드 분류
  const pts = splitSentences(hit.content || '');
  const intro = pts[0] ?? '';
  const rest = pts.slice(1);
  const isDisease = (p: string) => /질환|질병|호발|유전|선천|발병|보고/.test(p);
  const isExercise = (p: string) => /산책|운동|활동|점프|계단|하네스|관절|슬개골|호흡|더위|성장판/.test(p);
  const isGrooming = (p: string) => /털|그루밍|빗질|미용|코트|목욕|엉킴|헤어볼|피부/.test(p);
  const traits: string[] = [];
  const grooming: string[] = [];
  const exercise: string[] = [];
  const diseases: string[] = [];
  for (const p of rest) {
    if (isDisease(p)) diseases.push(p);
    else if (isExercise(p)) exercise.push(p);
    else if (isGrooming(p)) grooming.push(p);
    else traits.push(p);
  }
  return {
    ...common,
    summary: intro,
    traits,
    grooming,
    exercise,
    hereditary: diseases.map((d) => ({ name: d, note: '' })),
    cautions: [],
  };
}
