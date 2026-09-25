import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'mypet — 반려동물 맞춤 케어 리포트';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 인식표 표식 — components/Brand.tsx의 TagMark와 같은 도형
const TAG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="120" height="120"><circle cx="10" cy="5.9" r="2.2" fill="none" stroke="#ffffff" stroke-width="1.5"/><path fill="#ffffff" fill-rule="evenodd" d="M7.6 6.6h4.8a4 4 0 0 1 4 4v4.6a4 4 0 0 1-4 4H7.6a4 4 0 0 1-4-4v-4.6a4 4 0 0 1 4-4Zm2.4 1.5a1.2 1.2 0 1 0 0 2.4a1.2 1.2 0 1 0 0-2.4Z"/></svg>`;

/*
  ⚠️ 엣지 런타임 기본 서체에는 한글이 없어서, 한글을 쓰면 네모(□)로 나온다.
     그래서 이미지 안의 글자는 영문만 쓴다. 한글 설명은 alt와 메타 설명이 맡는다.
*/
export default function Image() {
  const tagSrc = `data:image/svg+xml;base64,${btoa(TAG)}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#155e4d',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width="120" height="120" src={tagSrc} alt="" />
          <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -5 }}>mypet</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 48, letterSpacing: -1 }}>Pet care report by breed, age and weight</div>
          <div style={{ fontSize: 30, opacity: 0.75 }}>mypet.taif.kr</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
