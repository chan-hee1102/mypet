import { redirect } from 'next/navigation';
import SymptomChecker from '@/components/SymptomChecker';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: '증상 체크 — 병원 가야 할까요? · mypet',
};

export const dynamic = 'force-dynamic';

export default async function SymptomPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/symptom');

  return (
    <main className="container">
      <section className="hero">
        <span className="eyebrow"><Icon name="cross" size={14} /> 증상 체크</span>
        <h1>기침·떨림, 병원 가야 할까요?</h1>
        <p className="hero-sub">증상을 입력하면 가능한 원인과 응급도를 바로 안내해 드립니다.</p>
      </section>
      <SymptomChecker />
    </main>
  );
}
