// 배포 뒤 한 번 실행: node scripts/indexnow.mjs   (특정 주소만: node scripts/indexnow.mjs /breed/말티즈/food /guide/...)
// 사이트맵의 주소 전부를 IndexNow로 알린다. 키 파일은 public/<key>.txt.
// 보내는 곳 두 군데(2026-11-19):
//   ① api.indexnow.org — 빙 등 참여 검색엔진 공용
//   ② searchadvisor.naver.com/indexnow — 네이버 직접. 코스톡에서 공용으로만 보냈을 때 날짜 페이지가 열흘씩 색인되지 않았고,
//      네이버 직접 통보를 더한 뒤 풀렸다(2026-10-24). 구글은 IndexNow에 참여하지 않는다.
const KEY = '83cf1fe8141eab96104763fb457bb30c';
const HOST = 'mypet.taif.kr';
const ENDPOINTS = ['https://api.indexnow.org/indexnow', 'https://searchadvisor.naver.com/indexnow'];

let urls = [];
const only = process.argv.slice(2);
if (only.length) {
  urls = only.map((p) => (p.startsWith('http') ? p : `https://${HOST}${encodeURI(p)}`));
} else {
  // 네이버·빙 전용 사이트맵까지 함께 알린다
  for (const path of ['/sitemap.xml', '/sitemap-nb.xml']) {
    const xml = await (await fetch(`https://${HOST}${path}`)).text();
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&')));
  }
}
urls = [...new Set(urls)];
console.log('알릴 주소', urls.length);
for (const endpoint of ENDPOINTS) {
  for (let i = 0; i < urls.length; i += 1000) {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(i, i + 1000) }),
    });
    console.log(new URL(endpoint).host, r.status, (await r.text()).slice(0, 120));
  }
}
