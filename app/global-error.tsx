'use client';

// 루트 레이아웃에서 발생한 오류를 잡는 최후의 경계. (자체 html/body 필요)
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '48px 20px', textAlign: 'center', color: '#0e0f0c' }}>
        <h1 style={{ fontSize: 21, marginBottom: 8 }}>화면을 불러오지 못했어요</h1>
        <p style={{ color: '#6a6c6a', marginBottom: 20 }}>잠시 후 다시 시도해 주세요.</p>
        <button
          onClick={reset}
          style={{ background: '#9fe870', color: '#163300', border: 'none', borderRadius: 999, padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
