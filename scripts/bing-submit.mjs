// 배포 뒤 실행: node scripts/bing-submit.mjs   — 빙 웹마스터 SubmitUrlBatch로 중요한 주소부터 하루 한도(100)만큼 제출한다.
// 챗GPT 검색은 빙 색인을 함께 쓴다 — 빙에 빨리 들어가야 챗GPT가 인용할 수 있다(2026-11-19 「챗GPT에 나오게」).
// 키는 사용자 환경 변수 BING_WEBMASTER_API_KEY(출력하지 않는다). 남은 한도를 먼저 보고 그만큼만 보낸다.
// 순서: 첫 화면·목록·처음 데려온다면·가이드 → 네이버 착지가 많은 사료량·몸무게(말티푸·코숏…) → 나머지 사료량·몸무게 → 품종 안내판.
const key = process.env.BING_WEBMASTER_API_KEY;
if (!key) {
  console.error('BING_WEBMASTER_API_KEY 없음');
  process.exit(1);
}
const HOST = 'https://mypet.taif.kr';
const site = encodeURIComponent(`${HOST}/`);
const api = (m) => `https://ssl.bing.com/webmaster/api.svc/json/${m}?apikey=${key}`;

const quota = await (await fetch(`https://ssl.bing.com/webmaster/api.svc/json/GetUrlSubmissionQuota?siteUrl=${site}&apikey=${key}`)).json();
const left = quota?.d?.DailyQuota ?? 0;
console.log('오늘 남은 한도', left, '이번 달', quota?.d?.MonthlyQuota);
if (!left) process.exit(0);

const locs = async (path) => [...(await (await fetch(`${HOST}${path}`)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
const main = await locs('/sitemap.xml');
const nb = await locs('/sitemap-nb.xml');
// 네이버 착지 상위(2026-11-05~19) — 같은 페이지가 빙·챗GPT에서도 먼저 잡히게
const HOT = ['말티푸', '코리안숏헤어', '브리티시숏헤어', '진돗개', '골든리트리버', '시츄', '치와와', '먼치킨', '보더콜리', '시바이누', '말티즈', '포메라니안', '토이푸들', '비숑프리제', '러시안블루', '스코티시폴드', '페르시안', '랙돌'];
const hot = nb.filter((u) => HOT.some((n) => decodeURIComponent(u).includes(`/breed/${n}/`)));
const first = main.filter((u) => !/\/breed\/[^/]+$/.test(decodeURIComponent(u).replace(HOST, '')));
const ordered = [...new Set([...first, ...hot, ...nb, ...main])].slice(0, left);
const r = await fetch(api('SubmitUrlBatch'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ siteUrl: `${HOST}/`, urlList: ordered }),
});
console.log('빙 제출', ordered.length, '건 →', r.status, (await r.text()).slice(0, 160));
