import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 경량 상태 조회 — 결과 페이지 폴링용. 토큰 이외의 정보는 노출하지 않는다. */
export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get('token');
    if (!token || token.length < 20) return NextResponse.json({ status: 'none' });
    const admin = createAdminClient();
    const { data } = await admin.from('diagnoses').select('status').eq('token', token).maybeSingle();
    return NextResponse.json({ status: data?.status ?? 'none' });
  } catch {
    return NextResponse.json({ status: 'error' });
  }
}
