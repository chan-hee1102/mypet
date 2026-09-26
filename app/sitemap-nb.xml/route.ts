import { naverBingOnlyUrls } from '@/lib/searchScope';

/**
 * 네이버·빙 전용 사이트맵 — robots.txt에 적지 않는다(구글이 읽지 않게).
 * 네이버 서치어드바이저·빙 웹마스터에 이 주소를 직접 제출한다. 이유와 방식은 lib/searchScope.ts.
 */
export const revalidate = 86400;

export function GET() {
  const lastmod = '2026-09-27';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${naverBingOnlyUrls()
  .map((u) => `<url><loc>${u.replace(/&/g, '&amp;')}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq></url>`)
  .join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
}
