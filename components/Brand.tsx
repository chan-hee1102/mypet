/**
 * mypet 표식 — 목걸이에 다는 **인식표** 모양.
 * 발바닥 아이콘은 반려동물 서비스라면 어디나 쓰는 모양이라 우리 것이 되지 않는다.
 * 인식표는 「이 아이가 누구인지 적어 두는 것」이라, 기록지를 만드는 서비스와 뜻이 맞는다.
 * favicon(app/icon.svg)도 같은 도형을 쓴다 — 바꾸면 둘 다 바꿀 것.
 */
export function TagMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="5.9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7.6 6.6h4.8a4 4 0 0 1 4 4v4.6a4 4 0 0 1-4 4H7.6a4 4 0 0 1-4-4v-4.6a4 4 0 0 1 4-4Zm2.4 1.5a1.2 1.2 0 1 0 0 2.4a1.2 1.2 0 1 0 0-2.4Z"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <>
      <TagMark />
      mypet
    </>
  );
}
