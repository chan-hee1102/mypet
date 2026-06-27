import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'mypet_admin';

/** 비밀번호 기반 세션 토큰(쿠키 값). 원문 비밀번호는 쿠키에 담지 않는다. */
export function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD || '';
  return createHash('sha256').update('mypet-admin::' + pw).digest('hex');
}

/** 현재 요청이 관리자 인증 쿠키를 가졌는지(서버 컴포넌트/액션/라우트에서 사용). */
export function isAdmin(): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = cookies().get(ADMIN_COOKIE)?.value;
  return !!c && c === adminToken();
}
