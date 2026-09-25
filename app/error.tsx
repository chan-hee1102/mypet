'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // TODO(모니터링): Sentry 등으로 전송
    console.error(error);
  }, [error]);

  return (
    <main className="container container--narrow status-wrap">
      <div className="card gate">
        <div className="gate-ico gate-ico--err"><Icon name="alert" size={20} /></div>
        <h1 className="gate-title">화면을 불러오지 못했어요</h1>
        <p className="gate-desc">일시적인 오류일 수 있어요. 다시 시도해도 같으면 아래 고객문의로 알려 주세요.</p>
        <button className="btn btn--primary btn--lg btn--block" onClick={reset}>다시 시도</button>
        <p className="gate-note"><Link href="/" className="linklike">처음으로</Link></p>
      </div>
    </main>
  );
}
