import { createPublicKey, verify } from 'node:crypto';

/**
 * taif.kr 관리자(「전체 사이트」 탭)가 보낸 요청인가 — Ed25519 서명 검증(2026-09-29).
 *
 * 왜 공유 비밀이 아니라 서명인가:
 *   · 비밀키는 taif Vercel 환경변수(HUB_PRIVATE_KEY) **한 곳**에만 있다. 여기엔 공개키만 있어서
 *     이 레포·Vercel 환경변수가 새도 남이 요청을 만들 수 없다(공개키는 비밀이 아니다).
 *   · 관리자 비밀번호나 service_role 키를 taif에 넘기면 주문·연락처까지 열린다. 이 창구는 숫자 요약만 준다.
 * 서명 대상 = `${scope}|${ts}`. scope에 사이트 이름을 넣어 다른 사이트용 서명을 재사용하지 못하게 하고,
 * ts는 ±2분만 받는다. 짝은 taif-site `src/lib/hub.ts`의 signHub(kostock `src/lib/hub-auth.ts`와 같은 파일).
 */
const HUB_PUBLIC_KEY = 'MCowBQYDK2VwAyEAoEvsRNKSUetKqM5jui/UclAAFHIuc12EW2zH/UW0cAs=';
const MAX_SKEW_MS = 2 * 60_000;

const key = createPublicKey({ key: Buffer.from(HUB_PUBLIC_KEY, 'base64'), format: 'der', type: 'spki' });

export function verifyHub(req: Request, scope: string): boolean {
  const ts = req.headers.get('x-hub-ts') ?? '';
  const sig = req.headers.get('x-hub-sig') ?? '';
  const t = Number(ts);
  if (!ts || !sig || !Number.isFinite(t) || Math.abs(Date.now() - t) > MAX_SKEW_MS) return false;
  try {
    return verify(null, Buffer.from(`${scope}|${ts}`), key, Buffer.from(sig, 'base64url'));
  } catch {
    return false;
  }
}
