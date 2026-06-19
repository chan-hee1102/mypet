import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clampText } from '@/lib/validation';

export const runtime = 'nodejs';

const KINDS = ['weight', 'symptom', 'vet_visit', 'memo', 'med'];

export async function POST(req: Request) {
  try {
    const { petId, kind, value, note } = await req.json();
    if (!petId || !kind || !KINDS.includes(kind)) {
      return NextResponse.json({ error: '필수 값이 올바르지 않습니다.' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const { data: pet } = await supabase.from('pets').select('id').eq('id', petId).single();
    if (!pet) return NextResponse.json({ error: '반려동물을 찾을 수 없습니다.' }, { status: 404 });

    // 체중은 숫자 검증
    let safeValue: unknown = value ?? null;
    if (kind === 'weight') {
      const kg = Number(value?.kg);
      if (!kg || kg <= 0 || kg > 200) {
        return NextResponse.json({ error: '몸무게를 올바르게 입력해 주세요.' }, { status: 400 });
      }
      safeValue = { kg };
    }

    const { error } = await supabase.from('pet_records').insert({
      pet_id: petId,
      user_id: user.id,
      kind,
      value: safeValue,
      note: clampText(note, 500) ?? null,
    });
    if (error) return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
