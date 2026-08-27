/**
 * 가이드 불변조건 검사 — `node scripts/check-guides.mjs`
 *
 * 이 레포에는 테스트 러너가 없다(devDependencies에 typescript뿐). 그래서 가이드를 늘릴 때
 * **조용히 깨지는 것**만 골라 검사한다. 셋 다 배포 후에는 눈에 잘 띄지 않는 종류다:
 *
 *   ① **키워드 충돌** — 같은 검색어를 두 페이지가 노리면 둘 다 순위가 내려간다(자기잠식).
 *      화면은 멀쩡해서, 순위가 안 오르는 이유를 몇 주 뒤에야 알게 된다.
 *   ② **끊긴 related 링크** — 오타 하나로 404. 관련글 카드는 눌러보지 않으면 모른다.
 *   ③ **얇은 본문** — 결론·FAQ가 짧으면 AI 답변엔진이 인용할 것이 없다.
 *
 * TS를 그대로 실행할 수 없어 소스에서 필요한 필드만 읽는다. 구조가 크게 바뀌면 파싱이
 * 먼저 실패하도록 두었다 — 검사가 조용히 통과하는 것보다 시끄럽게 깨지는 편이 낫다.
 */
import { readFileSync } from 'node:fs';

// 줄바꿈을 LF로 맞춰 읽는다 — Windows 체크아웃에서는 CRLF라 정규식이 통째로 빗나간다.
const src = readFileSync(new URL('../lib/guides.ts', import.meta.url), 'utf8').split('\r\n').join('\n');

// guides.ts의 문자열은 전부 작은따옴표 리터럴이고 내부에 이스케이프가 없다
// (있으면 TS 자체가 깨지므로, 여기서도 단순 매칭으로 충분하다).
const STR = "'([^']*)'";
const pick = (block, key) => {
  const m = block.match(new RegExp('(?:^|\\n)\\s*' + key + ':\\s*' + STR));
  return m ? m[1] : null;
};
const pickArr = (block, key) => {
  const m = block.match(new RegExp('(?:^|\\n)\\s*' + key + ':\\s*\\[([\\s\\S]*?)\\]'));
  return m ? [...m[1].matchAll(new RegExp(STR, 'g'))].map((x) => x[1]) : [];
};

const blocks = src.split(/\n  \{\n/).slice(1);
const guides = blocks
  .map((b) => ({
    slug: pick(b, 'slug'),
    answer: pick(b, 'answer'),
    keywords: pickArr(b, 'keywords'),
    related: pickArr(b, 'related'),
    faqCount: (b.match(/\{ q: '/g) || []).length,
  }))
  .filter((g) => g.slug);

const errors = [];
if (guides.length < 2) {
  errors.push(`가이드 파싱 실패 — ${guides.length}개만 읽혔다. guides.ts 구조가 바뀐 듯하다.`);
}

const slugs = new Set(guides.map((g) => g.slug));

// ① 키워드는 가이드끼리 겹치면 안 된다
const seen = new Map();
for (const g of guides) {
  if (!g.keywords.length) errors.push(`${g.slug}: keywords가 비었다`);
  for (const k of g.keywords) {
    const norm = k.replace(/\s+/g, ' ').trim();
    if (seen.has(norm)) errors.push(`키워드 충돌 "${norm}" — ${seen.get(norm)} vs ${g.slug}`);
    else seen.set(norm, g.slug);
  }
}

for (const g of guides) {
  // ② related는 실재하는 slug만
  for (const r of g.related) {
    if (!slugs.has(r)) errors.push(`${g.slug}: related "${r}" 가 없는 가이드다`);
    if (r === g.slug) errors.push(`${g.slug}: related가 자기 자신을 가리킨다`);
  }
  if (g.related.length === 0) errors.push(`${g.slug}: related가 비었다 (고아 페이지가 된다)`);
  // ③ 인용될 만한 최소 분량
  if ((g.answer ?? '').length < 90) errors.push(`${g.slug}: answer가 너무 짧다 (${(g.answer ?? '').length}자)`);
  if (g.faqCount < 3) errors.push(`${g.slug}: FAQ가 ${g.faqCount}개다 (3개 이상 필요)`);
}

// 아무도 링크하지 않는 가이드는 크롤러가 늦게 찾는다
const inbound = new Map(guides.map((g) => [g.slug, 0]));
for (const g of guides) for (const r of g.related) if (inbound.has(r)) inbound.set(r, inbound.get(r) + 1);
for (const [slug, n] of inbound) if (n === 0) errors.push(`${slug}: 다른 가이드가 아무도 링크하지 않는다`);

if (errors.length) {
  console.error(`\n✗ 가이드 검사 실패 (${errors.length}건)\n`);
  errors.forEach((e) => console.error('  · ' + e));
  process.exit(1);
}
console.log(`✓ 가이드 ${guides.length}개 · 키워드 ${seen.size}개 — 충돌 없음, related 링크 정상`);
