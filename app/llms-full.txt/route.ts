import breedData from '@/lib/breedKnowledge.json';
import { answerOf, boardOf, careOf, flagTexts, metersOf } from '@/lib/care';
import { COAT_LABEL, SIZE_LABEL } from '@/lib/careProfile';
import { UPDATED } from '@/lib/breedSeo';
import { breedPath, isFeatured, type BreedRow } from '@/lib/growth';
import { SITE } from '@/lib/site';

/**
 * /llms-full.txt — 188종 품종의 핵심 숫자를 한 장에(2026-11-19, AEO·GEO). /llms.txt가 목차라면 이것은 본문.
 * AI 답변엔진이 페이지를 하나씩 열지 않고도 「말티즈 하루 사료량」「코숏 다 크면 몇 kg」에 바로 답하고 출처(이 사이트)를 달 수 있게.
 * 숫자는 품종 안내판 화면과 같은 함수(lib/care boardOf·answerOf·metersOf·flagTexts)에서 — 따로 적지 않는다.
 * 약 150KB. 하루 캐시.
 */

export const revalidate = 86400;

type Row = BreedRow & { source_url?: string };

export function GET() {
  const breeds = (breedData as Row[]).slice().sort((a, b) => (a.species === b.species ? a.breed_ko.localeCompare(b.breed_ko, 'ko') : a.species === 'dog' ? -1 : 1));
  const blocks = breeds.map((b) => {
    const p = careOf(b.breed_ko);
    const url = `${SITE.url}${breedPath(b.breed_ko)}`;
    const head = `## ${b.breed_ko} (${b.breed_en}) — ${b.species === 'dog' ? '강아지' : '고양이'}`;
    if (!p) return `${head}\n- 키우기 안내판: ${url}`;
    const t = Object.fromEntries(boardOf(b, p).map((x) => [x.key, x]));
    const lines = [
      head,
      `- 요약: ${answerOf(b, p)}`,
      `- 체구 ${SIZE_LABEL[p.sizeClass]} · 털 ${COAT_LABEL[p.coat]}${b.weight_kg ? ` · 다 큰 몸무게 ${b.weight_kg}kg` : ''}${b.life_years ? ` · 수명 ${b.life_years}년` : ''}`,
      `- 하루 사료: ${t.food?.value ?? '-'} (${t.food?.sub ?? ''}) — ${t.food?.detail ?? ''}`,
      `- 끼니 ${t.meals?.value ?? '-'} · ${t.walk?.label ?? '산책'} ${t.walk?.value ?? '-'} (${t.walk?.sub ?? ''}) · 빗질 ${t.brush?.value ?? '-'} · 미용 ${t.trim?.value ?? '-'} · 목욕 ${t.bath?.value ?? '-'} · ${t.potty?.label ?? '배변'} ${t.potty?.value ?? '-'}`,
      `- 성향: ${metersOf(p).map((m) => `${m.label} ${m.words}`).join(', ')}`,
    ];
    const flags = flagTexts(p);
    if (flags.length) lines.push(`- 조심할 점: ${flags.map((f) => f.text).join(' / ')}`);
    const links = [`키우기 안내판 ${url}`];
    if (isFeatured(b.breed_ko)) links.push(`사료량 ${SITE.url}${breedPath(b.breed_ko, 'food')}`, `개월별 몸무게 ${SITE.url}${breedPath(b.breed_ko, 'growth')}`);
    lines.push(`- 페이지: ${links.join(' · ')}`);
    const srcs = (p.sources ?? []).map((s) => `${s.org} ${s.url}`);
    if (srcs.length) lines.push(`- 출처: ${srcs.join(' · ')}`);
    return lines.join('\n');
  });

  const text = [
    `# 마이펫 품종 188종 키우기 안내 — 숫자 모음`,
    '',
    `> 강아지 130종·고양이 58종. 하루 사료는 다 큰 중성화 기준(쉬는 동안 열량 70×몸무게^0.75 × 활동계수, 건사료 1g당 3.5~4.0kcal), 종이컵은 약 180ml 어림값.`,
    `> 일반적인 정보이며 수의사의 진단·진료를 대신하지 않습니다. 근거와 계산 방법: ${SITE.url}/sources · 마지막 확인 ${UPDATED} · 운영 ${SITE.company}`,
    '',
    ...blocks.flatMap((x) => [x, '']),
  ].join('\n');

  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
}
