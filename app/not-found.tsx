import Link from 'next/link';

export const metadata = { title: '페이지를 찾을 수 없어요 — mypet' };

export default function NotFound() {
  return (
    <main className="container container--narrow status-wrap">
      <div className="card gate">
        <h1 className="gate-title">페이지를 찾을 수 없어요</h1>
        <p className="gate-desc">주소가 바뀌었거나 없는 페이지예요. 리포트 링크라면 결제 때 받은 이메일의 링크를 열거나, 리포트 찾기에서 다시 찾을 수 있어요.</p>
        <div style={{ display: 'grid', gap: 8 }}>
          <Link href="/" className="btn btn--primary btn--lg btn--block">처음으로</Link>
          <Link href="/find" className="btn btn--secondary btn--lg btn--block">리포트 찾기</Link>
        </div>
      </div>
    </main>
  );
}
