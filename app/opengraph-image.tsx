import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'mypet — 반려동물 맞춤 케어 리포트';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 발바닥 표식 — components/Brand.tsx의 BrandMark와 같은 도형(바탕이 이미 먹색이라 네모 없이 발바닥만)
const TAG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="120" height="120"><g fill="#9fe870" transform="translate(0 -.6)"><ellipse cx="6" cy="11" rx="1.6" ry="2.1"/><ellipse cx="10" cy="8.2" rx="1.7" ry="2.2"/><ellipse cx="14" cy="8.2" rx="1.7" ry="2.2"/><ellipse cx="18" cy="11" rx="1.6" ry="2.1"/><path d="M12 13.2c-2.5 0-4.3 1.9-4.3 3.7 0 1.6 1.6 2.3 4.3 2.3s4.3-.7 4.3-2.3c0-1.8-1.8-3.7-4.3-3.7Z"/></g></svg>`;

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
          background: '#163300',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width="120" height="120" src={tagSrc} alt="" />
          <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -5, color: '#9fe870' }}>mypet</div>
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
