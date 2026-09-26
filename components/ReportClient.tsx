'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReportDocument } from './CareCard';
import type { CareCard, Species } from '@/lib/types';

/** 결제 후 리포트 화면 — 문서 + PDF 저장 + 링크 복사. */
export default function ReportClient({ species, petName, card }: { species: Species; petName: string; card: CareCard }) {
  const router = useRouter();
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied('ok');
    } catch {
      // 클립보드 권한이 없는 브라우저(일부 인앱 브라우저)에서는 주소를 직접 보여 준다
      setCopied('fail');
    }
    setTimeout(() => setCopied('idle'), 4000);
  }

  return (
    <>
      <ReportDocument species={species} petName={petName} card={card} onReset={() => router.push('/diagnose')} />

      {/* 저장·공유는 문서 아래에 — 첫 화면은 결론부터 */}
      <div className="doc-actions">
        <button className="btn btn--primary btn--lg" onClick={() => window.print()}>PDF로 저장하거나 인쇄하기</button>
        <button className="btn btn--secondary btn--lg" onClick={copyLink} aria-live="polite">
          {copied === 'ok' ? '링크를 복사했어요' : '이 리포트 링크 복사'}
        </button>
        <p className="hint">
          {copied === 'fail'
            ? '이 브라우저에서는 복사가 막혀 있어요. 주소창의 주소를 길게 눌러 복사해 주세요.'
            : '링크는 발급일로부터 60일 동안 열려요. PDF로 저장해 두면 그 뒤에도 볼 수 있어요.'}
        </p>
      </div>
    </>
  );
}
