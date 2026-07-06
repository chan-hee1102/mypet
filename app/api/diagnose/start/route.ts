import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildTeaser } from '@/lib/diagnose';
import { validateImage, clampText } from '@/lib/validation';
import { SITE } from '@/lib/site';
import { PetInput, Species } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * 일회성 진단 시작(로그인 불필요). 입력+사진을 pending으로 저장하고 무료 티저를 반환.
 * ⚠️ 여기서는 AI를 호출하지 않는다(비용 어뷰징 방지). 생성은 결제 확인 후 finalize에서.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = body?.input as PetInput | undefined;
    const image = (body?.image as { data: string; mediaType: string } | null) ?? null;

    if (!raw?.name || !raw?.species) {
      return NextResponse.json({ error: '이름과 종류(강아지/고양이)는 필수입니다.' }, { status: 400 });
    }
    if (raw.species !== ('dog' as Species) && raw.species !== ('cat' as Species)) {
      return NextResponse.json({ error: '종류가 올바르지 않습니다.' }, { status: 400 });
    }
    // 입력 필드 정규화·길이 제한 (프롬프트 토큰 부풀리기·DB 남용 방지)
    const input: PetInput = {
      name: clampText(raw.name, 30) ?? '',
      species: raw.species,
      breed: clampText(raw.breed, 60),
      birth: typeof raw.birth === 'string' && /^\d{4}-\d{2}$/.test(raw.birth) ? raw.birth : undefined,
      sex: raw.sex === 'male' || raw.sex === 'female' ? raw.sex : undefined,
      neutered: typeof raw.neutered === 'boolean' ? raw.neutered : undefined,
      weightKg: typeof raw.weightKg === 'number' && raw.weightKg > 0 && raw.weightKg < 150 ? raw.weightKg : undefined,
      notes: clampText(raw.notes, 1000),
    };
    if (!input.name) {
      return NextResponse.json({ error: '이름을 입력해 주세요.' }, { status: 400 });
    }
    const imgCheck = validateImage(image);
    if (!imgCheck.ok) return NextResponse.json({ error: imgCheck.error }, { status: 400 });

    const teaser = buildTeaser(input.species, input.breed);
    const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').slice(0, 8);

    const admin = createAdminClient();
    const { error } = await admin.from('diagnoses').insert({
      token,
      species: input.species,
      input,
      photo_b64: image?.data ?? null,
      photo_mime: image?.mediaType ?? null,
      teaser,
      amount: SITE.pricePerPet,
      status: 'pending',
    });
    if (error) {
      console.error('[diagnose/start] insert error:', error.message);
      return NextResponse.json({ error: '접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
    }

    return NextResponse.json({ token, teaser, amount: SITE.pricePerPet });
  } catch (e: any) {
    console.error('[diagnose/start] error:', e);
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
