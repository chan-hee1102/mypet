import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminToken, safeEqual } from '@/lib/adminAuth';

export const runtime = 'nodejs';

// 베스트에포트 인메모리 레이트리밋 — 웜 인스턴스 내 무차별 대입 버스트 차단.
// (서버리스 콜드스타트 시 초기화되므로, 실패 시 고정 지연과 강한 비밀번호로 보완.)
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60_000;
const MAX_FAILS = 8;

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0].trim() : '') || req.headers.get('x-real-ip') || 'unknown';
}
function isLimited(ip: string): boolean {
  const e = attempts.get(ip);
  const now = Date.now();
  if (!e || now - e.first > WINDOW_MS) {
    attempts.set(ip, { count: 0, first: now });
    return false;
  }
  return e.count >= MAX_FAILS;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (isLimited(ip)) {
    return NextResponse.json({ error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  const { password } = await req.json().catch(() => ({ password: '' }));
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD가 설정되지 않았습니다(서버 환경변수).' }, { status: 500 });
  }

  if (typeof password !== 'string' || !safeEqual(password, expected)) {
    const e = attempts.get(ip);
    if (e) e.count += 1;
    await new Promise((r) => setTimeout(r, 600)); // 무차별 대입 완화 지연
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  attempts.delete(ip); // 성공 시 카운터 리셋
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7일
  });
  return res;
}
