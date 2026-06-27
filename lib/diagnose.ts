import breedData from './breedKnowledge.json';
import { Species } from './types';

const BREEDS = breedData as Array<{
  breed_ko: string;
  breed_en: string;
  aliases?: string[];
  species: string;
  size?: string;
  weight_kg?: string;
  life_years?: string;
  content?: string;
  source_org?: string;
  source_title?: string;
  source_url?: string;
}>;

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/**
 * 품종 매칭 — 정확 일치 우선, 그 다음 포함관계.
 * 느슨한 짧은 별칭 substring(예: "폼"이 "폼피츠"에 포함)으로 인한 오매칭을 방지한다.
 * → "폼피츠"(믹스)는 어떤 순종과도 일치하지 않아 null 반환(정확성 우선).
 */
function matchBreed(species: Species, breed?: string | null) {
  if (!breed) return null;
  const base = norm(breed.split(/[(,/·]/)[0]);
  if (base.length < 2) return null;
  const pool = BREEDS.filter((b) => b.species === species);

  // 1) 정확 일치 (한글명 · 영문명 · 별칭)
  for (const b of pool) {
    if (norm(b.breed_ko) === base || norm(b.breed_en) === base) return b;
    if ((b.aliases || []).some((a) => norm(a) === base)) return b;
  }
  // 2) 포함관계 (입력이 품종명을 포함하거나, 품종명이 입력을 포함)
  for (const b of pool) {
    const ko = norm(b.breed_ko);
    if (ko.includes(base) || base.includes(ko)) return b;
  }
  return null;
}

/** 결제 전 무료 티저(레거시 — 짧은 인식 정보). */
export type Teaser = {
  breedMatched: string | null;
  breedEn?: string;
  lifeYears?: string;
  size?: string;
  sourceOrg?: string;
};

export function buildTeaser(species: Species, breed?: string | null): Teaser {
  const hit = matchBreed(species, breed);
  if (!hit) return { breedMatched: null };
  return { breedMatched: hit.breed_ko, breedEn: hit.breed_en, lifeYears: hit.life_years, size: hit.size, sourceOrg: hit.source_org };
}

/** 1단계 무료 일반 가이드 — DB(품종 검수 데이터)를 카드용으로 분류. AI 호출 없음. */
export type BreedGuide = {
  matched: boolean;
  breedKo?: string;
  breedEn?: string;
  size?: string;
  weightKg?: string;
  lifeYears?: string;
  intro?: string; // 한 줄 소개
  traits?: string[]; // 성격·특징
  grooming?: string[]; // 털·그루밍
  exercise?: string[]; // 산책·운동
  diseases?: string[]; // 호발/유전질환
  sourceOrg?: string;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
};

export function getBreedGuide(species: Species, breed?: string | null): BreedGuide {
  const hit = matchBreed(species, breed);
  if (!hit) return { matched: false };

  const points = (hit.content || '')
    .split(/(?<=다\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  const intro = points[0] ?? '';
  const rest = points.slice(1);

  const isDisease = (p: string) => /질환|질병|호발|유전|선천|발병|보고/.test(p);
  const isExercise = (p: string) => /산책|운동|활동|점프|계단|하네스|관절|슬개골|호흡|더위|성장판/.test(p);
  const isGrooming = (p: string) => /털|그루밍|빗질|미용|코트|목욕|엉킴|헤어볼|피부/.test(p);

  const diseases: string[] = [];
  const exercise: string[] = [];
  const grooming: string[] = [];
  const traits: string[] = [];
  for (const p of rest) {
    if (isDisease(p)) diseases.push(p);
    else if (isExercise(p)) exercise.push(p);
    else if (isGrooming(p)) grooming.push(p);
    else traits.push(p);
  }

  return {
    matched: true,
    breedKo: hit.breed_ko,
    breedEn: hit.breed_en,
    size: hit.size,
    weightKg: hit.weight_kg,
    lifeYears: hit.life_years,
    intro,
    traits,
    grooming,
    exercise,
    diseases,
    sourceOrg: hit.source_org,
    sourceTitle: hit.source_title ?? null,
    sourceUrl: hit.source_url ?? null,
  };
}
