import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import breedData from '@/lib/breedKnowledge.json';
import { getBreedTips } from '@/lib/breedTips';
import { Icon } from '@/components/icons';
import { SITE } from '@/lib/site';
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
  const name = decodeURIComponent(slug);
  return BREEDS.find((b) => b.breed_ko === name);
}

export const dynamicParams = false;

export function generateStaticParams() {
  return BREEDS.map((b) => ({ slug: b.breed_ko }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const b = findBreed(params.slug);
  if (!b) return {};
  const speciesKo = b.species === 'dog' ? '강아지' : '고양이';
  const title = `${b.breed_ko} 성격·수명·조심할 질환 총정리 | mypet`;
  const description =
    (b.guide?.summary ?? `${b.breed_ko}(${b.breed_en}) ${speciesKo} 키우기 가이드.`).slice(0, 150) +
    ' 우리 아이 체중 비교는 무료.';
  const url = `${SITE.url}/breed/${encodeURIComponent(b.breed_ko)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
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

  return (
    <main className="container guide">
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
