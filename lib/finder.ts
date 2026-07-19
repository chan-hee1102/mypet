import { createHmac } from 'node:crypto';

/**
 * '내 리포트 찾기' 재조회 해시 (서버 전용).
 * 휴대폰번호·PIN의 원문은 저장하지 않고, HMAC 일방향 해시만 diagnoses.finder_hash에 남긴다.
 * 조회 시 같은 입력으로 해시를 재계산해 일치하는 행만 반환 — 원문 복원 불가.
 */
export function finderHash(phone: unknown, pin: unknown): string | null {
  if (typeof phone !== 'string' || typeof pin !== 'string') return null;
  const p = phone.replace(/\D/g, '');
  const n = pin.replace(/\D/g, '');
  if (p.length < 10 || p.length > 11 || n.length !== 6) return null;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null; // 시크릿 없으면 저장·조회 모두 불가 (fail-closed)
  return createHmac('sha256', `mypet-finder:${secret}`).update(`${p}:${n}`).digest('hex');
}
