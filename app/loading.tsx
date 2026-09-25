export default function Loading() {
  return (
    <main className="container container--narrow status-wrap" aria-busy="true">
      <div className="progress" style={{ marginTop: 40 }} />
      <p className="hint center">불러오는 중</p>
    </main>
  );
}
