// 배포 뒤 한 번 실행: node scripts/indexnow.mjs
// 사이트맵의 주소 전부를 IndexNow(빙·네이버 등 참여 검색엔진 공용)로 알린다. 키 파일은 public/<key>.txt.
const KEY = '83cf1fe8141eab96104763fb457bb30c';
const HOST = 'mypet.taif.kr';
const res = await fetch(`https://${HOST}/sitemap.xml`);
const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log('사이트맵 주소', urls.length);
for (let i = 0; i < urls.length; i += 1000) {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(i, i + 1000) }),
  });
  console.log('IndexNow', r.status, await r.text());
}
