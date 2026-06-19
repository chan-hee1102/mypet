'use client';

import type { ReactNode } from 'react';
import { CareCard as CareCardType, Species } from '@/lib/types';
import { TOXIC_FOODS, GOOD_FOODS } from '@/lib/petData';
import { Icon } from './icons';
import Paywall from './Paywall';

const CONF_KO: Record<string, string> = { high: '높음', medium: '보통', low: '낮음' };

function Section({ icon, title, variant, children }: { icon: string; title: string; variant?: string; children: ReactNode }) {
  return (
    <section className={`section ${variant ?? ''}`}>
      <div className="section-head">
        <span className="section-ico"><Icon name={icon} size={18} /></span>
        <h3 className="section-title">{title}</h3>
      </div>
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
          {x}
        </li>
      ))}
    </ul>
  );
}

export default function CareCardView({
  species,
  petName,
  card,
  unlocked,
  onUnlock,
  onReset,
}: {
  species: Species;
  petName: string;
  card: CareCardType;
  unlocked: boolean;
  onUnlock: () => void;
  onReset: () => void;
}) {
  const speciesKo = species === 'dog' ? '강아지' : '고양이';
  const toxic = TOXIC_FOODS[species];
  const goodFoods = Array.from(new Set([...GOOD_FOODS[species], ...card.food.goodFoods]));
  const conf = card.photoAnalysis.confidence;

  return (
    <div className="report">
      {/* 리포트 헤더 */}
      <div className="report-hero">
        <div>
          <div className="report-eyebrow">맞춤 케어 리포트</div>
          <h2 className="report-title">{petName}</h2>
          <div className="report-chips">
            <span className="chip chip--solid">{speciesKo}</span>
            <span className="chip">{card.photoAnalysis.breedGuess}</span>
            <span className={`chip conf-${conf}`}>신뢰도 {CONF_KO[conf] ?? conf}</span>
          </div>
        </div>
        <button className="btn btn--ghost" onClick={onReset}>
          <Icon name="refresh" size={14} /> 다시
        </button>
      </div>

      {/* ── 미리보기 (무료) ── */}
      <Section icon="info" title="사진·기본 분석">
        <p>{card.photoAnalysis.coatSkinNotes}</p>
        <div className="meta-grid">
          <span className="meta-pill">체형<b>{card.photoAnalysis.bodyCondition}</b></span>
          <span className="meta-pill">품종 추정<b>{card.photoAnalysis.breedGuess}</b></span>
        </div>
      </Section>

      <Section icon="tag" title="품종 특성">
        <p>{card.breedTraits.summary}</p>
        {card.breedTraits.healthRisks.length > 0 && (
          <>
            <div className="sub">주의할 질환</div>
            <Bullets items={card.breedTraits.healthRisks} />
          </>
        )}
      </Section>

      {/* ── 전체 리포트 (결제 후) ── */}
      {unlocked ? (
        <>
          <Section icon="scissors" title="그루밍">
            <p>{card.grooming.summary}</p>
            {card.grooming.cautions.length > 0 && <Bullets items={card.grooming.cautions} warn />}
          </Section>

          <Section icon="activity" title="운동·산책">
            <p>{card.exercise.summary}</p>
            <div className="meta-grid">
              <span className="meta-pill accent">하루 권장<b>{card.exercise.walkMinutesPerDay}</b></span>
            </div>
            {card.exercise.cautions.length > 0 && <Bullets items={card.exercise.cautions} warn />}
          </Section>

          <Section icon="bowl" title="음식 가이드">
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
              <div className="note"><Icon name="info" size={15} /><span>{petName} 특이사항 관련 주의: {card.food.cautionFoods.join(', ')}</span></div>
            )}
          </Section>

          <Section icon="calendar" title={`나이별 케어 · ${card.ageCare.stage}`}>
            <Bullets items={card.ageCare.tips} />
          </Section>

          <Section icon="repeat" title="권장 주기">
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

          <Section icon="cross" title="병원 방문이 필요한 신호" variant="flags">
            <Bullets items={card.redFlags} warn />
          </Section>

          <p className="disclaimer"><Icon name="info" size={14} /> 본 리포트는 일반 정보이며, 수의사의 진단·진료를 대체하지 않습니다.</p>
        </>
      ) : (
        <Paywall petName={petName} onUnlock={onUnlock} />
      )}

      <button className="btn btn--secondary btn--block" onClick={onReset}>다른 아이 등록하기</button>
    </div>
  );
}
