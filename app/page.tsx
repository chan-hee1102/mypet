import Image from 'next/image';
import Link from 'next/link';
import breedData from '@/lib/breedKnowledge.json';
import { BreedSearch, type BreedLite } from '@/components/board/BreedSearch';
import { MIX_DOG, careProfiles } from '@/lib/care';
import { COAT_LABEL, SIZE_LABEL } from '@/lib/careProfile';
import { breedPath } from '@/lib/breedSlug';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';

export const metadata = {
  // 한글 이름(마이펫)과 보호자가 검색하는 말을 제목 앞쪽에(2026-09-27 · 11-19 개편)
  title: { absolute: '마이펫 | 강아지·고양이 품종별 키우기 안내판 — 사료량·산책·미용·준비물' },
  description: '강아지 130종·고양이 58종. 품종마다 하루 사료량·끼니·산책·빗질·미용·목욕·배변과 조심할 질환, 그 품종에 맞는 준비물을 한 장에 정리했어요.',
  alternates: { canonical: SITE.url },
};

/*
  첫 화면(2026-11-19 전면 개편 · 같은 날 토스식 판) — 「품종을 찾는다 → 안내판 한 장」이 전부다.
  흐름: 흰 표지(제목·신뢰 한 줄·사진·검색) → 품종을 몰라도 괜찮아요 → 인기 강아지·인기 고양이(전체 보기 따로) → 처음 데려온다면 → 더 알아보기.
  말티즈 「한눈에」 미리 보기는 2026-11-19에 뺐다 — 한눈에가 「하나씩 자세하게」로 길어져서(첫 화면의 일은 품종 찾기).
  인기 품종은 국내 등록·검색이 많은 품종을 고른 것(순서 고정). 칩은 같은 폭 격자.
*/
const POPULAR_DOGS = ['말티즈', '토이푸들', '포메라니안', '비숑프리제', '시츄', '치와와', '말티푸', '진돗개', '웰시코기(펨브로크)', '골든리트리버', '시바이누', '요크셔테리어'];
const POPULAR_CATS = ['코리안숏헤어', '러시안블루', '스코티시폴드', '페르시안', '브리티시숏헤어', '랙돌', '먼치킨', '노르웨이숲고양이'];
// 품종을 모르는 아이(길에서 데려왔거나 믹스) — 표지 바로 아래 카드 두 장과 검색 「없음」 안내가 여기로 보낸다(2026-11-19)
const MIX_CAT = '믹스/혼혈 고양이';

type Row = { breed_ko: string; species: string; aliases?: string[] };
const shortName = (n: string) => n.replace(/\s*\([^)]*\)\s*/g, '');

/**
 * 사진 카드(2026-11-19) — 흰 카드 왼쪽에 제목·화살표, 오른쪽 아래에 동물이 앉는다. 사진은 OpenAI gpt-image-2로 만든 뒤
 * 배경을 순백으로 펴 잘라 쓴다(원본 C:/Users/mukke/mypet-img/v2). unoptimized — 다시 압축하면 흰색이 254로 바뀌어 네모가 비친다.
 * 제목이 곧 설명이라 사진은 alt="" (장식).
 */
function PicCard({ href, title, img, w, h }: { href: string; title: string; img: string; w: number; h: number }) {
  return (
    <Link href={href} className="pic-card">
      <span className="pic-txt">
        <b>{title}</b>
        <span className="go" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </span>
      <Image className="pic-img" src={img} alt="" width={w} height={h} unoptimized />
    </Link>
  );
}

/** 인기 품종 칩 — 이름만(회색 보조 문구 없음, 2026-11-19). 체구·털은 품종 목록(/breed)과 검색 결과에 남아 있다 */
function Chips({ names }: { names: string[] }) {
  return (
    <ul className="chips chips--name">
      {names.map((n) => (
        <li key={n}>
          <Link href={breedPath(n)} className="chip">
            <b>{shortName(n)}</b>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const all = breedData as Row[];
  const profiles = careProfiles();
  const lite: BreedLite[] = all.map((b) => {
    const p = profiles.get(b.breed_ko);
    return { name: b.breed_ko, path: breedPath(b.breed_ko), species: b.species as 'dog' | 'cat', tag: b.breed_ko === MIX_DOG ? '체구 제각각' : p ? `${SIZE_LABEL[p.sizeClass]} · ${COAT_LABEL[p.coat]}` : '', aliases: b.aliases ?? [] };
  });
  const dogs = all.filter((b) => b.species === 'dog').length;
  const cats = all.length - dogs;
  // 더 알아보기 — 새 질문형 가이드 4편을 먼저(첫 화면 링크가 새 페이지 색인을 앞당긴다, 2026-11-19), 그다음 먹으면 안 되는 음식 2편
  const guides = ['found-stray-pet', 'neutered-food-amount', 'kibble-cup-grams', 'kitten-weight-by-week', 'dog-toxic-foods', 'cat-toxic-foods'].map((s) => GUIDES.find((x) => x.slug === s)).filter((x): x is (typeof GUIDES)[number] => !!x);

  return (
    <main className="tz">
      <div className="tz-wrap">
        <section className="hp-hero">
          {/* 표지(2026-11-19) — 처음 표지 사진 원본(말티즈·러시안블루, 베이지 배경천, OpenAI gpt-image-2 1장)을 판 전체 배경으로
              (사장님 「하얀 배경으로 하기 전 전체 이미지로」). 원본 C:/Users/mukke/mypet-img/hero-1.webp — 검색칸이 사진 안 바닥에 오도록
              바닥만 같은 색으로 늘렸다. 글은 왼쪽 빈 배경천 위, 동물 발이 검색칸 윗선에 닿는다. 휴대폰은 글 → 동물 → 검색칸, 판 색 #e2e3dc.
              next/image를 쓰지 않는다(컴퓨터·휴대폰 그림이 달라 <picture>, 재압축 불필요) */}
          <div className="hp-cover">
            <div className="hp-copy">
              <p className="hp-kicker">
                강아지 {dogs}종 · 고양이 {cats}종
              </p>
              <h1>
                강아지·고양이
                <br />
                품종별 양육 안내서
              </h1>
              {/* 신뢰 한 줄 — 품종 자료 출처(케어 데이터 sources: AKC 117·CFA 41·TICA 28·FCI 10곳)와 규칙 36개 중 22개가 인용한 동물보호법.
                  「공식」은 그 기관·법령의 자료를 꾸미는 말 — 마이펫이 공식 사이트라는 뜻으로 읽히게 쓰지 말 것 */}
              <p className="hp-trust">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z" />
                  <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
                </svg>
                AKC·FCI·CFA·TICA·동물보호법 공식 근거
              </p>
            </div>
            <div className="hp-photo">
              {/* 컴퓨터: 처음 표지 사진 원본(베이지 배경천) + 아래 바닥을 같은 색으로 200px 늘린 판(1536×1224) — 판 전체를 덮는다.
                  휴대폰: 동물만 잘라 가장자리를 판 색(#e2e3dc)으로 녹인 판 */}
              <picture>
                <source media="(max-width: 767px)" srcSet="/hero-cover-m.webp" width={560} height={552} />
                <img src="/hero-cover.webp" alt="나란히 앉은 흰 말티즈 강아지와 회색 러시안블루 고양이" width={1536} height={1224} />
              </picture>
            </div>
            <div className="hp-find">
              <BreedSearch breeds={lite} unknown={{ dog: breedPath(MIX_DOG), cat: breedPath(MIX_CAT) }} />
            </div>
          </div>
        </section>

        <section className="hp-sec hp-unk" aria-labelledby="hp-unk-t">
          <h2 id="hp-unk-t" className="hp-h">
            품종을 몰라도 괜찮아요
          </h2>
          <div className="pic-grid">
            <PicCard href={breedPath(MIX_DOG)} title="믹스견·품종 모르는 강아지" img="/pet-mixdog.webp" w={481} h={994} />
            <PicCard href={`${breedPath(MIX_CAT)}#rescue`} title="길에서 데려온 고양이" img="/pet-streetcat.webp" w={472} h={979} />
          </div>
        </section>

        {/* 인기 품종 — 강아지·고양이 시트를 나누고 「전체 보기」도 따로(품종 목록 #dog·#cat으로 바로) */}
        <section className="sheet">
          <h2 className="sheet-title">많이 찾는 강아지</h2>
          <Chips names={POPULAR_DOGS} />
          <Link href="/breed#dog" className="sheet-more">
            강아지 {dogs}종 전체 보기
          </Link>
        </section>
        <section className="sheet">
          <h2 className="sheet-title">많이 찾는 고양이</h2>
          <Chips names={POPULAR_CATS} />
          <Link href="/breed#cat" className="sheet-more">
            고양이 {cats}종 전체 보기
          </Link>
        </section>


        <section className="hp-sec" aria-labelledby="hp-start-t">
          <h2 id="hp-start-t" className="hp-h">
            처음 데려온다면
          </h2>
          <div className="pic-grid pic-grid--pair">
            <PicCard href="/start/dog" title="강아지" img="/pet-puppy.webp" w={520} h={711} />
            <PicCard href="/start/cat" title="고양이" img="/pet-kitten.webp" w={520} h={831} />
          </div>
        </section>

        <section className="sheet">
          <h2 className="sheet-title">더 알아보기</h2>
          <ul className="rows">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guide/${g.slug}`}>{g.title}</Link>
              </li>
            ))}
            <li>
              <Link href="/tools/food">사료량 계산기</Link>
            </li>
            <li>
              <Link href="/tools/adult-weight">다 큰 몸무게 계산기</Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
