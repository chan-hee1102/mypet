import { createClient } from '@supabase/supabase-js';

/**
 * 서버 전용 관리자 클라이언트 (service_role 키 사용).
 * ⚠️ service_role 키는 RLS(행 수준 보안)를 무시하고 모든 데이터에 접근한다.
 *    절대 클라이언트 컴포넌트에서 import 하지 말 것 — 서버(라우트 핸들러)에서만.
 * 용도: 결제 검증 후 잠금 해제 기록 등, 사용자 권한을 넘어선 서버 작업.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
