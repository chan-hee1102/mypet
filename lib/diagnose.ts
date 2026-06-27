import breedData from './breedKnowledge.json';
import { Species } from './types';

/** 결제 전 무료 티저 — 품종 프로필(로컬 데이터)만 사용해 AI 비용 없이 즉시 계산. */
export type Teaser = {
  breedMatched: string | null; // 인식된 품종(한국어). 못 찾으면 null
  breedEn?: string;
  lifeYears?: string;
  size?: string;
  sourceOrg?: string;
};

const BREEDS = breedData as Array<{
  breed_ko: string;
  breed_en: string;
  aliases?: string[];
  species: string;
  size?: string;
  life_years?: string;
  source_org?: string;
}>;

/** 입력 품종명을 breedKnowledge와 느슨하게 매칭. */
export function buildTeaser(species: Species, breed?: string | null): Teaser {
  if (!breed) return { breedMatched: null };
  const base = breed.split(/[(,/·]/)[0].trim().toLowerCase();
  if (base.length < 2) return { breedMatched: null };
  const hit = BREEDS.find(
    (b) =>
      b.species === species &&
      (b.breed_ko.toLowerCase().includes(base) ||
        base.includes(b.breed_ko.toLowerCase()) ||
        (b.breed_en || '').toLowerCase().includes(base) ||
        (b.aliases || []).some((a) => a.toLowerCase().includes(base) || base.includes(a.toLowerCase()))),
  );
  if (!hit) return { breedMatched: null };
  return {
    breedMatched: hit.breed_ko,
    breedEn: hit.breed_en,
    lifeYears: hit.life_years,
    size: hit.size,
    sourceOrg: hit.source_org,
  };
}
