import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/mail-test — 메일 발송 설정 점검 (관리자 전용)
 *
 * ⚠️ 왜 필요한가: 이 서비스의 메일 발송(문의 알림·리포트 링크)은 **실패를 조용히 삼킨다.**
 *    그건 옳은 설계다 — 메일이 안 갔다고 결제 응답을 되돌리면 안 되니까.
 *    하지만 그 대가로 **설정이 틀렸을 때 알 방법이 없다.** 키를 안 넣었는지, 도메인 인증이
 *    안 됐는지, from 주소가 거부됐는지 — 전부 똑같이 '아무 일도 안 일어남'으로 보인다.
 *    (실제로 RESEND_API_KEY가 비어 있는 동안 문의 알림이 한 통도 안 나갔을 수 있다)
 *
 *    이 라우트는 그 침묵을 깬다. 같은 키·같은 from 주소로 한 통 보내고
 *    **Resend가 준 응답을 그대로 돌려준다.**
 *
 * body: { to?: string }  — 없으면 관리자 이메일로. 관리자만 부를 수 있으므로 발송 남용은 불가.
 */
export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: '관리자만 사용할 수 있습니다.' }, { status: 403 });
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'mypet <noreply@taif.kr>';

  // 설정 자체가 비었으면 발송을 시도하지 않고 그 사실을 그대로 알린다.
  if (!key) {
    return NextResponse.json({
      ok: false,
      stage: 'config',
      reason: 'RESEND_API_KEY 가 설정되지 않았습니다. 이 상태에서는 문의 알림과 리포트 링크 메일이 조용히 발송되지 않습니다.',
      from,
    }, { status: 503 });
  }

  let to = SITE.adminEmail;
  try {
    const b = await req.json();
    if (typeof b?.to === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.to)) to = b.to.trim();
  } catch { /* 본문 없음 = 관리자 이메일로 */ }

  const stamp = new Date().toISOString();
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: '[mypet] 메일 발송 점검',
        text: [
          '이 메일이 도착했다면 발송 설정이 정상입니다.',
          '',
          `보낸 주소(MAIL_FROM): ${from}`,
          `발송 시각: ${stamp}`,
          '',
          '이 설정으로 나가는 메일:',
          '· 고객 문의 접수 알림 (관리자에게)',
          '· 진단 리포트 링크 (이용자에게)',
        ].join('\n'),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const body = await res.text();
    if (!res.ok) {
      /*
        가장 흔한 실패는 도메인 미인증이다 — Resend는 인증되지 않은 도메인에서 보내는 것을
        403으로 막는다. 그 경우 body에 이유가 그대로 들어 있으므로 감추지 않고 넘긴다.
      */
      return NextResponse.json({
        ok: false, stage: 'resend', status: res.status, from, to,
        detail: body.slice(0, 500),
        hint: res.status === 403
          ? 'from 도메인(taif.kr)이 Resend에서 인증되지 않았을 수 있습니다. Resend > Domains에서 DNS 레코드를 등록·확인하세요.'
          : res.status === 401 ? 'API 키가 올바르지 않습니다.' : undefined,
      }, { status: 502 });
    }

    return NextResponse.json({ ok: true, stage: 'sent', from, to, at: stamp, detail: body.slice(0, 200) });
  } catch (e) {
    return NextResponse.json({
      ok: false, stage: 'network', from, to,
      reason: e instanceof Error ? e.message : '알 수 없는 오류',
    }, { status: 502 });
  }
}
