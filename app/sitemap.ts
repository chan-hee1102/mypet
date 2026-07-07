import type { MetadataRoute } from 'next';
import breedData from '@/lib/breedKnowledge.json';
import { SITE } from '@/lib/site';

/** 검색엔진 색인용 사이트맵 — 정적 페이지 + 품종 가이드 188종. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const breeds = (breedData as { breed_ko: string }[]).map((b) => ({
    url: `${base}/breed/${encodeURIComponent(b.breed_ko)}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/diagnose`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/breed`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/refund`, changeFrequency: 'yearly', priority: 0.2 },
    ...breeds,
  ];
}
