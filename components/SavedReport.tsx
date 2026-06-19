'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CareCardView from './CareCard';
import { CareCard as CareCardType, PreviewCard, Species } from '@/lib/types';

/**
 * 저장된 케어카드 상세. 서버가 잠금 해제 여부를 판단해 fullCard를 줄지 결정하므로,
 * 결제 전이면 프리미엄 필드가 애초에 클라이언트로 오지 않는다.
 */
export default function SavedReport({
  petId,
  species,
  petName,
  preview,
  fullCard,
  unlocked: initialUnlocked,
}: {
  petId: string;
  species: Species;
  petName: string;
  preview: PreviewCard;
  fullCard: CareCardType | null;
  unlocked: boolean;
}) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(initialUnlocked);

  async function handleUnlock() {
    try {
      await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId }),
      });
    } catch {
      // 기록 실패해도 CareCard가 /api/report로 재확인한다.
    }
    setUnlocked(true);
    router.refresh();
  }

  return (
    <CareCardView
      species={species}
      petName={petName}
      petId={petId}
      preview={preview}
      fullCard={fullCard}
      unlocked={unlocked}
      onUnlock={handleUnlock}
      onReset={() => router.push('/pets')}
    />
  );
}
