import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Icon } from '@/components/icons';
import { dDayLabel, daysUntil, SCHEDULE_META, type ScheduleType } from '@/lib/careSchedule';

export const metadata = { title: '대시보드 — mypet' };
export const dynamic = 'force-dynamic';

type Pet = { id: string; name: string; species: 'dog' | 'cat'; breed: string | null; photo_url: string | null };
type Sched = { id: string; pet_id: string; type: ScheduleType; title: string; due_date: string };
type Rec = { id: string; pet_id: string; kind: string; value: any; note: string | null; recorded_at: string };

const KIND_LABEL: Record<string, string> = { weight: '체중', symptom: '증상', vet_visit: '병원', memo: '메모', med: '약' };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const name = (user.user_metadata?.name as string) || user.email?.split('@')[0] || '보호자';

  const [petsRes, schedRes, recRes] = await Promise.all([
    supabase.from('pets').select('id,name,species,breed,photo_url').order('created_at', { ascending: false }),
    supabase.from('care_schedules').select('id,pet_id,type,title,due_date').eq('status', 'upcoming').order('due_date', { ascending: true }).limit(6),
    supabase.from('pet_records').select('id,pet_id,kind,value,note,recorded_at').order('recorded_at', { ascending: false }).limit(5),
  ]);
  const pets = (petsRes.data ?? []) as Pet[];
  const schedules = (schedRes.data ?? []) as Sched[];
  const records = (recRes.data ?? []) as Rec[];
  const petName = (id: string) => pets.find((p) => p.id === id)?.name ?? '';

  const paths = pets.map((p) => p.photo_url).filter((x): x is string => !!x);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from('pet-photos').createSignedUrls(paths, 3600);
    data?.forEach((s) => { if (s.signedUrl && s.path) signed.set(s.path, s.signedUrl); });
  }
  const nextByPet = new Map<string, Sched>();
  schedules.forEach((s) => { if (!nextByPet.has(s.pet_id)) nextByPet.set(s.pet_id, s); });

  if (pets.length === 0) {
    return (
      <main className="container">
        <section className="hero">
          <h1>{name}님, 환영해요</h1>
          <p className="hero-sub">첫 반려동물을 등록하고 맞춤 케어를 시작하세요.</p>
        </section>
        <div className="card gate">
          <div className="gate-ico"><Icon name="paw" size={24} filled /></div>
          <h2 className="gate-title">아직 등록된 아이가 없어요</h2>
          <p className="gate-desc">사진과 정보를 입력하면 케어 리포트와 일정이 자동으로 만들어져요.</p>
          <Link href="/create" className="btn btn--primary btn--lg btn--block"><Icon name="sparkle" size={17} filled /> 시작하기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="dash-head">
        <div>
          <div className="dash-hi">안녕하세요</div>
          <h1 className="dash-name">{name}님 🐾</h1>
        </div>
      </section>

      {/* 우리 아이 */}
      <div className="dash-section-title"><span>우리 아이</span><Link href="/pets" className="dash-more">전체보기</Link></div>
      <div className="pet-strip">
        {pets.map((p) => {
          const photo = p.photo_url ? signed.get(p.photo_url) : null;
          const next = nextByPet.get(p.id);
          return (
            <Link key={p.id} href={`/pets/${p.id}`} className="pet-chip">
              <div className="pet-chip-thumb">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={p.name} />
                ) : (
                  <Icon name="paw" size={22} filled />
                )}
              </div>
              <div className="pet-chip-name">{p.name}</div>
              {next ? <div className="pet-chip-next">{dDayLabel(next.due_date)}</div> : <div className="pet-chip-next muted">일정없음</div>}
            </Link>
          );
        })}
        <Link href="/create" className="pet-chip pet-chip--add">
          <div className="pet-chip-thumb pet-chip-thumb--add"><Icon name="sparkle" size={20} filled /></div>
          <div className="pet-chip-name">추가</div>
        </Link>
      </div>

      {/* 다가오는 케어 */}
      <div className="dash-section-title"><span>📅 다가오는 케어</span></div>
      <div className="card dash-card">
        {schedules.length === 0 ? (
          <p className="dash-empty">예정된 일정이 없어요.</p>
        ) : (
          <ul className="sched-list">
            {schedules.map((s) => {
              const d = daysUntil(s.due_date);
              return (
                <li key={s.id} className={`sched-item ${d < 0 ? 'overdue' : ''}`}>
                  <span className="sched-ico"><Icon name={SCHEDULE_META[s.type].icon} size={16} /></span>
                  <span className="sched-body">
                    <span className="sched-title">{s.title}</span>
                    <span className="sched-sub">{petName(s.pet_id)} · {s.due_date}</span>
                  </span>
                  <span className={`sched-dday ${d <= 7 ? 'soon' : ''}`}>{dDayLabel(s.due_date)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="dash-note"><Icon name="info" size={13} /> 권장 예상 일정이에요. 실제 접종 이력에 맞춰 각 아이 페이지에서 수정하세요.</p>
      </div>

      {/* 빠른 액션 */}
      <div className="dash-section-title"><span>빠른 액션</span></div>
      <div className="quick-grid">
        <Link href="/symptom" className="quick-btn"><Icon name="cross" size={20} /> 증상 체크</Link>
        <Link href="/create" className="quick-btn"><Icon name="sparkle" size={20} filled /> 새 리포트</Link>
      </div>

      {/* 최근 기록 */}
      {records.length > 0 && (
        <>
          <div className="dash-section-title"><span>🗂 최근 기록</span></div>
          <div className="card dash-card">
            <ul className="rec-list">
              {records.map((r) => (
                <li key={r.id} className="rec-item">
                  <span className="rec-kind">{KIND_LABEL[r.kind] ?? r.kind}</span>
                  <span className="rec-body">
                    {r.kind === 'weight' && r.value?.kg ? `${r.value.kg}kg` : r.note || '—'}
                    <span className="rec-pet"> · {petName(r.pet_id)}</span>
                  </span>
                  <span className="rec-date">{r.recorded_at.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </main>
  );
}
