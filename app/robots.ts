import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/**
 * ⚠️ '/r/' 차단은 그대로 둔다 — 결과 페이지는 링크를 아는 사람만 보는 비밀 주소다.
 *    색인되면 남의 리포트가 검색에 노출된다.
 *
 * AI 크롤러를 따로 적는 이유: 기본 '*' 규칙에 이미 포함되지만, 명시해 두면 **의도가 남는다.**
 * 나중에 누가 전체 차단을 검토할 때 "얘들은 일부러 열어둔 것"임을 코드에서 바로 알 수 있다.
 * 우리 공개 문서는 인용되는 편이 이득이다(/llms.txt에 안내를 함께 둔다).
 */
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

export default function robots(): MetadataRoute.Robots {
  const blocked = ['/r/', '/admin', '/api/'];
  return {
    rules: [
      // 결과 페이지(비밀 링크)·관리자·API는 색인 금지
      { userAgent: '*', allow: '/', disallow: blocked },
      ...AI_CRAWLERS.map((ua) => ({ userAgent: ua, allow: '/', disallow: blocked })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
