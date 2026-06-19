import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Icon } from '@/components/icons';

export const metadata = { title: '내 아이 — mypet' };
export const dynamic = 'force-dynamic';

type PetRow = {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string | null;
  photo_url: string | null;
  created_at: string;
};

export default async function PetsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/pets');

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name, species, breed, photo_url, created_at')
    .order('created_at', { ascending: false });

  const list = (pets ?? []) as PetRow[];

  // 비공개 버킷이므로 사진은 서명 URL로 변환 (한 번에 batch)
  const paths = list.map((p) => p.photo_url).filter((x): x is string => !!x);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from('pet-photos').createSignedUrls(paths, 60 * 60);
    data?.forEach((s) => {
      if (s.signedUrl && s.path) signed.set(s.path, s.signedUrl);
    });
  }

  return (
    <main className="container">
      <section className="hero">
        <span className="eyebrow"><Icon name="paw" size={14} filled /> 내 아이</span>
        <h1>우리 아이들</h1>
        <p className="hero-sub">저장된 케어 리포트를 다시 확인하세요.</p>
      </section>

      {list.length === 0 ? (
        <div className="card gate">
          <div className="gate-ico"><Icon name="paw" size={24} filled /></div>
          <h2 className="gate-title">아직 등록된 아이가 없어요</h2>
          <p className="gate-desc">첫 케어 리포트를 만들어 보세요.</p>
          <Link href="/create" className="btn btn--primary btn--lg btn--block">
            <Icon name="sparkle" size={17} filled /> 케어 리포트 만들기
          </Link>
        </div>
      ) : (
        <div className="pet-grid">
          {list.map((p) => {
            const photo = p.photo_url ? signed.get(p.photo_url) : null;
            return (
              <Link key={p.id} href={`/pets/${p.id}`} className="pet-card">
                <div className="pet-thumb">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={p.name} />
                  ) : (
                    <span className="pet-thumb-ph"><Icon name="paw" size={26} filled /></span>
                  )}
                </div>
                <div className="pet-info">
                  <div className="pet-name">{p.name}</div>
                  <div className="pet-meta">
                    <span className="chip chip--solid">{p.species === 'dog' ? '강아지' : '고양이'}</span>
                    {p.breed && <span className="chip">{p.breed}</span>}
                  </div>
                </div>
                <span className="pet-go"><Icon name="tag" size={16} /></span>
              </Link>
            );
          })}
        </div>
      )}

      <Link href="/create" className="btn btn--secondary btn--block" style={{ marginTop: 20 }}>
        <Icon name="sparkle" size={16} filled /> 새 케어 리포트 만들기
      </Link>
    </main>
  );
}
