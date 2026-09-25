'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icons';

export const dynamic = 'force-dynamic';

const RETRY_DELAYS = [0, 3000, 6000, 10000, 15000]; // 백오프 — 총 ~34초 + 서버 대기

/**
 * 모바일 결제 리디렉션 복귀 페이지.
 * 원칙: code(취소·실패)가 없는 한 결제는 성공한 것 — 절대 "다시 결제" UI를 보여주지 않는다.
 * finalize가 실패해도 백오프 재시도 → 그래도 안 되면 결과 페이지로 안내(결과 페이지가 자동 복구).
 */
function PayReturnInner() {
  const q = useSearchParams();
  const router = useRouter();
  const [cancelled, setCancelled] = useState('');   // 사용자 취소/결제 실패 (code 존재)
  const [pgMessage, setPgMessage] = useState('');   // 결제사 원문 메시지(작게만 보여 준다)
  const [softFail, setSoftFail] = useState(false);  // 결제 성공했으나 확인 지연
  const token = q.get('token') ?? '';
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode 중복 실행 방지
    ran.current = true;

    const paymentId = q.get('paymentId');
    const code = q.get('code');

    if (!token) { setCancelled('주소가 올바르지 않아요. 리포트 만들기에서 다시 시작해 주세요.'); return; }
    if (code) { setCancelled('결제가 취소됐거나 승인되지 않았어요.'); setPgMessage(q.get('message') ?? ''); return; }

    let stop = false;
    (async () => {
      for (const delay of RETRY_DELAYS) {
        if (stop) return;
        if (delay > 0) await new Promise((r) => setTimeout(r, delay));
        try {
          const r = await fetch('/api/diagnose/finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, paymentId }),
          });
          if (r.ok) {
            try { localStorage.removeItem('mypet_diagnose_v1'); } catch { /* ignore */ }
            router.replace(`/r/${token}`);
            return;
          }
        } catch { /* 네트워크 오류 — 다음 시도 */ }
      }
      // 여기 와도 결제는 성공 상태 — 결과 페이지로 안내 (그쪽에서 자동 복구·폴링)
      if (!stop) setSoftFail(true);
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cancelled) {
    return (
      <main className="container container--narrow status-wrap">
        <div className="card gate">
          <div className="gate-ico gate-ico--warn"><Icon name="alert" size={20} /></div>
          <h1 className="gate-title">결제가 완료되지 않았어요</h1>
          <p className="gate-desc">{cancelled}</p>
          <Link href="/diagnose" className="btn btn--primary btn--lg btn--block">결제 다시 하기</Link>
          <p className="gate-note">아이 정보는 그대로 남아 있어요. 이메일, 휴대폰 번호, 다시 찾기 번호만 다시 적고 결제해 주세요.</p>
          {pgMessage && <p className="gate-note">결제사 안내: {pgMessage}</p>}
        </div>
      </main>
    );
  }

  if (softFail) {
    return (
      <main className="container container--narrow status-wrap">
        <div className="card gate">
          <div className="gate-ico"><Icon name="check" size={20} /></div>
          <h1 className="gate-title">결제는 접수됐어요</h1>
          <p className="gate-desc">
            확인이 조금 늦어지고 있어요. 리포트를 열면 이어서 만들어져요. 다시 결제하지 마세요.
          </p>
          <Link href={`/r/${token}`} className="btn btn--primary btn--lg btn--block">리포트 열기</Link>
          <p className="gate-note">문제가 계속되면 <Link href="/contact" className="linklike">문의하기</Link>로 알려 주세요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow status-wrap">
      <div className="card gate" aria-live="polite">
        <div className="gate-ico"><Icon name="check" size={20} /></div>
        <h1 className="gate-title">결제를 확인하고 있어요</h1>
        <p className="gate-desc">확인이 끝나면 리포트 화면으로 바로 넘어가요. 이 화면을 닫지 말아 주세요.</p>
        <div className="progress" />
      </div>
    </main>
  );
}

export default function PayReturnPage() {
  return (
    <Suspense fallback={null}>
      <PayReturnInner />
    </Suspense>
  );
}
