/**
 * 개월별·체중별·품종 비교 페이지의 숫자와 문장(2026-11-22 사장님 「페이지 더 많이 넣어서 AEO·GEO·SEO」).
 * 화면은 app/month·app/weight·app/compare, 무엇을 말할지는 여기서 정한다.
 * ⚠️ 숫자는 새로 만들지 않는다 — 열량은 lib/energy(리포트·사료량 표와 같은 식), 성장은 lib/growthCurve, 품종 성향은 lib/care 프로필.
 *    그래서 같은 품종의 숫자가 품종 페이지·사료량 표·이 페이지들에서 똑같다.
 * 검색 노출은 네이버·빙만(lib/searchScope NAVER_BING_ONLY) — 구글은 대량 생성 페이지 제재가 심하다(2026-09-27 사장님 지시).
 */
import { dailyFeeding } from './energy';
import { seniorStartMonths } from './petData';
import { CUP_GRAM, careOf, cupText, flagTexts, metersOf } from './care';
import { COAT_LABEL, SIZE_LABEL, BRUSH_LABEL, type CareProfile } from './careProfile';
import { FEATURED_BREEDS, GROWTH_END, breedGrowth, classForDog, featuredBreeds, findBreed, fmtKg, growthRatio, isWideRange, parseRange, type BreedRow, type GrowthClass } from './growth';
import { baseName } from './breedSeo';
import { breedSlugOf, slugMatches } from './breedSlug';
import { josa } from './josa';
import { humanAge } from './guidePersonal';

/** 이 페이지들을 처음 연 날·크게 고친 날(구조화 데이터 날짜·사이트맵 lastmod) */
export const SEO_UPDATED = '2026-11-22';

export type Sp = 'dog' | 'cat';
export const spKo = (s: Sp) => (s === 'dog' ? '강아지' : '고양이');
export const babyKo = (s: Sp) => (s === 'dog' ? '아기 강아지' : '아기 고양이');
export const adultKo = (s: Sp) => (s === 'dog' ? '성견' : '성묘');
export const isSp = (s: string): s is Sp => s === 'dog' || s === 'cat';
const kcal = (n: number) => `${Math.round(n / 10) * 10}kcal`;
const g = (e: { gramLo: number; gramHi: number }) => (e.gramLo === e.gramHi ? `약 ${e.gramLo}g` : `${e.gramLo}~${e.gramHi}g`);

/** 하루 몇 번 — 사료량 표 문답과 같은 기준(app/breed/[slug]/food) */
export const mealsOf = (s: Sp, months: number) => (months < 6 ? '3~4번' : s === 'dog' ? (months < 12 ? '3번' : '2번') : '2번 이상');

/* ───────── 개월별(2~12개월) ───────── */

export const MONTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** 「다 크면 몇 kg」 예시 줄 — 체급마다 성장 속도가 달라 한 줄씩(lib/growthCurve 체급 경계 안쪽 값) */
const DOG_ADULTS = [3, 5, 8, 12, 20, 30, 40];
const CAT_ADULTS: [number, GrowthClass][] = [[3.5, 'cat'], [4.5, 'cat'], [5.5, 'cat'], [7, 'cat-large']];

export type MonthRow = { adult: number; label: string; ratio: number; weight: number; kcal: number; gram: string };

export function monthRows(s: Sp, m: number): MonthRow[] {
  const list: [number, GrowthClass][] = s === 'dog' ? DOG_ADULTS.map((a) => [a, classForDog(a)]) : CAT_ADULTS;
  return list.map(([adult, cls]) => {
    const ratio = growthRatio(cls, m);
    const weight = adult * ratio;
    const e = dailyFeeding(s, weight, m, false, null, adult);
    const label = cls === 'cat-large' ? `대형묘(다 크면 ${fmtKg(adult)}kg 이상)` : `다 크면 ${fmtKg(adult)}kg`;
    return { adult, label, ratio, weight, kcal: e.kcal, gram: g(e) };
  });
}

export type BreedMonthRow = { b: BreedRow; name: string; range: string; gram: string };

/** 그 달 인기 품종 표 — 손으로 고른 인기 품종(FEATURED_BREEDS) 중 체중 범위가 좁은 품종 */
export function monthBreedRows(s: Sp, m: number): BreedMonthRow[] {
  return FEATURED_BREEDS.map(findBreed)
    .filter((b): b is BreedRow => !!b && b.species === s && !isWideRange(b))
    .flatMap((b) => {
      const gr = breedGrowth(b);
      if (!gr) return [];
      const r = growthRatio(gr.cls, m);
      const lo = gr.adult.min * r;
      const hi = gr.adult.max * r;
      const adultMid = (gr.adult.min + gr.adult.max) / 2;
      const e = dailyFeeding(s, (lo + hi) / 2, m, false, b.size, adultMid);
      return [{ b, name: baseName(b), range: `${fmtKg(lo)}~${fmtKg(hi)}kg`, gram: g(e) }];
    });
}

export function monthCopy(s: Sp, m: number) {
  const rows = monthRows(s, m);
  const sk = spKo(s);
  const title = `${m}개월 ${sk} 몸무게·사료량`;
  const small = rows[s === 'dog' ? 1 : 1];
  const big = rows[rows.length - 1];
  const pct = (r: MonthRow) => `${Math.round(r.ratio * 100)}%`;
  const answer =
    s === 'dog'
      ? `${m}개월 ${josa(sk, '은/는')} 체급에 따라 다 큰 몸무게의 ${pct(rows[rows.length - 1])}~${pct(rows[0])}까지 자라 있어요. 다 크면 ${fmtKg(small.adult)}kg인 소형견이면 지금 약 ${fmtKg(small.weight)}kg, 하루 사료 ${small.gram}(${kcal(small.kcal)}) 안팎이고, 하루 ${mealsOf(s, m)}에 나눠 줘요.`
      : `${m}개월 ${josa(sk, '은/는')} 다 큰 몸무게의 약 ${pct(rows[1])}까지 자라 있어요(대형묘는 ${pct(big)}). 다 크면 ${fmtKg(small.adult)}kg인 고양이면 지금 약 ${fmtKg(small.weight)}kg, 하루 사료 ${small.gram}(${kcal(small.kcal)}) 안팎이고, 하루 ${mealsOf(s, m)}에 나눠 줘요.`;
  const description = `${m}개월 ${sk} 예상 몸무게와 하루 사료량을 다 큰 몸무게별·인기 품종별 표로 정리했어요. ${answer.slice(0, 70)}…`;
  const faq = [
    { q: `${m}개월 ${sk} 사료는 하루 몇 번 줘요?`, a: `하루 ${mealsOf(s, m)}이에요. ${m < 6 ? '6개월 전에는 위가 작아 한 번에 많이 먹기 어려워서 여러 번 나눠 줘요.' : s === 'dog' ? '1살 무렵부터 하루 2번으로 줄여요.' : '자율급식을 한다면 하루 총량만 정해 두고 그만큼 채워 주세요.'}` },
    { q: `${m}개월 ${sk} 몸무게가 표보다 적거나 많으면요?`, a: '표는 품종 표준 체중으로 계산한 가운데 값이라 개체마다 차이가 있어요. 한두 주에 한 번 같은 시간에 몸무게를 재서 꾸준히 늘고 있는지 보세요. 갑자기 줄거나 늘지 않으면 동물병원에서 확인해 보세요.' },
    { q: `${m}개월 ${sk} 간식은 얼마나 줘도 돼요?`, a: `하루 열량의 10% 안이에요. 하루 ${kcal(small.kcal)}를 먹는 아이라면 간식은 ${kcal(small.kcal / 10)} 정도이고, 준 만큼 사료를 덜어 주세요.` },
    { q: `${sk} 성장기 사료는 언제까지 먹여요?`, a: s === 'dog' ? `다 자랄 때까지예요. 작은 개는 ${GROWTH_END.I.label}, 중형견은 ${GROWTH_END.III.label}, 큰 개는 ${GROWTH_END.V.label}까지 자라요.` : `보통 ${GROWTH_END.cat.label}까지 자라요. 메인쿤 같은 대형묘는 ${GROWTH_END['cat-large'].label}까지 천천히 커요.` },
  ];
  return { title, answer, description, faq, rows };
}

/* ───────── 체중별(강아지 1~40kg, 고양이 2~10kg) ───────── */

export const KGS: Record<Sp, number[]> = { dog: Array.from({ length: 40 }, (_, i) => i + 1), cat: [2, 3, 4, 5, 6, 7, 8, 9, 10] };
const dogSize = (kg: number) => (kg < 10 ? '소형' : kg < 25 ? '중형' : '대형');
const kibbleOf = (s: Sp, kg: number): CareProfile['kibble'] => (s === 'cat' || kg < 10 ? 'small' : kg < 25 ? 'medium' : 'large');

export function weightCopy(s: Sp, kg: number) {
  const sk = spKo(s);
  const size = s === 'dog' ? dogSize(kg) : null;
  const senior = seniorStartMonths(s, size) + 12;
  const rows = [
    { label: `중성화한 ${adultKo(s)}`, e: dailyFeeding(s, kg, 36, true, size) },
    { label: `중성화 안 한 ${adultKo(s)}`, e: dailyFeeding(s, kg, 36, false, size) },
    { label: s === 'dog' ? '노령견' : '노령묘', e: dailyFeeding(s, kg, senior, true, size) },
  ];
  const main = rows[0].e;
  const kib = kibbleOf(s, kg);
  const mid = (main.gramLo + main.gramHi) / 2;
  const cups = mid / CUP_GRAM[kib];
  const cupLine = s === 'dog' ? `종이컵으로는 아침저녁 한 번에 약 ${cupText(cups / 2)}씩이에요.` : `종이컵으로는 하루 약 ${cupText(cups)}이에요.`;
  const title = `${kg}kg ${sk} 하루 사료량`;
  const answer = `중성화한 ${kg}kg ${josa(adultKo(s), '은/는')} 하루 약 ${kcal(main.kcal)}, 건사료로 ${g(main)} 안팎이 시작점이에요. ${cupLine} 중성화하지 않았다면 ${g(rows[1].e)}으로 조금 더 필요해요.`;
  const description = `${kg}kg ${sk} 하루 사료량은 중성화 기준 ${g(main)}(${kcal(main.kcal)})예요. 중성화 여부·노령기별 g, 종이컵 환산, 간식 상한, 이 체중의 품종까지 정리했어요.`;
  const treat = kcal(main.kcal / 10);
  const breeds = breedsAround(s, kg);
  const faq = [
    { q: `${kg}kg ${sk} 사료 종이컵으로 몇 컵이에요?`, a: `종이컵(180ml)에 깎아 담으면 ${kib === 'small' ? '작은 알갱이는 약 90g' : kib === 'medium' ? '보통 알갱이는 약 80g' : '큰 알갱이는 약 70g'}이라, 하루 ${g(main)}는 약 ${cupText(cups)}이에요. 사료마다 무게가 달라서 한 번 저울에 재 보면 정확해요.` },
    { q: `${kg}kg ${sk} 간식은 얼마나 줘도 돼요?`, a: `하루 열량의 10%까지, 약 ${treat}예요. 간식을 준 날은 그만큼 사료를 덜어 주세요.` },
    { q: `${kg}kg ${sk} 사료는 하루 몇 번 나눠 줘요?`, a: s === 'dog' ? '다 큰 개는 하루 2번이 무난해요. 6개월 전 아기는 하루 3~4번이에요.' : '하루 2번 이상 나눠 주거나, 자율급식이면 하루 총량을 정해 두고 그만큼만 채워 주세요.' },
    { q: '살을 빼야 하면 어떻게 해요?', a: '지금 몸무게가 아니라 목표 몸무게 기준으로 줄여야 해서, 한 번에 많이 줄이지 말고 동물병원에서 목표 체중과 속도를 정해 시작하세요.' },
    ...(breeds.length ? [{ q: `다 크면 ${kg}kg쯤 되는 품종은요?`, a: `${breeds.slice(0, 8).map((b) => baseName(b)).join(', ')} 같은 품종이 다 크면 ${kg}kg 안팎이에요.` }] : []),
  ];
  return { title, answer, description, faq, rows, kib, cups, treat, breeds, size };
}

/** 다 큰 몸무게 범위가 kg를 품는 품종(인기 품종 먼저) */
export function breedsAround(s: Sp, kg: number): BreedRow[] {
  return featuredBreeds().filter((b) => {
    if (b.species !== s || isWideRange(b)) return false;
    const r = parseRange(b.weight_kg);
    return !!r && r.min - 0.5 <= kg && kg <= r.max + 0.5;
  });
}

/* ───────── 품종 비교(인기 품종끼리) ───────── */

/** 비교할 품종 — 손으로 고른 인기 품종 중 케어 프로필이 있는 품종(믹스 고양이는 표준이 없어 뺀다) */
function comparable(s: Sp): BreedRow[] {
  return FEATURED_BREEDS.map(findBreed).filter((b): b is BreedRow => !!b && b.species === s && !!careOf(b.breed_ko) && !/믹스|혼혈/.test(b.breed_ko));
}
const midKg = (b: BreedRow) => {
  const r = parseRange(b.weight_kg)!;
  return (r.min + r.max) / 2;
};

/** 비교 짝 — 품종마다 몸무게가 가장 비슷한 인기 품종 3개(사람들이 「말티즈 vs 푸들」처럼 비슷한 체구끼리 고민한다). 앞 품종 = 인기 순서가 앞선 쪽 */
export function comparePairs(): [BreedRow, BreedRow][] {
  const out = new Map<string, [BreedRow, BreedRow]>();
  for (const s of ['dog', 'cat'] as Sp[]) {
    const list = comparable(s);
    for (const a of list) {
      const near = list
        .filter((x) => x !== a)
        .sort((x, y) => Math.abs(Math.log(midKg(x) / midKg(a))) - Math.abs(Math.log(midKg(y) / midKg(a))))
        .slice(0, 3);
      for (const b of near) {
        const [p, q] = list.indexOf(a) < list.indexOf(b) ? [a, b] : [b, a];
        out.set(compareSlug(p, q), [p, q]);
      }
    }
  }
  return [...out.values()];
}
export const compareSlug = (a: BreedRow, b: BreedRow) => `${breedSlugOf(a.breed_ko)}-vs-${breedSlugOf(b.breed_ko)}`;
export const comparePath = (a: BreedRow, b: BreedRow) => `/compare/${compareSlug(a, b)}`;
export function findPair(slug: string): [BreedRow, BreedRow] | null {
  const s = decodeURIComponent(slug);
  return comparePairs().find(([a, b]) => slugMatches(s, `${a.breed_ko}-vs-${b.breed_ko}`) || s === compareSlug(a, b)) ?? null;
}
/** 이 품종이 들어간 비교 페이지(품종 사료량·성장 페이지 아래 링크용) */
export const pairsOf = (name: string) => comparePairs().filter(([a, b]) => a.breed_ko === name || b.breed_ko === name);

export type CompareRow = { label: string; a: string; b: string };

export function compareCopy(a: BreedRow, b: BreedRow) {
  const pa = careOf(a.breed_ko)!;
  const pb = careOf(b.breed_ko)!;
  const A = baseName(a);
  const B = baseName(b);
  const s = a.species as Sp;
  const feed = (x: BreedRow) => dailyFeeding(s, midKg(x), 36, true, x.size);
  const ma = metersOf(pa);
  const mb = metersOf(pb);
  const meter = (label: string) => [ma.find((x) => x.label === label), mb.find((x) => x.label === label)] as const;
  const trim = (p: CareProfile) => (p.trimWeeks ? `${p.trimWeeks[0]}~${p.trimWeeks[1]}주마다` : '커트 필요 없음');
  const ex = (p: CareProfile) => `${p.exerciseMin[0]}~${p.exerciseMin[1]}분`;
  const rows: CompareRow[] = [
    { label: '다 큰 몸무게', a: `${a.weight_kg}kg`, b: `${b.weight_kg}kg` },
    { label: '수명', a: a.life_years ? `${a.life_years}년` : '-', b: b.life_years ? `${b.life_years}년` : '-' },
    { label: '체구', a: SIZE_LABEL[pa.sizeClass], b: SIZE_LABEL[pb.sizeClass] },
    { label: '털', a: COAT_LABEL[pa.coat], b: COAT_LABEL[pb.coat] },
    ...metersOf(pa).map((r, i) => ({ label: r.label, a: r.words, b: mb[i].words })),
    { label: '빗질', a: BRUSH_LABEL[pa.brushing], b: BRUSH_LABEL[pb.brushing] },
    { label: '전문 미용', a: trim(pa), b: trim(pb) },
    { label: '목욕', a: `${pa.bathWeeks[0]}~${pa.bathWeeks[1]}주마다`, b: `${pb.bathWeeks[0]}~${pb.bathWeeks[1]}주마다` },
    { label: s === 'dog' ? '하루 산책·운동' : '하루 놀이', a: ex(pa), b: ex(pb) },
    { label: '하루 사료(중성화)', a: `${g(feed(a))}`, b: `${g(feed(b))}` },
    { label: '조심할 점', a: flagTexts(pa).slice(0, 3).map((f) => f.label).join(', ') || '-', b: flagTexts(pb).slice(0, 3).map((f) => f.label).join(', ') || '-' },
  ];
  // 다른 점만 문장으로 — 같으면 말하지 않는다
  const lines: string[] = [];
  const lower = (label: string, word: string) => {
    const [x, y] = meter(label);
    if (!x || !y || x.value === y.value) return;
    const [lo, hi] = x.value < y.value ? [A, B] : [B, A];
    lines.push(`${word}${josa(lo, '이/가')} ${hi}보다 적은 편이에요.`);
  };
  lines.push(`다 크면 ${josa(A, '은/는')} ${a.weight_kg}kg, ${josa(B, '은/는')} ${b.weight_kg}kg이에요.`);
  lower('털 빠짐', '털 빠짐은 ');
  lower(s === 'dog' ? '짖음' : '울음', s === 'dog' ? '짖음은 ' : '울음은 ');
  if (pa.exerciseMin[1] !== pb.exerciseMin[1]) {
    const [more, less] = pa.exerciseMin[1] > pb.exerciseMin[1] ? [A, B] : [B, A];
    lines.push(`${s === 'dog' ? '산책·운동' : '놀이'} 시간은 ${josa(more, '이/가')} 더 필요해요(${A} ${ex(pa)}, ${B} ${ex(pb)}).`);
  }
  if (!!pa.trimWeeks !== !!pb.trimWeeks) {
    const [cut, none] = pa.trimWeeks ? [A, B] : [B, A];
    lines.push(`${josa(cut, '은/는')} 전문 미용이 정기적으로 필요하고, ${josa(none, '은/는')} 커트가 필요 없는 털이에요.`);
  }
  const answer = lines.join(' ');
  // 이런 집이라면 — 다른 점이 있을 때만
  const fit: string[] = [];
  const [sa, sb] = meter('털 빠짐');
  if (sa && sb && sa.value !== sb.value) fit.push(`털 날림이 걱정된다면 ${sa.value < sb.value ? A : B} 쪽이 털이 덜 빠져요.`);
  if (pa.exerciseMin[1] !== pb.exerciseMin[1]) fit.push(`매일 ${s === 'dog' ? '산책' : '놀이'} 시간을 길게 내기 어렵다면 ${pa.exerciseMin[1] < pb.exerciseMin[1] ? A : B} 쪽이 부담이 덜해요.`);
  const [va, vb] = meter(s === 'dog' ? '짖음' : '울음');
  if (va && vb && va.value !== vb.value) fit.push(`공동주택이라 소리가 신경 쓰인다면 ${va.value < vb.value ? A : B} 쪽이 ${s === 'dog' ? '덜 짖는' : '덜 우는'} 편이에요.`);
  const title = `${A} ${B} 차이 — 몸무게·털 빠짐·성격·산책 비교`;
  const description = `${josa(A, '과/와')} ${B} 무엇이 다를까요? ${answer.slice(0, 80)}… 몸무게·수명·털 빠짐·짖음·미용·산책·사료량을 표 한 장으로 비교했어요.`;
  const faq = [
    { q: `${josa(A, '과/와')} ${B} 중 털이 덜 빠지는 쪽은요?`, a: sa && sb && sa.value !== sb.value ? `${sa.value < sb.value ? A : B} 쪽이 덜 빠지는 편이에요(${A} ${sa.words}, ${B} ${sb.words}).` : `둘 다 비슷해요(${A} ${sa?.words}, ${B} ${sb?.words}).` },
    { q: `${josa(A, '과/와')} ${B} 중 어느 쪽이 더 커요?`, a: `다 크면 ${josa(A, '은/는')} ${a.weight_kg}kg, ${josa(B, '은/는')} ${b.weight_kg}kg이에요.` },
    { q: `${josa(A, '과/와')} ${B} 하루 사료량은 얼마나 달라요?`, a: `중성화한 성${s === 'dog' ? '견' : '묘'} 표준 체중 가운데 값 기준으로 ${josa(A, '은/는')} 하루 ${g(feed(a))}, ${josa(B, '은/는')} ${g(feed(b))}예요.` },
  ];
  return { A, B, s, rows, answer, fit, title, description, faq, pa, pb };
}

/* ───────── 나이별 사람 나이(강아지 1~20살, 고양이 1~22살) ───────── */

export const AGES: Record<Sp, number[]> = { dog: Array.from({ length: 20 }, (_, i) => i + 1), cat: Array.from({ length: 22 }, (_, i) => i + 1) };
/** 사람 나이 환산 출처 — 환산식은 lib/guidePersonal humanAge(사람 나이 환산표 가이드와 같은 식) */
export const AGE_SOURCES = {
  dog: { org: 'AKC', title: 'How to Calculate Dog Years to Human Years', url: 'https://www.akc.org/expert-advice/health/how-to-calculate-dog-years-to-human-years/' },
  cat: { org: 'AAHA·AAFP', title: '2021 AAHA/AAFP Feline Life Stage Guidelines', url: 'https://catvets.com/guidelines/practice-guidelines/life-stage-guidelines/' },
};
/** 고양이 생애 단계 — AAHA/AAFP 2021(아기 ~1살 · 젊은 성묘 1~6살 · 성숙한 성묘 7~10살 · 노령묘 10살~) */
const catStage = (y: number) => (y < 1 ? '아기 고양이' : y <= 6 ? '젊은 성묘' : y <= 10 ? '성숙한 성묘' : '노령묘');

/** guidePersonal humanAge는 size 문자열(「대형」「중형」)로 속도를 고른다 */
const humanAgeOf = (s: Sp, months: number, size: string) => humanAge(s, months, size || undefined) ?? 0;

export type AgeRow = { label: string; human: number; stage: string; senior: boolean; kg: number; feed: string };

export function ageCopy(s: Sp, y: number) {
  const months = y * 12;
  const sk = spKo(s);
  const sizes: [string, string, number][] = s === 'dog' ? [['소형견', '소형', 5], ['중형견', '중형', 15], ['대형견', '대형', 30]] : [['고양이', '', 4]];
  const rows: AgeRow[] = sizes.map(([label, size, kg]) => {
    const senior = months >= seniorStartMonths(s, size || null);
    return {
      label,
      human: humanAgeOf(s, months, size),
      stage: s === 'cat' ? catStage(y) : y < 1 ? '아기 강아지' : senior ? '노령견' : '성견',
      senior,
      kg,
      feed: g(dailyFeeding(s, kg, months, true, size || null)),
    };
  });
  const anySenior = rows.some((r) => r.senior);
  const title = `${y}살 ${sk} 사람 나이로 몇 살?`;
  const ageLine = s === 'dog' ? rows.map((r) => `${r.label} 약 ${r.human}살`).join(', ') : `약 ${rows[0].human}살`;
  const stageLine =
    s === 'dog'
      ? anySenior
        ? rows.every((r) => r.senior)
          ? '체구와 상관없이 모두 노령기예요(대형견 7살, 중형견 8살, 소형견 10살부터).'
          : `${rows.filter((r) => r.senior).map((r) => r.label).join('·')}은 이미 노령기예요(대형견 7살, 중형견 8살, 소형견 10살부터).`
        : '아직 노령기 전이에요(대형견 7살, 중형견 8살, 소형견 10살부터 노령기).'
      : `생애 단계로는 「${rows[0].stage}」예요(AAHA·AAFP 기준, 10살부터 노령묘).`;
  const answer = `${y}살 ${josa(sk, '을/를')} 사람 나이로 바꾸면 ${ageLine}이에요. ${stageLine}`;
  const description = `${y}살 ${sk} 사람 나이는 ${ageLine}. 체구별 사람 나이, 노령기인지, 이 나이의 하루 사료량과 건강검진 주기를 정리했어요.`;
  const check = y >= 7 ? '6개월마다' : '1년에 한 번';
  const faq = [
    { q: `${y}살 ${josa(sk, '은/는')} 노령${s === 'dog' ? '견' : '묘'}인가요?`, a: stageLine },
    { q: `${y}살 ${sk} 건강검진은 얼마나 자주 해요?`, a: `${check}이 권장돼요. 7살이 넘으면 1년에 한 번에서 6개월마다로 줄이고, 체중·물 마시는 양·배변 변화를 적어 두면 진료 때 도움이 돼요.` },
    {
      q: `${y}살 ${sk} 사료는 바꿔야 하나요?`,
      a: anySenior
        ? `노령기에는 활동량이 줄어 필요한 열량이 줄어드는 편이에요. 몸무게와 체형을 보며 양을 조절하고, 노령용 사료로 바꿀지는 동물병원과 상의하세요.`
        : `노령기 전이라 지금 사료를 그대로 먹여도 돼요. 몸무게가 늘거나 줄면 양부터 10%씩 조절해요.`,
    },
    { q: '사람 나이 환산은 정확한가요?', a: `대략적인 값이에요. 첫해를 사람 15살, 두 살을 24살로 보고 그 뒤로는 해마다 ${s === 'dog' ? '체구에 따라 4~6살' : '약 4살'}씩 더하는 널리 쓰는 방식이에요. 체구가 클수록 빨리 나이 들어요.` },
  ];
  return { title, answer, description, faq, rows, anySenior, check };
}
