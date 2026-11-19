import { type NextRequest, NextResponse } from 'next/server';
import { breedPath } from '@/lib/breedSlug';

/*
  닫은 주소 처리 — 옛 주소(북마크·검색 결과)가 404 대신 갈 곳으로 가게.

  ① 2026-09-26: 로그인해서 반려동물을 등록하던 옛 기능(/login·/create·/symptom …)을 닫았다.
  ② 2026-11-19: 2,900원 리포트(/diagnose·결제·/r 결과·/find 다시 찾기·/sample·/refund)를 전부 걷어냈다(사장님 「전면 개편」).
     /diagnose?breed=말티즈 처럼 품종이 붙은 주소는 그 품종 안내판으로, 나머지는 첫 화면으로 보낸다.
     결과 링크(/r/…)를 받은 실제 고객은 없었다(주문 전부 사장님 시험 — 관리자 기록으로 확인).
  옛 API는 410(없어짐). 관리자(/admin)는 비밀번호 쿠키로 자체 게이트하므로 건드리지 않는다.
*/
const LEGACY_PAGES = ['/login', '/create', '/pets', '/symptom', '/account', '/dashboard', '/reset-password', '/auth', '/diagnose', '/find', '/r', '/pay', '/sample', '/refund'];
const LEGACY_APIS = ['/api/analyze', '/api/symptom', '/api/unlock', '/api/records', '/api/schedules', '/api/report', '/api/payments', '/api/diagnose', '/api/find', '/api/portone', '/api/breed-guide', '/api/admin/orders', '/api/admin/knowledge'];

const hit = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(p + '/'));

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (hit(path, LEGACY_APIS)) {
    return NextResponse.json({ error: '더 이상 제공하지 않는 기능이에요.' }, { status: 410 });
  }
  if (hit(path, LEGACY_PAGES)) {
    const url = request.nextUrl.clone();
    const breed = path.startsWith('/diagnose') ? request.nextUrl.searchParams.get('breed') : null;
    url.pathname = breed ? breedPath(breed) : path.startsWith('/diagnose') ? '/breed' : '/';
    url.search = '';
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login/:path*', '/create/:path*', '/pets/:path*', '/symptom/:path*', '/account/:path*',
    '/dashboard/:path*', '/reset-password/:path*', '/auth/:path*',
    '/diagnose/:path*', '/find/:path*', '/r/:path*', '/pay/:path*', '/sample/:path*', '/refund/:path*',
    '/api/analyze/:path*', '/api/symptom/:path*', '/api/unlock/:path*', '/api/records/:path*',
    '/api/schedules/:path*', '/api/report/:path*', '/api/payments/:path*',
    '/api/diagnose/:path*', '/api/find/:path*', '/api/portone/:path*', '/api/breed-guide/:path*',
    '/api/admin/orders/:path*', '/api/admin/knowledge/:path*',
  ],
};
