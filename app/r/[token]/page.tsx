import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import ReportClient from '@/components/ReportClient';
import ResultPending from '@/components/ResultPending';
import { Icon } from '@/components/icons';
import type { CareCard, Species } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: '케어 리포트 — mypet', robots: { index: false, follow: false } };

const LINK_VALID_DAYS = 60; // KG이니시스 입점 요건: 결과 링크 유효기간 60일

export default async function ResultPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient();
  const { data: dx } = await admin
    .from('diagnoses')
    .select('species, input, card, status, created_at, paid_at')
    .eq('token', params.token)
    .maybeSingle();

  if (!dx) notFound();

  // 링크 유효기간(60일) 만료 확인
  const baseTs = (dx.paid_at as string | null) || (dx.created_at as string | null);
  if (baseTs) {
    const ageDays = (Date.now() - new Date(baseTs).getTime()) / 86400000;
    if (ageDays > LINK_VALID_DAYS) {
      return (
        <main className="container container--narrow status-wrap">
          <div className="card gate">
            <div className="gate-ico gate-ico--warn"><Icon name="lock" size={20} /></div>
            <h2 className="gate-title">열람 기간이 지났어요</h2>
            <p className="gate-desc">
              리포트는 발급일로부터 {LINK_VALID_DAYS}일 동안 볼 수 있어요. 다시 필요하면 새로 만들어 주세요.
            </p>
            <Link href="/diagnose" className="btn btn--primary btn--lg btn--block">
              새 리포트 만들기
            </Link>
          </div>
        </main>
      );
    }
  }

  if (dx.status !== 'done' || !dx.card) {
    /*
      pending·paid·generating·failed 모두 ResultPending으로 — 거기서 finalize가 결제를 다시 확인하고
      리포트를 (다시) 만든다. 예전에는 failed면 여기서 「새 리포트 만들기」를 주 버튼으로 보여 줘서,
      돈을 낸 사람에게 **다시 결제하라**는 길을 먼저 내밀었다.
    */
    return <ResultPending token={params.token} />;
  }

  const card = dx.card as CareCard;
  const input = dx.input as { name?: string } | null;

  return (
    <main className="container container--doc">
      <ReportClient species={dx.species as Species} petName={input?.name ?? '우리 아이'} card={card} />
    </main>
  );
}
