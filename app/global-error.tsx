'use client';

// 루트 레이아웃에서 발생한 오류를 잡는 최후의 경계. (자체 html/body 필요)
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '48px 20px', textAlign: 'center', color: '#191c22' }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>문제가 발생했어요</h2>
        <p style={{ color: '#7b818b', marginBottom: 20 }}>잠시 후 다시 시도해 주세요.</p>
        <button
          onClick={reset}
          style={{ background: '#0b7d5f', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
