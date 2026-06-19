import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * 결제(잠금 해제)한 사용자에게만 전체 케어 리포트를 내려준다.
 * 미리보기 외 프리미엄 필드는 이 라우트를 통해서만 클라이언트로 전달된다.
 * RLS가 본인 데이터만 보이게 하므로 service_role 불필요.
 */
export async function GET(_req: Request, { params }: { params: { petId: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 잠금 해제(결제) 여부 — RLS상 본인 unlock만 조회됨
    const { data: unlock } = await supabase
      .from('unlocks')
      .select('id')
      .eq('pet_id', params.petId)
      .maybeSingle();
    if (!unlock) {
      return NextResponse.json({ error: '결제가 필요한 콘텐츠입니다.' }, { status: 403 });
    }

    // 가장 최근 전체 케어카드 — RLS상 본인 펫의 카드만 조회됨
    const { data: cc } = await supabase
      .from('care_cards')
      .select('card')
      .eq('pet_id', params.petId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!cc) {
      return NextResponse.json({ error: '리포트를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ card: cc.card });
  } catch (e: any) {
    console.error('[report] error:', e);
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
