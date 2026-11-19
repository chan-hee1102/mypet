// 품종 돌봄 데이터(lib/data/care/*.json) 검사 — 형식·값 범위·금지 출처·문장 끝. 사용: node scripts/check-care.mjs [파일…] (없으면 전부)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'lib/data/care');
const breeds = JSON.parse(readFileSync(join(root, 'lib/breedKnowledge.json'), 'utf8'));
const speciesOf = new Map(breeds.map((b) => [b.breed_ko, b.species]));
const files = process.argv.slice(2).length ? process.argv.slice(2) : existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f)) : [];

const FLAGS = new Set(['patella', 'hip', 'back', 'trachea', 'brachy', 'eyes', 'tearStain', 'ears', 'skinFold', 'skin', 'dental', 'obesity', 'bloat', 'separation', 'prey', 'escape', 'dangerous', 'drool', 'heart', 'kidney', 'urinary', 'hairball', 'climber', 'joint']);
const SIZES = { dog: ['toy', 'small', 'medium', 'large', 'giant'], cat: ['small', 'medium', 'large'] };
const COATS = ['short', 'double', 'long', 'curly', 'wire', 'silky', 'hairless'];
const NOTES = ['food', 'treat', 'toy', 'walk', 'grooming', 'potty', 'home', 'health'];
const BANNED_SRC = /namu\.wiki|나무위키|naver\.com|daum\.net|tistory|blog\.|wikipedia\.org|brunch\.co\.kr/i;
const BANNED_TXT = /나무위키|최저가|최고의|완치|치료해|예방해 ?줘|낫게|\bAI\b|인공지능/;
const DANGEROUS = new Set(['도사견', '아메리칸핏불테리어', '스태퍼드셔불테리어', '로트와일러']);

let bad = 0;
const seen = new Map();
const err = (b, m) => { bad++; console.log(`✗ ${b}: ${m}`); };
const lvl = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
const range = (v, lo, hi) => Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && n >= lo && n <= hi) && v[0] <= v[1];

for (const f of files) {
  let arr;
  try { arr = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { err(f, `JSON 아님 — ${e.message}`); continue; }
  if (!Array.isArray(arr)) { err(f, '배열이 아님'); continue; }
  for (const p of arr) {
    const b = p.breed ?? '(이름 없음)';
    if (seen.has(b)) err(b, `중복 (${seen.get(b)})`); else seen.set(b, f);
    const sp = speciesOf.get(b);
    if (!sp) err(b, 'breedKnowledge.json에 없는 이름');
    if (p.species !== sp) err(b, `species ${p.species} ≠ ${sp}`);
    if (!SIZES[p.species]?.includes(p.sizeClass)) err(b, `sizeClass ${p.sizeClass}`);
    if (!COATS.includes(p.coat)) err(b, `coat ${p.coat}`);
    for (const k of ['shedding', 'energy', 'chewer', 'voice']) if (!lvl(p[k])) err(b, `${k} ${p[k]}`);
    for (const k of ['heat', 'cold']) if (![1, 2, 3].includes(p[k])) err(b, `${k} ${p[k]}`);
    if (!['daily', 'few', 'weekly'].includes(p.brushing)) err(b, `brushing ${p.brushing}`);
    if (!['small', 'medium', 'large'].includes(p.kibble)) err(b, `kibble ${p.kibble}`);
    if (p.trimWeeks !== null && !range(p.trimWeeks, 2, 20)) err(b, `trimWeeks ${JSON.stringify(p.trimWeeks)}`);
    if (!range(p.bathWeeks, 1, 26)) err(b, `bathWeeks ${JSON.stringify(p.bathWeeks)}`);
    if (!range(p.exerciseMin, 5, 240)) err(b, `exerciseMin ${JSON.stringify(p.exerciseMin)}`);
    if (p.species === 'dog' ? !range(p.walksPerDay, 1, 4) : p.walksPerDay !== null) err(b, `walksPerDay ${JSON.stringify(p.walksPerDay)}`);
    if (!Array.isArray(p.flags) || p.flags.some((x) => !FLAGS.has(x))) err(b, `flags ${JSON.stringify(p.flags)}`);
    if (p.flags?.includes('dangerous') !== DANGEROUS.has(b)) err(b, 'dangerous 표시는 법정 맹견 4종(이 목록)에만');
    for (const k of NOTES) {
      const t = p.notes?.[k];
      if (typeof t !== 'string' || t.length < 25 || t.length > 200) { err(b, `notes.${k} 길이 ${t?.length}`); continue; }
      if (!/요[.!]?$/.test(t.trim())) err(b, `notes.${k} 해요체로 끝나지 않음: …${t.slice(-12)}`);
      if (BANNED_TXT.test(t)) err(b, `notes.${k} 금지 표현: ${t.match(BANNED_TXT)[0]}`);
    }
    if (!Array.isArray(p.sources) || !p.sources.length) err(b, 'sources 비어 있음');
    for (const s of p.sources ?? []) {
      if (!s.org || !/^https:\/\//.test(s.url ?? '')) err(b, `source 형식 ${JSON.stringify(s)}`);
      if (BANNED_SRC.test(`${s.org} ${s.url}`)) err(b, `금지 출처 ${s.url}`);
    }
  }
}
console.log(bad ? `\n문제 ${bad}개` : `통과 — ${seen.size}종`);
process.exit(bad ? 1 : 0);
