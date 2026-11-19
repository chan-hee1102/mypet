import type { ReactNode } from 'react';
import type { ShopIcon } from '@/lib/shop';

/**
 * 키우기 안내판 그림 아이콘 — 준비물 카드·칸 머리에 쓴다(2026-11-19). 48칸, 먹색 선 + 연두 면 두 겹.
 * 쿠팡 상품 사진을 저장·표시하지 않으므로 카드 그림은 전부 여기서 그린다(상품이 바뀌어도 그림은 그대로).
 * 색은 CSS 변수(--ci-ink 선 · --ci-soft 면 · --ci-acc 강조)로 받아 칸마다 바꿀 수 있다.
 */

export type CareIconName = ShopIcon | 'heart' | 'paw' | 'law';

const S = 'var(--ci-soft)';
const A = 'var(--ci-acc)';

const ICONS: Record<CareIconName, ReactNode> = {
  bag: (<><path d="M13 12h22l3 7v18a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V19z" fill={S} /><path d="M10 19h28M18 12l-2 7M30 12l2 7" /><circle cx="24" cy="29" r="5.5" fill={A} /><path d="M22 28.5h.01M26 28.5h.01M24 31h.01" /></>),
  can: (<><path d="M14 14v20c0 2 4.5 3.5 10 3.5s10-1.5 10-3.5V14" fill={S} /><ellipse cx="24" cy="14" rx="10" ry="3.5" fill={A} /><path d="M14 21c0 2 4.5 3.5 10 3.5s10-1.5 10-3.5M14 28c0 2 4.5 3.5 10 3.5s10-1.5 10-3.5" /></>),
  bowl: (<><circle cx="18" cy="20" r="2.4" fill={A} /><circle cx="24" cy="18" r="2.4" fill={A} /><circle cx="30" cy="20" r="2.4" fill={A} /><path d="M7 24h34c-1 8-8 13-17 13S8 32 7 24z" fill={S} /><path d="M12 38h24" /></>),
  slowBowl: (<><path d="M7 22h34c-1 9-8 14-17 14S8 31 7 22z" fill={S} /><path d="M14 27c3-3 5 3 8 0s5 3 8 0 4 2 5 1" /><path d="M12 38h24" /></>),
  bone: (<><path d="M15 17a4.5 4.5 0 1 0-4 7 4.5 4.5 0 1 0 6 4l14-8a4.5 4.5 0 1 0 6-4 4.5 4.5 0 1 0-4-7 4.5 4.5 0 1 0-6 4l-14 8a4.5 4.5 0 0 0 2-4z" fill={S} transform="rotate(-10 24 24)" /></>),
  chew: (<><rect x="9" y="20" width="30" height="9" rx="4.5" fill={S} transform="rotate(-30 24 24)" /><path d="M17 31l-3-5M22 28l-3-5M27 25l-3-5M32 22l-3-5" /></>),
  tube: (<><path d="M18 10h12l-1 6v20a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V16z" fill={S} /><path d="M18 10l2-2 2 2 2-2 2 2 2-2 2 2" /><path d="M21 22h6M21 27h6" /><circle cx="24" cy="33" r="2" fill={A} /></>),
  nose: (<><rect x="8" y="10" width="32" height="28" rx="6" fill={S} /><circle cx="16" cy="18" r="3" fill={A} /><circle cx="24" cy="18" r="3" /><circle cx="32" cy="18" r="3" fill={A} /><circle cx="16" cy="29" r="3" /><circle cx="24" cy="29" r="3" fill={A} /><circle cx="32" cy="29" r="3" /></>),
  rope: (<><path d="M13 13c6 6 16 16 22 22" strokeWidth="5" stroke={S} /><path d="M13 13c6 6 16 16 22 22" /><circle cx="12" cy="12" r="5" fill={A} /><circle cx="36" cy="36" r="5" fill={A} /><path d="M18 20l2-2M22 24l2-2M26 28l2-2" /></>),
  ring: (<><path d="M24 7c5 0 7 4 6 8 5 1 7 5 6 10-1 6-6 9-12 9s-11-3-12-9c-1-5 1-9 6-10-1-4 1-8 6-8z" fill={S} /><ellipse cx="24" cy="12" rx="2.5" ry="1.5" fill={A} /><path d="M17 24c2 2 4 3 7 3s5-1 7-3" /><path d="M19 41h10" /></>),
  plush: (<><circle cx="15" cy="15" r="5" fill={A} /><circle cx="33" cy="15" r="5" fill={A} /><circle cx="24" cy="26" r="13" fill={S} /><path d="M19 24h.01M29 24h.01" /><path d="M21 30c2 2 4 2 6 0" /></>),
  ball: (<><circle cx="24" cy="24" r="15" fill={S} /><path d="M11 18c6 2 8 8 6 18M37 30c-6-2-8-8-6-18" /><circle cx="24" cy="24" r="15" fill="none" /></>),
  puzzle: (<><path d="M24 8l14 8v16l-14 8-14-8V16z" fill={S} /><circle cx="24" cy="18" r="2.5" fill={A} /><circle cx="17" cy="27" r="2.5" fill={A} /><circle cx="31" cy="27" r="2.5" fill={A} /></>),
  wand: (<><path d="M8 40L26 10" /><path d="M26 10c6 4 10 10 9 17" strokeDasharray="1 3.5" /><path d="M35 27c-3 1-5 5-3 8 3 2 7 0 7-4 0-2-2-4-4-4z" fill={A} /><path d="M33 30l4 4" /></>),
  kicker: (<><path d="M9 24c4-8 18-10 27-5l5-4v18l-5-4c-9 5-23 3-27-5z" fill={S} /><circle cx="16" cy="22" r="1.4" fill="var(--ci-ink)" stroke="none" /><path d="M22 18v12M28 19v10" /></>),
  tunnel: (<><path d="M14 13h20a10 11 0 0 1 0 22H14" fill={S} /><ellipse cx="14" cy="24" rx="7" ry="11" fill={A} /><ellipse cx="14" cy="24" rx="3.5" ry="6" fill="var(--ci-ink)" stroke="none" opacity=".35" /><path d="M22 13v22M29 13.5v21" /></>),
  harness: (<><path d="M12 14c4 3 8 4 12 4s8-1 12-4l3 9c-3 6-9 10-15 10S12 29 9 23z" fill={S} /><path d="M18 18l-2 15M30 18l2 15" /><circle cx="24" cy="12" r="3" fill={A} /><path d="M24 15v3" /></>),
  leash: (<><path d="M10 10c-4 4 0 10 6 8l4-2" fill="none" /><path d="M20 16c6 4 6 12 12 16" /><rect x="30" y="30" width="7" height="9" rx="2" fill={A} transform="rotate(-35 33 34)" /><circle cx="12" cy="13" r="5" fill={S} /></>),
  poopBag: (<><rect x="11" y="14" width="18" height="22" rx="9" fill={S} /><path d="M29 18h8c2 0 3 2 3 4v12" /><path d="M16 22h8M16 28h8" /><circle cx="20" cy="10" r="3" fill={A} /><path d="M20 13v1" /></>),
  tag: (<><circle cx="24" cy="10" r="3" /><path d="M24 13v3" /><path d="M14 19a4 4 0 0 1 6-2h8a4 4 0 0 1 6 2v12a4 4 0 0 1-6 3h-8a4 4 0 0 1-6-3z" fill={S} /><path d="M19 24h10M19 29h6" /></>),
  vest: (<><path d="M14 10l6 4h8l6-4 4 10-4 4v14H14V24l-4-4z" fill={S} /><path d="M17 26c2-2 4 2 7 0s4 2 7 0M17 32c2-2 4 2 7 0s4 2 7 0" stroke={A} strokeWidth="2.6" /></>),
  muzzle: (<><path d="M12 14h24c0 13-5 22-12 22S12 27 12 14z" fill={S} /><path d="M18 14v18M24 14v22M30 14v18M13 22h22M15 29h18" /><path d="M8 12c4 2 28 2 32 0" /></>),
  brush: (<><rect x="9" y="9" width="22" height="16" rx="5" fill={S} /><path d="M14 14h.01M19 14h.01M24 14h.01M14 19h.01M19 19h.01M24 19h.01" strokeWidth="2.6" /><path d="M24 25l12 13" strokeWidth="5" stroke={A} /><path d="M24 25l12 13" /></>),
  comb: (<><rect x="7" y="14" width="34" height="8" rx="3" fill={S} /><path d="M11 22v12M15 22v12M19 22v12M23 22v12M27 22v8M31 22v8M35 22v8" /></>),
  rake: (<><path d="M24 40V22" strokeWidth="5" stroke={A} /><path d="M24 40V22" /><rect x="10" y="12" width="28" height="10" rx="3" fill={S} /><path d="M13 12V7M18 12V7M23 12V7M28 12V7M33 12V7" /></>),
  rubber: (<><ellipse cx="24" cy="26" rx="15" ry="11" fill={S} /><path d="M17 23h.01M24 21h.01M31 23h.01M17 29h.01M24 29h.01M31 29h.01" strokeWidth="3" /><path d="M14 17c2-4 6-6 10-6s8 2 10 6" /></>),
  bottle: (<><path d="M17 18h14l2 4v15a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V22z" fill={S} /><path d="M21 18v-5h6v5M27 9h-8M24 9V7" /><path d="M19 28c2-2 4 2 6 0s3 1 4 0" stroke={A} strokeWidth="2.6" /></>),
  clipper: (<><path d="M14 30l14-18c2-3 6-2 6 1L22 31" fill={S} /><circle cx="15" cy="35" r="5" fill={A} /><circle cx="31" cy="35" r="5" fill={A} /><path d="M20 32l6-6" /></>),
  tooth: (<><path d="M9 33l20-20" strokeWidth="5" stroke={A} /><path d="M9 33l20-20" /><rect x="27" y="6" width="8" height="12" rx="2" fill={S} transform="rotate(45 31 12)" /><path d="M28 36h10a3 3 0 0 0 0-6H28" fill={S} /></>),
  wipe: (<><rect x="9" y="20" width="30" height="18" rx="5" fill={S} /><path d="M19 20c-1-6 3-10 7-10s6 4 5 10" fill={A} /><path d="M17 29h14" /></>),
  pad: (<><rect x="8" y="8" width="32" height="32" rx="4" fill={S} /><rect x="14" y="14" width="20" height="20" rx="3" fill={A} /><path d="M14 24h20M24 14v20" opacity=".5" /></>),
  tray: (<><rect x="7" y="13" width="34" height="24" rx="4" fill={S} /><rect x="12" y="18" width="24" height="14" rx="2" fill={A} /><path d="M12 25h24" opacity=".5" /></>),
  spray: (<><path d="M17 20h12v18a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill={S} /><path d="M19 20v-6h10l3 3M22 14V9h8" /><path d="M36 12h3M36 17h4M36 22h3" stroke={A} strokeWidth="2.6" /></>),
  fence: (<><path d="M7 16h34v20H7z" fill={S} /><path d="M7 16v20M15 16v20M24 16v20M33 16v20M41 16v20M7 22h34M7 30h34" /><path d="M7 12v4M41 12v4" /></>),
  mat: (<><rect x="7" y="12" width="34" height="24" rx="5" fill={S} /><path d="M14 19h.01M21 19h.01M28 19h.01M35 19h.01M14 29h.01M21 29h.01M28 29h.01M35 29h.01" strokeWidth="3.2" stroke={A} /></>),
  stairs: (<><path d="M8 38V30h10v-8h10v-8h12v24z" fill={S} /><path d="M8 30h10M18 22h10M28 14h12" stroke={A} strokeWidth="3" /></>),
  bed: (<><ellipse cx="24" cy="28" rx="17" ry="9" fill={S} /><ellipse cx="24" cy="26" rx="10" ry="4.5" fill={A} /><path d="M7 28v3c0 5 8 8 17 8s17-3 17-8v-3" /></>),
  coolMat: (<><rect x="7" y="16" width="34" height="20" rx="5" fill={S} /><path d="M24 19v14M18 22l12 8M30 22l-12 8" stroke="var(--ci-ink)" /><circle cx="24" cy="26" r="2" fill={A} /></>),
  crate: (<><path d="M8 18c0-5 4-8 9-8h14c5 0 9 3 9 8v20H8z" fill={S} /><rect x="15" y="20" width="18" height="18" rx="2" fill={A} /><path d="M20 20v18M24 20v18M28 20v18" /><path d="M20 10V7h8v3" /></>),
  cam: (<><path d="M12 30a12 12 0 1 1 24 0z" fill={S} /><circle cx="24" cy="24" r="5" fill={A} /><path d="M10 30h28M18 36h12M24 30v6" /></>),
  tower: (<><path d="M14 40V10M34 40V22" strokeWidth="5" stroke={A} /><path d="M14 40V10M34 40V22" /><rect x="7" y="7" width="15" height="5" rx="2" fill={S} /><rect x="22" y="18" width="18" height="5" rx="2" fill={S} /><path d="M6 40h36" /></>),
  wheel: (<><circle cx="24" cy="22" r="15" fill={S} /><circle cx="24" cy="22" r="10" fill="var(--white, #fff)" /><path d="M14 40l6-6M34 40l-6-6M10 40h28" /></>),
  hammock: (<><rect x="8" y="7" width="32" height="24" rx="3" fill={S} /><path d="M24 7v24M8 19h32" opacity=".45" /><path d="M10 31c4 8 24 8 28 0" fill={A} /><path d="M10 31l2-4M38 31l-2-4" /></>),
  litter: (<><path d="M14 10h20l4 8v18a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V18z" fill={S} /><path d="M10 18h28" /><path d="M18 27h.01M23 30h.01M28 26h.01M30 32h.01M19 33h.01" strokeWidth="3.2" stroke={A} /></>),
  box: (<><path d="M7 22h34l-3 15H10z" fill={S} /><path d="M10 22c2-4 5-4 7 0s5 4 7 0 5-4 7 0 5 4 7 0" stroke={A} strokeWidth="2.6" /><path d="M33 9l-4 11" /><rect x="31" y="6" width="7" height="5" rx="1" fill={A} transform="rotate(20 34 8)" /></>),
  scratcher: (<><path d="M24 39V9" strokeWidth="9" stroke={S} /><path d="M20 12h8M20 17h8M20 22h8M20 27h8M20 32h8" /><rect x="10" y="38" width="28" height="4" rx="2" fill={A} /><circle cx="24" cy="7" r="3" fill={A} /></>),
  fountain: (<><path d="M8 28h32c-1 7-7 11-16 11S9 35 8 28z" fill={S} /><path d="M24 28V16" /><path d="M24 16c-4 0-7 3-8 8M24 16c4 0 7 3 8 8" stroke={A} strokeWidth="2.6" /><circle cx="24" cy="13" r="2.5" fill={A} /></>),
  house: (<><path d="M8 38V24C8 15 15 9 24 9s16 6 16 15v14z" fill={S} /><path d="M18 38v-6a6 6 0 0 1 12 0v6" fill={A} /><path d="M6 38h36" /></>),
  window: (<><rect x="9" y="7" width="30" height="34" rx="2" fill={S} /><path d="M9 15h30M9 23h30M9 31h30M17 7v34M24 7v34M31 7v34" opacity=".55" /><rect x="9" y="7" width="30" height="34" rx="2" fill="none" /></>),
  heater: (<><rect x="8" y="24" width="32" height="13" rx="6" fill={S} /><path d="M17 20c-2-3 2-5 0-8M24 20c-2-3 2-5 0-8M31 20c-2-3 2-5 0-8" stroke={A} strokeWidth="2.6" /></>),
  clothes: (<><path d="M17 9l-9 6 4 7 4-2v18h16V20l4 2 4-7-9-6c-1 3-4 5-7 5s-6-2-7-5z" fill={S} /><path d="M20 27h8" stroke={A} strokeWidth="2.6" /></>),
  carrier: (<><rect x="7" y="15" width="34" height="23" rx="5" fill={S} /><rect x="14" y="20" width="14" height="13" rx="2" fill={A} /><path d="M18 20v13M22 20v13M26 20v0" /><path d="M18 15v-3a6 6 0 0 1 12 0v3" /><path d="M33 22v8" /></>),
  leaf: (<><path d="M10 38C10 20 22 9 39 9c0 17-11 29-29 29z" fill={S} /><path d="M10 38L30 18" /><path d="M18 30h6M23 25v-6" stroke={A} strokeWidth="2.6" /></>),
  heart: (<><path d="M24 39S8 30 8 18a8 8 0 0 1 16-3 8 8 0 0 1 16 3c0 12-16 21-16 21z" fill={S} /><path d="M24 20v10M19 25h10" stroke="var(--ci-ink)" /></>),
  paw: (<><ellipse cx="24" cy="31" rx="9" ry="7.5" fill={S} /><circle cx="13" cy="21" r="3.6" fill={A} /><circle cx="19.5" cy="14" r="3.6" fill={A} /><circle cx="28.5" cy="14" r="3.6" fill={A} /><circle cx="35" cy="21" r="3.6" fill={A} /></>),
  law: (<><path d="M24 7v34M12 41h24M10 13h28" /><path d="M10 13l-5 12c0 3 2.5 5 5 5s5-2 5-5zM38 13l-5 12c0 3 2.5 5 5 5s5-2 5-5z" fill={S} /><circle cx="24" cy="9" r="2.5" fill={A} /></>),
};

export function CareIcon({ name, size = 48, className }: { name: CareIconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="var(--ci-ink)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {ICONS[name]}
    </svg>
  );
}
