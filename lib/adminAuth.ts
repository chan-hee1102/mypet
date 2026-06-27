import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'mypet_admin';

/** 세션 서명 시크릿(서버 전용). 없으면 null → 인증 전체 비활성(fail closed). */
function sessionSecret(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

/** 관리자 기능이 사용 가능하도록 환경변수가 모두 설정됐는지. */
export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD && !!sessionSecret();
}

/**
 * 관리자 세션 쿠키 값. 비밀번호를 서버 시크릿으로 HMAC 서명.
 * 시크릿이 없으면 throw → 호출부에서 fail closed (하드코딩 폴백 없음).
 */
export function adminToken(): string {
  const secret = sessionSecret();
  if (!secret) throw new Error('admin session secret missing');
  const pw = process.env.ADMIN_PASSWORD || '';
  return createHmac('sha256', secret).update('mypet-admin::' + pw).digest('hex');
}

/** 길이 노출 없는 상수시간 비교 — 양쪽을 sha256 고정길이화 후 비교. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

/** 현재 요청이 유효한 관리자 인증 쿠키를 가졌는지. */
export function isAdmin(): boolean {
  if (!adminConfigured()) return false;
  try {
    const c = cookies().get(ADMIN_COOKIE)?.value;
    return !!c && safeEqual(c, adminToken());
  } catch {
    return false;
  }
}
