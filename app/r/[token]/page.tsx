import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import ReportClient from '@/components/ReportClient';
import { Icon } from '@/components/icons';
import type { CareCard, Species } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: '진단 결과 — mypet', robots: { index: false, follow: false } };

export default async function ResultPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient();
  const { data: dx } = await admin
    .from('diagnoses')
    .select('species, input, card, status')
    .eq('token', params.token)
    .maybeSingle();

  if (!dx) notFound();

  if (dx.status !== 'done' || !dx.card) {
    const failed = dx.status === 'failed';
    return (
      <main className="container container--narrow">
        <div className="card gate">
          <div className="gate-ico"><Icon name={failed ? 'alert' : 'lock'} size={24} /></div>
          <h2 className="gate-title">{failed ? '진단 생성에 문제가 있었어요' : '아직 결제 전이에요'}</h2>
          <p className="gate-desc">
            {failed
              ? '결제가 되었는데 결과가 안 보이면 고객센터로 문의해 주세요.'
              : '결제가 완료되면 이 페이지에서 전체 진단을 볼 수 있어요.'}
          </p>
          <Link href="/diagnose" className="btn btn--primary btn--lg btn--block">
            <Icon name="sparkle" size={17} filled /> 새 진단 시작하기
          </Link>
        </div>
      </main>
    );
  }

  const card = dx.card as CareCard;
  const input = dx.input as { name?: string } | null;

  return (
    <main className="container container--narrow report--large">
      <ReportClient species={dx.species as Species} petName={input?.name ?? '우리 아이'} card={card} />
    </main>
  );
}
