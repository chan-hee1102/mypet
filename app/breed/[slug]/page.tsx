import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import breedData from '@/lib/breedKnowledge.json';
import { getBreedTips } from '@/lib/breedTips';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';
import { breedPath, breedSlugOf, slugMatches } from '@/lib/breedSlug';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd, type Faq } from '@/components/seo/SeoBits';
import { adultFeedingRows, gramText, growthFacts, socialMeta } from '@/lib/breedSeo';
import { fmtKg, isFeatured } from '@/lib/growth';
import { josa } from '@/lib/josa';
import type { Species } from '@/lib/types';

/**
 * 품종별 키우기 가이드 — 검색 유입용 정적 페이지(188종).
 * "말티즈 성격", "폼피츠 미용" 같은 검색에 걸려 무료 체크 → 유료 진단으로 잇는 입구.
 */

type Breed = {
  breed_ko: string;
  breed_en: string;
  species: string;
  size?: string;
  weight_kg?: string;
  life_years?: string;
  source_org?: string;
  guide?: {
    summary?: string;
    traits?: string[];
    grooming?: string[];
    exercise?: string[];
    hereditary?: { name: string; note: string }[];
    cautions?: string[];
  };
};

const BREEDS = breedData as Breed[];

function findBreed(slug: string): Breed | undefined {
  return BREEDS.find((b) => slugMatches(slug, b.breed_ko));
}

export const dynamicParams = false;

export function generateStaticParams() {
  return BREEDS.map((b) => ({ slug: breedSlugOf(b.breed_ko) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const b = findBreed(params.slug);
  if (!b) return {};
  const speciesKo = b.species === 'dog' ? '강아지' : '고양이';
  // 성장·사료량 전용 페이지가 있는 품종은 그쪽이 「몸무게·사료량」 검색어를 맡는다(같은 검색어를 두 페이지가 노리면 둘 다 내려간다)
  const title = isFeatured(b.breed_ko)
    ? `${b.breed_ko} 성격·수명·조심할 질환 총정리 | mypet`
    : `${b.breed_ko} 성격·몸무게·사료량·수명 총정리 | mypet`;
  const description =
    (b.guide?.summary ?? `${b.breed_ko}(${b.breed_en}) ${speciesKo} 키우기 가이드.`).slice(0, 150) +
    ' 우리 아이 체중 비교는 무료.';
  const url = `${SITE.url}${breedPath(b.breed_ko)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    ...socialMeta(title.replace(/ \| mypet$/, ''), description, url),
  };
}


export default function BreedPage({ params }: { params: { slug: string } }) {
  const b = findBreed(params.slug);
  if (!b) notFound();
  const g = b.guide ?? {};
  const speciesKo = b.species === 'dog' ? '강아지' : '고양이';
  const tip = getBreedTips(b.species as Species, b.breed_ko)[0];
  const diagnoseHref = `/diagnose?breed=${encodeURIComponent(b.breed_ko)}&sp=${b.species}`;
  const src = b.source_org ?? '공식 수의 자료';
  const featured = isFeatured(b.breed_ko);
  const gf = growthFacts(b);
  const feed = adultFeedingRows(b)[1];
  // 몸무게·사료량 질문은 전용 페이지(growth·food)가 있는 품종이면 그쪽에 맡긴다 — 같은 질문을 두 페이지가 답하면 서로 잠식한다
  const showTable = !!gf && !gf.wide;
  const faq: Faq[] = [
    ...(!featured && b.weight_kg ? [{ q: `${b.breed_ko} 다 크면 몇 kg인가요?`, a: `표준 체중은 ${gf ? gf.adultText : `${b.weight_kg}kg`}이에요.${gf ? ` ${gf.end.label} 거의 다 자라요.` : ''}${gf?.wide ? ' 부모 체구에 따라 차이가 커서 다 큰 몸무게 계산기로 보는 쪽이 정확해요.' : ''}` }] : []),
    ...(b.life_years ? [{ q: `${b.breed_ko} 수명은 얼마나 되나요?`, a: `기대 수명은 보통 ${b.life_years}년이에요. ${b.species === 'cat' ? '비만은 당뇨와 관절 질환 위험을 높여서' : '날씬하게 키운 개가 더 오래 살았다는 연구가 있어서'}, 정기 검진과 함께 체중 관리가 중요해요.` }] : []),
    ...(!featured && feed ? [{ q: `${b.breed_ko} 하루 사료량은요?`, a: `다 큰 ${fmtKg(feed.weight)}kg, 중성화 기준 하루 약 ${Math.round(feed.neutered.kcal / 10) * 10}kcal, 건사료 ${gramText(feed.neutered)}이에요. 사료 열량에 따라 달라요.` }] : []),
    ...((g.grooming?.length ?? 0) > 0 ? [{ q: `${b.breed_ko} 털 관리는 어떻게 하나요?`, a: g.grooming!.join(' ') }] : []),
    ...((g.exercise?.length ?? 0) > 0 ? [{ q: `${b.breed_ko} 산책·운동은 얼마나 필요한가요?`, a: g.exercise!.join(' ') }] : []),
    ...((g.hereditary?.length ?? 0) > 0 ? [{ q: `${b.breed_ko}에게 흔한 질환은 무엇인가요?`, a: `${g.hereditary!.slice(0, 3).map((h) => h.name).join(', ')} 등이 자주 보고돼요. 증상이 보이기 전에 정기 검진으로 확인하는 게 좋아요.` }] : []),
  ];

  return (
    <main className="container guide">
      <JsonLd data={[faqJsonLd(faq), breadcrumbJsonLd([
        { name: '홈', url: SITE.url },
        { name: '품종 가이드', url: `${SITE.url}/breed` },
        { name: b.breed_ko, url: `${SITE.url}${breedPath(b.breed_ko)}` },
      ])]} />
      <nav className="gcrumb">
        <Link href="/breed">품종 가이드</Link> <span>›</span> {b.breed_ko}
      </nav>

      <h1 className="gtitle">{b.breed_ko} 키우기 가이드</h1>
      <p className="gquestion">{b.breed_en}, {speciesKo}</p>

      <dl className="bfacts">
        <div><dt>크기</dt><dd>{b.size ?? '-'}</dd></div>
        <div><dt>표준 체중</dt><dd>{b.weight_kg ? `${b.weight_kg}kg` : '-'}</dd></div>
        <div><dt>기대 수명</dt><dd>{b.life_years ? `${b.life_years}년` : '-'}</dd></div>
      </dl>

      {featured && (
        <nav className="bsub" aria-label={`${b.breed_ko} 정보`}>
          <Link href={breedPath(b.breed_ko)} aria-current="page">성격·질환</Link>
          <Link href={breedPath(b.breed_ko, 'growth')}>개월별 몸무게</Link>
          <Link href={breedPath(b.breed_ko, 'food')}>사료량</Link>
        </nav>
      )}

      {(g.summary || (g.traits?.length ?? 0) > 0) && (
        <section className="bsec">
          <h2>성격과 특징</h2>
          {g.summary && <p>{g.summary}</p>}
          {(g.traits?.length ?? 0) > 0 && (
            <ul className="glist" style={{ marginTop: 14 }}>
              {g.traits!.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
        </section>
      )}

      {tip && (
        <section className="bsec">
          <h2>관리에서 먼저 알아 둘 것</h2>
          <h3>{tip.title}</h3>
          <p>{tip.body}</p>
        </section>
      )}

      <div className="bcheck">
        <div>
          <b>우리 {b.breed_ko}의 체중은 표준 범위 안일까요?</b>
          <p>나이와 체중을 적으면 {b.weight_kg ? `표준 ${b.weight_kg}kg과` : '품종 표준과'} 비교해 무료로 바로 보여 드려요.</p>
        </div>
        <Link href={diagnoseHref} className="btn btn--primary">무료 가이드 보기</Link>
      </div>

      {gf && (
        <section className="bsec">
          <h2>{b.breed_ko} 몸무게·사료량 한눈에</h2>
          {showTable && (
          <div className="gtable-wrap">
            <table className="gtable gtable--fit gtable--num">
              <thead>
                <tr><th>나이</th><th className="num">예상 몸무게</th></tr>
              </thead>
              <tbody>
                {gf.rows.filter((r) => (featured ? [2, 6] : [2, 3, 4, 6, 8]).includes(r.months) || r.months === gf.end.months).map((r) => (
                  <tr key={r.months}><td><b>{r.months}개월</b></td><td className="num">{fmtKg(r.min)}~{fmtKg(r.max)}kg</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          <p style={{ marginTop: 14 }}>
            {josa(b.breed_ko, '은/는')} {gf.end.label} 거의 다 자라요.
            {gf.wide && <> 다만 부모 체구에 따라 다 큰 몸무게가 {gf.adultText}으로 크게 달라서 개월별 표 대신 계산기를 권해요.</>}
            {feed && <> 다 큰 뒤 {fmtKg(feed.weight)}kg(중성화)이면 하루 약 {Math.round(feed.neutered.kcal / 10) * 10}kcal, 건사료 {gramText(feed.neutered)}이 알맞아요.</>}
            {!featured && <> 지금 몸무게로 계산하려면 <Link href="/tools/adult-weight">다 큰 몸무게 계산기</Link>와 <Link href="/tools/food">사료량 계산기</Link>를 써 보세요.</>}
          </p>
          {featured && (
            <div className="gcta-btns" style={{ marginTop: 16 }}>
              <Link href={breedPath(b.breed_ko, 'growth')} className="btn btn--tint">{b.breed_ko} 개월별 몸무게 표</Link>
              <Link href={breedPath(b.breed_ko, 'food')} className="btn btn--tint">{b.breed_ko} 사료량 표</Link>
            </div>
          )}
        </section>
      )}

      {((g.exercise?.length ?? 0) > 0 || (g.grooming?.length ?? 0) > 0) && (
        <section className="bsec">
          <h2>산책·운동과 미용</h2>
          {(g.exercise?.length ?? 0) > 0 && (<><h3>산책·운동</h3><p>{g.exercise!.join(' ')}</p></>)}
          {(g.grooming?.length ?? 0) > 0 && (<><h3>미용·털 관리</h3><p>{g.grooming!.join(' ')}</p></>)}
        </section>
      )}

      {(g.hereditary?.length ?? 0) > 0 && (
        <section className="bsec">
          <h2>{b.breed_ko}에게 자주 보고되는 질환</h2>
          <ul className="bdz">
            {g.hereditary!.map((h, i) => (
              <li key={i}><b>{h.name}</b>{h.note && <span>{h.note}</span>}</li>
            ))}
          </ul>
          {(g.cautions?.length ?? 0) > 0 && (
            <ul className="glist glist--warn" style={{ marginTop: 16 }}>
              {g.cautions!.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
        </section>
      )}

      <FaqList items={faq} />

      <section className="gcta">
        <h2>{b.breed_ko} 기준으로 우리 아이 리포트 만들기</h2>
        <p>
          급여량, 접종 일정, 조심할 질환, 먹으면 안 되는 음식을 나이와 체중에 맞춰 리포트로 정리해 드려요.
          결제 전에 무료 가이드로 먼저 확인할 수 있어요.
        </p>
        <div className="gcta-btns">
          <Link href={diagnoseHref} className="btn btn--primary btn--lg">리포트 만들기</Link>
          <Link href="/breed" className="btn btn--secondary btn--lg">다른 품종 보기</Link>
        </div>
      </section>

      <p className="gdisclaimer">
        <Icon name="info" size={14} /> {src} 자료를 바탕으로 한 일반 정보이며, 수의사의 진찰과 진료를 대신하지 않아요.
      </p>
    </main>
  );
}
