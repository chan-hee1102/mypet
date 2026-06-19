import { redirect } from 'next/navigation';
import PetForm from '@/components/PetForm';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: '케어 리포트 만들기 — mypet',
};

export const dynamic = 'force-dynamic';

export default async function CreatePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/create');

  return (
    <main className="container">
      <section className="hero">
        <span className="eyebrow"><Icon name="sparkle" size={14} filled /> AI 케어 리포트</span>
        <h1>우리 아이 정보를 입력하세요</h1>
        <p className="hero-sub">사진과 기본 정보로 맞춤 케어 리포트를 만들어 드립니다.</p>
      </section>
      <PetForm />
    </main>
  );
}
