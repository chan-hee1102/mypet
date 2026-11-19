import Link from 'next/link';
import breedData from '@/lib/breedKnowledge.json';
import { CareBoard } from '@/components/board/CareBoard';
import { CareIcon } from '@/components/board/CareIcon';
import { BreedSearch, type BreedLite } from '@/components/board/BreedSearch';
import { boardOf, careOf, careProfiles, flagTexts, metersOf } from '@/lib/care';
import { COAT_LABEL, SIZE_LABEL } from '@/lib/careProfile';
import { breedPath } from '@/lib/breedSlug';
import { GUIDES } from '@/lib/guides';
import { findBreed } from '@/lib/growth';
import { SITE } from '@/lib/site';

export const metadata = {
  // 한글 이름(마이펫)과 보호자가 검색하는 말을 제목 앞쪽에(2026-09-27 · 11-19 개편)
  title: { absolute: '마이펫 | 강아지·고양이 품종별 키우기 안내판 — 사료량·산책·미용·준비물' },
  description: '강아지 130종·고양이 58종. 품종마다 하루 사료량·끼니·산책·빗질·미용·목욕·배변과 조심할 질환, 그 품종에 맞는 준비물을 한 장에 정리했어요.',
  alternates: { canonical: SITE.url },
};

/*
  첫 화면(2026-11-19 전면 개편 · 같은 날 토스식 판) — 「품종을 찾는다 → 안내판 한 장」이 전부다.
  흐름: 큰 제목 + 품종 찾기 → 인기 품종 시트(강아지·고양이) → 실제 말티즈 「한눈에」 시트(예시가 곧 제품) → 처음 데려온다면 → 더 알아보기.
  인기 품종은 국내 등록·검색이 많은 품종을 고른 것(순서 고정). 칩은 같은 폭 격자.
*/
const POPULAR_DOGS = ['말티즈', '토이푸들', '포메라니안', '비숑프리제', '시츄', '치와와', '말티푸', '진돗개', '웰시코기(펨브로크)', '골든리트리버', '시바이누', '요크셔테리어'];
const POPULAR_CATS = ['코리안숏헤어', '러시안블루', '스코티시폴드', '페르시안', '브리티시숏헤어', '랙돌', '먼치킨', '노르웨이숲고양이'];
const EXAMPLE = '말티즈';

type Row = { breed_ko: string; species: string; aliases?: string[] };
const shortName = (n: string) => n.replace(/\s*\([^)]*\)\s*/g, '');

function Chips({ names }: { names: string[] }) {
  return (
    <ul className="chips">
      {names.map((n) => {
        const p = careOf(n);
        return (
          <li key={n}>
            <Link href={breedPath(n)} className="chip">
              <b>{shortName(n)}</b>
              <span>{p ? `${SIZE_LABEL[p.sizeClass]} · ${COAT_LABEL[p.coat]}` : '안내판 보기'}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Home() {
  const all = breedData as Row[];
  const profiles = careProfiles();
  const lite: BreedLite[] = all.map((b) => {
    const p = profiles.get(b.breed_ko);
    return { name: b.breed_ko, path: breedPath(b.breed_ko), species: b.species as 'dog' | 'cat', tag: p ? `${SIZE_LABEL[p.sizeClass]} · ${COAT_LABEL[p.coat]}` : '', aliases: b.aliases ?? [] };
  });
  const dogs = all.filter((b) => b.species === 'dog').length;
  const cats = all.length - dogs;
  const ex = findBreed(EXAMPLE);
  const exP = careOf(EXAMPLE);
  const guides = GUIDES.slice(0, 6);

  return (
    <main className="tz">
      <div className="tz-wrap">
        <section className="hp-hero">
          <p className="hp-kicker">
            강아지 {dogs}종 · 고양이 {cats}종
          </p>
          <h1>
            우리 아이 품종으로 보는
            <br />
            키우기 안내판
          </h1>
          <p className="hp-sub">하루 사료량부터 산책·미용·배변, 그 품종에 맞는 준비물까지 한 장에 모았어요.</p>
          <BreedSearch breeds={lite} />
        </section>

        <section className="sheet">
          <h2 className="sheet-title">많이 찾는 강아지</h2>
          <Chips names={POPULAR_DOGS} />
          <h2 className="sheet-title" style={{ marginTop: 26 }}>
            많이 찾는 고양이
          </h2>
          <Chips names={POPULAR_CATS} />
          <Link href="/breed" className="sheet-more">
            188종 전체 보기
          </Link>
        </section>

        {ex && exP ? (
          <>
            <p className="tz-lead" style={{ margin: '28px 6px 0' }}>
              안내판 한 장엔 이런 게 있어요 — 예를 들어 {EXAMPLE}라면
            </p>
            <CareBoard name={EXAMPLE} tiles={boardOf(ex, exP).map((t) => ({ ...t, href: `${breedPath(EXAMPLE)}${t.href}` }))} meters={metersOf(exP)} flags={flagTexts(exP)} />
            <Link href={breedPath(EXAMPLE)} className="row-link" style={{ marginTop: 12 }}>
              {EXAMPLE} 안내판 전체 보기
            </Link>
          </>
        ) : null}

        <div className="start-grid" style={{ marginTop: 28 }}>
          <Link href="/start/dog" className="start-card shop-ico--food">
            <span className="start-ico">
              <CareIcon name="harness" size={40} />
            </span>
            <span>
              <b>강아지를 처음 데려온다면</b>
              <span>준비물 · 첫 주 · 동물등록</span>
            </span>
          </Link>
          <Link href="/start/cat" className="start-card shop-ico--home">
            <span className="start-ico">
              <CareIcon name="box" size={40} />
            </span>
            <span>
              <b>고양이를 처음 데려온다면</b>
              <span>준비물 · 첫 주 · 화장실</span>
            </span>
          </Link>
        </div>

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
