'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CareCard as CareCardType, PreviewCard, Species } from '@/lib/types';
import { TOXIC_FOODS, GOOD_FOODS } from '@/lib/petData';
import { Icon } from './icons';
import Paywall from './Paywall';
import SourceBadges from './SourceBadges';

const CONF_KO: Record<string, string> = { high: '높음', medium: '보통', low: '낮음' };

/** RAG 내부 라벨("근거1)", "근거3, 5)")이 본문에 새어나온 것을 표시 단계에서만 제거. */
function stripRefs(s: string): string {
  if (!s) return s;
  return s
    .replace(/[.\s,]*근거[\d,\s]+(?=\))/g, '') // "…합니다. 근거1)" → "…합니다)"
    .replace(/\(\s*\)/g, '') // 빈 괄호 "()" 정리
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,)])/g, '$1')
    .trim();
}

function Section({
  icon,
  title,
  variant,
  collapsible,
  defaultOpen = true,
  children,
}: {
  icon: string;
  title: string;
  variant?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const head = (
    <>
      <span className="section-ico"><Icon name={icon} size={18} /></span>
      <h3 className="section-title">{title}</h3>
      {collapsible && <span className="section-chev"><Icon name="chevron" size={18} /></span>}
    </>
  );
  if (collapsible) {
    return (
      <details className={`section section--collapsible ${variant ?? ''}`} open={defaultOpen}>
        <summary className="section-head">{head}</summary>
        <div className="section-body">{children}</div>
      </details>
    );
  }
  return (
    <section className={`section ${variant ?? ''}`}>
      <div className="section-head">{head}</div>
      {children}
    </section>
  );
}

function Bullets({ items, warn }: { items: string[]; warn?: boolean }) {
  return (
    <ul className={`list ${warn ? 'warn' : ''}`}>
      {items.map((x, i) => (
        <li key={i}>
          <Icon name={warn ? 'alert' : 'check'} size={14} strokeWidth={2} />
          {stripRefs(x)}
        </li>
      ))}
    </ul>
  );
}

/** 잠금 해제된 프리미엄 섹션 (전체 리포트). */
function PremiumSections({ species, petName, card }: { species: Species; petName: string; card: CareCardType }) {
  const toxic = TOXIC_FOODS[species];
  const goodFoods = Array.from(new Set([...GOOD_FOODS[species], ...card.food.goodFoods]));
  return (
    <>
      <Section icon="scissors" title="그루밍" collapsible defaultOpen={false}>
        <p>{stripRefs(card.grooming.summary)}</p>
        {card.grooming.cautions.length > 0 && <Bullets items={card.grooming.cautions} warn />}
      </Section>

      <Section icon="activity" title="운동·산책" collapsible defaultOpen={false}>
        <p>{stripRefs(card.exercise.summary)}</p>
        <div className="meta-grid">
          <span className="meta-pill accent">하루 권장<b>{card.exercise.walkMinutesPerDay}</b></span>
        </div>
        {card.exercise.cautions.length > 0 && <Bullets items={card.exercise.cautions} warn />}
      </Section>

      <Section icon="bowl" title="음식 가이드" collapsible defaultOpen={false}>
        <div className="food">
          <div className="food-col good">
            <div className="food-col-head"><Icon name="check" size={15} strokeWidth={2.2} /> 먹어도 좋아요</div>
            <ul className="food-list">{goodFoods.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
          <div className="food-col bad">
            <div className="food-col-head"><Icon name="alert" size={15} /> 절대 금지</div>
            <ul className="food-list">{toxic.map((f) => <li key={f.name}><b>{f.name}</b> — {f.reason}</li>)}</ul>
          </div>
        </div>
        {card.food.cautionFoods.length > 0 && (
          <div className="note">
            <Icon name="info" size={15} />
            <div>
              <b>{petName} 특이사항 관련 주의</b>
              <ul className="note-list">
                {card.food.cautionFoods.map((x, i) => <li key={i}>{stripRefs(x)}</li>)}
              </ul>
            </div>
          </div>
        )}
      </Section>

      <Section icon="calendar" title={`나이별 케어 · ${card.ageCare.stage}`} collapsible defaultOpen={false}>
        <Bullets items={card.ageCare.tips} />
      </Section>

      <Section icon="repeat" title="권장 주기" collapsible defaultOpen={false}>
        <div className="stats">
          <div className="stat">
            <div className="stat-ico"><Icon name="repeat" size={18} /></div>
            <div className="stat-label">목욕</div>
            <div className="stat-value">{card.routine.bath}</div>
          </div>
          <div className="stat">
            <div className="stat-ico"><Icon name="activity" size={18} /></div>
            <div className="stat-label">산책</div>
            <div className="stat-value">{card.routine.walk}</div>
          </div>
          <div className="stat">
            <div className="stat-ico"><Icon name="scissors" size={18} /></div>
            <div className="stat-label">빗질·미용</div>
            <div className="stat-value">{card.routine.grooming}</div>
          </div>
        </div>
      </Section>

      <Section icon="cross" title="병원 방문이 필요한 신호" variant="flags" collapsible defaultOpen>
        <Bullets items={card.redFlags} warn />
      </Section>

      <p className="disclaimer"><Icon name="info" size={14} /> 본 리포트는 일반 정보이며, 수의사의 진단·진료를 대체하지 않습니다.</p>
    </>
  );
}

export default function CareCardView({
  species,
  petName,
  petId,
  preview,
  fullCard,
  unlocked,
  onUnlock,
  onReset,
}: {
  species: Species;
  petName: string;
  petId: string | null;
  preview: PreviewCard;
  /** 서버에서 이미 잠금해제 확인하고 내려준 전체 카드(있으면 추가 fetch 안 함). */
  fullCard?: CareCardType | null;
  unlocked: boolean;
  onUnlock: () => void;
  onReset: () => void;
}) {
  const speciesKo = species === 'dog' ? '강아지' : '고양이';
  const conf = preview.photoAnalysis.confidence;

  // 프리미엄(전체 리포트)은 잠금 해제된 경우에만 서버 보호 라우트에서 가져온다.
  const [premium, setPremium] = useState<CareCardType | null>(fullCard ?? null);
  const [premiumErr, setPremiumErr] = useState(false);

  useEffect(() => {
    if (!unlocked || premium || !petId) return;
    let cancelled = false;
    setPremiumErr(false);
    fetch(`/api/report/${petId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j) => { if (!cancelled) setPremium(j.card as CareCardType); })
      .catch(() => { if (!cancelled) setPremiumErr(true); });
    return () => { cancelled = true; };
  }, [unlocked, premium, petId]);

  return (
    <div className="report">
      {/* 리포트 헤더 */}
      <div className="report-hero">
        <div>
          <div className="report-eyebrow">맞춤 케어 리포트</div>
          <h2 className="report-title">{petName}</h2>
          <div className="report-chips">
            <span className="chip chip--solid">{speciesKo}</span>
            <span className="chip">{preview.photoAnalysis.breedGuess}</span>
            <span className={`chip conf-${conf}`}>신뢰도 {CONF_KO[conf] ?? conf}</span>
          </div>
        </div>
        <button className="btn btn--ghost" onClick={onReset}>
          <Icon name="refresh" size={14} /> 다시
        </button>
      </div>

      <SourceBadges sources={preview.sources} />

      {/* ── 사진·기본 분석 (맞춤 핵심 — 펼친 상태) ── */}
      <Section icon="info" title="사진·기본 분석" collapsible defaultOpen>
        <p>{stripRefs(preview.photoAnalysis.coatSkinNotes)}</p>
        <div className="meta-grid">
          <span className="meta-pill">체형<b>{preview.photoAnalysis.bodyCondition}</b></span>
          <span className="meta-pill">품종 추정<b>{preview.photoAnalysis.breedGuess}</b></span>
        </div>
      </Section>

      <Section icon="tag" title="품종 특성" collapsible>
        <p>{stripRefs(preview.breedTraits.summary)}</p>
        {preview.breedTraits.healthRisks.length > 0 && (
          <>
            <div className="sub">주의할 질환</div>
            <Bullets items={preview.breedTraits.healthRisks} />
          </>
        )}
      </Section>

      {/* ── 전체 리포트 (결제 후, 서버에서 가져옴) ── */}
      {unlocked ? (
        premium ? (
          <PremiumSections species={species} petName={petName} card={premium} />
        ) : premiumErr ? (
          <div className="alert"><Icon name="alert" size={16} /> 리포트를 불러오지 못했어요. 새로고침해 주세요.</div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)' }}>
            <span className="spinner" style={{ borderColor: 'rgba(17,160,122,.25)', borderTopColor: 'var(--brand)' }} /> 전체 리포트를 불러오는 중…
          </div>
        )
      ) : (
        <Paywall petName={petName} onUnlock={onUnlock} />
      )}

      <button className="btn btn--secondary btn--block" onClick={onReset}>다른 아이 등록하기</button>
    </div>
  );
}
