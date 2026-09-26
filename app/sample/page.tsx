import Link from 'next/link';
import { ReportDocument } from '@/components/CareCard';
import { sampleCard, sampleInput } from '@/lib/sample';
import { SITE } from '@/lib/site';

export const metadata = {
  title: '예시 리포트 — mypet',
  description: '포메라니안 3살 3.4kg 예시로 만든 mypet 케어 리포트 전체예요. 급여량, 접종 일정, 조심할 질환과 신호, 먹으면 안 되는 음식, 주간 체크리스트가 들어 있어요.',
  alternates: { canonical: `${SITE.url}/sample` },
};

// 예시의 날짜(발행일·접종 예정일)가 오늘 기준으로 맞도록 하루에 한 번 다시 만든다.
export const revalidate = 86400;

/*
  예시 리포트 — 결제하면 받는 것을 끝까지 보여 준다.
  사용성 테스트(2026-09-26)에서 「무료 가이드와 무엇이 다른지 확인할 수 없어서 결제를 미뤘다」는
  말이 나왔다. 가상의 강아지(구름이)를 실제 계산 코드로 만든 리포트라 값이 지어낸 것이 아니다.
*/
export default function SamplePage() {
  const input = sampleInput('dog');
  const card = sampleCard('dog');
  return (
    <main className="container container--doc on-grey">
      <div className="sample-note">
        <p><b>예시 리포트예요.</b> {input.name}(포메라니안, 3살, 3.4kg)라는 가상의 강아지로 만들었어요. 실제 리포트는 입력하신 정보로 계산해요.</p>
        <Link href="/diagnose" className="btn btn--primary">우리 아이로 시작하기</Link>
      </div>
      <ReportDocument species="dog" petName={input.name} card={card} />
    </main>
  );
}
