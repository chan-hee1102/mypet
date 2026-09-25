import { type NextRequest, NextResponse } from 'next/server';

/*
  ⚠️ 2026-09-26 옛 로그인 기능을 닫았다.

  mypet은 원래 로그인해서 반려동물을 등록하는 서비스였다가, 로그인 없는 1회 결제형(/diagnose)으로
  바뀌었다. 그런데 옛 화면과 API가 살아 있어서 **가짜 메일로 가입하면 결제 없이 같은 리포트를
  무료로 받을 수 있었다**(/create → /api/analyze → 「베타 무료」 잠금 해제 → /api/unlock).
  /api/symptom은 횟수 제한 없이 AI를 불렀다.

  여기서 입구를 닫는다: 옛 화면은 리포트 만들기로 보내고, 옛 API는 410(없어짐)을 준다.
  코드 파일은 아직 남아 있다 — 완전히 지울 때는 이 목록과 app/legacy.css도 함께 지울 것.
  관리자(/admin)는 비밀번호 쿠키로 페이지에서 자체 게이트하므로 건드리지 않는다.
*/
const LEGACY_PAGES = ['/login', '/create', '/pets', '/symptom', '/account', '/dashboard', '/reset-password', '/auth'];
const LEGACY_APIS = ['/api/analyze', '/api/symptom', '/api/unlock', '/api/records', '/api/schedules', '/api/report', '/api/payments'];

const hit = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(p + '/'));

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (hit(path, LEGACY_APIS)) {
    return NextResponse.json({ error: '더 이상 제공하지 않는 기능이에요.' }, { status: 410 });
  }
  if (hit(path, LEGACY_PAGES)) {
    const url = request.nextUrl.clone();
    url.pathname = '/diagnose';
    url.search = '';
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login/:path*', '/create/:path*', '/pets/:path*', '/symptom/:path*', '/account/:path*',
    '/dashboard/:path*', '/reset-password/:path*', '/auth/:path*',
    '/api/analyze/:path*', '/api/symptom/:path*', '/api/unlock/:path*', '/api/records/:path*',
    '/api/schedules/:path*', '/api/report/:path*', '/api/payments/:path*',
  ],
};
