import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** 로그아웃: 세션 쿠키를 지우고 홈으로 보낸다. (헤더의 로그아웃 폼이 POST) */
export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
