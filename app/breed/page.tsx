import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import breedData from '@/lib/breedKnowledge.json';
import { BreedFinder, type FinderItem } from '@/components/board/BreedFinder';
import { careProfiles } from '@/lib/care';
import { COAT_LABEL, SIZE_LABEL } from '@/lib/careProfile';
import { breedPath } from '@/lib/breedSlug';
import { SITE } from '@/lib/site';

/** 품종 안내판 목록 — 검색 유입 + 188개 품종 안내판으로 가는 허브(2026-11-19 개편: 체구·털 빠짐 거르기). */

type Breed = { breed_ko: string; species: string; size?: string };
const BREEDS = breedData as Breed[];

export const metadata: Metadata = {
  title: { absolute: '강아지·고양이 품종 188종 키우기 안내판 — 소형견·털 덜 빠지는 품종 찾기 | 마이펫' },
  description: '말티즈, 푸들, 포메라니안부터 코리안숏헤어까지 — 강아지 130종·고양이 58종. 체구와 털 빠짐으로 거르고, 품종마다 사료량·산책·미용·준비물을 안내판 한 장으로 보세요.',
  alternates: { canonical: `${SITE.url}/breed` },
};

export default function BreedIndexPage() {
  const profiles = careProfiles();
  const items: FinderItem[] = [...BREEDS]
    .sort((a, b) => a.breed_ko.localeCompare(b.breed_ko, 'ko'))
    .map((b) => {
      const p = profiles.get(b.breed_ko);
      return {
        name: b.breed_ko,
        path: breedPath(b.breed_ko),
        species: b.species as 'dog' | 'cat',
        size: p?.sizeClass ?? '',
        sizeLabel: p ? SIZE_LABEL[p.sizeClass] : (b.size ?? ''),
        coatLabel: p ? COAT_LABEL[p.coat] : '',
        shedding: p?.shedding ?? null,
      };
    });

  return (
    <main className="tz">
      <div className="tz-wrap">
        <nav className="gcrumb">
          <Link href="/">마이펫</Link> <span>›</span> 품종 안내판
        </nav>
        {/* 사진 표지(2026-11-19) — 포메라니안·웰시코기·골든리트리버·페르시안·코숏(public/pet-lineup.webp, gpt-image-2 → 배경 순백, unoptimized) */}
        <header className="pic-hero pic-hero--lineup">
          <div className="pic-hero-txt">
            <h1>품종 안내판 {BREEDS.length}종</h1>
            <p className="tz-lead">품종마다 하루 사료량·산책·빗질·미용·배변과 조심할 질환, 맞는 준비물을 한 장에 정리했어요.</p>
          </div>
          <Image
            className="pic-hero-img"
            src="/pet-lineup.webp"
            alt="포메라니안, 웰시코기, 골든리트리버, 페르시안, 코리안숏헤어가 나란히 앉아 있는 모습"
            width={1400}
            height={654}
            priority
            unoptimized
          />
        </header>
        <BreedFinder items={items} />
      </div>
    </main>
  );
}
