import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SavedReport from '@/components/SavedReport';
import { CareCard as CareCardType, Species } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PetDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/pets/${params.id}`);

  // 펫 (RLS로 본인 것만 조회됨)
  const { data: pet } = await supabase
    .from('pets')
    .select('id, name, species')
    .eq('id', params.id)
    .single();
  if (!pet) notFound();

  // 가장 최근 케어카드
  const { data: cc } = await supabase
    .from('care_cards')
    .select('card')
    .eq('pet_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!cc) notFound();

  // 잠금 해제 여부
  const { data: unlock } = await supabase
    .from('unlocks')
    .select('id')
    .eq('pet_id', params.id)
    .maybeSingle();

  return (
    <main className="container">
      <SavedReport
        petId={pet.id}
        species={pet.species as Species}
        petName={pet.name}
        card={cc.card as CareCardType}
        unlocked={!!unlock}
      />
    </main>
  );
}
