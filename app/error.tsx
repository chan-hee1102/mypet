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
    <main className="container container--narrow">
      <div className="card gate">
        <div className="gate-ico"><Icon name="alert" size={24} /></div>
        <h2 className="gate-title">문제가 발생했어요</h2>
        <p className="gate-desc">일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요.</p>
        <button className="btn btn--primary btn--lg btn--block" onClick={reset}>다시 시도</button>
        <p className="hint center" style={{ marginTop: 12 }}>
          <Link href="/" className="linklike">홈으로</Link>
        </p>
      </div>
    </main>
  );
}
