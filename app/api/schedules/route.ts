import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultSchedules } from '@/lib/careSchedule';
import { Species } from '@/lib/types';

export const runtime = 'nodejs';

/** 기본 케어 일정 생성 (이미 있으면 건너뜀). */
export async function POST(req: Request) {
  try {
    const { petId } = await req.json();
    if (!petId) return NextResponse.json({ error: 'petId가 필요합니다.' }, { status: 400 });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const { data: pet } = await supabase.from('pets').select('id, species, birth').eq('id', petId).single();
    if (!pet) return NextResponse.json({ error: '반려동물을 찾을 수 없습니다.' }, { status: 404 });

    const { count } = await supabase
      .from('care_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('pet_id', petId);
    if (count && count > 0) return NextResponse.json({ ok: true, skipped: true });

    const rows = defaultSchedules(pet.species as Species, { birth: pet.birth }).map((s) => ({
      ...s,
      pet_id: petId,
      user_id: user.id,
      auto_generated: true,
    }));
    const { error } = await supabase.from('care_schedules').insert(rows);
    if (error) return NextResponse.json({ error: '일정 생성에 실패했습니다.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}

/** 일정 상태 변경 (완료/건너뜀). RLS가 본인 것만 허용. */
export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !['upcoming', 'done', 'skipped'].includes(status)) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const { error } = await supabase.from('care_schedules').update({ status }).eq('id', id);
    if (error) return NextResponse.json({ error: '변경에 실패했습니다.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
