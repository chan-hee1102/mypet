import type { Metadata } from 'next';
import Link from 'next/link';
import breedData from '@/lib/breedKnowledge.json';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';

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
  const dogs = BREEDS.filter((b) => b.species === 'dog');
  const cats = BREEDS.filter((b) => b.species === 'cat');

  return (
    <main className="container container--narrow bpage">
      <section className="hero">
        <span className="eyebrow"><Icon name="shield" size={14} /> 공식 수의 자료 기반</span>
        <h1>품종별 키우기 가이드</h1>
        <p className="hero-sub">성격·수명·미용·조심할 질환까지, {BREEDS.length}개 품종을 정리했어요.</p>
      </section>

      <section className="section" style={{ marginBottom: 13 }}>
        <div className="section-head"><span className="section-ico"><Icon name="paw" size={18} /></span><h2 className="section-title">강아지 {dogs.length}종</h2></div>
        <div className="breed-links">
          {dogs.map((b) => (
            <Link key={b.breed_ko} href={`/breed/${encodeURIComponent(b.breed_ko)}`} className="breed-link">{b.breed_ko}</Link>
          ))}
        </div>
      </section>

      <section className="section" style={{ marginBottom: 13 }}>
        <div className="section-head"><span className="section-ico"><Icon name="paw" size={18} /></span><h2 className="section-title">고양이 {cats.length}종</h2></div>
        <div className="breed-links">
          {cats.map((b) => (
            <Link key={b.breed_ko} href={`/breed/${encodeURIComponent(b.breed_ko)}`} className="breed-link">{b.breed_ko}</Link>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>우리 아이 맞춤 체크는 무료</h2>
        <p>품종·나이·몸무게만 넣으면 표준 대비 판정을 바로 보여드려요.</p>
        <Link href="/diagnose" className="btn btn--white btn--lg"><Icon name="sparkle" size={17} filled /> 무료로 시작하기</Link>
      </section>
    </main>
  );
}
