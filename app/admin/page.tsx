import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { ingestKnowledge } from '@/lib/ingestKnowledge';
import { isAdmin, ADMIN_COOKIE } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = { title: '문의 관리 — mypet', robots: { index: false, follow: false } };

type Inquiry = {
  id: string;
  name: string | null;
  email: string;
  category: string | null;
  message: string;
  status: string;
  created_at: string;
};

function fmt(ts: string): string {
  try {
    return new Date(ts).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

// ── 서버 액션 ──────────────────────────────────────────────
async function setStatus(formData: FormData) {
  'use server';
  if (!isAdmin()) return;
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !['open', 'answered', 'closed'].includes(status)) return;
  const admin = createAdminClient();
  await admin.from('inquiries').update({ status }).eq('id', id);
  revalidatePath('/admin');
}

async function runIngest() {
  'use server';
  if (!isAdmin()) return;
  await ingestKnowledge();
  revalidatePath('/admin');
}

async function logout() {
  'use server';
  cookies().delete(ADMIN_COOKIE);
  redirect('/admin/login');
}

export default async function AdminPage({ searchParams }: { searchParams?: { filter?: string } }) {
  if (!isAdmin()) redirect('/admin/login');

  const filter = searchParams?.filter ?? 'all';
  const admin = createAdminClient();
  const [{ data: inq }, { count: kbCount }] = await Promise.all([
    admin
      .from('inquiries')
      .select('id, name, email, category, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(300),
    admin.from('knowledge').select('*', { count: 'exact', head: true }),
  ]);

  let inquiries = (inq ?? []) as Inquiry[];
  if (filter === 'refund') inquiries = inquiries.filter((i) => i.category === '환불');
  if (filter === 'open') inquiries = inquiries.filter((i) => i.status === 'open');

  const all = (inq ?? []) as Inquiry[];
  const openCount = all.filter((i) => i.status === 'open').length;
  const refundCount = all.filter((i) => i.category === '환불').length;

  return (
    <main className="container container--narrow">
      <section className="hero">
        <span className="eyebrow">관리자</span>
        <h1>문의 관리</h1>
        <p className="hero-sub">전체 {all.length}건 · 미처리 {openCount}건 · 환불 {refundCount}건</p>
        <form action={logout} style={{ marginTop: 8 }}>
          <button className="btn btn--ghost btn--sm" type="submit">로그아웃</button>
        </form>
      </section>

      {/* 필터 */}
      <div className="seg" style={{ marginBottom: 14 }}>
        <a href="/admin?filter=all" className={`seg-opt ${filter === 'all' ? 'on' : ''}`}>전체</a>
        <a href="/admin?filter=open" className={`seg-opt ${filter === 'open' ? 'on' : ''}`}>미처리</a>
        <a href="/admin?filter=refund" className={`seg-opt ${filter === 'refund' ? 'on' : ''}`}>환불 문의</a>
      </div>

      {/* 지식베이스(RAG) 현황 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h2 className="card-title">지식베이스 (RAG)</h2>
          <p className="card-desc">적재된 근거 청크: <b>{kbCount ?? 0}</b>개 (일반 가이드 + 품종 프로필)</p>
        </div>
        <form action={runIngest}>
          <button className="btn btn--secondary btn--block" type="submit">지식베이스 적재/갱신</button>
        </form>
      </div>

      {/* 문의 목록 */}
      {inquiries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>해당하는 문의가 없어요.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {inquiries.map((q) => (
            <div key={q.id} className="card" style={q.status === 'open' ? undefined : { opacity: 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <strong>
                  {q.category === '환불' ? '💸 ' : ''}{q.category ?? '기타'}
                  {q.status !== 'open' && ` · ${q.status === 'answered' ? '답변완료' : '닫힘'}`}
                </strong>
                <span className="hint">{fmt(q.created_at)}</span>
              </div>
              <p style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{q.message}</p>
              <p className="hint">
                {q.name ? `${q.name} · ` : ''}
                <a href={`mailto:${q.email}?subject=${encodeURIComponent('[mypet] 문의 답변')}`} className="linklike">{q.email}</a>
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {q.status !== 'answered' && (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="status" value="answered" />
                    <button className="btn btn--secondary btn--sm" type="submit">답변완료</button>
                  </form>
                )}
                <form action={setStatus}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="status" value={q.status === 'open' ? 'closed' : 'open'} />
                  <button className="btn btn--secondary btn--sm" type="submit">{q.status === 'open' ? '닫기' : '다시 열기'}</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
