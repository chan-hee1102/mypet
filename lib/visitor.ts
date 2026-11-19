/**
 * 방문 한 줄이 사람인지 봇인지 — KOSTOCK 관리자의 판정(kostock lib/bot-signals)을 mypet 방문 기록에 옮긴 것(2026-11-19).
 *
 * 왜 필요한가: 11-08 점검에서 30일 4,002건 중 84%가 「직접 유입 · PC · 0초」로 하루 내내 품종 페이지를 고르게 여는
 * JS 실행 크롤러였다(진짜 사람은 네이버 검색 하루 20~50명). 관리자·taif 카드가 그 숫자를 「방문」으로 세고 있었다.
 *
 * 신호(전부 /api/track이 저장 — IP·UA 원문은 저장하지 않는다):
 *   서버가 본 것  · 브라우저 이름+주버전(browserOf) · 이름을 밝힌 봇(botOf: 검색·AI·미리보기·도구)
 *                 · 자동 조종(webdriver) · 헤드리스·위장 크롬(클라이언트 힌트가 UA와 어긋남) · 너무 낡은 데스크톱 크롬
 *   화면이 보낸 것 · 화면을 만졌나(스크롤·터치·마우스·키 — interacted) · 탭을 정상으로 닫았나(closed)
 *                 · 시간대·언어(해외 서버에서 도는 봇은 시간대가 서울이 아니다)
 * 판정(kindOf)은 쓸 때마다 다시 계산해 visits.kind에 둔다 — 개수 세는 곳(taif 카드)이 행을 읽지 않고 거를 수 있게.
 *
 * ⚠️ 막지 않는다. 「봇 의심」 무리가 네이버 검색봇일 수도 있어 막으면 검색 유입이 끊긴다 — 통계에서만 뺀다.
 * ⚠️ 사람을 봇으로 빼는 쪽이 더 나쁘다. 휴대폰은 행동만으로 봇이라 하지 않는다(오래된 앱 속 브라우저는 진짜 사람이 쓴다).
 */

export type Kind = 'human' | 'likely' | 'search' | 'ai' | 'preview' | 'auto' | 'suspect';

export const KIND_LABEL: Record<Kind, string> = {
  human: '사람',
  likely: '사람 추정',
  search: '검색봇',
  ai: 'AI봇',
  preview: '미리보기봇',
  auto: '자동 브라우저',
  suspect: '봇 의심',
};

export const PERSON_KINDS: readonly Kind[] = ['human', 'likely'];
export const isPerson = (k: Kind | string | null | undefined) => k === 'human' || k === 'likely';

/* ───────── 브라우저 이름(KOSTOCK browserOf와 같은 규칙) ───────── */

/** 「크롬 141」처럼 이름 + 주버전. 웨일·삼성·엣지·앱 속 브라우저가 Chrome/·Safari/를 함께 적어 순서가 중요하다 */
export function browserOf(ua: string | null | undefined): string | null {
  if (!ua) return null;
  const rules: [string, RegExp][] = [
    ['카카오톡', /KAKAOTALK[ /](\d+)/i],
    ['네이버앱', /NAVER\((?:inapp|higgs)[^)]*?(\d+)/i],
    ['인스타그램', /Instagram (\d+)/i],
    ['페이스북', /FBAV\/(\d+)|FB_IAB(?!.*FBAV)/],
    ['라인', /\bLine\/(\d+)/i],
    ['밴드', /\bBAND\/(\d+)/i],
    ['다음앱', /DaumApps\/(\d+)/i],
    ['구글앱', /\bGSA\/(\d+)/],
    ['앱 속 브라우저', /Android[^)]*; wv\)/],
    ['앱 속 브라우저', /(?:iPhone|iPad|iPod)(?!.*Safari\/)/],
    ['웨일', /Whale\/(\d+)/],
    ['삼성', /SamsungBrowser\/(\d+)/],
    ['엣지', /Edg(?:A|iOS)?\/(\d+)/],
    ['오페라', /OPR\/(\d+)/],
    ['파이어폭스', /(?:Firefox|FxiOS)\/(\d+)/],
    ['헤드리스 크롬', /HeadlessChrome\/(\d+)/],
    ['크롬', /(?:CriOS|Chrome)\/(\d+)/],
    ['사파리', /Version\/(\d+)[^ ]* (?:Mobile\/\S+ )?Safari\//],
  ];
  for (const [name, re] of rules) {
    const m = ua.match(re);
    if (m) return m[1] ? `${name} ${m[1]}` : name;
  }
  return null;
}

/* ───────── 이름을 밝힌 봇 ───────── */

/** [분류, 이름, UA 표식] — 앞에서부터 처음 맞는 것 */
const NAMED: [Exclude<Kind, 'human' | 'likely' | 'suspect'> | 'tool', string, RegExp][] = [
  ['search', '네이버', /Yeti|NaverBot/i],
  ['search', '구글', /Googlebot|Google-InspectionTool|AdsBot-Google|Mediapartners-Google|APIs-Google|Storebot-Google/i],
  ['search', '빙', /bingbot|BingPreview|msnbot/i],
  // 다음 앱 속 브라우저(DaumApps/…)는 사람이다 — 수집기는 「Daum/4.1」·「Daumoa」
  ['search', '다음', /\bDaum\/\d|Daumoa/],
  ['search', '애플', /Applebot/i],
  ['search', '덕덕고', /DuckDuckBot/i],
  ['search', '얀덱스', /YandexBot|YandexMobileBot/i],
  ['search', '바이두', /Baiduspider/i],
  ['search', '기타 검색', /SeznamBot|Sogou|Exabot|PetalBot|Qwantify|coccocbot/i],
  ['ai', 'ChatGPT', /GPTBot|ChatGPT-User|OAI-SearchBot/i],
  ['ai', 'Claude', /ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai/i],
  ['ai', 'Perplexity', /PerplexityBot|Perplexity-User/i],
  ['ai', '구글 AI', /Google-Extended|GoogleOther/i],
  ['ai', 'Exa', /ExaBot|ExaSearchBot|Exa-User/i],
  ['ai', '기타 AI', /CCBot|Bytespider|Amazonbot|meta-externalagent|meta-externalfetcher|cohere-ai|YouBot|Diffbot|ImagesiftBot|Timpibot/i],
  ['preview', '카카오톡 미리보기', /kakaotalk-scrap/i],
  ['preview', '페이스북 미리보기', /facebookexternalhit|facebookcatalog/i],
  ['preview', '기타 미리보기', /Slackbot|Twitterbot|TelegramBot|Discordbot|LinkedInBot|WhatsApp|Pinterestbot|SkypeUriPreview/i],
  ['auto', '헤드리스 브라우저', /HeadlessChrome|PhantomJS|Puppeteer|Playwright|Selenium/i],
  ['auto', '측정 도구', /Lighthouse|PageSpeed|GTmetrix|PTST/i],
  ['tool', 'SEO 도구', /AhrefsBot|SemrushBot|MJ12bot|DotBot|Screaming Frog|BLEXBot|serpstatbot|DataForSeoBot|SiteAuditBot/i],
  ['tool', '스크립트', /curl\/|Wget|python-requests|python-urllib|aiohttp|axios|node-fetch|undici|Go-http-client|Java\/|okhttp|libwww|Scrapy|HTTrack/i],
  // 「Cubot」은 휴대폰 상표라 뺀다
  ['tool', '기타 봇', /(?<!cu)bot\b|crawler|spider|slurp|scrapy|fetcher/i],
];

/** 데스크톱 크롬이 이보다 낮으면 사람으로 보지 않는다(100 = 2022-03, 윈도 7·8은 109에서 멈춤 — KOSTOCK 실측) */
const OLD_DESKTOP_CHROME_BELOW = 100;
const PURE_DESKTOP_CHROME = /^Mozilla\/5\.0 \((?:Windows NT [\d.]+[^)]*|Macintosh; Intel Mac OS X [\d_]+)\) AppleWebKit\/537\.36 \(KHTML, like Gecko\) Chrome\/(\d+)\.[\d.]+ Safari\/537\.36$/;

function brandVersion(secChUa: string, brand: string): number | null {
  for (const m of secChUa.matchAll(/"([^"]+)";\s*v="(\d+)"/g)) if (m[1] === brand) return Number(m[2]);
  return null;
}

/**
 * 서버가 본 요청으로 내린 봇 판정 — 「분류:이름」(예 `search:네이버`, `auto:webdriver`). 사람 쪽이면 null.
 * 클라이언트 힌트(Sec-CH-UA)는 크로미움이 HTTPS마다 보낸다 — UA만 바꾼 자동화는 힌트가 원래 값으로 남아 어긋난다.
 * webdriver는 화면이 보낸 값이라 거짓일 수 있지만 「나를 빼 달라」는 거짓말만 가능하다.
 */
export function botOf(input: { ua: string; secChUa?: string | null; platform?: string | null; webdriver?: boolean }): string | null {
  const ua = input.ua.trim();
  if (!ua) return 'tool:브라우저 정보 없음';
  for (const [cat, name, re] of NAMED) if (re.test(ua)) return `${cat === 'tool' ? 'auto' : cat}:${name}`;
  if (input.webdriver) return 'auto:자동 조종(webdriver)';
  const secChUa = input.secChUa ?? null;
  if (secChUa && /HeadlessChrome/i.test(secChUa)) return 'auto:헤드리스 크롬';
  const m = ua.match(PURE_DESKTOP_CHROME);
  if (m) {
    const v = Number(m[1]);
    if (v < OLD_DESKTOP_CHROME_BELOW) return 'auto:낡은 크롬';
    if (input.platform) {
      const want = ua.includes('Windows NT') ? 'Windows' : 'macOS';
      if (input.platform.replace(/"/g, '').trim() !== want) return 'auto:위장 크롬(운영체제 어긋남)';
    }
    if (secChUa) {
      const b = brandVersion(secChUa, 'Chromium') ?? brandVersion(secChUa, 'Google Chrome');
      if (b !== null && b !== v) return 'auto:위장 크롬(버전 어긋남)';
    }
  }
  return null;
}

/* ───────── 판정 ───────── */

export type KindInput = {
  bot: string | null;
  device: string | null;
  duration_sec: number;
  pageviews: number;
  clicks: number;
  interacted: boolean | null;
  closed: boolean | null;
  tz: string | null;
};

export type Verdict = { kind: Kind; why: string };

const secs = (s: number) => (s < 60 ? `${s}초` : `${Math.floor(s / 60)}분`);

/**
 * 사람인가 봇인가. 위에서부터 처음 맞는 것.
 *   1. 서버가 봇이라 본 것(이름·자동 조종·위장)
 *   2. 화면을 만졌거나 눌렀거나 두 쪽 이상 봄 → 사람
 *   3. 해외 시간대인데 아무것도 안 함 → 봇 의심
 *   4. PC · 5초 안 · 닫힘 신호 없음(브라우저째 꺼짐) → 봇 의심(KOSTOCK 「숨은 헤드리스 탭」과 같은 꼴)
 *   5. 10초 넘게 봄, 또는 휴대폰 → 사람 추정
 *   6. 나머지(PC · 짧게 · 조작 없음) → 봇 의심
 */
export function kindOf(r: KindInput): Verdict {
  if (r.bot) {
    const [cat, ...rest] = r.bot.split(':');
    const name = rest.join(':');
    const kind: Kind = cat === 'search' || cat === 'ai' || cat === 'preview' ? cat : 'auto';
    return { kind, why: name || KIND_LABEL[kind] };
  }
  if (r.interacted) return { kind: 'human', why: '화면을 만졌어요' };
  if (r.clicks > 0) return { kind: 'human', why: `${r.clicks}번 눌렀어요` };
  if (r.pageviews >= 2) return { kind: 'human', why: `${r.pageviews}쪽 봤어요` };
  if (r.tz && r.tz !== 'Asia/Seoul') return { kind: 'suspect', why: `해외 시간대(${r.tz}) · 조작 없음` };
  const mobile = r.device === 'mobile';
  if (!mobile && r.duration_sec < 5 && !r.closed) return { kind: 'suspect', why: 'PC · 5초 안 · 닫힘 신호 없음' };
  if (r.duration_sec >= 10) return { kind: 'likely', why: `${secs(r.duration_sec)} 머묾` };
  if (mobile) return { kind: 'likely', why: '휴대폰 · 짧게 봄' };
  return { kind: 'suspect', why: 'PC · 짧게 · 조작 없음' };
}
