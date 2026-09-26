import { GUIDES } from '@/lib/guides';
import { baseName } from '@/lib/breedSeo';
import { breedPath, featuredBreeds } from '@/lib/growth';
import { SITE } from '@/lib/site';

/**
 * /rss.xml — 네이버 서치어드바이저에 사이트맵과 함께 제출한다(네이버는 RSS로 새 글을 더 빨리 가져간다).
 * 검색 유입용 페이지만 싣는다: 계산기·품종별 개월별 몸무게·사료량·정보 가이드.
 */

export const revalidate = 86400;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const DATE = new Date('2026-09-27T09:00:00+09:00').toUTCString();

export function GET() {
  const items: { title: string; link: string; description: string }[] = [
    { title: '강아지·고양이 사료량 계산기', link: `${SITE.url}/tools/food`, description: '몸무게·나이·중성화로 하루 열량과 건사료 g을 계산해요.' },
    { title: '강아지 다 크면 몇 kg? 다 큰 몸무게 계산기', link: `${SITE.url}/tools/adult-weight`, description: '지금 나이·몸무게로 다 컸을 때 몸무게를 계산해요.' },
    ...featuredBreeds().flatMap((b) => [
      { title: `${baseName(b)} 개월별 몸무게`, link: `${SITE.url}${breedPath(b.breed_ko, 'growth')}`, description: `${baseName(b)} 2개월부터 다 클 때까지 예상 몸무게 표와 계산기.` },
      { title: `${baseName(b)} 사료량`, link: `${SITE.url}${breedPath(b.breed_ko, 'food')}`, description: `${baseName(b)} 개월별·체중별 하루 사료량 표와 계산기.` },
    ]),
    ...GUIDES.map((g) => ({ title: g.title, link: `${SITE.url}/guide/${g.slug}`, description: g.lead })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${esc(SITE.serviceName)}</title>
<link>${SITE.url}</link>
<description>강아지·고양이 사료량, 개월별 몸무게, 예방접종, 품종별 키우기 정보</description>
<language>ko</language>
<lastBuildDate>${DATE}</lastBuildDate>
${items
  .map(
    (i) => `<item><title>${esc(i.title)}</title><link>${esc(i.link)}</link><guid>${esc(i.link)}</guid><description>${esc(i.description)}</description><pubDate>${DATE}</pubDate></item>`,
  )
  .join('\n')}
</channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
}
