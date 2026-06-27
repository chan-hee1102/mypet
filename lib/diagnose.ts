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

function matchBreed(species: Species, breed?: string | null) {
  if (!breed) return null;
  const base = breed.split(/[(,/·]/)[0].trim().toLowerCase();
  if (base.length < 2) return null;
  return (
    BREEDS.find(
      (b) =>
        b.species === species &&
        (b.breed_ko.toLowerCase().includes(base) ||
          base.includes(b.breed_ko.toLowerCase()) ||
          (b.breed_en || '').toLowerCase().includes(base) ||
          (b.aliases || []).some((a) => a.toLowerCase().includes(base) || base.includes(a.toLowerCase()))),
    ) || null
  );
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

/** 1단계 무료 일반 가이드 — DB(품종 검수 데이터)에서 구성. AI 호출 없음. */
export type BreedGuide = {
  matched: boolean;
  breedKo?: string;
  breedEn?: string;
  size?: string;
  weightKg?: string;
  lifeYears?: string;
  points?: string[]; // 검수 설명을 문장 단위로 분리
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
  return {
    matched: true,
    breedKo: hit.breed_ko,
    breedEn: hit.breed_en,
    size: hit.size,
    weightKg: hit.weight_kg,
    lifeYears: hit.life_years,
    points,
    sourceOrg: hit.source_org,
    sourceTitle: hit.source_title ?? null,
    sourceUrl: hit.source_url ?? null,
  };
}
