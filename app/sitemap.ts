import type { MetadataRoute } from 'next';
import breedData from '@/lib/breedKnowledge.json';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';

/**
 * 검색엔진 색인용 사이트맵 — 정적 페이지 + 정보 가이드 + 품종 가이드 188종.
 *
 * ⚠️ 여기에만 있고 **어디서도 링크되지 않는 페이지는 색인이 잘 안 된다.** 사이트맵은 발견을 돕는
 *    힌트일 뿐, 링크가 색인의 근거다. 새 페이지를 넣을 때는 /guide 허브나 푸터에서 닿는지 함께 확인할 것.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const breeds = (breedData as { breed_ko: string }[]).map((b) => ({
    url: `${base}/breed/${encodeURIComponent(b.breed_ko)}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  const guides = GUIDES.map((g) => ({
    url: `${base}/guide/${g.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/diagnose`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/guide`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/breed`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/symptom`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/refund`, changeFrequency: 'yearly', priority: 0.2 },
    ...guides,
    ...breeds,
  ];
}
