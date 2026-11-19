import type { Pick, ShopCat } from '@/lib/shop';

/** 단추 글 — 「쿠팡에서 보기」 대신 무엇을 보러 가는지(2026-11-19 사장님). 어디로 가는지는 카드 오른쪽 위 「쿠팡」과 밖으로 나가는 화살표로 밝힌다 */
const GO: Record<ShopCat, string> = { food: '맞는 사료 보기', treat: '맞는 간식 보기', toy: '맞는 장난감 보기', walk: '맞는 용품 보기', grooming: '맞는 용품 보기', potty: '맞는 용품 보기', home: '맞는 용품 보기' };
import { CareIcon } from './CareIcon';

/**
 * 준비물 카드 — 쿠팡 파트너스 링크(lib/shop.ts). 그림은 우리 아이콘, 글은 「고르는 기준」(사실)만.
 * 토스식 판(2026-11-19): 시트 안의 옅은 회색 카드 3장, 휴대폰에선 옆으로 넘기는 줄.
 * ⚠️ 대가성 문구(공정위 추천·보증 심사지침, 쿠팡 파트너스 약관 제11조): 「제목 또는 첫 부분」에, 본문과 다른 색으로,
 *    링크가 있는 페이지는 제목 아래 <Disclosure />(쿠팡이 정한 문장 그대로) — 이 한 줄은 빼지 말 것(없으면 지침 위반·쿠팡 최종 승인 반려).
 *    2026-11-19 사장님 「광고 티를 덜」: 맨 위는 연두 배지 → 평범한 한 줄, 카드 묶음마다 되풀이하던 문장은 뺐다
 *    (지침이 요구하는 건 「글의 제목 또는 첫 부분」 — 묶음마다 되풀이는 docs/coupang-partners.md 5절의 보수적 해석이었다).
 *    링크는 sponsored·nofollow(검색엔진 규칙), 단추 글은 「쿠팡에서 보기」로 어디로 가는지 밝힌다.
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

export function ShopCards({ picks, label = '준비물', intro }: { picks: Pick[]; label?: string; intro?: string }) {
  if (!picks.length) return null;
  return (
    <div className="shop">
      <h3 className="shop-head">{label}</h3>
      {intro ? <p className="shop-intro">{intro}</p> : null}
      <ul className="shop-row">
        {picks.map((p) => {
          const body = (
            <>
              <span className={`shop-ico shop-ico--${p.cat}`}>
                <CareIcon name={p.icon} size={42} />
              </span>
              <b>{p.title}</b>
              <span className="shop-pick">{p.pick}</span>
              {p.url ? <span className="shop-src">쿠팡</span> : null}
              <span className="shop-go">
                {p.url ? GO[p.cat] : '링크 준비 중'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 16L16 8M10 8h6v6" />
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
