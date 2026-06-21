import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';

const CATEGORIES = ['결제', '환불', '오류', '제휴', '기타'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 새 문의 알림 메일(선택). RESEND_API_KEY 가 있을 때만 동작.
 * 보낸사람(from)은 Resend에서 인증된 도메인이어야 함(예: taif.kr).
 * reply-to를 문의자 이메일로 두어 관리자 메일에서 바로 답장 가능.
 */
async function notifyAdmin(q: { name: string | null; email: string; category: string; message: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'mypet 문의 <noreply@taif.kr>',
        to: [SITE.adminEmail],
        reply_to: q.email,
        subject: `[mypet 문의] ${q.category}`,
        text: `유형: ${q.category}\n이름: ${q.name ?? '-'}\n이메일: ${q.email}\n\n${q.message}`,
      }),
    });
  } catch (e) {
    console.error('[inquiries] notify failed:', e);
  }
}

/**
 * 문의 접수. 로그인/비로그인 모두 허용.
 * RLS상 inquiries는 클라이언트 정책이 없어(전체 차단) 서버 admin client로 기록한다.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? '').trim().slice(0, 60);
    const email = String(body?.email ?? '').trim().slice(0, 200);
    const category = CATEGORIES.includes(body?.category) ? body.category : '기타';
    const message = String(body?.message ?? '').trim().slice(0, 4000);

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: '올바른 이메일 주소를 입력해 주세요.' }, { status: 400 });
    }
    if (message.length < 5) {
      return NextResponse.json({ error: '문의 내용을 조금 더 자세히 적어 주세요.' }, { status: 400 });
    }

    // 로그인 상태면 작성자 user_id를 함께 남긴다(선택).
    let userId: string | null = null;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      /* 비로그인 — 무시 */
    }

    const admin = createAdminClient();
    const { error } = await admin.from('inquiries').insert({
      user_id: userId,
      name: name || null,
      email,
      category,
      message,
    });
    if (error) {
      console.error('[inquiries] insert error:', error.message);
      return NextResponse.json({ error: '접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
    }

    await notifyAdmin({ name: name || null, email, category, message });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[inquiries] error:', e);
    return NextResponse.json({ error: '접수 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
