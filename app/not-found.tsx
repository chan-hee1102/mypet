import Link from 'next/link';

export const metadata = { title: '페이지를 찾을 수 없어요 — 마이펫' };

export default function NotFound() {
  return (
    <main className="container container--narrow status-wrap">
      <div className="card gate">
        <h1 className="gate-title">페이지를 찾을 수 없어요</h1>
        <p className="gate-desc">주소가 바뀌었거나 없는 페이지예요. 품종 이름으로 다시 찾아보세요.</p>
        <div style={{ display: 'grid', gap: 8 }}>
          <Link href="/breed" className="btn btn--primary btn--lg btn--block">품종 안내판</Link>
          <Link href="/" className="btn btn--secondary btn--lg btn--block">처음으로</Link>
        </div>
      </div>
    </main>
  );
}
