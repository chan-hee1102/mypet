import { createClient } from '@supabase/supabase-js';

// 일부 Node 런타임(<22)에 전역 WebSocket이 없으면 supabase-js realtime 생성자가 throw한다.
// 우리는 realtime을 쓰지 않으므로 ws로 폴리필만 해 둔다(없으면 조용히 무시).
if (typeof (globalThis as any).WebSocket === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    (globalThis as any).WebSocket = require('ws');
  } catch {
    /* ws 미설치 — 런타임이 전역 WebSocket을 제공하면 문제없음 */
  }
}

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
