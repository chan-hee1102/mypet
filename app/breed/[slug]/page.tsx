import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import breedData from '@/lib/breedKnowledge.json';
import { CareBoard } from '@/components/board/CareBoard';
import { CareIcon, type CareIconName } from '@/components/board/CareIcon';
import { Disclosure, ShopCards } from '@/components/board/ShopCards';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd, type Faq } from '@/components/seo/SeoBits';
import { boardOf, careOf, feedOf, flagTexts, foodFacts, groomFacts, homeFacts, metersOf, pottyFacts, rulesForBreed, toyFacts, treatFacts, walkFacts, type CareRule } from '@/lib/care';
import { BRUSH_LABEL, COAT_LABEL, SIZE_LABEL, type CareNotes } from '@/lib/careProfile';
import { breedPath, breedSlugOf, slugMatches } from '@/lib/breedSlug';
import { socialMeta } from '@/lib/breedSeo';
import { fmtKg, isFeatured, type BreedRow } from '@/lib/growth';
import { hasLive, picksFor, type Pick, type ShopCat } from '@/lib/shop';
import { SITE } from '@/lib/site';

/**
 * 품종 키우기 안내판(188종) — 2026-11-19 전면 개편(사장님 「키우기 안내판 느낌으로, 이름은 마이펫 그대로, 리포트 전부 걷어내고」).
 *   ① 「한눈에」 먹색 판: 하루 사료 g·끼니·산책·빗질·미용·목욕·배변·다 큰 몸무게 + 성향 눈금 + 조심할 점
 *   ② 칸 여덟 개(사료·간식·장난감·산책·미용·배변·집·건강): 그 품종 한두 문장(lib/data/care) → 숫자 있는 사실 → 준비물 카드(쿠팡)
 *   ③ 법으로 정해진 것(동물등록·목줄 2m·맹견)은 lib/data/care-rules.json의 조문 그대로
 * 숫자는 lib/care.ts가 계산한다(사료 g은 lib/energy 열량식). 준비물은 lib/shop.ts가 체구·털·표시로 고른다.
 * 성장·사료량 전용 페이지가 있는 품종(isFeatured)은 그쪽이 「몸무게·사료량」 검색어를 맡는다 — 제목에서 사료량을 뺀다.
 */

type Breed = BreedRow & { guide?: BreedRow['guide'] & { summary?: string } };
const BREEDS = breedData as Breed[];
const findBreed = (slug: string) => BREEDS.find((b) => slugMatches(slug, b.breed_ko));

export const dynamicParams = false;
export function generateStaticParams() {
  return BREEDS.map((b) => ({ slug: breedSlugOf(b.breed_ko) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const b = findBreed(params.slug);
  if (!b) return {};
  const featured = isFeatured(b.breed_ko);
  const title = featured ? `${b.breed_ko} 키우기 — 성격·산책·미용·준비물 한눈에 | 마이펫` : `${b.breed_ko} 키우기 — 사료량·산책·미용·준비물 한눈에 | 마이펫`;
  const p = careOf(b.breed_ko);
  const feed = feedOf(b);
  const lead = p
    ? `${b.breed_ko} 하루 ${feed ? `사료 ${feed.gram}, ` : ''}${p.species === 'dog' ? '산책' : '놀이'} ${p.exerciseMin[0]}~${p.exerciseMin[1]}분, 빗질 ${BRUSH_LABEL[p.brushing]}.`
    : '';
  const description = `${lead} ${b.guide?.summary ?? ''}`.trim().slice(0, 155);
  const url = `${SITE.url}${breedPath(b.breed_ko)}`;
  return { title: { absolute: title }, description, alternates: { canonical: url }, ...socialMeta(title.replace(/ \| 마이펫$/, ''), description, url) };
}

type SecKey = keyof CareNotes;
const SECTIONS: { key: SecKey; dog: string; cat: string; icon: [CareIconName, CareIconName] }[] = [
  { key: 'food', dog: '사료', cat: '사료', icon: ['bowl', 'bowl'] },
  { key: 'treat', dog: '간식', cat: '간식', icon: ['bone', 'tube'] },
  { key: 'toy', dog: '장난감', cat: '장난감', icon: ['ball', 'wand'] },
  { key: 'walk', dog: '산책', cat: '놀이·운동', icon: ['leash', 'tower'] },
  { key: 'grooming', dog: '미용·목욕', cat: '미용·목욕', icon: ['brush', 'comb'] },
  { key: 'potty', dog: '배변', cat: '화장실', icon: ['pad', 'box'] },
  { key: 'home', dog: '집 환경', cat: '집 환경', icon: ['house', 'house'] },
  { key: 'health', dog: '건강', cat: '건강', icon: ['heart', 'heart'] },
];

function LawList({ rules }: { rules: CareRule[] }) {
  if (!rules.length) return null;
  return (
    <ul className="law">
      {rules.map((r) => (
        <li key={r.id}>
          <span className="law-ico">
            <CareIcon name={r.kind === 'law' ? 'law' : 'heart'} size={26} />
          </span>
          <div>
            <b>{r.title}</b>
            <p>
              {r.body}
              {r.penalty ? <span className="law-pen"> {r.penalty}</span> : null}
            </p>
            <a href={r.url} target="_blank" rel="noopener" className="law-ref">
              {r.ref}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Facts({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="bd-facts">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

export default function BreedPage({ params }: { params: { slug: string } }) {
  const b = findBreed(params.slug);
  if (!b) notFound();
  const p = careOf(b.breed_ko);
  const g = b.guide ?? {};
  const isDog = b.species === 'dog';
  const speciesKo = isDog ? '강아지' : '고양이';
  const featured = isFeatured(b.breed_ko);
  const url = `${SITE.url}${breedPath(b.breed_ko)}`;

  const cats: ShopCat[] = ['food', 'treat', 'toy', 'walk', 'grooming', 'potty', 'home'];
  const picks: Record<string, Pick[]> = p ? Object.fromEntries(cats.map((c) => [c, picksFor(p, c, 3)])) : {};
  const live = cats.some((c) => hasLive(picks[c] ?? []));
  const feed = feedOf(b);

  const facts: Record<SecKey, string[]> = p
    ? { food: foodFacts(b, p), treat: treatFacts(b), toy: toyFacts(p), walk: walkFacts(p), grooming: groomFacts(p), potty: pottyFacts(p), home: homeFacts(p), health: [] }
    : { food: [], treat: [], toy: [], walk: [], grooming: [], potty: [], home: [], health: [] };
  const lawFor: Partial<Record<SecKey, CareRule[]>> = p ? rulesForBreed(b.breed_ko, p) : {};

  const faq: Faq[] = [
    ...(feed && !featured ? [{ q: `${b.breed_ko} 하루 사료량은요?`, a: `다 큰 ${fmtKg(feed.weight)}kg, 중성화 기준 하루 약 ${feed.kcal}kcal — 건사료로 ${feed.gram}이에요. 사료마다 열량이 달라 포장 급여표와 같이 보세요.` }] : []),
    ...(p && isDog ? [{ q: `${b.breed_ko} 산책은 얼마나 해야 하나요?`, a: `하루 ${p.walksPerDay ? `${p.walksPerDay[0]}~${p.walksPerDay[1]}번, ` : ''}합쳐서 ${p.exerciseMin[0]}~${p.exerciseMin[1]}분이 알맞아요. ${p.notes.walk}` }] : []),
    ...(p && !isDog ? [{ q: `${b.breed_ko} 놀이는 얼마나 해 줘야 하나요?`, a: `하루 ${p.exerciseMin[0]}~${p.exerciseMin[1]}분, 몇 번으로 나눠 사냥 놀이를 해 주세요. ${p.notes.walk}` }] : []),
    ...(p ? [{ q: `${b.breed_ko} 털 관리는 어떻게 하나요?`, a: `${COAT_LABEL[p.coat]}이라 빗질은 ${BRUSH_LABEL[p.brushing]}, ${p.trimWeeks ? `미용은 ${p.trimWeeks[0]}~${p.trimWeeks[1]}주마다예요` : '커트는 필요 없어요'}. ${p.notes.grooming}` }] : []),
    ...(b.life_years ? [{ q: `${b.breed_ko} 수명은 얼마나 되나요?`, a: `기대 수명은 보통 ${b.life_years}년이에요. 정기 검진과 체중 관리가 오래 함께하는 데 가장 중요해요.` }] : []),
    ...((g.hereditary?.length ?? 0) > 0 ? [{ q: `${b.breed_ko}에게 흔한 질환은요?`, a: `${g.hereditary!.slice(0, 3).map((h) => h.name).join(', ')} 등이 자주 보고돼요. 증상이 보이기 전에 정기 검진으로 확인해 보세요.` }] : []),
  ];

  return (
    <main className="bd">
      <JsonLd
        data={[
          faqJsonLd(faq),
          breadcrumbJsonLd([
            { name: '마이펫', url: SITE.url },
            { name: '품종 안내판', url: `${SITE.url}/breed` },
            { name: b.breed_ko, url },
          ]),
        ]}
      />
      <div className="bd-wrap">
        <nav className="gcrumb">
          <Link href="/breed">품종 안내판</Link> <span>›</span> {speciesKo} <span>›</span> {b.breed_ko}
        </nav>
        <header className="bd-hero">
          <h1>{b.breed_ko} 키우기</h1>
          <p className="bd-en">
            {b.breed_en} · {speciesKo}
            {p ? ` · ${SIZE_LABEL[p.sizeClass]} · ${COAT_LABEL[p.coat]}` : ''}
          </p>
          {g.summary ? <p className="bd-lead">{g.summary}</p> : null}
          {live ? <Disclosure /> : null}
        </header>

        {p ? <CareBoard name={b.breed_ko} tiles={boardOf(b, p)} meters={metersOf(p)} flags={flagTexts(p)} /> : null}

        {featured ? (
          <nav className="bd-sub" aria-label={`${b.breed_ko} 더 보기`}>
            <Link href={breedPath(b.breed_ko, 'growth')}>개월별 몸무게 표</Link>
            <Link href={breedPath(b.breed_ko, 'food')}>개월별 사료량 표</Link>
          </nav>
        ) : null}

        {(g.traits?.length ?? 0) > 0 ? (
          <section className="bd-traits">
            <h2>이런 아이예요</h2>
            <ul>
              {g.traits!.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {p ? (
        <nav className="bd-nav" aria-label="칸 바로가기">
          <div className="bd-nav-in">
            {SECTIONS.map((s) => (
              <a key={s.key} href={`#${s.key}`}>
                {isDog ? s.dog : s.cat}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      <div className="bd-wrap">
        {p
          ? SECTIONS.map((s) => (
              <section key={s.key} id={s.key} className="bd-sec">
                <header className="bd-sec-head">
                  <span className={`bd-sec-ico shop-ico--${s.key}`}>
                    <CareIcon name={s.icon[isDog ? 0 : 1]} size={34} />
                  </span>
                  <h2>
                    {b.breed_ko} {isDog ? s.dog : s.cat}
                  </h2>
                </header>
                <p className="bd-note">{p.notes[s.key]}</p>
                <Facts items={facts[s.key]} />

                {s.key === 'food' ? (
                  featured ? (
                    <p className="bd-more">
                      개월별로 보려면 <Link href={breedPath(b.breed_ko, 'food')}>{b.breed_ko} 사료량 표</Link>와 <Link href={breedPath(b.breed_ko, 'growth')}>개월별 몸무게 표</Link>를 보세요.
                    </p>
                  ) : (
                    <p className="bd-more">
                      지금 몸무게로 계산하려면 <Link href="/tools/food">사료량 계산기</Link>를 써 보세요.
                    </p>
                  )
                ) : null}

                {s.key === 'health' ? (
                  <>
                    {(g.hereditary?.length ?? 0) > 0 ? (
                      <ul className="bdz">
                        {g.hereditary!.map((h, i) => (
                          <li key={i}>
                            <b>{h.name}</b>
                            {h.note ? <span>{h.note}</span> : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {(g.cautions?.length ?? 0) > 0 ? <Facts items={g.cautions!} /> : null}
                    <div className="bd-links">
                      <Link href={isDog ? '/guide/dog-vaccine-schedule' : '/guide/cat-vaccine-schedule'}>예방접종 시기</Link>
                      <Link href={isDog ? '/guide/dog-toxic-foods' : '/guide/cat-toxic-foods'}>먹으면 안 되는 음식</Link>
                      <Link href="/guide/pet-symptom-vet-signs">병원에 가야 하는 증상</Link>
                    </div>
                  </>
                ) : null}

                <LawList rules={lawFor[s.key] ?? []} />
                {s.key !== 'health' ? <ShopCards picks={picks[s.key] ?? []} label={`${b.breed_ko}에게 맞는 준비물`} /> : null}
              </section>
            ))
          : null}

        <FaqList items={faq} />

        <section className="bd-end">
          <h2>다른 품종도 보기</h2>
          <div className="gcta-btns">
            <Link href="/breed" className="btn btn--primary">
              품종 안내판 전체
            </Link>
            <Link href={isDog ? '/start/dog' : '/start/cat'} className="btn btn--secondary">
              처음 {isDog ? '강아지' : '고양이'}를 데려온다면
            </Link>
          </div>
        </section>

        <p className="gdisclaimer">
          {(p?.sources ?? []).map((s, i) => (
            <span key={s.url}>
              {i ? ' · ' : ''}
              <a href={s.url} target="_blank" rel="noopener">
                {s.org}
              </a>
            </span>
          ))}
          {p?.sources?.length ? ' 자료를 바탕으로 한 일반 정보예요. ' : ''}수의사의 진찰과 진료를 대신하지 않아요.
        </p>
      </div>
    </main>
  );
}
