/**
 * mypet 표식 — 둥근 네모 안의 발바닥.
 * 2026-08 판 로고로 되돌렸다(2026-09-26 사장님 요청 — 그 사이 잠깐 인식표 모양을 썼다).
 * 색은 Wise 판에 맞춰 먹색 바탕 + 라임 발바닥.
 * favicon(app/icon.svg)·OG 이미지(app/opengraph-image.tsx)도 같은 도형 — 바꾸면 셋 다 바꿀 것.
 */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="7" fill="#163300" />
      <g fill="#9fe870" transform="translate(12 12) scale(.72) translate(-12 -12.6)">
        <ellipse cx="6" cy="11" rx="1.6" ry="2.1" />
        <ellipse cx="10" cy="8.2" rx="1.7" ry="2.2" />
        <ellipse cx="14" cy="8.2" rx="1.7" ry="2.2" />
        <ellipse cx="18" cy="11" rx="1.6" ry="2.1" />
        <path d="M12 13.2c-2.5 0-4.3 1.9-4.3 3.7 0 1.6 1.6 2.3 4.3 2.3s4.3-.7 4.3-2.3c0-1.8-1.8-3.7-4.3-3.7Z" />
      </g>
    </svg>
  );
}

export function Wordmark() {
  return (
    <>
      <BrandMark />
      mypet
    </>
  );
}
