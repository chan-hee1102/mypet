export default function Loading() {
  return (
    <main className="container container--narrow">
      <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--muted)' }}>
        <span
          style={{
            display: 'inline-block',
            width: 20,
            height: 20,
            border: '2.5px solid var(--brand-50)',
            borderTopColor: 'var(--brand)',
            borderRadius: '50%',
            animation: 'spin .7s linear infinite',
            verticalAlign: 'middle',
            marginRight: 8,
          }}
        />
        불러오는 중…
      </div>
    </main>
  );
}
