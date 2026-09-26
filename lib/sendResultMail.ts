import { SITE } from '@/lib/site';

/**
 * 진단 결과 링크를 이용자 이메일로 보낸다.
 *
 * ⚠️ 왜 필요한가 — 이게 없던 동안 **결과를 볼 수 있는 유일한 길이 그 순간의 브라우저 링크**였다.
 *    창을 닫거나, 결제 직후 리디렉션이 끊기거나, 폰이 꺼지면 돈을 내고도 결과에 못 닿았다.
 *    (`/find`의 휴대폰+PIN 복구가 있었지만, 그걸 안내받고 기억해야만 쓸 수 있었다)
 *    메일은 그 모든 경우를 덮는 안전망이다.
 *
 * ⚠️ 실패해도 절대 throw하지 않는다. 메일 발송 실패가 **결제 완료 응답을 되돌리면 안 된다** —
 *    이용자는 이미 돈을 냈고 리포트는 만들어졌다. 메일은 부가 전달 수단이지 전달의 조건이 아니다.
 *    실패는 로그로 남기고, 화면 링크는 그대로 동작한다.
 *
 * ⚠️ 본문에 진단 내용을 싣지 않는다. 반려동물 건강 정보라 메일 계정이 털리면 그대로 새고,
 *    무엇보다 메일은 우리가 회수할 수 없다. **링크만 보낸다** — 링크는 60일 뒤 만료된다.
 */

const RESEND = 'https://api.resend.com/emails';

export interface ResultMailArgs {
  to: string;
  token: string;
  petName?: string | null;
  /** 관리자가 덧붙이는 말(늦게 보내는 사과 등). 이용자 입력이 아니지만 HTML에는 이스케이프해 넣는다 */
  note?: string | null;
}

/** 보냈으면 true. 키가 없거나 실패면 false(호출측은 이 값으로 재시도 여부만 정한다). */
export async function sendResultMail({ to, token, petName, note }: ResultMailArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;

  const url = `${SITE.url.replace(/\/$/, '')}/r/${token}`;
  const name = (petName ?? '').trim() || '우리 아이';
  const extra = (note ?? '').trim().slice(0, 1000);

  /*
    제목에 반려동물 이름을 넣는다 — 받은편지함에서 「무슨 메일이지」가 되지 않게.
    광고가 아니라 **구매한 결과물의 전달**이므로 정보성 메일이다(수신동의 대상이 아니다).
  */
  const subject = `[mypet] ${name} 케어 리포트가 준비됐어요`;
  // ⚠️ 문의 주소로 관리자 개인 메일을 적지 않는다(예전엔 모든 결제 메일에 노출됐다).
  //    문의하기 페이지는 DB에 남고 관리자에게 알림 메일이 간다(app/api/inquiries).
  const contactUrl = `${SITE.url.replace(/\/$/, '')}/contact`;

  const text = [
    `${name} 케어 리포트가 준비됐어요.`,
    ``,
    ...(extra ? [extra, ``] : []),
    `아래 링크에서 확인해 주세요.`,
    url,
    ``,
    `· 이 링크는 발급일로부터 60일간 열람할 수 있어요.`,
    `· PDF로 저장해 두면 60일이 지나도 볼 수 있어요.`,
    ``,
    `이 리포트는 일반적인 관리 정보이며, 수의사의 진찰과 진료를 대신하지 않아요.`,
    `이 메일에는 답장할 수 없어요. 문의는 ${contactUrl} 에 남겨 주세요.`,
    `${SITE.company}`,
  ].join('\n');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#222">
      <h1 style="font-size:19px;margin:0 0 6px">${escapeHtml(name)} 케어 리포트가 준비됐어요</h1>
      <p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 18px">
        요청하신 케어 리포트가 준비됐어요. 아래 버튼을 눌러 확인해 주세요.
      </p>
      ${extra ? `<p style="font-size:14px;line-height:1.7;color:#333;margin:0 0 18px;padding:12px 14px;background:#f4f5f3;border-radius:8px">${escapeHtml(extra).replace(/\n/g, '<br />')}</p>` : ''}
      <p style="margin:0 0 20px">
        <a href="${url}" style="display:inline-block;background:#0b8560;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;font-weight:600">
          리포트 보기
        </a>
      </p>
      <p style="font-size:12.5px;line-height:1.7;color:#777;margin:0 0 4px">
        · 이 링크는 발급일로부터 <b>60일간</b> 열람할 수 있어요.<br />
        · PDF로 저장해 두면 60일이 지나도 볼 수 있어요.
      </p>
      <hr style="border:0;border-top:1px solid #eee;margin:18px 0" />
      <p style="font-size:11.5px;line-height:1.6;color:#999;margin:0">
        이 리포트는 일반적인 관리 정보이며, 수의사의 진찰과 진료를 대신하지 않아요.<br />
        이 메일에는 답장할 수 없어요. 문의는 <a href="${contactUrl}" style="color:#555">문의하기</a>에 남겨 주세요. · ${escapeHtml(SITE.company)}
      </p>
    </div>`;

  try {
    const res = await fetch(RESEND, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'mypet <noreply@taif.kr>',
        to: [to],
        subject,
        text,   // HTML을 못 그리는 클라이언트를 위한 대체본. 링크가 반드시 살아 있어야 한다
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error('[result-mail] 발송 실패', res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[result-mail] 발송 오류:', e instanceof Error ? e.message : e);
    return false;
  }
}

/** 이름은 이용자가 적은 값이라 그대로 HTML에 넣지 않는다. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
