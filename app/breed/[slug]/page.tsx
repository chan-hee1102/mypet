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
    ' 우리 아이 맞춤 체크는 무료.';
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

  return (
    <main className="container container--narrow bpage">
      <nav className="bcrumb">
        <Link href="/breed">품종 가이드</Link> <span>›</span> <b>{b.breed_ko}</b>
      </nav>

      <section className="hero" style={{ paddingBottom: 8 }}>
        <span className="eyebrow"><Icon name="shield" size={14} /> {b.source_org ?? '공식 수의 자료'} 기반</span>
        <h1>{b.breed_ko} 키우기 가이드</h1>
        <p className="hero-sub">{b.breed_en} · {speciesKo}</p>
      </section>

      <div className="gcard" style={{ marginBottom: 13 }}>
        <div className="gcard-stats" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="gcard-stat"><span>크기</span><b>{b.size ?? '-'}</b></div>
          <div className="gcard-stat"><span>표준체중</span><b>{b.weight_kg ? `${b.weight_kg}kg` : '-'}</b></div>
          <div className="gcard-stat"><span>기대수명</span><b>{b.life_years ? `${b.life_years}년` : '-'}</b></div>
        </div>
      </div>

      {(g.summary || (g.traits?.length ?? 0) > 0) && (
        <section className="section" style={{ marginBottom: 13 }}>
          <div className="section-head"><span className="section-ico"><Icon name="paw" size={18} /></span><h2 className="section-title">성격은 어때요?</h2></div>
          {g.summary && <p>{g.summary}</p>}
          {(g.traits?.length ?? 0) > 0 && (
            <ul className="list">
              {g.traits!.map((t, i) => (
                <li key={i}><Icon name="check" size={14} strokeWidth={2} />{t}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tip && (
        <section className="tipcard" style={{ marginBottom: 13 }}>
          <div className="tipcard-head"><span className="tipcard-bulb">💡</span><h2>아는 사람만 아는 {b.breed_ko} 꿀팁</h2></div>
          <div className="tipcard-item">
            <span className="tipcard-ico"><Icon name={tip.icon} size={15} /></span>
            <div><b>{tip.title}</b><p>{tip.body}</p></div>
          </div>
          <p className="tipcard-src">AKC·AVMA 등 공식 수의 자료에서 확인된 내용만 담았어요</p>
        </section>
      )}

      {/* 중간 CTA — 맞춤 체크 */}
      <section className="rlock" style={{ marginBottom: 13 }}>
        <div className="rlock-head"><Icon name="sparkle" size={15} filled /><h2>우리 아이는 어떨까요?</h2></div>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65, marginBottom: 12 }}>
          같은 {b.breed_ko}라도 나이·몸무게에 따라 지금 중요한 게 달라요.
          이름·나이·몸무게만 넣으면 <b>표준 대비 판정</b>을 무료로 바로 보여드려요.
        </p>
        <Link href={diagnoseHref} className="btn btn--primary btn--block"><Icon name="paw" size={16} filled /> {b.breed_ko} 맞춤 체크 무료로 받기</Link>
      </section>

      {((g.exercise?.length ?? 0) > 0 || (g.grooming?.length ?? 0) > 0) && (
        <section className="section" style={{ marginBottom: 13 }}>
          <div className="section-head"><span className="section-ico"><Icon name="activity" size={18} /></span><h2 className="section-title">산책·운동과 미용</h2></div>
          {(g.exercise?.length ?? 0) > 0 && (
            <div className="care-block"><div className="care-block-tag"><Icon name="activity" size={13} /> 산책·운동</div><p>{g.exercise!.join(' ')}</p></div>
          )}
          {(g.grooming?.length ?? 0) > 0 && (
            <div className="care-block"><div className="care-block-tag"><Icon name="scissors" size={13} /> 미용·털관리</div><p>{g.grooming!.join(' ')}</p></div>
          )}
        </section>
      )}

      {(g.hereditary?.length ?? 0) > 0 && (
        <section className="section flags" style={{ marginBottom: 13 }}>
          <div className="section-head"><span className="section-ico"><Icon name="cross" size={18} /></span><h2 className="section-title">{b.breed_ko}가 조심해야 하는 질환</h2></div>
          <div className="dz-grid">
            {g.hereditary!.map((h, i) => (
              <div className="dz-item" key={i}><b>{h.name}</b>{h.note && <span>{h.note}</span>}</div>
            ))}
          </div>
          {(g.cautions?.length ?? 0) > 0 && <ul className="list warn" style={{ marginTop: 10 }}>{g.cautions!.map((c, i) => <li key={i}><Icon name="alert" size={14} />{c}</li>)}</ul>}
        </section>
      )}

      <section className="cta-band" style={{ marginTop: 20 }}>
        <h2>증상이 걱정되세요?</h2>
        <p>사진·증상을 알려주시면 AI가 {b.breed_ko} 기준으로 병원에 가야 할지부터 알려드려요.</p>
        <Link href={diagnoseHref} className="btn btn--white btn--lg"><Icon name="sparkle" size={17} filled /> 무료로 시작하기</Link>
      </section>

      <p className="disclaimer" style={{ marginTop: 14 }}>
        <Icon name="info" size={14} /> 본 내용은 {b.source_org ?? '공식 수의 자료'} 기반 일반 정보이며, 수의사의 진단·진료를 대체하지 않습니다.
      </p>
    </main>
  );
}
