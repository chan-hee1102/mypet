import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 서버(서버 컴포넌트 / 라우트 핸들러)용 Supabase 클라이언트.
 * 로그인한 사용자의 세션을 쿠키에서 읽어 RLS가 적용된 채로 동작한다.
 * 호출하는 쪽에서 매번 새로 생성하세요. (요청마다 쿠키가 다름)
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서는 쿠키 set이 막혀 있다 → 세션 갱신은 middleware.ts가 담당.
          }
        },
      },
    }
  );
}
