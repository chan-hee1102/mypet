import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Icon } from '@/components/icons';

export const metadata = { title: '계정 — mypet' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');

  const name = (user.user_metadata?.name as string) || '';
  const initial = (user.email?.trim()[0] || 'U').toUpperCase();

  return (
    <main className="container container--narrow">
      <section className="hero">
        <span className="eyebrow"><Icon name="user" size={14} /> 계정</span>
        <h1>마이 페이지</h1>
      </section>

      <div className="card">
        <div className="account-head">
          <div className="account-avatar">{initial}</div>
          <div className="account-id">
            {name && <div className="account-name">{name}</div>}
            <div className="account-email">{user.email}</div>
          </div>
        </div>

        <div className="account-rows">
          <Link href="/pets" className="account-row">
            <Icon name="paw" size={18} filled /> <span>내 아이</span>
            <Icon name="tag" size={15} className="account-row-go" />
          </Link>
          <Link href="/create" className="account-row">
            <Icon name="sparkle" size={18} filled /> <span>새 케어 리포트 만들기</span>
            <Icon name="tag" size={15} className="account-row-go" />
          </Link>
          <Link href="/symptom" className="account-row">
            <Icon name="cross" size={18} /> <span>증상 체크</span>
            <Icon name="tag" size={15} className="account-row-go" />
          </Link>
        </div>

        <div className="account-rows account-rows--sub">
          <Link href="/terms" className="account-row account-row--sub">이용약관</Link>
          <Link href="/privacy" className="account-row account-row--sub">개인정보처리방침</Link>
          <Link href="/refund" className="account-row account-row--sub">환불정책</Link>
        </div>

        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn--secondary btn--block" style={{ marginTop: 14 }}>
            <Icon name="lock" size={16} /> 로그아웃
          </button>
        </form>
      </div>
    </main>
  );
}
