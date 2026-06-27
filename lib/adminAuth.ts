import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'mypet_admin';

/**
 * 관리자 세션 쿠키 값. 비밀번호 + 서버 시크릿(service_role)을 HMAC으로 서명한다.
 * → 비밀번호만 알아도 토큰을 위조할 수 없고(서버 시크릿 필요), 비밀번호 변경 시 자동 무효화.
 */
export function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD || '';
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mypet-admin-fallback-secret';
  return createHmac('sha256', secret).update('mypet-admin::' + pw).digest('hex');
}

/** 길이 노출 없는 상수시간 비교 — 양쪽을 sha256으로 고정길이화 후 비교. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

/** 현재 요청이 관리자 인증 쿠키를 가졌는지(서버 컴포넌트/액션/라우트에서 사용). */
export function isAdmin(): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = cookies().get(ADMIN_COOKIE)?.value;
  return !!c && safeEqual(c, adminToken());
}
