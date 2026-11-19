import { ImageResponse } from 'next/og';
import { PET_GLYPH } from '@/components/Brand';

export const runtime = 'edge';
export const alt = '마이펫 — 강아지·고양이 품종별 키우기 안내판';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 표식 — components/Brand.tsx의 PET_GLYPH(반은 강아지·반은 고양이 얼굴). 바탕이 이미 먹색이라 네모 없이 얼굴만 라임으로
const TAG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><path fill="#9fe870" fill-rule="evenodd" d="${PET_GLYPH}"/></svg>`;

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
          <div style={{ fontSize: 48, letterSpacing: -1 }}>Care guide boards for 188 dog & cat breeds</div>
          <div style={{ fontSize: 30, opacity: 0.75 }}>mypet.taif.kr</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
