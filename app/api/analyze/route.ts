import { NextRequest, NextResponse } from 'next/server';
import { generateCareCard } from '@/lib/careAdvisor';
import { PetInput } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = body?.input as PetInput | undefined;
    const image = (body?.image as { data: string; mediaType: string } | null) ?? null;

    if (!input?.name || !input?.species) {
      return NextResponse.json({ error: '이름과 종류(강아지/고양이)는 필수입니다.' }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요.' },
        { status: 500 },
      );
    }

    const card = await generateCareCard(input, image);
    return NextResponse.json({ card });
  } catch (e: any) {
    console.error('[analyze] error:', e);
    return NextResponse.json({ error: e?.message || '분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
