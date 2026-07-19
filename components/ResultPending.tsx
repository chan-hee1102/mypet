'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';

/**
 * 결과 페이지의 '아직 완성 전' 상태 처리기.
 * 1) 마운트 시 finalize(토큰만)를 1회 호출 — 리디렉션이 끊겨 유실된 결제를 자동 복구
 * 2) 4초 간격으로 상태를 확인, 완성되면 자동 새로고침
 * 3) 결제 이력이 없으면(402) '아직 결제 전' 안내로 전환
 */
export default function ResultPending({ token }: { token: string }) {
  const [notPaid, setNotPaid] = useState(false);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const r = await fetch('/api/diagnose/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (stop) return;
        if (r.ok) { window.location.reload(); return; }
        if (r.status === 402) { setNotPaid(true); return; } // 실제로 결제 이력 없음
      } catch { /* 네트워크 — 폴링으로 계속 */ }
      const iv = setInterval(async () => {
        try {
          const s = await fetch(`/api/diagnose/status?token=${encodeURIComponent(token)}`).then((x) => x.json());
          if (s.status === 'done') { clearInterval(iv); window.location.reload(); }
          if (s.status === 'failed') { clearInterval(iv); window.location.reload(); }
        } catch { /* 다음 턴 */ }
      }, 4000);
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (notPaid) {
    return (
      <main className="container container--narrow">
        <div className="card gate">
          <div className="gate-ico"><Icon name="lock" size={24} /></div>
          <h2 className="gate-title">아직 결제 전이에요</h2>
          <p className="gate-desc">결제가 완료되면 이 페이지에서 전체 진단을 볼 수 있어요.</p>
          <Link href="/diagnose" className="btn btn--primary btn--lg btn--block">
            <Icon name="sparkle" size={17} filled /> 진단 이어서 하기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow">
      <div className="card gate">
        <div className="gate-ico"><Icon name="sparkle" size={24} filled /></div>
        <h2 className="gate-title">진단을 확인하고 있어요</h2>
        <p className="gate-desc">
          결제 내역을 확인하고 리포트를 만드는 중이에요.<br />
          완성되면 <b>자동으로 화면이 바뀌어요</b> — 잠시만 기다려 주세요.
        </p>
        <p className="gate-note"><span className="spinner" style={{ borderColor: 'rgba(16,163,124,.25)', borderTopColor: 'var(--brand)' }} /> 보통 1분 안에 완성돼요</p>
      </div>
    </main>
  );
}
