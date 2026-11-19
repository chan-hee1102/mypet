import type { Pick } from '@/lib/shop';
import { CareIcon } from './CareIcon';

/**
 * 준비물 카드 — 쿠팡 파트너스 링크(lib/shop.ts). 그림은 우리 아이콘, 글은 「고르는 기준」(사실)만.
 * 토스식 판(2026-11-19): 시트 안의 옅은 회색 카드 3장, 휴대폰에선 옆으로 넘기는 줄.
 * ⚠️ 대가성 문구(공정위 추천·보증 심사지침, 쿠팡 파트너스 약관 제11조): 「제목 또는 첫 부분」에, 본문과 다른 색으로,
 *    「추천할 때마다」 — 그래서 링크가 있는 페이지는 제목 아래 <Disclosure />, 카드 묶음마다 같은 문장을 한 번 더 낸다
 *    (docs/coupang-partners.md 5절). 쿠팡이 정한 문장을 글자 그대로 쓴다. 링크는 sponsored·nofollow(검색엔진 규칙).
 * 클릭은 data-track 「쿠팡:카드 id」로 방문 기록에 남는다(components/VisitTracker) — 관리자 「쿠팡 링크」 탭이 센다.
 */

export const DISCLOSURE = '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

export function Disclosure() {
  return (
    <p className="disclose" role="note">
      {DISCLOSURE}
    </p>
  );
}

export function ShopCards({ picks, label = '준비물' }: { picks: Pick[]; label?: string }) {
  if (!picks.length) return null;
  const live = picks.some((p) => p.url);
  return (
    <div className="shop">
      <h3 className="shop-head">{label}</h3>
      {live ? <p className="shop-disc">{DISCLOSURE}</p> : null}
      <ul className="shop-row">
        {picks.map((p) => {
          const body = (
            <>
              <span className={`shop-ico shop-ico--${p.cat}`}>
                <CareIcon name={p.icon} size={42} />
              </span>
              <b>{p.title}</b>
              <span className="shop-pick">{p.pick}</span>
              <span className="shop-go">
                {p.url ? '쿠팡에서 보기' : '링크 준비 중'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </>
          );
          return (
            <li key={p.id}>
              {p.url ? (
                <a className="shop-card" href={p.url} target="_blank" rel="sponsored nofollow noopener" data-track={`쿠팡:${p.id}`}>
                  {body}
                </a>
              ) : (
                <div className="shop-card shop-card--empty" title={`검색어: ${p.q}`}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
