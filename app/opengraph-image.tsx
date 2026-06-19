import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'mypet — AI 반려동물 맞춤 케어 리포트';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PAW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="130" height="130"><g fill="#0b7d5f"><ellipse cx="6" cy="11" rx="1.6" ry="2.1"/><ellipse cx="10" cy="8.2" rx="1.7" ry="2.2"/><ellipse cx="14" cy="8.2" rx="1.7" ry="2.2"/><ellipse cx="18" cy="11" rx="1.6" ry="2.1"/><path d="M12 13.2c-2.5 0-4.3 1.9-4.3 3.7 0 1.6 1.6 2.3 4.3 2.3s4.3-.7 4.3-2.3c0-1.8-1.8-3.7-4.3-3.7Z"/></g></svg>`;

export default function Image() {
  const pawSrc = `data:image/svg+xml;base64,${btoa(PAW)}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #14ab83 0%, #0b7d5f 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 196,
            height: 196,
            borderRadius: 48,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 44,
            boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width="130" height="130" src={pawSrc} alt="" />
        </div>
        <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -3 }}>mypet</div>
        <div style={{ fontSize: 40, opacity: 0.94, marginTop: 6, letterSpacing: -1 }}>AI Pet Care Report</div>
      </div>
    ),
    { ...size },
  );
}
