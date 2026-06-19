'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';
import { SITE } from '@/lib/site';

export default function Paywall({ petName, onUnlock }: { petName: string; onUnlock: () => void }) {
  const [working, setWorking] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function unlock() {
    if (!agreed) return;
    setWorking(true);
    // TODO(결제): PG(토스페이먼츠/포트원) 결제위젯 호출 → 서버 /api/payments/confirm 에서
    //   승인 API로 금액·상태 검증 후에만 onUnlock. 사업자등록·PG 키 발급 후 연동 예정.
    //   현재는 베타 무료 해금.
    await new Promise((r) => setTimeout(r, 600));
    setWorking(false);
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

      <div className="paywall-price">
        정식 가격 <b>{SITE.pricePerPet.toLocaleString()}원</b> · 마리당 1회
        <span className="paywall-beta">베타 기간 무료</span>
      </div>

      <label className="paywall-agree">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          주문 내용을 확인했으며 <Link href="/terms" target="_blank">이용약관</Link>,{' '}
          <Link href="/refund" target="_blank">환불정책</Link>,{' '}
          <Link href="/privacy" target="_blank">개인정보처리방침</Link>에 동의합니다.
        </span>
      </label>

      <button className="btn btn--primary btn--lg btn--block" onClick={unlock} disabled={working || !agreed}>
        {working ? <><span className="spinner" /> 처리 중…</> : '동의하고 전체 리포트 보기'}
      </button>

      <p className="paywall-note">
        판매자 {SITE.company} · 결제 완료 즉시 콘텐츠가 제공되어 청약철회가 제한될 수 있습니다(<Link href="/refund" target="_blank">환불정책</Link>).
      </p>
    </div>
  );
}
