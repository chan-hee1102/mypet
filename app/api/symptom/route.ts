import { NextRequest, NextResponse } from 'next/server';
import { analyzeSymptoms } from '@/lib/symptomAdvisor';
import { SymptomInput } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = body?.input as SymptomInput | undefined;
    const image = (body?.image as { data: string; mediaType: string } | null) ?? null;

    if (!input?.species) {
      return NextResponse.json({ error: '종류(강아지/고양이)를 선택해 주세요.' }, { status: 400 });
    }
    if ((!input.symptomIds || input.symptomIds.length === 0) && !input.description?.trim()) {
      return NextResponse.json({ error: '증상을 하나 이상 선택하거나 설명을 적어주세요.' }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요.' }, { status: 500 });
    }

    const triage = await analyzeSymptoms(input, image);
    return NextResponse.json({ triage });
  } catch (e: any) {
    console.error('[symptom] error:', e);
    return NextResponse.json({ error: e?.message || '분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
