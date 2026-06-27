'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CareCardView from './CareCard';
import { Icon } from './icons';
import type { CareCard, PreviewCard, Species } from '@/lib/types';

/** 일회성 진단 결과 렌더(전부 잠금해제 상태) + 비밀 링크 복사. */
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

  return (
    <>
      <div className="save-banner">
        <Icon name="info" size={16} />
        <span>이 페이지 주소를 저장해두면 나중에 다시 볼 수 있어요.</span>
        <button className="btn btn--sm btn--primary" onClick={copyLink}>
          <Icon name={copied ? 'check' : 'tag'} size={14} /> {copied ? '복사됨' : '링크 복사'}
        </button>
      </div>
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
    </>
  );
}
