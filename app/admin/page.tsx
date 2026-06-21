import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ingestKnowledge } from '@/lib/ingestKnowledge';
import { SITE } from '@/lib/site';

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
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

/** 서버 액션 공통 가드 — 관리자 이메일이 아니면 중단. */
async function ensureAdmin(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() === SITE.adminEmail.toLowerCase();
}

// ── 서버 액션 ──────────────────────────────────────────────
async function setStatus(formData: FormData) {
  'use server';
  if (!(await ensureAdmin())) return;
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !['open', 'answered', 'closed'].includes(status)) return;
  const admin = createAdminClient();
  await admin.from('inquiries').update({ status }).eq('id', id);
  revalidatePath('/admin');
}

async function runIngest() {
  'use server';
  if (!(await ensureAdmin())) return;
  await ingestKnowledge();
  revalidatePath('/admin');
}

export default async function AdminPage() {
  // 1) 관리자 게이트 — 로그인 + 관리자 이메일만 (그 외엔 404 위장)
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== SITE.adminEmail.toLowerCase()) {
    notFound();
  }

  // 2) service_role로 문의 + 지식베이스 현황 조회
  const admin = createAdminClient();
  const [{ data: inq }, { count: kbCount }] = await Promise.all([
    admin
      .from('inquiries')
      .select('id, name, email, category, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('knowledge').select('*', { count: 'exact', head: true }),
  ]);

  const inquiries = (inq ?? []) as Inquiry[];
  const openCount = inquiries.filter((i) => i.status === 'open').length;

  return (
    <main className="container container--narrow">
      <section className="hero">
        <span className="eyebrow">관리자</span>
        <h1>관리자</h1>
        <p className="hero-sub">문의 {inquiries.length}건 · 미처리 {openCount}건</p>
      </section>

      {/* 지식베이스(RAG) 현황 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h2 className="card-title">지식베이스 (RAG)</h2>
          <p className="card-desc">
            현재 적재된 근거 청크: <b>{kbCount ?? 0}</b>개
            {!kbCount && ' — 아직 비어 있어요. 적재해야 케어 리포트에 출처가 붙습니다.'}
          </p>
        </div>
        <form action={runIngest}>
          <button className="btn btn--secondary btn--block" type="submit">
            지식베이스 적재/갱신 (시드 임베딩)
          </button>
        </form>
        <p className="hint center" style={{ marginTop: 8 }}>
          시드 내용(lib/knowledgeSeed.ts) 전체를 임베딩해 다시 채웁니다. 20~30초 걸릴 수 있어요.
        </p>
      </div>

      {/* 문의 목록 */}
      {inquiries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>아직 접수된 문의가 없어요.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {inquiries.map((q) => (
            <div key={q.id} className="card" style={q.status === 'open' ? undefined : { opacity: 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <strong>{q.category ?? '기타'}{q.status !== 'open' && ` · ${q.status === 'answered' ? '답변완료' : '닫힘'}`}</strong>
                <span className="hint">{fmt(q.created_at)}</span>
              </div>
              <p style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{q.message}</p>
              <p className="hint">
                {q.name ? `${q.name} · ` : ''}
                <a href={`mailto:${q.email}?subject=${encodeURIComponent('[mypet] 문의 답변')}`} className="linklike">
                  {q.email}
                </a>
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {q.status !== 'answered' && (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="status" value="answered" />
                    <button className="btn btn--secondary btn--sm" type="submit">답변완료</button>
                  </form>
                )}
                {q.status !== 'open' ? (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="status" value="open" />
                    <button className="btn btn--secondary btn--sm" type="submit">다시 열기</button>
                  </form>
                ) : (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="status" value="closed" />
                    <button className="btn btn--secondary btn--sm" type="submit">닫기</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
