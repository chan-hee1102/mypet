'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icons';

export const dynamic = 'force-dynamic';

/**
 * 모바일 결제 리디렉션 복귀 페이지.
 * 포트원 V2는 모바일에서 결제창이 페이지 이동으로 동작하고, 완료 후
 * redirectUrl로 paymentId(성공) 또는 code/message(실패)를 붙여 돌아온다.
 * 여기서 결제 검증(finalize) → 진단 생성 → 결과 페이지로 보낸다.
 */
function PayReturnInner() {
  const q = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode 중복 실행 방지
    ran.current = true;

    const token = q.get('token');
    const paymentId = q.get('paymentId');
    const code = q.get('code');

    if (!token) { setError('잘못된 접근이에요. 처음부터 다시 시도해 주세요.'); return; }
    if (code) { setError(q.get('message') || '결제가 취소되었어요.'); return; }

    (async () => {
      try {
        const r = await fetch('/api/diagnose/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, paymentId }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || '결제 처리 중 오류가 발생했습니다.');
        try { localStorage.removeItem('mypet_diagnose_v1'); } catch { /* ignore */ }
        router.replace(`/r/${token}`);
      } catch (e: any) {
        setError(e?.message || '결제 처리 중 오류가 발생했습니다.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <main className="container container--narrow">
        <div className="card gate">
          <div className="gate-ico"><Icon name="alert" size={24} /></div>
          <h2 className="gate-title">결제가 완료되지 않았어요</h2>
          <p className="gate-desc">{error}</p>
          <Link href="/diagnose" className="btn btn--primary btn--lg btn--block">
            <Icon name="refresh" size={16} /> 다시 시도하기
          </Link>
          <p className="gate-note">입력하신 정보는 그대로 남아 있어요. 결제만 다시 하시면 됩니다.</p>
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
        <p className="gate-note"><span className="spinner" style={{ borderColor: 'rgba(17,160,122,.25)', borderTopColor: 'var(--brand)' }} /> 완료되면 자동으로 결과 페이지로 이동해요</p>
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
