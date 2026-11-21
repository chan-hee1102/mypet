import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import breedData from '@/lib/breedKnowledge.json';
import { BreedPhoto, KeyLine, Profile, Step } from '@/components/board/BreedStory';
import { CareIcon, type CareIconName } from '@/components/board/CareIcon';
import { Disclosure, ShopCards } from '@/components/board/ShopCards';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd, type Faq } from '@/components/seo/SeoBits';
import type { ReactNode } from 'react';
import { answerOf, careOf, feedOf, flagTexts, keyOf, metersOf, mixSizesOf, rescueOf, rulesForBreed, shopIntro, sourcesOf, type CareRule, type MixSize } from '@/lib/care';
import { breedImageOf } from '@/lib/breedImage';
import { josa } from '@/lib/josa';
import { BRUSH_LABEL, COAT_LABEL, SIZE_LABEL, type CareNotes, type CareProfile } from '@/lib/careProfile';
import { breedPath, breedSlugOf, slugMatches } from '@/lib/breedSlug';
import { ORG_REF, socialMeta, UPDATED } from '@/lib/breedSeo';
import { fmtKg, isFeatured, type BreedRow } from '@/lib/growth';
import { hasLive, picksFor, type Pick, type ShopCat } from '@/lib/shop';
import { SITE } from '@/lib/site';

/**
 * 품종 키우기 안내판(188종) — 2026-11-19 전면 개편(사장님 「키우기 안내판 느낌으로, 이름은 마이펫 그대로, 리포트 전부 걷어내고」).
 * 2026-11-19 순서형 개편(사장님 「카드가 한곳에 몰려 있고 누르면 빠진다 → 사진·소개 다음 1번 사료, 2번 산책… 설명과 같이, 준비물은 자연스럽게, 밑에 근거」):
 *   ① 맨 위: 제목·소개 + 품종 사진(위키미디어 자유 라이선스, lib/breedImage) + 대가성 문구 한 줄
 *   ② 「이런 아이예요」: 성격 + 성향 눈금 + 조심할 점(옛 「한눈에」 판의 눈금·표시를 옮김. 숫자 카드 묶음과 칸 바로가기 줄은 뺐다)
 *   ③ 번호 칸 여덟 개(사료·간식·산책/놀이·장난감·털 관리·배변/화장실·집·건강): 핵심 한 줄(lib/care keyOf) → 그 품종 한두 문장(notes)
 *      → 사실 → 「○○에게 맞는 …」 소개 문장(shopIntro) + 준비물 카드(쿠팡) → 근거(sourcesOf)
 *   ④ 법으로 정해진 것(동물등록·목줄 2m·맹견)은 lib/data/care-rules.json의 조문 그대로
 * 숫자는 lib/care.ts가 계산한다(사료 g은 lib/energy 열량식). 준비물은 lib/shop.ts가 체구·털·표시로 고른다.
 * 성장·사료량 전용 페이지가 있는 품종(isFeatured)은 그쪽이 「몸무게·사료량」 검색어를 맡는다 — 제목에서 사료량을 뺀다.
 */

/** 160자 안에서 문장 끝(요.)으로 자른다 */
const cutAt = (t: string, n: number) => (t.length <= n ? t : t.slice(0, t.lastIndexOf('.', n) + 1) || t.slice(0, n));

/** 「2.0–3.5」 → 「2~3.5」, 괄호 설명(「미니어처/스탠다드에 따라 차이」)은 뗀다 — 숫자 칸이 넘치지 않게 */
const tidyRange = (r: string) => r.replace(/\s*\([^)]*\)\s*/g, '').replace(/\.0(?=\D|$)/g, '').replace(/\s*[–-]\s*/, '~').trim();

type Breed = BreedRow & { guide?: BreedRow['guide'] & { summary?: string } };
const BREEDS = breedData as Breed[];
const findBreed = (slug: string) => BREEDS.find((b) => slugMatches(slug, b.breed_ko));

// 운영은 false — 목록(188종)에 없는 주소를 라우팅 단계에서 진짜 404로 막는다. true면 app/loading.tsx 스트리밍이 먼저 200을 보내
// notFound() 화면이 200으로 나가고 1년 캐시까지 된다(소프트 404, 2026-11-19 운영 빌드로 확인).
// 개발(next dev)만 true — Next 14 dev는 한글 주소를 인코딩된 채로 목록과 비교해 false면 모든 품종이 404가 된다.
export const dynamicParams = process.env.NODE_ENV === 'development';
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
  const mix = p ? mixSizesOf(b, p) : null;
  const lead = mix
    ? `${b.breed_ko} 하루 사료·산책을 체구별로 — ${mix.map((v) => `${v.label} ${feedOf(v.b)?.gram ?? ''}·${v.p.exerciseMin[0]}~${v.p.exerciseMin[1]}분`).join(', ')}.`
    : p
      ? `${b.breed_ko} 하루 ${feed ? `사료 ${feed.gram}, ` : ''}${p.species === 'dog' ? '산책' : '놀이'} ${p.exerciseMin[0]}~${p.exerciseMin[1]}분, 빗질 ${BRUSH_LABEL[p.brushing]}.`
      : '';
  // 검색 결과 설명 = 숫자 한 문단(lib/care answerOf — 화면 카드와 같은 숫자, 화면엔 안 낸다). 믹스견은 체구별 줄
  const answer = p && !mix ? answerOf(b, p) : '';
  const description = answer ? cutAt(answer, 160) : `${lead} ${b.guide?.summary ?? ''}`.trim().slice(0, 155);
  const url = `${SITE.url}${breedPath(b.breed_ko)}`;
  const social = socialMeta(title.replace(/ \| 마이펫$/, ''), description, url);
  // 공유 미리보기 그림 = 품종 사진(있으면). lib/breedSeo socialMeta는 그대로 두고 그림만 덮어쓴다(검색 작업 세션 kostock-4c와 나눈 경계)
  const img = breedImageOf(b.breed_ko);
  if (img) {
    const pic = { url: `${SITE.url}${img.src}`, width: img.w, height: img.h, alt: `${b.breed_ko} 사진` };
    social.openGraph = { ...social.openGraph, images: [pic] };
    social.twitter = { ...social.twitter, images: [pic.url] };
  }
  return { title: { absolute: title }, description, alternates: { canonical: url }, ...social };
}

type SecKey = keyof CareNotes;
/** 번호 칸 순서 — 사료 → 간식 → 산책(고양이는 놀이) → 장난감 → 털 관리 → 배변(화장실) → 집 → 건강 */
const SECTIONS: { key: SecKey; dog: string; cat: string; icon: [CareIconName, CareIconName]; shop: [string, string] }[] = [
  { key: 'food', dog: '사료', cat: '사료', icon: ['bowl', 'bowl'], shop: ['사료', '사료'] },
  { key: 'treat', dog: '간식', cat: '간식', icon: ['bone', 'tube'], shop: ['간식', '간식'] },
  { key: 'walk', dog: '산책', cat: '놀이', icon: ['leash', 'wand'], shop: ['산책 준비물', '놀이 준비물'] },
  { key: 'toy', dog: '장난감', cat: '장난감', icon: ['ball', 'kicker'], shop: ['장난감', '장난감'] },
  { key: 'grooming', dog: '털 관리', cat: '털 관리', icon: ['brush', 'comb'], shop: ['털 관리 용품', '털 관리 용품'] },
  { key: 'potty', dog: '배변', cat: '화장실', icon: ['pad', 'litter'], shop: ['배변 용품', '화장실 용품'] },
  { key: 'home', dog: '집 환경', cat: '집 환경', icon: ['bed', 'house'], shop: ['집에 두면 좋은 것', '집에 두면 좋은 것'] },
  { key: 'health', dog: '건강', cat: '건강', icon: ['heart', 'heart'], shop: ['', ''] },
];

/** 법으로 정해진 것 — 조문 글은 그대로, 순서형 흐름을 끊지 않게 접어 둔다(제목 줄에 몇 가지인지·과태료가 있는지) */
function LawList({ rules }: { rules: CareRule[] }) {
  if (!rules.length) return null;
  const laws = rules.filter((r) => r.kind === 'law').length;
  return (
    <details className="law-fold">
      <summary>
        {laws ? `법으로 정해진 것 ${laws}가지` : `수의 지침 ${rules.length}가지`}
        {laws && rules.length > laws ? `와 수의 지침 ${rules.length - laws}가지` : ''}
      </summary>
      <LawItems rules={rules} />
    </details>
  );
}

function LawItems({ rules }: { rules: CareRule[] }) {
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
    <ul className="checks sec-facts">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

/** 「길에서 데려왔다면」 — 상황 이름(when) + 법 조문·수의 지침 카드(lib/care rescueOf). 홈 카드·처음 데려온다면이 #rescue로 보낸다 */
function RescueSection({ items }: { items: { when: string; rule: CareRule }[] }) {
  return (
    <section id="rescue" className="sheet sec">
      <header className="sec-head">
        <span className="sec-ico shop-ico--potty">
          <CareIcon name="carrier" size={30} />
        </span>
        <h2>길에서 데려왔다면</h2>
      </header>
      <ul className="law rescue">
        {items.map(({ when, rule: r }) => (
          <li key={r.id}>
            <span className="law-ico">
              <CareIcon name={r.kind === 'law' ? 'law' : 'heart'} size={26} />
            </span>
            <div>
              <span className="rs-when">{when}</span>
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
    </section>
  );
}

/** 믹스견 체구 고르기 — 라디오 단추만(자바스크립트 없음). 고른 값에 따라 board.css가 data-v 블록을 하나만 보여 준다 */
function MixPicker({ mix }: { mix: MixSize[] }) {
  return (
    <section className="sheet mix-pick" aria-labelledby="mix-pick-t">
      <h2 id="mix-pick-t" className="sheet-title">
        우리 아이 체구는?
      </h2>
      <div className="mix-opts" role="radiogroup" aria-labelledby="mix-pick-t">
        {mix.map((v) => (
          <label key={v.key} className="mix-opt">
            <input type="radio" name="mix-size" value={v.key} defaultChecked={v.key === 'medium'} />
            <span>
              <b>{v.label}</b>
              <small>{v.range}</small>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

/** 믹스견이면 체구마다 다른 것만 세 벌(data-v)로, 세 벌이 똑같으면 한 번만 그린다. 믹스견이 아니면 base 그대로 */
function bySize<T>(mix: MixSize[] | null, vals: T[] | undefined, base: T, render: (x: T) => ReactNode): ReactNode {
  if (!mix || !vals) return render(base);
  if (vals.every((x) => JSON.stringify(x) === JSON.stringify(vals[0]))) return render(vals[0]);
  return mix.map((v, i) => (
    <div key={v.key} data-v={v.key}>
      {render(vals[i])}
    </div>
  ));
}

/**
 * 쿠팡 카드 묶음 제목(2026-11-22 사장님 「말티즈가 먹으면 좋은 사료 보기처럼 유도」) — 품종 이름이 들어간 권하는 말.
 * ⚠️ 「먹으면 좋은」은 건강 효과처럼 읽혀(표시광고법·추천보증 심사지침) 「먹기 좋은」(알갱이 크기 — 바로 아래 소개 문장의 사실)으로 쓴다.
 *    효능(좋아요·예방·개선)을 말하지 않는다. 나머지 칸은 쓰임만 말한다.
 */
function shopHeading(key: SecKey, name: string, shopLabel: string, isDog: boolean): string {
  switch (key) {
    case 'food':
      return `${josa(name, '이/가')} 먹기 좋은 사료`;
    case 'treat':
      return `${name}에게 주기 좋은 간식`;
    case 'toy':
      return `${josa(name, '이/가')} 갖고 놀 장난감`;
    case 'walk':
      return isDog ? `${name} 산책 준비물` : `${name} 놀이 준비물`;
    case 'grooming':
      return `${name} 털 관리 용품`;
    case 'potty':
      return isDog ? `${name} 배변 용품` : `${name} 화장실 용품`;
    default:
      return key === 'home' ? `${name} 집 환경 준비물` : `${name}에게 맞는 ${shopLabel}`;
  }
}

/**
 * 준비물 소개가 바로 위 요약(그 품종 한두 문장)과 거의 같은 말이면 빼기(2026-11-22 — 집 환경 칸에서 같은 문장이 두 번 나왔다).
 * 소개 문장 낱말의 60% 이상이 요약에 이미 있으면 같은 말로 본다.
 */
function unlessSaid(said: string | undefined, intro: string): string | undefined {
  if (!said) return intro;
  const words = intro.replace(/[.,·—「」]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return intro;
  const hit = words.filter((w) => said.includes(w)).length;
  return hit / words.length >= 0.6 ? undefined : intro;
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
  const picksOf = (pp: CareProfile): Record<string, Pick[]> => Object.fromEntries(cats.map((c) => [c, picksFor(pp, c, 3)]));
  // 믹스견은 체구 세 벌(소형·중형·대형) — 숫자·준비물이 체구마다 다르다(lib/care mixSizesOf)
  const mix = p ? mixSizesOf(b, p) : null;
  const picks: Record<string, Pick[]> = p ? picksOf(p) : {};
  const mixPicks = mix?.map((v) => picksOf(v.p));
  const live = [picks, ...(mixPicks ?? [])].some((pk) => cats.some((c) => hasLive(pk[c] ?? [])));
  const feed = feedOf(b);

  const lawFor: Partial<Record<SecKey, CareRule[]>> = p ? rulesForBreed(b.breed_ko, p) : {};
  const rescue = rescueOf(b.breed_ko, isDog ? 'dog' : 'cat');
  const img = breedImageOf(b.breed_ko);
  // 맨 위 소개 = 성격 첫 문장(프로필의 「자세히 보기」엔 나머지만). 성격 문장이 없는 품종은 요약 문장
  const intro = g.traits?.[0] ?? g.summary ?? '';
  const restTraits = g.traits?.length ? g.traits.slice(1) : [];
  // Article 구조화 데이터 — 갱신일·발행처는 lib/breedSeo, 근거(citation)는 칸별 근거를 모은 것, 그림은 품종 사진
  const citations = p ? [...new Map(SECTIONS.flatMap((x) => sourcesOf(x.key, b, p)).map((c) => [c.url, c])).values()] : [];
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${b.breed_ko} 키우기`,
    description: (p && !mix ? answerOf(b, p) : '') || intro || g.summary || '',
    inLanguage: 'ko',
    mainEntityOfPage: url,
    dateModified: UPDATED,
    about: { '@type': 'Thing', name: b.breed_ko, alternateName: b.breed_en },
    author: ORG_REF,
    publisher: ORG_REF,
    ...(citations.length ? { citation: citations.map((c) => ({ '@type': 'CreativeWork', name: c.label, url: c.url })) } : {}),
    ...(img ? { image: `${SITE.url}${img.src}` } : {}),
  };
  const name = b.breed_ko.replace(/\s*\([^)]*\)\s*/g, '').trim() || b.breed_ko;

  const mixFeed = mix?.map((v) => ({ v, f: feedOf(v.b) }));
  const faq: Faq[] = [
    ...(mixFeed
      ? [{ q: `${b.breed_ko} 하루 사료량은요?`, a: `체구에 따라 달라요 — 중성화 기준 ${mixFeed.map(({ v, f }) => (f ? `${v.label}(${fmtKg(f.weight)}kg) ${f.gram}` : '')).filter(Boolean).join(', ')}이에요. 지금 몸무게로 정확히 보려면 사료량 계산기를 써 보세요.` }]
      : feed && !featured
        ? [{ q: `${b.breed_ko} 하루 사료량은요?`, a: `다 큰 ${fmtKg(feed.weight)}kg, 중성화 기준 하루 약 ${feed.kcal}kcal — 건사료로 ${feed.gram}이에요. 사료마다 열량이 달라 포장 급여표와 같이 보세요.` }]
        : []),
    ...(mix && p
      ? [{ q: `${b.breed_ko} 산책은 얼마나 해야 하나요?`, a: `하루 2번, 합쳐서 ${mix.map((v) => `${v.label} ${v.p.exerciseMin[0]}~${v.p.exerciseMin[1]}분`).join(', ')}이 알맞아요. ${p.notes.walk}` }]
      : []),
    ...(p && isDog && !mix ? [{ q: `${b.breed_ko} 산책은 얼마나 해야 하나요?`, a: `하루 ${p.walksPerDay ? `${p.walksPerDay[0]}~${p.walksPerDay[1]}번, ` : ''}합쳐서 ${p.exerciseMin[0]}~${p.exerciseMin[1]}분이 알맞아요. ${p.notes.walk}` }] : []),
    ...(p && !isDog ? [{ q: `${b.breed_ko} 놀이는 얼마나 해 줘야 하나요?`, a: `하루 ${p.exerciseMin[0]}~${p.exerciseMin[1]}분, 몇 번으로 나눠 사냥 놀이를 해 주세요. ${p.notes.walk}` }] : []),
    ...(p ? [{ q: `${b.breed_ko} 털 관리는 어떻게 하나요?`, a: `${COAT_LABEL[p.coat]}이라 빗질은 ${BRUSH_LABEL[p.brushing]}, ${p.trimWeeks ? `미용은 ${p.trimWeeks[0]}~${p.trimWeeks[1]}주마다예요` : '커트는 필요 없어요'}. ${p.notes.grooming}` }] : []),
    // 「길에서 데려왔다면」 칸의 요약(같은 근거 — care-rules.json rescue)
    ...(rescue?.length
      ? [
          isDog
            ? { q: '길에서 데려온 강아지는 뭐부터 해야 하나요?', a: '주인이 있을 수 있으니 시·군·구나 동물보호센터에 신고해 주인을 찾을 수 있어요. 공고한 날부터 10일이 지나도 주인을 알 수 없으면 입양 절차를 밟을 수 있어요. 7개월이 넘었으면 심장사상충 검사부터 하고, 접종 기록이 없으면 다시 맞혀요.' }
            : { q: '길에서 데려온 고양이는 뭐부터 해야 하나요?', a: '새끼만 있으면 멀리서 3시간쯤 어미를 기다려 봐요. 왼쪽 귀 끝이 잘려 있으면 이미 중성화를 마친 길고양이예요. 데려오면 되도록 빨리 FeLV·FIV 검사를 하고, 결과가 나올 때까지 다른 고양이와 따로 지내게 해요.' },
        ]
      : []),
    ...(b.life_years ? [{ q: `${b.breed_ko} 수명은 얼마나 되나요?`, a: `기대 수명은 보통 ${b.life_years}년이에요. 정기 검진과 체중 관리가 오래 함께하는 데 가장 중요해요.` }] : []),
    ...((g.hereditary?.length ?? 0) > 0 ? [{ q: `${b.breed_ko}에게 흔한 질환은요?`, a: `${g.hereditary!.slice(0, 3).map((h) => h.name).join(', ')} 등이 자주 보고돼요. 증상이 보이기 전에 정기 검진으로 확인해 보세요.` }] : []),
  ];

  return (
    <main className="tz">
      <JsonLd
        data={[
          articleLd,
          faqJsonLd(faq),
          breadcrumbJsonLd([
            { name: '마이펫', url: SITE.url },
            { name: '품종 안내판', url: `${SITE.url}/breed` },
            { name: b.breed_ko, url },
          ]),
        ]}
      />
      <div className="tz-wrap">
        <nav className="gcrumb">
          <Link href="/breed">품종 안내판</Link> <span>›</span> {speciesKo} <span>›</span> {b.breed_ko}
        </nav>

        {/* ① 맨 위 — 제목·소개 + 품종 사진(컴퓨터: 오른쪽, 휴대폰: 제목 아래) */}
        <header className={`tz-hero${img ? ' tz-hero--photo' : ''}`}>
          {/* 체구·털·몸무게·수명은 바로 아래 프로필 카드에 있어서 여기선 뺐다(2026-11-19 사장님 「위 내용과 카드가 겹친다」) — 소개는 성격 한 줄 */}
          <div className="th-title">
            <h1>{b.breed_ko} 키우기</h1>
            <p className="th-en">{b.breed_en}</p>
          </div>
          {img ? <BreedPhoto img={img} name={b.breed_ko} /> : null}
          <div className="th-lead">
            {intro ? <p className="tz-lead">{intro}</p> : null}
            {live ? <Disclosure /> : null}
          </div>
        </header>

        {p && mix ? <MixPicker mix={mix} /> : null}

        {/* ② 이런 아이예요 — 핵심 숫자 4칸 · 성향 카드 · 조심할 점 이름표 (문장은 자세히 보기) */}
        {p ? (
          <Profile
            title={`${josa(name, '은/는')} 이런 아이예요`}
            specs={[
              ...(b.weight_kg ? [{ label: '다 큰 몸무게', value: `${tidyRange(b.weight_kg)}kg` }] : []),
              ...(b.life_years ? [{ label: '수명', value: `${tidyRange(b.life_years)}년` }] : []),
              { label: '체구', value: mix ? '제각각' : SIZE_LABEL[p.sizeClass] },
              { label: '털', value: COAT_LABEL[p.coat] },
            ]}
            meters={metersOf(p)}
            flags={flagTexts(p)}
            traits={restTraits}
          />
        ) : null}

        {rescue?.length ? <RescueSection items={rescue} /> : null}

        {/* ③ 번호 칸 — 핵심 한 줄 → 그 품종 이야기 → 사실 → 맞는 준비물 → 근거 */}
        {p
          ? SECTIONS.map((s, idx) => {
              const shopLabel = s.shop[isDog ? 0 : 1];
              return (
                <Step
                  key={s.key}
                  n={idx + 1}
                  id={s.key}
                  title={isDog ? s.dog : s.cat}
                  icon={s.icon[isDog ? 0 : 1]}
                  tone={s.key}
                  keyLine={bySize(mix, mix?.map((v) => keyOf(s.key, v.b, v.p)), keyOf(s.key, b, p), (k) => (
                    <KeyLine k={k} />
                  ))}
                  sources={sourcesOf(s.key, b, p)}
                >
                  {/* 핵심 한 줄 아래 자세한 이야기는 접어 둔다(2026-11-19 사장님 「자세히 보기로 접어, 가시성 좋게」) — 건강 칸의 질환 목록만 펼쳐 둔다 */}
                  {s.key === 'health' && (g.hereditary?.length ?? 0) > 0 ? (
                    <ul className="dz">
                      {g.hereditary!.map((h, i) => (
                        <li key={i}>
                          <b>{h.name}</b>
                          {h.note ? <span>{h.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {/* 2026-11-22 사장님 「자세히 보기보다 간략하게 — 말티즈는 ○○이 어떠면 좋다, 그때 필요한 물품은 이런 것」:
                      접기를 없애고 그 품종 한두 문장(notes)을 요약으로 바로 보여 준 뒤 준비물 카드로 잇는다.
                      사실 목록(*Facts)은 요약·핵심 한 줄·준비물 소개와 겹쳐 뺐다(숫자는 핵심 한 줄·llms-full에 남는다). 건강 칸 주의 목록·사료 칸 표 링크만 남긴다 */}
                  <p className="sec-note sec-sum">{p.notes[s.key]}</p>
                  {s.key === 'health' && (g.cautions?.length ?? 0) > 0 ? <Facts items={g.cautions!} /> : null}
                  {s.key === 'food' ? (
                    featured ? (
                      <p className="sec-more">
                        개월별로 보려면 <Link href={breedPath(b.breed_ko, 'food')}>{b.breed_ko} 사료량 표</Link>와 <Link href={breedPath(b.breed_ko, 'growth')}>개월별 몸무게 표</Link>를 보세요.
                      </p>
                    ) : (
                      <p className="sec-more">
                        지금 몸무게로 계산하려면 <Link href="/tools/food">사료량 계산기</Link>를 써 보세요.
                      </p>
                    )
                  ) : null}
                  {s.key === 'health' ? (
                    <div className="sec-links">
                      <Link href={isDog ? '/guide/dog-vaccine-schedule' : '/guide/cat-vaccine-schedule'}>예방접종 시기</Link>
                      <Link href={isDog ? '/guide/dog-toxic-foods' : '/guide/cat-toxic-foods'}>먹으면 안 되는 음식</Link>
                      <Link href="/guide/pet-symptom-vet-signs">병원에 가야 하는 증상</Link>
                    </div>
                  ) : null}

                  {s.key !== 'health'
                    ? bySize(mix, mix?.map((v, i) => ({ pk: mixPicks![i][s.key] ?? [], vp: v.p })), { pk: picks[s.key] ?? [], vp: p }, ({ pk, vp }) => (
                        <ShopCards picks={pk} label={shopHeading(s.key, name, shopLabel, isDog)} intro={unlessSaid(p.notes[s.key], shopIntro(s.key, b.breed_ko, vp))} />
                      ))
                    : null}
                  <LawList rules={lawFor[s.key] ?? []} />
                </Step>
              );
            })
          : null}

        <section className="sheet">
          <FaqList items={faq} />
        </section>

        <section className="sheet tz-end">
          <h2 className="sheet-title">다른 품종도 보기</h2>
          <div className="gcta-btns">
            <Link href="/breed" className="btn btn--primary">
              품종 안내판 전체
            </Link>
            <Link href={isDog ? '/start/dog' : '/start/cat'} className="btn btn--secondary">
              처음 {isDog ? '강아지' : '고양이'}를 데려온다면
            </Link>
          </div>
        </section>

        <p className="tz-src">
          {(p?.sources ?? []).map((s, i) => (
            <span key={s.url}>
              {i ? ', ' : ''}
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
