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
  const [softFail, setSoftFail] = useState(false);  // 결제 성공했으나 확인 지연
  const token = q.get('token') ?? '';
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode 중복 실행 방지
    ran.current = true;

    const paymentId = q.get('paymentId');
    const code = q.get('code');

    if (!token) { setCancelled('잘못된 접근이에요. 처음부터 다시 시도해 주세요.'); return; }
    if (code) { setCancelled(q.get('message') || '결제가 취소되었어요.'); return; }

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
      <main className="container container--narrow">
        <div className="card gate">
          <div className="gate-ico"><Icon name="alert" size={24} /></div>
          <h2 className="gate-title">결제가 완료되지 않았어요</h2>
          <p className="gate-desc">{cancelled}</p>
          <Link href="/diagnose" className="btn btn--primary btn--lg btn--block">
            <Icon name="refresh" size={16} /> 다시 시도하기
          </Link>
          <p className="gate-note">입력하신 정보는 그대로 남아 있어요. 결제만 다시 하시면 됩니다.</p>
        </div>
      </main>
    );
  }

  if (softFail) {
    return (
      <main className="container container--narrow">
        <div className="card gate">
          <div className="gate-ico"><Icon name="check" size={24} /></div>
          <h2 className="gate-title">결제는 접수됐어요</h2>
          <p className="gate-desc">
            확인이 조금 늦어지고 있어요. 아래 버튼을 누르면 결과 페이지에서
            자동으로 진단이 이어서 만들어져요. <b>다시 결제하실 필요 없어요.</b>
          </p>
          <Link href={`/r/${token}`} className="btn btn--primary btn--lg btn--block">
            <Icon name="sparkle" size={17} filled /> 결과 페이지 열기
          </Link>
          <p className="gate-note">문제가 계속되면 하단 &ldquo;환불 문의&rdquo;로 알려주세요. 바로 처리해 드려요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow">
      <div className="card gate">
        <div className="gate-ico"><Icon name="sparkle" size={24} filled /></div>
        <h2 className="gate-title">결제 확인 중이에요</h2>
        <p className="gate-desc">
          결제를 확인하고 AI 진단을 만들고 있어요.<br />
          <b>최대 1분</b> 정도 걸려요 — 이 화면을 닫지 말아 주세요.
        </p>
        <p className="gate-note"><span className="spinner" style={{ borderColor: 'rgba(16,163,124,.25)', borderTopColor: 'var(--brand)' }} /> 완료되면 자동으로 결과 페이지로 이동해요</p>
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
