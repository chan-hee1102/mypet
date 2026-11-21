import type { Pick, ShopCat } from '@/lib/shop';

/** 단추 글 — 무엇을 보러 가는지(2026-11-19 사장님 → 11-22 「더 유도하게」: 「이 사료 보러 가기」). 어디로 가는지는 그림 칸 오른쪽 위 「쿠팡」과 밖으로 나가는 화살표로 밝힌다 */
const GO: Record<ShopCat, string> = { food: '이 사료 보러 가기', treat: '이 간식 보러 가기', toy: '이 장난감 보러 가기', walk: '이 용품 보러 가기', grooming: '이 용품 보러 가기', potty: '이 용품 보러 가기', home: '이 용품 보러 가기' };
import { CareIcon } from './CareIcon';

/**
 * 카드 그림이 있는 아이콘(public/shop/<아이콘>.webp, 2026-11-22) — OpenAI gpt-image-2로 3×3 격자 6장(물건 54개)을 그려 잘랐다(원본 C:/Users/mukke/mypet-img/shop).
 * 브랜드·글자 없는 일반 그림이라 특정 상품을 가리키지 않는다(링크는 쿠팡 검색 결과). 목록에 없는 아이콘은 예전처럼 선 아이콘.
 */
const ART = new Set([
  'bag', 'can', 'bowl', 'slowBowl', 'fountain', 'bone', 'chew', 'tube', 'leaf', 'nose', 'rope', 'ring', 'plush', 'ball', 'puzzle', 'wand', 'kicker', 'tunnel',
  'harness', 'leash', 'poopBag', 'tag', 'vest', 'muzzle', 'clothes', 'carrier', 'coolMat', 'brush', 'comb', 'rake', 'rubber', 'bottle', 'clipper', 'tooth', 'wipe', 'spray',
  'pad', 'tray', 'litter', 'box', 'mat', 'fence', 'stairs', 'bed', 'crate', 'cam', 'tower', 'wheel', 'hammock', 'scratcher', 'house', 'window', 'heater',
]);
/**
 * 같은 그림을 쓰는 카드끼리(사료 봉지 3장, 덴탈껌, 샴푸·귀 세정제…) 구분하는 작은 꼬리표 — 카드 이름에서 그대로 뽑는다(새 사실 없음).
 * 앞에 있는 말이 먼저 잡힌다(「대형견 퍼피 사료」 → 퍼피).
 */
const TAG_WORDS = ['퍼피', '키튼', '성견', '성묘', '노령', '체중 관리', '덴탈', '동결건조', '오래 씹는', '훈련용', '귀 세정제', '샴푸', '눈가', '주름', '일반형', '메모리폼', '벤토나이트', '두부', '입구 낮은', 'Y형', '조끼형', '스트리핑', '일자', '대형묘', '대형'];
const tagOf = (title: string) => TAG_WORDS.find((w) => title.includes(w));

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
              <span className="shop-art">
                {ART.has(p.icon) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/shop/${p.icon}.webp`} alt="" width={256} height={256} loading="lazy" decoding="async" />
                ) : (
                  <span className={`shop-ico shop-ico--${p.cat}`}>
                    <CareIcon name={p.icon} size={46} />
                  </span>
                )}
                {p.url ? <span className="shop-src">쿠팡</span> : null}
                {tagOf(p.title) ? <span className="shop-tag">{tagOf(p.title)}</span> : null}
              </span>
              <b>{p.title}</b>
              <span className="shop-pick">{p.pick}</span>
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
