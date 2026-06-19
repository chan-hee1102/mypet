import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * 결제 후 잠금 해제 기록.
 * ⚠️ 지금은 모의 결제(클라이언트가 성공 후 호출)를 신뢰한다.
 *    실결제 연동 시: 여기서 토스/포트원 결제 검증을 한 뒤에만 unlocks를 기록해야 한다.
 * unlocks INSERT는 RLS상 막혀 있어(사용자가 위조 못 하도록) 서버 관리자 클라이언트로 기록한다.
 */
export async function POST(req: Request) {
  try {
    const { petId } = await req.json();
    if (!petId) {
      return NextResponse.json({ error: 'petId가 필요합니다.' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 본인 소유 펫인지 확인 (RLS로 본인 것만 조회됨)
    const { data: pet } = await supabase.from('pets').select('id').eq('id', petId).single();
    if (!pet) {
      return NextResponse.json({ error: '해당 반려동물을 찾을 수 없습니다.' }, { status: 404 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('unlocks')
      .upsert(
        { user_id: user.id, pet_id: petId, amount: 3900, provider: 'mock' },
        { onConflict: 'pet_id' },
      );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '오류가 발생했습니다.' }, { status: 500 });
  }
}
