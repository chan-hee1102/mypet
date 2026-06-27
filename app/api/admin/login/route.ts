import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminToken, safeEqual, adminConfigured } from '@/lib/adminAuth';

export const runtime = 'nodejs';

// 베스트에포트 인메모리 레이트리밋(웜 인스턴스 내 무차별 대입 버스트 차단).
// ⚠️ 서버리스 인스턴스 간 공유 안 됨 → 실패 지연 + 강한 비밀번호가 주 방어.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60_000;
const MAX_FAILS = 8;
const MAX_KEYS = 5000; // 메모리 폭주 방지 상한

/** Vercel 엣지가 설정하는 신뢰 가능한 클라이언트 IP(클라이언트가 위조 불가). */
function clientIp(req: Request): string {
  return req.headers.get('x-real-ip') || 'unknown';
}

function isLimited(ip: string): boolean {
  const now = Date.now();
  if (attempts.size > MAX_KEYS) attempts.clear(); // 키 폭주 시 전체 초기화
  const e = attempts.get(ip);
  if (!e || now - e.first > WINDOW_MS) {
    attempts.set(ip, { count: 0, first: now });
    return false;
  }
  return e.count >= MAX_FAILS;
}

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: '관리자 기능이 설정되지 않았습니다(서버 환경변수).' }, { status: 500 });
  }

  const ip = clientIp(req);
  if (isLimited(ip)) {
    return NextResponse.json({ error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  const { password } = await req.json().catch(() => ({ password: '' }));
  const expected = process.env.ADMIN_PASSWORD as string;

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
