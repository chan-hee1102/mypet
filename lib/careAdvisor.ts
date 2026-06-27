import { GoogleGenAI, Type } from '@google/genai';
import { PetInput, CareCard } from './types';
import { TOXIC_FOODS, computeAge, lifeStage } from './petData';
import { retrieveKnowledge, knowledgeToPrompt, knowledgeSources, getBreedProfile } from './rag';

// 안정·저비용·넉넉한 무료 할당량. 더 빠르게는 'gemini-3.1-flash-lite' 가능.
const MODEL = 'gemini-2.5-flash';

// 요청 시점에 1회만 생성 (모듈 로드/빌드 때 키 없이 만들어지는 경고 방지)
let _ai: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

/** Gemini가 반드시 이 형식(JSON)으로만 답하도록 강제하는 구조화 출력 스키마 */
const careCardSchema = {
  type: Type.OBJECT,
  properties: {
    photoAnalysis: {
      type: Type.OBJECT,
      properties: {
        breedGuess: { type: Type.STRING },
        bodyCondition: { type: Type.STRING },
        coatSkinNotes: { type: Type.STRING },
        confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
      },
      required: ['breedGuess', 'bodyCondition', 'coatSkinNotes', 'confidence'],
    },
    breedTraits: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        healthRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['summary', 'healthRisks'],
    },
    grooming: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        cautions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['summary', 'cautions'],
    },
    exercise: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        walkMinutesPerDay: { type: Type.STRING },
        cautions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['summary', 'walkMinutesPerDay', 'cautions'],
    },
    food: {
      type: Type.OBJECT,
      properties: {
        goodFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
        cautionFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['goodFoods', 'cautionFoods'],
    },
    ageCare: {
      type: Type.OBJECT,
      properties: {
        stage: { type: Type.STRING },
        tips: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['stage', 'tips'],
    },
    routine: {
      type: Type.OBJECT,
      properties: {
        bath: { type: Type.STRING },
        walk: { type: Type.STRING },
        grooming: { type: Type.STRING },
      },
      required: ['bath', 'walk', 'grooming'],
    },
    redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['photoAnalysis', 'breedTraits', 'grooming', 'exercise', 'food', 'ageCare', 'routine', 'redFlags'],
};

export async function generateCareCard(
  input: PetInput,
  image: { data: string; mediaType: string } | null,
): Promise<CareCard> {
  const age = computeAge(input.birth);
  const stage = age ? lifeStage(input.species, age.months) : '나이 미상';
  const speciesKo = input.species === 'dog' ? '강아지' : '고양이';
  const toxicList = TOXIC_FOODS[input.species].map((f) => `${f.name}(${f.reason})`).join('; ');

  // RAG: ① 등록 품종의 공식 프로필을 정확 매칭으로 우선 확보 + ② 의미검색으로 일반 근거 보강
  const breedProfile = await getBreedProfile(input.breed, input.species);
  const ragQuery = [input.breed, speciesKo, stage, '예방접종 영양 호발질환 케어', input.notes]
    .filter(Boolean)
    .join(' ');
  const chunks = await retrieveKnowledge(ragQuery, input.species, 6);
  // 품종 프로필을 맨 앞에 두고 중복 제거 (출처 배지/근거 통합용)
  const evidenceChunks = breedProfile
    ? [breedProfile, ...chunks.filter((c) => c.content !== breedProfile.content)]
    : chunks;

  let evidenceBlock = '';
  if (breedProfile) {
    evidenceBlock += `\n\n[품종 프로필 — ${input.breed} · 출처:${breedProfile.source_org}]\n이 아이의 품종 공식 정보다. 품종 특성·호발질환·그루밍·운동은 반드시 이 내용을 우선 반영하라:\n${breedProfile.content}`;
  }
  if (chunks.length) {
    evidenceBlock += `\n\n[검증된 수의 근거 — 반드시 우선 반영]\n아래는 신뢰할 수 있는 수의 가이드라인에서 검색된 근거다. 케어 카드 내용이 이 근거와 충돌하지 않게 하고, 관련 항목은 이 근거를 우선 반영하라:\n${knowledgeToPrompt(chunks)}`;
  }

  const system = `당신은 한국 반려동물 보호자를 돕는 따뜻하고 신뢰할 수 있는 케어 어시스턴트입니다.

[규칙]
- 모든 답변은 한국어로, 보호자가 바로 실천할 수 있게 구체적으로.
- 질병을 단정적으로 진단하지 말 것. 위험해 보이면 "병원 방문 권장"으로 안내(redFlags).
- 아래 '독성 음식'은 검증된 사실이다. 절대 안전하다고 바꾸지 말 것:
  ${toxicList}
- 사진으로 품종·체형·털 상태를 추정하되, 확신이 없으면 confidence를 medium 또는 low로.
- 사진이 없으면 입력된 품종 정보를 바탕으로 작성하고 confidence는 low.
- 모든 조언은 일반 정보이며 수의사 상담을 대체하지 않는다.${evidenceBlock}`;

  const userText = `다음 반려동물에 맞춘 케어 카드를 만들어줘.

- 이름: ${input.name}
- 종: ${speciesKo}
- 품종: ${input.breed || '(미입력 — 사진으로 추정)'}
- 나이: ${age ? age.label : '미상'} (생애단계: ${stage})
- 성별: ${input.sex === 'female' ? '암컷' : input.sex === 'male' ? '수컷' : '미상'}
- 중성화: ${input.neutered == null ? '미상' : input.neutered ? '예' : '아니오'}
- 몸무게: ${input.weightKg ? input.weightKg + 'kg' : '미상'}
- 특이사항(알레르기/지병 등): ${input.notes || '없음'}

품종 특성, 그루밍 주의(예: 폼피츠 같은 더블코트는 바짝 밀면 털이 잘 안 자랄 수 있음), 운동/산책, 음식, 나이별 케어, 목욕·산책·빗질 주기, 병원 방문 권장 신호를 포함해줘.`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (image) {
    parts.push({ inlineData: { mimeType: image.mediaType, data: image.data } });
  }
  parts.push({ text: userText });

  const res = await getClient().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: system,
      responseMimeType: 'application/json',
      responseSchema: careCardSchema,
      temperature: 0.7,
      maxOutputTokens: 6000,
    },
  });

  const text = res.text;
  if (!text) {
    throw new Error('AI 응답이 비어 있습니다. 다시 시도해 주세요.');
  }
  try {
    const card = JSON.parse(text) as CareCard;
    if (evidenceChunks.length) card.sources = knowledgeSources(evidenceChunks);
    return card;
  } catch {
    throw new Error('AI 응답 형식 오류. 다시 시도해 주세요.');
  }
}
