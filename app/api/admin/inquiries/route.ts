import { isAdmin } from '@/lib/adminAuth';
import type { Inquiry } from '@/lib/admin-types';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['open', 'answered', 'closed'] as const;

/** 문의함 — 목록(최근 300건)과 상태 바꾸기 */
export async function GET() {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const db = createAdminClient();
  const { data, error } = await db
    .from('inquiries')
    .select('id, name, email, category, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: (data ?? []) as Inquiry[] }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(req: Request) {
  if (!isAdmin()) return Response.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? '');
  const status = String(body?.status ?? '');
  if (!/^[0-9a-f-]{36}$/.test(id) || !(STATUSES as readonly string[]).includes(status)) {
    return Response.json({ error: '요청이 올바르지 않아요.' }, { status: 400 });
  }
  const db = createAdminClient();
  const { error } = await db.from('inquiries').update({ status }).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
