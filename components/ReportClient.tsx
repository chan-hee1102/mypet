'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CareCardView from './CareCard';
import { Icon } from './icons';
import type { CareCard, PreviewCard, Species } from '@/lib/types';

/** 일회성 진단 결과 렌더(전부 잠금해제 상태) + PDF 저장 + 비밀 링크 복사. */
export default function ReportClient({ species, petName, card }: { species: Species; petName: string; card: CareCard }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const preview: PreviewCard = { photoAnalysis: card.photoAnalysis, breedTraits: card.breedTraits, sources: card.sources };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* 클립보드 권한 없음 — 무시 */
    }
  }

  function savePdf() {
    // 인쇄 전 모든 접힌 섹션을 펼쳐 전체가 PDF에 담기게 한다.
    document.querySelectorAll('details.section').forEach((d) => d.setAttribute('open', ''));
    window.print();
  }

  return (
    <>
      <CareCardView
        species={species}
        petName={petName}
        petId={null}
        preview={preview}
        fullCard={card}
        unlocked
        onUnlock={() => {}}
        onReset={() => router.push('/diagnose')}
      />

      {/* 저장·공유는 내용 아래에 — 첫 화면은 결론부터 */}
      <div className="result-actions" style={{ marginTop: 14 }}>
        <button className="btn btn--primary btn--block" onClick={savePdf}>
          <Icon name="check" size={16} /> 진단서 PDF로 저장 · 인쇄
        </button>
        <button className="btn btn--secondary btn--block" onClick={copyLink}>
          <Icon name={copied ? 'check' : 'tag'} size={16} /> {copied ? '링크가 복사됐어요' : '링크 복사 (나중에 다시 보기)'}
        </button>
        <p className="hint center" style={{ marginTop: 2 }}>※ 이 링크는 발급일로부터 60일간 볼 수 있어요.</p>
      </div>
    </>
  );
}
