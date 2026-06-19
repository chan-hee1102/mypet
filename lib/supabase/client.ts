import { createBrowserClient } from '@supabase/ssr';

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 * 'use client' 컴포넌트에서 import 해서 쓴다. (예: 로그인 버튼, 폼 저장)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
