import { NextResponse } from 'next/server';
import { getBreedGuide } from '@/lib/diagnose';
import { computeAge, lifeStage, TOXIC_FOODS, GOOD_FOODS } from '@/lib/petData';
import { Species } from '@/lib/types';

export const runtime = 'nodejs';

/** 1단계: 품종 일반 가이드 + 음식(검증 고정값) 조회. 무료, AI/결제 없음. */
export async function POST(req: Request) {
  try {
    const { species, breed, birth } = await req.json();
    if (species !== 'dog' && species !== 'cat') {
      return NextResponse.json({ error: '종류가 올바르지 않습니다.' }, { status: 400 });
    }
    const sp = species as Species;
    const guide = getBreedGuide(sp, breed);
    const age = computeAge(birth);
    return NextResponse.json({
      guide,
      ageLabel: age ? age.label : null,
      stage: age ? lifeStage(sp, age.months) : null,
      foods: { good: GOOD_FOODS[sp], toxic: TOXIC_FOODS[sp] },
    });
  } catch {
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
