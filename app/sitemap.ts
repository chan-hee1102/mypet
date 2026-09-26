import type { MetadataRoute } from 'next';
import breedData from '@/lib/breedKnowledge.json';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';
import { breedPath } from '@/lib/breedSlug';
import { featuredBreeds } from '@/lib/growth';

/**
 * 검색엔진 색인용 사이트맵 — 정적 페이지 + 정보 가이드 + 품종 가이드 188종.
 *
 * ⚠️ 여기에만 있고 **어디서도 링크되지 않는 페이지는 색인이 잘 안 된다.** 사이트맵은 발견을 돕는
 *    힌트일 뿐, 링크가 색인의 근거다. 새 페이지를 넣을 때는 /guide 허브나 푸터에서 닿는지 함께 확인할 것.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const breeds = (breedData as { breed_ko: string }[]).map((b) => ({
    url: `${base}${breedPath(b.breed_ko)}`,
    lastModified: new Date('2026-09-27'),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  const guides = GUIDES.map((g) => ({
    url: `${base}/guide/${g.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));
  // 2026-09-27 추가한 성장·사료량 페이지와 계산기. lastModified는 고정 날짜 — 매번 now()면 검색엔진이 신호를 믿지 않는다
  const added = new Date('2026-09-27');
  const breedTools = featuredBreeds().flatMap((b) => [
    { url: `${base}${breedPath(b.breed_ko, 'growth')}`, lastModified: added, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${base}${breedPath(b.breed_ko, 'food')}`, lastModified: added, changeFrequency: 'monthly' as const, priority: 0.8 },
  ]);
  const tools = ['/tools', '/tools/food', '/tools/adult-weight'].map((p) => ({
    url: `${base}${p}`, lastModified: added, changeFrequency: 'monthly' as const, priority: p === '/tools' ? 0.6 : 0.9,
  }));
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/diagnose`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/guide`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/breed`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/sample`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/refund`, changeFrequency: 'yearly', priority: 0.2 },
    ...tools,
    ...guides,
    ...breedTools,
    ...breeds,
  ];
}
