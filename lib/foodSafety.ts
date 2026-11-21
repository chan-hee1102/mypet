/**
 * 「강아지·고양이 OO 먹어도 되나요?」 음식별 페이지 데이터(2026-11-22 사장님 「AI로 직접 서치해서 정보 더 추가」).
 * 자료: lib/data/food-safety.json — ASPCA·AKC·VCA·Merck Veterinary Manual·Pet Poison Helpline·International Cat Care 원문을 열어 확인한 것만.
 *   출처가 그 종(개/고양이)을 직접 말하지 않으면 그 종의 verdict는 null → 그 종 페이지는 만들지 않는다(추측 금지).
 * ⚠️ 먹었을 때 집에서 토하게 하라는 말은 쓰지 않는다(흡인 위험 — 독성 음식 가이드와 같은 원칙). 「바로 동물병원에 연락」.
 * 검색 노출은 네이버·빙만(lib/searchScope).
 */
import data from './data/food-safety.json';
import type { Sp } from './seoPages';

export type Verdict = 'no' | 'caution' | 'ok';
export type FoodSide = { verdict: Verdict | null; answer: string; why: string; symptoms: string[]; howTo: string; ifEaten: string };
export type FoodItem = {
  slug: string;
  name: string;
  aliases: string[];
  dog: FoodSide;
  cat: FoodSide;
  sources: { org: string; title: string; url: string; supports?: string }[];
};

export const FOODS = data as FoodItem[];
export const findFood = (slug: string) => FOODS.find((f) => f.slug === slug);
/** 이 종 페이지가 있는 음식(그 종 verdict가 확인된 것만) */
export const foodsFor = (s: Sp) => FOODS.filter((f) => f[s].verdict);
export const foodPath = (s: Sp, slug: string) => `/can-eat/${s}/${slug}`;

export const VERDICT: Record<Verdict, { word: string; short: string; cls: string }> = {
  no: { word: '먹으면 안 돼요', short: '안 돼요', cls: 'vd vd--no' },
  caution: { word: '조심해서 아주 조금만', short: '조심', cls: 'vd vd--caution' },
  ok: { word: '조금은 괜찮아요', short: '괜찮아요', cls: 'vd vd--ok' },
};
/** 목록 순서 — 위험한 것부터 */
export const VERDICT_ORDER: Verdict[] = ['no', 'caution', 'ok'];
