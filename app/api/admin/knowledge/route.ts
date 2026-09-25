import { isAdmin } from '@/lib/adminAuth';
import { ingestKnowledge } from '@/lib/ingestKnowledge';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 지식베이스(증상 답변의 근거 문단) — 개수 확인(GET)과 다시 적재(POST).
 * 직접 적은 증상에 답할 때(lib/careAdvisor.ts) 이 표에서 근거를 찾는다.
 */
export async function GET() {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const { count, error } = await createAdminClient().from('knowledge').select('*', { count: 'exact', head: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ count: count ?? 0 });
}

export async function POST() {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  try {
    await ingestKnowledge();
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '적재 실패' }, { status: 500 });
  }
  const { count } = await createAdminClient().from('knowledge').select('*', { count: 'exact', head: true });
  return Response.json({ ok: true, count: count ?? 0 });
}
