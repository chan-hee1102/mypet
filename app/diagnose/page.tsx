import DiagnoseForm from '@/components/DiagnoseForm';
import breedData from '@/lib/breedKnowledge.json';

export const metadata = {
  title: '케어 리포트 만들기 — mypet',
  description: '이름, 품종, 나이, 체중을 적으면 품종 가이드를 무료로 먼저 보여 드려요. 리포트는 2,900원이에요.',
};
export const dynamic = 'force-dynamic';

/*
  품종 이름 목록을 입력칸 자동완성(datalist)에 넣는다.
  자유 입력만 받던 때는 「포메」 「말티」처럼 줄여 쓰거나 오타가 나면 품종을 못 찾고
  일반 기준으로 떨어졌다. 이름만 넘기므로 188종이어도 몇 KB다(본문 데이터는 넘기지 않는다).
*/
const BREEDS = breedData as Array<{ breed_ko: string; species: string }>;
const NAMES = {
  dog: BREEDS.filter((b) => b.species === 'dog').map((b) => b.breed_ko).sort((a, b) => a.localeCompare(b, 'ko')),
  cat: BREEDS.filter((b) => b.species === 'cat').map((b) => b.breed_ko).sort((a, b) => a.localeCompare(b, 'ko')),
};

export default function DiagnosePage() {
  return (
    <main className="container dx">
      <DiagnoseForm breedNames={NAMES} />
    </main>
  );
}
