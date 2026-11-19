import { isAdmin } from '@/lib/adminAuth';
import type { AdminShop } from '@/lib/admin-types';
import { fetchVisits, isPersonRow, shopClicksOf, viewedBoard } from '@/lib/admin-visits';
import { careProfiles } from '@/lib/care';
import { linkOf, rankFor, searchUrl, SLOTS, type ShopCat } from '@/lib/shop';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 관리자 「쿠팡 링크」 탭 — 준비물 카드(lib/shop.ts)마다 링크가 걸렸나 · 몇 품종에 1~3순위로 붙나 · 최근 14일 몇 번 눌렸나.
 * 링크 만드는 순서: 「붙는 품종」이 많은 카드부터 쿠팡 파트너스 간편 링크(검색 결과 주소)로 만들어 lib/data/coupang-links.json에 넣는다.
 * 그 탭을 열 때·새로고침 때만 부른다(14일 방문 행을 읽는다 — 폴링 금지).
 */
const CATS: ShopCat[] = ['food', 'treat', 'toy', 'walk', 'grooming', 'potty', 'home'];

export async function GET() {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });

  const cover = new Map<string, number>();
  for (const p of careProfiles().values()) {
    for (const c of CATS) for (const s of rankFor(p, c).slice(0, 3)) cover.set(s.id, (cover.get(s.id) ?? 0) + 1);
  }

  const clicks = new Map<string, number>();
  let boardViews = 0;
  try {
    const rows = (await fetchVisits(createAdminClient(), new Date(Date.now() - 14 * 86_400_000).toISOString())).filter(isPersonRow);
    for (const r of rows) {
      if (viewedBoard(r)) boardViews++;
      for (const id of new Set(shopClicksOf(r))) clicks.set(id, (clicks.get(id) ?? 0) + 1);
    }
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '읽기 실패' }, { status: 500 });
  }

  const body: AdminShop = {
    generatedAt: new Date().toISOString(),
    boardViews,
    slots: SLOTS.map((s) => ({
      id: s.id,
      species: s.species,
      cat: s.cat,
      title: s.title,
      q: s.q,
      searchUrl: searchUrl(s.q),
      linked: !!linkOf(s.id),
      breeds: cover.get(s.id) ?? 0,
      clicks: clicks.get(s.id) ?? 0,
    })),
  };
  return Response.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
}
