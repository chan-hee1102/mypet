'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';

/**
 * 결과 페이지의 '아직 완성 전' 상태 처리기.
 * 1) 마운트 시 finalize(토큰만)를 호출 — 결제 직후 넘어온 경우 여기서 리포트가 만들어지고,
 *    리디렉션이 끊겨 유실된 결제도 여기서 자동 복구된다. 실패('failed')였던 건도 한 번 다시 만든다.
 * 2) 4초 간격으로 상태를 확인, 완성되면 자동 새로고침
 * 3) 결제 이력이 없으면(402) '결제 확인 안 됨' 안내로 전환
 * 4) 2분이 지나면 기다리기를 멈추고 **길을 준다**
 *
 * finalize 응답의 뜻(app/api/diagnose/finalize): 402 미결제 · 503 결제사 조회 지연 · 500 gen_failed 생성 실패.
 * ⚠️ 402를 한 번에 믿지 않는다 — 결제 직후 몇 초 동안은 결제사 조회가 늦게 PAID로 바뀔 수 있다.
 *    돈을 낸 사람에게 「결제가 안 됐다」고 말하는 것이 이 화면에서 가장 나쁜 실수다.
 * ⚠️ 생성 실패는 새로고침으로 되풀이하지 않는다. 예전 구조대로라면 실패 → 새로고침 → 또 실패가
 *    끝없이 돌 수 있다. 실패는 멈춰서 안내하고, 다시 시도는 사람이 누를 때만 한다.
 */

const GIVE_UP_MS = 120_000;
const POLL_MS = 4000;
const RETRY_WAITS = [2500, 5000];

type View = 'waiting' | 'notPaid' | 'failed' | 'stuck';

export default function ResultPending({ token }: { token: string }) {
  const [view, setView] = useState<View>('waiting');
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    let stop = false;
    const startedAt = Date.now();
    let iv: ReturnType<typeof setInterval> | undefined;
    const tick = setInterval(() => setWaited(Math.round((Date.now() - startedAt) / 1000)), 1000);

    const finalize = () =>
      fetch('/api/diagnose/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

    (async () => {
      try {
        let r = await finalize();
        // 402(미결제로 보임)·503(결제사 조회 지연)은 잠깐 뒤에 다시 물어본다
        for (const wait of RETRY_WAITS) {
          if (stop || (r.status !== 402 && r.status !== 503)) break;
          await new Promise((res) => setTimeout(res, wait));
          if (stop) return;
          r = await finalize();
        }
        if (stop) return;
        if (r.ok) { window.location.reload(); return; }
        if (r.status === 402) { setView('notPaid'); return; }
        if (r.status === 500) {
          const j = await r.json().catch(() => null);
          if (j?.code === 'gen_failed') { setView('failed'); return; }
        }
        // 그 외(503·504·네트워크)는 아래 폴링으로 — 생성이 다른 요청(웹훅 등)에서 끝날 수 있다
      } catch { /* 네트워크 — 폴링으로 계속 */ }

      iv = setInterval(async () => {
        if (Date.now() - startedAt > GIVE_UP_MS) {
          clearInterval(iv);
          setView('stuck');
          return;
        }
        try {
          const s = await fetch(`/api/diagnose/status?token=${encodeURIComponent(token)}`).then((x) => x.json());
          if (s.status === 'done') { clearInterval(iv); window.location.reload(); }
          else if (s.status === 'failed') { clearInterval(iv); setView('failed'); }
        } catch { /* 다음 턴 */ }
      }, POLL_MS);
    })();

    return () => { stop = true; clearInterval(tick); if (iv) clearInterval(iv); };
  }, [token]);

  if (view === 'notPaid') {
    return (
      <main className="container container--narrow status-wrap">
        <div className="card gate">
          <div className="gate-ico gate-ico--warn"><Icon name="lock" size={20} /></div>
          <h1 className="gate-title">결제가 확인되지 않았어요</h1>
          <p className="gate-desc">결제가 끝나지 않았거나 취소된 주문이에요. 결제를 마치면 이 주소에서 리포트를 볼 수 있어요.</p>
          <Link href="/diagnose" className="btn btn--primary btn--lg btn--block">리포트 만들기로 돌아가기</Link>
          <p className="gate-note">
            카드 결제 문자를 받으셨다면 다시 결제하지 마시고, <Link href="/contact" className="linklike">문의하기</Link>로
            이 페이지 주소를 보내 주세요. 확인해서 리포트를 열어 드리거나 환불해 드려요.
          </p>
        </div>
      </main>
    );
  }

  if (view === 'failed') {
    return (
      <main className="container container--narrow status-wrap">
        <div className="card gate">
          <div className="gate-ico gate-ico--err"><Icon name="alert" size={20} /></div>
          <h1 className="gate-title">리포트를 만들지 못했어요</h1>
          <p className="gate-desc">
            결제는 정상 처리됐어요. 다시 결제하지 마세요. 한 번 더 시도해도 같으면 문의하기로 이 페이지 주소를 보내 주세요.
            리포트를 다시 만들어 드리거나 환불해 드려요.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            <button className="btn btn--primary btn--lg btn--block" onClick={() => window.location.reload()}>다시 시도하기</button>
            <Link href="/contact" className="btn btn--secondary btn--lg btn--block">문의하기</Link>
          </div>
        </div>
      </main>
    );
  }

  /*
    2분을 넘긴 상태. 이용자가 지금 알아야 할 것은 ① 돈은 안전하다 ② 다시 여는 방법 ③ 사람에게 말할 방법이다.
  */
  if (view === 'stuck') {
    return (
      <main className="container container--narrow status-wrap">
        <div className="card gate">
          <div className="gate-ico gate-ico--warn"><Icon name="alert" size={20} /></div>
          <h1 className="gate-title">리포트가 늦어지고 있어요</h1>
          <p className="gate-desc">
            결제는 안전하게 처리됐어요. 다시 결제하지 마세요. 조금 뒤에 이 주소를 다시 열거나,
            리포트 찾기에서 휴대폰 번호와 다시 찾기 번호로 열 수 있어요. 완성되면 이메일로도 링크를 보내 드려요.
          </p>
          <button className="btn btn--primary btn--lg btn--block" onClick={() => window.location.reload()}>지금 다시 확인하기</button>
          <p className="gate-note">10분이 지나도 열리지 않으면 <Link href="/contact" className="linklike">문의하기</Link>로 이 페이지 주소를 보내 주세요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow status-wrap">
      <div className="card gate" aria-live="polite">
        <div className="gate-ico"><Icon name="check" size={20} /></div>
        <h1 className="gate-title">결제를 확인하고 리포트를 만드는 중이에요</h1>
        <p className="gate-desc">완성되면 이 화면이 리포트로 바뀌어요. 보통 몇 초면 끝나요.</p>
        <div className="progress" />
        <p className="gate-note">
          {waited > 0 ? `${waited}초 지났어요. ` : ''}
          창을 닫으셔도 결제는 안전해요. 리포트 찾기에서 휴대폰 번호와 다시 찾기 번호로 언제든 다시 열 수 있어요.
        </p>
      </div>
    </main>
  );
}
