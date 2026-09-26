import type { Metadata } from 'next';
import { breedPath } from './breedSlug';
import { featuredBreeds } from './growth';
import { SITE } from './site';

/**
 * 네이버·빙에만 올리는 페이지(2026-09-27 사장님 지시: 「구글은 대량 생성 페이지 제재가 심하니 네이버·빙에만」).
 *
 * 방법: 구글봇에게만 noindex를 준다(<meta name="googlebot" content="noindex">). 네이버(Yeti)·빙은 이 태그를 보지 않는다.
 * ⚠️ robots.txt로 구글봇을 막으면 안 된다 — 막으면 noindex를 못 읽어서 링크만으로 주소가 색인될 수 있다.
 * 구글이 읽는 /sitemap.xml에서는 이 주소들을 빼고, /sitemap-nb.xml로 따로 모아 네이버 서치어드바이저·빙 웹마스터에만 제출한다.
 * 구글에도 열려면: 아래 robots를 지우고 주소를 /sitemap.xml로 옮기면 된다.
 */
export const NAVER_BING_ONLY: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: { index: false, follow: true },
};

export function naverBingOnlyUrls(): string[] {
  return [
    '/tools',
    '/tools/food',
    '/tools/adult-weight',
    ...featuredBreeds().flatMap((b) => [breedPath(b.breed_ko, 'growth'), breedPath(b.breed_ko, 'food')]),
  ].map((p) => `${SITE.url}${p}`);
}
