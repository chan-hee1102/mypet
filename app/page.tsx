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
  첫 화면(2026-11-19 전면 개편) — 「품종을 찾는다 → 안내판 한 장」이 전부다.
  흐름: 큰 제목 + 품종 찾기 + 인기 품종 칩 → 실제 말티즈 「한눈에」 판(예시가 곧 제품) → 처음 데려온다면 → 정보 가이드·계산기.
  인기 품종은 국내 등록·검색이 많은 품종을 고른 것(순서 고정). 칩은 같은 폭 격자.
*/
const POPULAR_DOGS = ['말티즈', '토이푸들', '포메라니안', '비숑프리제', '시츄', '치와와', '말티푸', '진돗개', '웰시코기(펨브로크)', '골든리트리버', '시바이누', '요크셔테리어'];
const POPULAR_CATS = ['코리안숏헤어', '러시안블루', '스코티시폴드', '페르시안', '브리티시숏헤어', '랙돌', '먼치킨', '노르웨이숲고양이'];
const EXAMPLE = '말티즈';

type Row = { breed_ko: string; species: string; aliases?: string[] };
const shortName = (n: string) => n.replace(/\s*\([^)]*\)\s*/g, '');

function Chips({ names }: { names: string[] }) {
  return (
    <ul className="hp-chips">
      {names.map((n) => {
        const p = careOf(n);
        return (
          <li key={n}>
            <Link href={breedPath(n)} className="hp-chip">
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
    <main className="hp">
      <section className="hp-hero">
        <div className="bd-wrap">
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
          <h2 className="hp-h3">많이 찾는 강아지</h2>
          <Chips names={POPULAR_DOGS} />
          <h2 className="hp-h3">많이 찾는 고양이</h2>
          <Chips names={POPULAR_CATS} />
          <p className="hp-all">
            <Link href="/breed">188종 전체 보기</Link>
          </p>
        </div>
      </section>

      {ex && exP ? (
        <section className="hp-example">
          <div className="bd-wrap">
            <h2 className="hp-h2">안내판 한 장엔 이런 게 있어요</h2>
            <p className="hp-lead">예를 들어 {EXAMPLE}라면 — 숫자 칸을 누르면 그 칸의 자세한 설명으로 가요.</p>
            <CareBoard name={EXAMPLE} tiles={boardOf(ex, exP).map((t) => ({ ...t, href: `${breedPath(EXAMPLE)}${t.href}` }))} meters={metersOf(exP)} flags={flagTexts(exP)} />
            <Link href={breedPath(EXAMPLE)} className="btn btn--primary btn--lg hp-ex-btn">
              {EXAMPLE} 안내판 전체 보기
            </Link>
          </div>
        </section>
      ) : null}

      <section className="hp-start">
        <div className="bd-wrap">
          <h2 className="hp-h2">처음 데려온다면</h2>
          <p className="hp-lead">첫날 필요한 것, 첫 주에 할 일, 병원·등록까지 순서대로 정리했어요.</p>
          <div className="hp-start-grid">
            <Link href="/start/dog" className="hp-start-card shop-ico--food">
              <span className="hp-start-ico">
                <CareIcon name="harness" size={56} />
              </span>
              <b>강아지를 처음 데려온다면</b>
              <span>준비물 · 첫 주 · 동물등록</span>
            </Link>
            <Link href="/start/cat" className="hp-start-card shop-ico--home">
              <span className="hp-start-ico">
                <CareIcon name="box" size={56} />
              </span>
              <b>고양이를 처음 데려온다면</b>
              <span>준비물 · 첫 주 · 화장실</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="hp-more">
        <div className="bd-wrap">
          <h2 className="hp-h2">더 알아보기</h2>
          <ul className="hp-links">
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
        </div>
      </section>
    </main>
  );
}
