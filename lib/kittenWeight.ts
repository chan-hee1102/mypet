/**
 * 아기 고양이 주령별 몸무게(출생~8주) — /guide/kitten-weight-by-week의 표 원본(2026-11-19).
 * 숫자는 원문에서 직접 확인한 것만: 1~8주는 ASPCApro 「Kitten Age & Weight Chart」(2023, PDF 글자 그대로 대조),
 * 출생은 VCA(80~120g)·iCatCare(평균 약 100g)·Merck(90~100g). 9주 이후는 수의 출처에 주 단위 표가 없어 싣지 않는다 —
 * 「주에 50~100g」(Merck)·「12주 약 3lb ≈ 1.4kg」(ASPCApro 나이 추정 안내)은 글로만.
 * ⚠️ ASPCA 자료는 All Rights Reserved — 숫자(사실)만 인용하고 표 모양·문구는 우리가 다시 짰다. 단모종 보통 체구 기준.
 */
export type KittenRow = { age: string; days: string; grams: string; src: 'ASPCApro' | 'VCA·iCatCare' };

export const KITTEN_WEIGHT: KittenRow[] = [
  { age: '갓 태어났을 때', days: '0일', grams: '80~120g (평균 약 100g)', src: 'VCA·iCatCare' },
  { age: '1주', days: '1~7일', grams: '70~190g', src: 'ASPCApro' },
  { age: '2주', days: '8~14일', grams: '205~295g', src: 'ASPCApro' },
  { age: '3주', days: '15~21일', grams: '310~400g', src: 'ASPCApro' },
  { age: '4주', days: '22~28일', grams: '415~505g', src: 'ASPCApro' },
  { age: '5주', days: '29~35일', grams: '520~610g', src: 'ASPCApro' },
  { age: '6주', days: '36~42일', grams: '625~715g', src: 'ASPCApro' },
  { age: '7주', days: '43~49일', grams: '730~820g', src: 'ASPCApro' },
  { age: '8주', days: '50~56일', grams: '835~925g', src: 'ASPCApro' },
];

export const KITTEN_SOURCES = {
  aspca: { org: 'ASPCApro', title: 'Kitten Age & Weight Chart (2023)', url: 'https://www.aspcapro.org/sites/default/files/2023-08/aspca_kittenchart_2023.pdf' },
  merck: { org: 'Merck Veterinary Manual', title: 'Feeding Practices in Small Animals — kittens', url: 'https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals/feeding-practices-in-small-animals' },
  vca: { org: 'VCA Animal Hospitals', title: 'Feeding Orphaned Kittens', url: 'https://vcahospitals.com/know-your-pet/feeding-orphaned-kittens' },
  icc: { org: 'International Cat Care', title: 'Bringing up a litter of kittens — health considerations', url: 'https://icatcare.org/articles/bringing-up-a-litter-of-kittens-health-considerations' },
  uwucd: { org: 'UW·UC Davis Shelter Medicine', title: 'Guide to Raising Unweaned Underage Kittens', url: 'https://kittencollege.org/wp-content/uploads/2025/10/Guide-to-Raising-Unweaned-Underage-Kittens-2.pdf' },
};
