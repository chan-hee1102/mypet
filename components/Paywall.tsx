'use client';

import { useState } from 'react';
import { Icon } from './icons';

export default function Paywall({ petName, onUnlock }: { petName: string; onUnlock: () => void }) {
  const [paying, setPaying] = useState(false);

  async function pay() {
    setPaying(true);
    // TODO(결제): 실제로는 토스페이먼츠/포트원 결제창 호출 → 서버에서 결제 검증 →
    //   검증 성공 시 서버가 전체 리포트를 내려주고 onUnlock() 호출.
    //   지금은 MVP 데모용 모의 결제 (1.2초 후 성공 처리).
    await new Promise((r) => setTimeout(r, 1200));
    setPaying(false);
    onUnlock();
  }

  return (
    <div className="paywall">
      <div className="paywall-lock"><Icon name="lock" size={22} /></div>
      <h3>전체 리포트 잠금 해제</h3>
      <p>{petName}의 맞춤 케어를 전부 확인하세요.</p>
      <ul className="paywall-list">
        <li><Icon name="bowl" size={16} /> 음식 가이드 — 먹어도 되는 음식 · 절대 금지 독성식품</li>
        <li><Icon name="calendar" size={16} /> 나이별 맞춤 케어</li>
        <li><Icon name="repeat" size={16} /> 목욕 · 산책 · 빗질 권장 주기</li>
        <li><Icon name="cross" size={16} /> 병원 방문이 필요한 신호</li>
      </ul>
      <button className="btn btn--primary btn--lg btn--block" onClick={pay} disabled={paying}>
        {paying ? <><span className="spinner" /> 결제 처리 중…</> : <>₩3,900 결제하고 전체 보기</>}
      </button>
      <p className="paywall-note"><Icon name="shield" size={13} /> 마리당 1회 결제 · 안전한 결제</p>
    </div>
  );
}
