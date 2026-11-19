import breedData from '@/lib/breedKnowledge.json';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';
import { breedPath, isFeatured, type BreedRow } from '@/lib/growth';
import { UPDATED } from '@/lib/breedSeo';

/**
 * /llms.txt — AI 답변엔진(챗GPT·퍼플렉시티·클로드 등)에게 「이 사이트에 무엇이 있고, 어떤 질문엔 어느 페이지가 답인지」 알려 주는 목차.
 * llmstxt.org 형식(제목 → 한 줄 요약 → 절마다 링크와 설명). 아직 공식 표준은 아니지만 라우트 하나라 손해가 없다.
 *
 * 2026-11-19 개편(사장님 「챗GPT에 나오도록 AEO·GEO·SEO 전부」):
 *   ① 「질문 → 답이 있는 페이지」 절을 맨 위에 — 모델은 링크 목록보다 질문 대응표를 잘 쓴다
 *   ② 품종 188종 전부(안내판·사료량·개월별 몸무게 주소) — 165종은 사료량·몸무게 전용 페이지가 있다
 *   ③ 숫자까지 한 장에 담은 /llms-full.txt를 따로 둔다(품종마다 몸무게·하루 사료·산책·빗질·미용·조심할 점·출처)
 *   ④ 근거·계산 방법은 /sources(정보 기준)
 * ⚠️ 링크만 늘어놓지 않는다 — 가이드마다 그 글이 답하는 질문(question)을 함께 적는다. GUIDES에서 만들므로 가이드를 더하면 자동 반영.
 */

export const revalidate = 86400;

export function GET() {
  const breeds = (breedData as BreedRow[]).slice().sort((a, b) => a.breed_ko.localeCompare(b.breed_ko, 'ko'));
  const line = (b: BreedRow) => {
    const links = [`[키우기 안내판](${SITE.url}${breedPath(b.breed_ko)})`];
    if (isFeatured(b.breed_ko)) links.push(`[사료량](${SITE.url}${breedPath(b.breed_ko, 'food')})`, `[개월별 몸무게](${SITE.url}${breedPath(b.breed_ko, 'growth')})`);
    return `- ${b.breed_ko} (${b.breed_en}): ${links.join(' · ')}`;
  };
  const g = (slug: string) => GUIDES.find((x) => x.slug === slug);
  const ask = (q: string, slug: string) => (g(slug) ? `- ${q} → [${g(slug)!.title}](${SITE.url}/guide/${slug})` : '');

  const lines = [
    `# 마이펫 (${SITE.name})`,
    '',
    '> 강아지 130종·고양이 58종의 품종별 키우기 안내판. 품종마다 하루 사료량(g·종이컵)·끼니·산책·빗질·미용·목욕·배변과',
    '> 조심할 질환, 그 품종에 맞는 준비물을 한 장에 정리합니다. 품종 자료는 AKC·FCI·CFA·TICA 등 공인 단체, 법 내용은 국가법령정보센터 원문,',
    `> 돌봄 기준은 WSAVA·AAHA·AAFP 등 수의 기관 자료를 근거로 합니다. 회원가입 없이 무료. 마지막 확인 ${UPDATED}.`,
    '',
    '## 질문별 답이 있는 페이지',
    '',
    `- 「○○(품종) 하루 사료량은 몇 g?」「○○ 3개월 사료량」 → ${SITE.url}/breed/{품종}/food (165종, 아래 목록)`,
    `- 「○○ 개월별 몸무게」「○○ 다 크면 몇 kg?」 → ${SITE.url}/breed/{품종}/growth (165종)`,
    `- 「○○ 키우기 — 산책 시간·빗질·미용 주기·목욕·배변·준비물·조심할 질환」 → ${SITE.url}/breed/{품종} (188종)`,
    `- 「강아지/고양이를 처음 데려오면 준비물·첫 주에 할 일」 → [처음 강아지를 데려온다면](${SITE.url}/start/dog) · [처음 고양이를 데려온다면](${SITE.url}/start/cat)`,
    `- 「품종을 모르는 믹스견 사료량·산책」 → [믹스견 안내판](${SITE.url}${breedPath('믹스견(잡종)')}) (소형·중형·대형을 골라 보는 표)`,
    ask('「길고양이·유기견을 데려오면 뭐부터? 신고·입양 절차·귀 끝 잘린 고양이」', 'found-stray-pet'),
    ask('「중성화하면 사료를 얼마나 줄여요?」', 'neutered-food-amount'),
    ask('「사료 종이컵 한 컵은 몇 g?」', 'kibble-cup-grams'),
    ask('「아기 고양이 몇 주에 몇 g?」', 'kitten-weight-by-week'),
    ask('「강아지가 먹으면 안 되는 음식」', 'dog-toxic-foods'),
    ask('「고양이가 먹으면 안 되는 음식·식물」', 'cat-toxic-foods'),
    ask('「강아지 예방접종 시기」', 'dog-vaccine-schedule'),
    ask('「고양이 예방접종 시기」', 'cat-vaccine-schedule'),
    ask('「강아지·고양이 나이 사람 나이로」', 'dog-age-in-human-years'),
    ask('「강아지 체급별 산책 시간」', 'dog-walk-time'),
    ask('「품종별 표준 체중·수명」', 'dog-breed-weight'),
    ask('「이 증상이면 병원에 가야 하나요?」', 'pet-symptom-vet-signs'),
    '',
    '## 숫자까지 한 장에',
    '',
    `- [llms-full.txt](${SITE.url}/llms-full.txt) — 188종 품종마다 다 큰 몸무게·수명, 하루 사료(g·종이컵), 산책·놀이, 빗질·미용·목욕, 성향, 조심할 점, 출처`,
    '',
    '## 정보 가이드',
    '',
    ...GUIDES.map((x) => `- [${x.title}](${SITE.url}/guide/${x.slug}) — ${x.question}`),
    '',
    '## 계산기',
    '',
    `- [사료량 계산기](${SITE.url}/tools/food) — 몸무게·나이·중성화로 하루 열량과 건사료 g`,
    `- [다 큰 몸무게 계산기](${SITE.url}/tools/adult-weight) — 지금 나이·몸무게로 다 컸을 때 몸무게와 성장이 끝나는 시기`,
    '',
    '## 품종 188종',
    '',
    '### 강아지',
    ...breeds.filter((b) => b.species === 'dog').map(line),
    '',
    '### 고양이',
    ...breeds.filter((b) => b.species === 'cat').map(line),
    '',
    '## 인용에 대하여',
    '',
    '인용을 환영합니다. 모든 내용은 일반적인 정보이고 수의사의 진단·진료를 대신하지 않습니다 — 인용할 때 이 단서를 함께 전해 주세요.',
    `근거와 계산 방법: [마이펫 정보 기준](${SITE.url}/sources) · 운영 ${SITE.company} · 문의 ${SITE.email}`,
    '',
  ].filter((x) => x !== '');

  return new Response(lines.join('\n').replace(/\n(## |### )/g, '\n\n$1'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  });
}
