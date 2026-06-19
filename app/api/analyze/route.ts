import { NextRequest, NextResponse } from 'next/server';
import { generateCareCard } from '@/lib/careAdvisor';
import { PetInput } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

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

    // 로그인한 사용자면 반려동물 + 사진 + 케어카드를 저장한다. (비로그인이면 카드만 반환)
    let petId: string | null = null;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        // 1) 사진 업로드 (있으면). 비공개 버킷의 <userId>/ 폴더에 저장.
        let photoUrl: string | null = null;
        if (image?.data) {
          const ext = (image.mediaType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const buffer = Buffer.from(image.data, 'base64');
          const { error: upErr } = await supabase.storage
            .from('pet-photos')
            .upload(path, buffer, { contentType: image.mediaType, upsert: false });
          if (!upErr) photoUrl = path;
          else console.error('[analyze] 사진 업로드 실패:', upErr.message);
        }
        // 2) 반려동물 insert
        const { data: pet, error: petErr } = await supabase
          .from('pets')
          .insert({
            user_id: user.id,
            name: input.name,
            species: input.species,
            breed: input.breed ?? null,
            birth: input.birth ?? null,
            sex: input.sex ?? null,
            neutered: input.neutered ?? null,
            weight_kg: input.weightKg ?? null,
            notes: input.notes ?? null,
            photo_url: photoUrl,
          })
          .select('id')
          .single();
        if (petErr) console.error('[analyze] 반려동물 저장 실패:', petErr.message);
        if (pet) {
          petId = pet.id;
          // 3) 케어카드 insert
          const { error: cardErr } = await supabase
            .from('care_cards')
            .insert({ pet_id: pet.id, user_id: user.id, card });
          if (cardErr) console.error('[analyze] 케어카드 저장 실패:', cardErr.message);
        }
      } catch (saveErr: any) {
        // 저장 실패해도 생성된 카드는 보여준다.
        console.error('[analyze] 저장 중 오류(카드만 반환):', saveErr?.message);
      }
    }

    return NextResponse.json({ card, petId });
  } catch (e: any) {
    console.error('[analyze] error:', e);
    return NextResponse.json({ error: e?.message || '분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
