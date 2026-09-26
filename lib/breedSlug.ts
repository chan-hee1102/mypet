/**
 * 품종 이름 ↔ 주소 조각. 「믹스/혼혈 고양이」의 슬래시는 주소를 두 칸으로 쪼개 404가 났다(2026-09-27 발견,
 * 사이트맵에 404 주소가 올라가 있었다). 슬래시는 「-」로 바꿔 한 칸으로 만든다.
 * 품종 JSON을 가져오지 않는 작은 파일이라 클라이언트 컴포넌트에서도 써도 된다.
 */
export const breedSlugOf = (name: string) => name.replace(/\//g, '-');
export const breedPath = (name: string, sub?: 'growth' | 'food') =>
  `/breed/${encodeURIComponent(breedSlugOf(name))}${sub ? `/${sub}` : ''}`;
/** 주소 조각(인코딩 여부 무관)이 이 품종을 가리키는가 */
export const slugMatches = (slug: string, name: string) => {
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    /* 이미 풀린 값 */
  }
  return breedSlugOf(name) === s;
};
