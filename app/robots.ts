import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 결과 페이지(비밀 링크)·관리자·API는 색인 금지
      { userAgent: '*', allow: '/', disallow: ['/r/', '/admin', '/api/'] },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
