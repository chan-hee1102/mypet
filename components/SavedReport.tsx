'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CareCardView from './CareCard';
import { CareCard as CareCardType, Species } from '@/lib/types';

/** 저장된 케어카드 상세를 보여주고, 잠금 해제를 서버(/api/unlock)에 기록한다. */
export default function SavedReport({
  petId,
  species,
  petName,
  card,
  unlocked: initialUnlocked,
}: {
  petId: string;
  species: Species;
  petName: string;
  card: CareCardType;
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
      // 기록 실패해도 화면은 열어준다(다음 방문 시 재시도됨).
    }
    setUnlocked(true);
    router.refresh();
  }

  return (
    <CareCardView
      species={species}
      petName={petName}
      card={card}
      unlocked={unlocked}
      onUnlock={handleUnlock}
      onReset={() => router.push('/pets')}
    />
  );
}
