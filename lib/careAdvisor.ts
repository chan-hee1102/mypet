import { GoogleGenAI, Type } from '@google/genai';
import { retrieveKnowledge, knowledgeToPrompt, knowledgeSources, getBreedProfile } from './rag';
import { buildCardFromData } from './careCardFromData';
import { getBreedTips } from './breedTips';
import { computeAge, lifeStage } from './petData';
import { SYMPTOMS } from './symptomData';
import type { CareCard, PetInput } from './types';

/**
 * 케어 카드 생성 — **데이터 우선, AI는 예외.**
 *
 * ⚠️ 2026-08-28 전면 개편. 그전에는 카드 10개 섹션을 **전부** 제미나이가 썼고,
 *    사진까지 함께 올려 읽혔다. 두 가지가 문제였다:
 *
 *    ① **같은 답을 매번 돈 내고 다시 만들었다.** 품종 특성·미용·운동·식단·연령 관리·루틴은
 *       188개 품종 데이터와 코드 안의 검증된 표에 이미 있다. 게다가 생성할 때마다 답이
 *       조금씩 달라졌다 — 같은 말티즈인데 어제와 오늘이 다르면 그건 지식이 아니라 인상이다.
 *    ② **사진 분석은 값이 비싸고 근거가 약했다.** 이미지 토큰은 텍스트보다 훨씬 비싼데,
 *       돌아오는 것은 "체형이 양호해 보입니다" 수준의 추측이었다. 수의사도 사진만으로는
 *       판단하지 않는 것을 우리가 단정하면 안 된다.
 *
 *    이제 흐름은 이렇다:
 *      1) buildCardFromData(input) — 데이터만으로 카드를 만든다. **API 0회**
 *      2) 보호자가 **직접 적은 증상**이 있을 때만 제미나이를 부른다.
 *         그것도 카드 전체가 아니라 `symptomAnswer` 한 조각만 (스키마가 1/10 크기다)
 *
 *    즉 「기침해요」처럼 우리 표에 없는 상황에만 돈이 든다. 그게 원래 AI가 필요한 자리다.
 */

const MODEL = 'gemini-2.5-flash';

let _ai: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

/**
 * 직접 적은 증상에만 쓰는 작은 스키마.
 * ⚠️ 예전 스키마는 10개 섹션 전체(최대 6000 토큰)였다. 지금은 이 조각 하나뿐이라
 *    응답이 짧고 빠르고 싸다. 필드를 늘리고 싶어지면, 그 값이 데이터로 답할 수 있는
 *    것인지부터 확인할 것 — 데이터로 되는 건 careCardFromData로 간다.
 */
const symptomAnswerSchema = {
  type: Type.OBJECT,
  properties: {
    causes: { type: Type.ARRAY, items: { type: Type.STRING }, description: '가능성 높은 순서의 원인 후보 2~4개. 단정하지 말고 "~일 수 있어요"로.' },
    careNow: { type: Type.ARRAY, items: { type: Type.STRING }, description: '지금 집에서 할 수 있는 조치 2~4개' },
    watchOk: { type: Type.ARRAY, items: { type: Type.STRING }, description: '이런 경우라면 지켜봐도 되는 조건. 반드시 시간 기준을 넣을 것(예: 24시간 내 1~2회)' },
    goNow: { type: Type.ARRAY, items: { type: Type.STRING }, description: '이런 신호가 있으면 바로 병원. 관찰 가능한 형태로 구체적으로' },
    homeCheck: { type: Type.ARRAY, items: { type: Type.STRING }, description: '집에서 확인할 것. 방법까지(예: 잇몸을 눌렀다 떼고 2초 안에 분홍색이 돌아오는지)' },
    vetPrep: {
      type: Type.OBJECT,
      properties: {
        tests: { type: Type.STRING, description: '병원에서 예상되는 검사' },
        script: { type: Type.STRING, description: '수의사에게 그대로 읽어줄 한 문장 요약' },
      },
      required: ['tests', 'script'],
    },
  },
  required: ['causes', 'careNow', 'watchOk', 'goNow', 'homeCheck', 'vetPrep'],
} as const;

/** 직접 적은 증상이 있는가 — 이게 유일한 유료 분기다. */
function hasCustomSymptom(input: PetInput): boolean {
  const t = (input.notes ?? '').trim();
  if (t.length < 2) return false;
  /*
    선택 칩의 라벨만 들어온 경우는 '직접 적은 것'이 아니다.
    예전 폼이 symptomLabels(ids)와 자유 입력을 ' / '로 이어 붙여 notes에 넣었기 때문에,
    라벨만 남은 문자열이 그대로 올 수 있다 — 그건 표로 답할 수 있으므로 AI를 부르지 않는다.
  */
  const labels = SYMPTOMS.map((s) => s.label);
  const stripped = t
    .split('/')
    .map((p) => p.trim())
    .filter((p) => p && !labels.includes(p))
    .join(' ');
  return stripped.length >= 2;
}

/**
 * 케어 카드. 대부분의 경우 **API를 한 번도 부르지 않는다.**
 * @param input 사진은 받지 않는다 — 이미지 분석은 2026-08-28에 폐지했다(상단 주석 ②).
 */
export async function generateCareCard(input: PetInput): Promise<CareCard> {
  const symptomIds = input.symptomIds ?? [];
  const card = buildCardFromData(input, symptomIds);

  if (!hasCustomSymptom(input)) return card;   // ← 여기서 끝나는 경우가 대부분이다

  try {
    const answer = await askCustomSymptom(input);
    if (answer) {
      /*
        표에서 나온 답(선택 칩)과 AI 답을 합친다. 표를 먼저 두는 이유는 그쪽이 검증된
        내용이라서다 — AI가 같은 말을 다르게 하더라도 검증된 문장이 위에 온다.
      */
      const prev = card.symptomAnswer;
      card.symptomAnswer = {
        causes: [...(prev?.causes ?? []), ...answer.causes],
        careNow: answer.careNow?.length ? answer.careNow : (prev?.careNow ?? []),
        watchOk: answer.watchOk,
        goNow: [...(prev?.goNow ?? []), ...(answer.goNow ?? [])],
        homeCheck: answer.homeCheck,
        vetPrep: answer.vetPrep,
      };
    }
  } catch (e) {
    /*
      ⚠️ AI 실패가 리포트 전체를 죽이지 않는다. 데이터 카드는 이미 완성돼 있고,
         빠지는 것은 '직접 적은 증상에 대한 답' 한 조각뿐이다.
         예전에는 생성 전체가 하나의 호출이라 실패하면 결제만 되고 결과가 없었다.
    */
    console.error('[careAdvisor] 커스텀 증상 답변 실패(카드는 그대로 반환):', e instanceof Error ? e.message : e);
  }
  return card;
}

/** 우리 데이터에 없는 상황에만 부르는, 하나짜리 질문. */
async function askCustomSymptom(input: PetInput): Promise<CareCard['symptomAnswer'] | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const speciesKo = input.species === 'dog' ? '강아지' : '고양이';
  const age = computeAge(input.birth);
  const stage = age ? lifeStage(input.species, age.months) : '나이 미상';

  // 근거 보강 — 이 경로에서만 임베딩 검색을 쓴다(임베딩도 유료 호출이다).
  const breedProfile = await getBreedProfile(input.breed, input.species);
  const chunks = await retrieveKnowledge(
    [input.notes, speciesKo, input.breed, stage].filter(Boolean).join(' '),
    input.species,
    5,
  );
  const evidence = [
    breedProfile ? `[품종 프로필 — ${input.breed} · 출처:${breedProfile.source_org}]\n${breedProfile.content}` : '',
    chunks.length ? `[검증된 수의 근거 — 반드시 우선 반영]\n${knowledgeToPrompt(chunks)}` : '',
    getBreedTips(input.species, input.breed).slice(0, 3).map((t) => `- ${t.title}: ${t.body}`).join('\n'),
  ].filter(Boolean).join('\n\n');

  const system = `당신은 한국 반려동물 보호자를 돕는 케어 어시스턴트입니다.
보호자가 직접 적은 증상에 대해 **판별 기준**을 알려주는 것이 당신의 일입니다.

반드시 지킬 것:
- 진단하지 마세요. "~입니다"가 아니라 "~일 수 있어요"로 씁니다.
- 수의사의 진료를 대체하지 않는다는 전제로 씁니다.
- "지켜봐도 되는 조건"에는 **반드시 시간·횟수 기준**을 넣으세요(예: 24시간 내 1~2회이고 밥을 먹는다면).
- "바로 병원"은 보호자가 눈으로 확인할 수 있는 형태로 쓰세요(예: 잇몸이 창백하다).
- 약 이름과 용량은 절대 쓰지 마세요.
- 근거가 주어졌다면 그것과 충돌하지 않게 쓰세요.
- 존댓말, 따뜻하고 담백한 한국어로.`;

  const user = `${speciesKo} · ${input.breed || '품종 미상'} · ${stage}${input.weightKg ? ` · ${input.weightKg}kg` : ''}
이름: ${input.name}

보호자가 적은 증상:
"""${(input.notes ?? '').trim().slice(0, 500)}"""

${evidence}`;

  const res = await getClient().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: user }] }],
    config: {
      systemInstruction: system,
      responseMimeType: 'application/json',
      responseSchema: symptomAnswerSchema,
      temperature: 0.6,
      maxOutputTokens: 1600,   // 예전 6000 → 조각 하나만 받으므로 크게 줄였다
    },
  });

  const text = res.text;
  if (!text) return null;
  try {
    return JSON.parse(text) as CareCard['symptomAnswer'];
  } catch {
    return null;
  }
}

/** 근거 출처 — 화면 배지에 쓰인다. 데이터 카드가 이미 품종 출처를 담고 있어 보조용이다. */
export { knowledgeSources };
