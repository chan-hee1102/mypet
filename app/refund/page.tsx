import LegalLayout from '@/components/LegalLayout';
import { SITE } from '@/lib/site';

export const metadata = { title: '환불·청약철회 정책 — mypet' };

export default function RefundPage() {
  return (
    <LegalLayout title="환불 및 청약철회 정책" updated={SITE.lastUpdated}>
      <p>
        본 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」에 근거하여 {SITE.serviceName}의 유료 콘텐츠(케어 리포트) 결제에 적용됩니다.
      </p>

      <h2>1. 콘텐츠의 성격</h2>
      <p>
        케어 리포트는 결제 즉시 생성·제공되는 <strong>디지털 콘텐츠</strong>입니다. 가격은 반려동물 1마리당 {SITE.pricePerPet.toLocaleString()}원입니다.
      </p>

      <h2>2. 청약철회</h2>
      <p>
        ① 이용자는 결제일로부터 <strong>7일 이내</strong>에 청약을 철회할 수 있습니다.<br />
        ② 다만, 전자상거래법 제17조 제2항 및 시행령에 따라 <strong>결제 즉시 콘텐츠가 제공(열람)되어 그 가치가 현저히 감소한 경우</strong>에는
        청약철회가 제한될 수 있습니다. 회사는 결제 전에 이 사실을 고지하고 동의를 받습니다.<br />
        ③ 콘텐츠에 하자가 있거나 표시·광고 내용과 다르게 제공된 경우에는 제공일로부터 3개월 이내 또는 그 사실을 안 날로부터 30일 이내에
        청약철회 및 환불을 요청할 수 있습니다.
      </p>

      <h2>3. 환불 절차</h2>
      <p>
        ① 환불 요청은 이메일({SITE.email})로 접수합니다.<br />
        ② 환불이 승인되면 결제수단과 동일한 방법으로 환불하며, 결제대행사(PG)·카드사 사정에 따라 영업일 기준 3~7일이 소요될 수 있습니다.
      </p>

      <h2>4. 환불이 제한되는 경우</h2>
      <p>
        이용자가 이미 리포트를 열람하여 콘텐츠의 가치가 소진된 경우, 부정한 방법으로 결제·이용한 경우에는 환불이 제한될 수 있습니다.
      </p>

      <h2>5. 결제 전 거래조건 고지</h2>
      <p>
        판매자: {SITE.company} · 결제수단: 신용카드·간편결제 등 PG가 제공하는 수단 · 공급시기: 결제 완료 즉시 ·
        청약철회 조건: 본 정책에 따름. 결제 화면에서 위 사항을 확인하고 동의 후 결제가 진행됩니다.
      </p>

      <h2>문의</h2>
      <p>
        {SITE.company} · 이메일 {SITE.email}
      </p>
    </LegalLayout>
  );
}
