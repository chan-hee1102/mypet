import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth(구글) 로그인 / 이메일 인증 링크의 콜백.
 * Supabase가 ?code=... 를 붙여 여기로 보내면, 코드를 세션으로 교환하고 next 로 이동한다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const oauthError = searchParams.get('error'); // 사용자가 구글에서 취소/거부한 경우

  // 오픈 리다이렉트 방지: 내부 상대경로만 허용
  const rawNext = searchParams.get('next') ?? '/';
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\') ? rawNext : '/';

  if (!oauthError && code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
