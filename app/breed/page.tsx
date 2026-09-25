import type { Metadata } from 'next';
import Link from 'next/link';
import breedData from '@/lib/breedKnowledge.json';
import { SITE } from '@/lib/site';
import BreedIndex from '@/components/BreedIndex';

/** 품종 가이드 인덱스 — 검색 유입 + 내부 링크 허브. */

type Breed = { breed_ko: string; species: string };
const BREEDS = breedData as Breed[];

export const metadata: Metadata = {
  title: '품종별 키우기 가이드 188종 — 성격·수명·조심할 질환 | mypet',
  description:
    '말티즈, 푸들, 폼피츠부터 코리안숏헤어까지 — 강아지·고양이 188개 품종의 성격, 수명, 미용, 조심할 질환을 공식 수의 자료 기반으로 정리했어요.',
  alternates: { canonical: `${SITE.url}/breed` },
};

export default function BreedIndexPage() {
  const byName = (a: Breed, b: Breed) => a.breed_ko.localeCompare(b.breed_ko, 'ko');
  const dogs = BREEDS.filter((b) => b.species === 'dog').sort(byName);
  const cats = BREEDS.filter((b) => b.species === 'cat').sort(byName);

  return (
    <main className="container guide breed-index">
      <nav className="gcrumb"><Link href="/">처음</Link> <span>›</span> 품종 가이드</nav>
      <h1 className="gtitle">품종별 키우기 가이드</h1>
      <p className="gquestion">
        {BREEDS.length}개 품종의 성격, 표준 체중과 수명, 미용, 자주 보고되는 질환을 AKC·FCI·TICA 같은 공식 자료로 정리했어요.
      </p>

      <BreedIndex dogs={dogs.map((b) => b.breed_ko)} cats={cats.map((b) => b.breed_ko)} />

      <section className="gcta">
        <h2>우리 아이 체중이 표준 범위 안인지 확인해 보세요</h2>
        <p>품종, 나이, 체중을 적으면 품종 표준과 비교한 결과를 무료로 바로 보여 드려요.</p>
        <div className="gcta-btns">
          <Link href="/diagnose" className="btn btn--primary btn--lg">무료 가이드 보기</Link>
        </div>
      </section>
    </main>
  );
}
