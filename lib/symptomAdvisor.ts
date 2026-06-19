import { GoogleGenAI, Type } from '@google/genai';
import { SymptomInput, SymptomTriage } from './types';
import { detectEmergency, symptomLabels, speciesKo } from './symptomData';

const MODEL = 'gemini-3.1-pro-preview';

let _ai: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

const triageSchema = {
  type: Type.OBJECT,
  properties: {
    urgency: { type: Type.STRING, enum: ['emergency', 'soon', 'monitor'] },
    headline: { type: Type.STRING, description: '보호자가 가장 먼저 봐야 할 한 줄 안내' },
    possibleCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
    homeCare: { type: Type.ARRAY, items: { type: Type.STRING }, description: '집에서 확인/관찰/조치할 것' },
    vetSigns: { type: Type.ARRAY, items: { type: Type.STRING }, description: '이런 신호면 즉시 병원' },
    note: { type: Type.STRING },
  },
  required: ['urgency', 'headline', 'possibleCauses', 'homeCare', 'vetSigns', 'note'],
};

export async function analyzeSymptoms(
  input: SymptomInput,
  image: { data: string; mediaType: string } | null,
): Promise<SymptomTriage> {
  const emergency = detectEmergency(input.symptomIds, input.description || '');
  const labels = symptomLabels(input.symptomIds);

  const system = `당신은 한국 반려동물 보호자를 돕는 신중한 케어 어시스턴트입니다.

[절대 규칙]
- 질병을 단정 진단하지 말 것. 보호자를 안심시키려 위험을 과소평가하지 말 것. 애매하면 반드시 더 높은 응급도로 판단한다.
- 다음은 응급이며 항상 "즉시 병원"이다: 호흡곤란·헐떡임, 발작·경련, 쓰러짐·의식저하, 잇몸 창백·청색, 피를 토함·혈변, 복부 팽만, 배뇨 불가, 중독 의심.
${emergency ? '- 이번 사례에는 응급 신호가 포함되어 있다. urgency는 반드시 "emergency"로 한다.' : ''}
- urgency 의미: emergency=지금 즉시 병원, soon=가능한 빨리(당일~익일) 병원, monitor=집에서 경과 관찰 가능하되 악화 시 병원.
- 사진이 첨부되면 피부·눈·잇몸·자세 등 보이는 상태를 참고하되, 사진만으로 단정하지 말 것.
- 모든 답변은 한국어. 이 안내는 일반 정보일 뿐 수의사의 진단·진료를 대체하지 않는다.`;

  const userText = `반려동물: ${speciesKo(input.species)}${input.petName ? ' ' + input.petName : ''}
선택한 증상: ${labels || '(선택 없음)'}
보호자 설명: ${input.description || '없음'}
지속 기간: ${input.duration || '미상'}

이 증상에 대해 가능한 원인 몇 가지, 응급도(urgency), 집에서 확인·관찰·조치할 것, 즉시 병원에 가야 하는 신호를 알려줘.`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (image) parts.push({ inlineData: { mimeType: image.mediaType, data: image.data } });
  parts.push({ text: userText });

  const res = await getClient().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: system,
      responseMimeType: 'application/json',
      responseSchema: triageSchema,
      temperature: 0.5,
      maxOutputTokens: 4000,
    },
  });

  const text = res.text;
  if (!text) throw new Error('AI 응답이 비어 있습니다. 다시 시도해 주세요.');

  let triage: SymptomTriage;
  try {
    triage = JSON.parse(text) as SymptomTriage;
  } catch {
    throw new Error('AI 응답 형식 오류. 다시 시도해 주세요.');
  }

  // 안전 최종 강제: 응급 신호가 감지되면 무조건 emergency 로 고정
  if (emergency) triage.urgency = 'emergency';
  return triage;
}
