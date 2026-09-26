import DiagnoseForm, { type BreedOption } from '@/components/DiagnoseForm';
import breedData from '@/lib/breedKnowledge.json';

export const metadata = {
  title: '케어 리포트 만들기 — mypet',
  description: '이름, 품종, 나이, 몸무게를 알려 주시면 품종 가이드를 무료로 먼저 보여 드려요. 전체 리포트는 2,900원이에요.',
};
export const dynamic = 'force-dynamic';

/*
  품종 목록을 **데이터 순서 그대로**(많이 키우는 순) 넘긴다 — 품종 질문의 「많이 키우는 품종」이 이 순서의 앞부분이다.
  별칭(코숏·포메·말티 …)도 같이 넘겨 검색에서 찾게 한다. 이름·별칭만 넘기므로 188종이어도 몇 KB다.
*/
const BREEDS = breedData as Array<{ breed_ko: string; species: string; aliases?: string[] }>;
const pick = (sp: string): BreedOption[] =>
  BREEDS.filter((b) => b.species === sp).map((b) => ({ n: b.breed_ko, a: (b.aliases ?? []).slice(0, 6) }));
const LIST = { dog: pick('dog'), cat: pick('cat') };

export default function DiagnosePage() {
  return (
    <main className="container dx">
      <DiagnoseForm breeds={LIST} />
    </main>
  );
}
