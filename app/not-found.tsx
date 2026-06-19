import Link from 'next/link';
import { Icon } from '@/components/icons';

export const metadata = { title: '페이지를 찾을 수 없어요 — mypet' };

export default function NotFound() {
  return (
    <main className="container container--narrow">
      <div className="card gate">
        <div className="gate-ico"><Icon name="paw" size={24} filled /></div>
        <h2 className="gate-title">페이지를 찾을 수 없어요</h2>
        <p className="gate-desc">주소가 바뀌었거나 삭제된 페이지일 수 있어요.</p>
        <Link href="/" className="btn btn--primary btn--lg btn--block">홈으로 돌아가기</Link>
      </div>
    </main>
  );
}
