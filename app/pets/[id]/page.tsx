import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SavedReport from '@/components/SavedReport';
import PetCare from '@/components/PetCare';
import { CareCard as CareCardType, PreviewCard, Species } from '@/lib/types';

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
  const unlocked = !!unlock;

  const full = cc.card as CareCardType;
  const preview: PreviewCard = { photoAnalysis: full.photoAnalysis, breedTraits: full.breedTraits };

  // 케어 일정 + 기록 (연속성 허브)
  const [schedRes, recRes] = await Promise.all([
    supabase.from('care_schedules').select('id,type,title,due_date,status').eq('pet_id', params.id).order('due_date', { ascending: true }),
    supabase.from('pet_records').select('id,kind,value,note,recorded_at').eq('pet_id', params.id).order('recorded_at', { ascending: false }).limit(30),
  ]);

  return (
    <main className="container">
      <SavedReport
        petId={pet.id}
        species={pet.species as Species}
        petName={pet.name}
        preview={preview}
        // 결제 전이면 프리미엄 필드를 클라이언트로 보내지 않는다.
        fullCard={unlocked ? full : null}
        unlocked={unlocked}
      />
      <PetCare petId={pet.id} schedules={(schedRes.data ?? []) as any} records={(recRes.data ?? []) as any} />
    </main>
  );
}
