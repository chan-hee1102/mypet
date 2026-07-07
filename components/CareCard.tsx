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

/** 검진결과지 스타일 — 접기 없이 전부 펼침, 대신 각 섹션을 짧고 스캔 가능하게. */
function Section({
  icon,
  title,
  variant,
  children,
}: {
  icon: string;
  title: string;
  variant?: string;
  children: ReactNode;
}) {
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
          {stripRefs(x)}
        </li>
      ))}
    </ul>
  );
}

const URGENCY = {
  now: { label: '지금 병원 진료를 권해요', cls: 'vd--now', icon: 'alert' },
  soon: { label: '2~3일 내 진료를 권해요', cls: 'vd--soon', icon: 'cross' },
  routine: { label: '예방 관리면 충분해요', cls: 'vd--ok', icon: 'check' },
} as const;

/** 종합 소견 — 리포트 맨 위. 결론·오늘 할 일부터. */
function VerdictCard({ petName, card }: { petName: string; card: CareCardType }) {
  const v = card.verdict;
  if (!v) return null;
  const u = URGENCY[v.urgency] ?? URGENCY.routine;
  return (
    <section className={`vd ${u.cls}`}>
      <span className="vd-badge"><Icon name={u.icon} size={13} /> {u.label}</span>
      <h3 className="vd-headline">{stripRefs(v.headline)}</h3>
      <p className="vd-summary">{stripRefs(v.summary)}</p>
      {v.todo.length > 0 && (
        <div className="vd-todo">
          <div className="vd-todo-head">오늘 할 일</div>
          <ul>
            {v.todo.map((t, i) => (
              <li key={i}><span className="vd-todo-n">{i + 1}</span>{stripRefs(t)}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="vd-note">※ {petName} 입력 정보 기준 참고 소견이에요. 진단은 수의사만 할 수 있어요.</p>
    </section>
  );
}

/** 입력한 증상에 대한 직접 답변. */
function SymptomCard({ card }: { card: CareCardType }) {
  const s = card.symptomAnswer;
  if (!s || s.causes.length === 0) return null;
  return (
    <Section icon="cross" title="말씀하신 증상, 왜 그럴까요?">
      <div className="sa-block">
        <div className="sa-tag">가능성 높은 원인</div>
        <ol className="sa-causes">
          {s.causes.map((c, i) => <li key={i}>{stripRefs(c)}</li>)}
        </ol>
      </div>
      {s.careNow.length > 0 && (
        <div className="sa-block">
          <div className="sa-tag sa-tag--do">지금 집에서 할 것</div>
          <Bullets items={s.careNow} />
        </div>
      )}
    </Section>
  );
}

/** 평소 케어 챕터 (그루밍·운동·음식·나이별·주기). */
function CareSections({ species, petName, card }: { species: Species; petName: string; card: CareCardType }) {
  const toxic = TOXIC_FOODS[species];
  const goodFoods = Array.from(new Set([...GOOD_FOODS[species], ...card.food.goodFoods]));
  return (
    <>
      <Section icon="scissors" title="그루밍">
        <p>{stripRefs(card.grooming.summary)}</p>
        {card.grooming.cautions.length > 0 && <Bullets items={card.grooming.cautions} warn />}
      </Section>

      <Section icon="activity" title="운동·산책">
        <div className="meta-grid" style={{ marginTop: 0 }}>
          <span className="meta-pill accent">하루 권장<b>{card.exercise.walkMinutesPerDay}</b></span>
        </div>
        <p>{stripRefs(card.exercise.summary)}</p>
        {card.exercise.cautions.length > 0 && <Bullets items={card.exercise.cautions} warn />}
      </Section>

      <Section icon="bowl" title="음식 가이드">
        <div className="food-row">
          <span className="food-tag food-tag--ok">좋아요</span>
          <div className="food-chips">{goodFoods.map((x, i) => <span className="food-chip" key={i}>{x}</span>)}</div>
        </div>
        <div className="food-row">
          <span className="food-tag food-tag--no">절대 금지</span>
          <div className="food-chips">{toxic.map((f) => <span className="food-chip food-chip--no" key={f.name} title={f.reason}>{f.name}</span>)}</div>
        </div>
        <p className="food-reason-note">금지 이유는 항목을 길게 누르면 보여요. 인쇄(PDF)에는 전부 담겨요.</p>
        <div className="food-print-only">
          <ul className="note-list">
            {toxic.map((f) => <li key={f.name}><b>{f.name}</b> — {f.reason}</li>)}
          </ul>
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

    </>
  );
}

/** 병원 신호 챕터. */
function VetSection({ card }: { card: CareCardType }) {
  return (
    <>
      <Section icon="cross" title="이런 신호가 보이면 병원으로" variant="flags">
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
  // 챕터 탭 — 10개 섹션 나열 대신 3개 묶음으로 (인쇄 시엔 전체 출력)
  const [rtab, setRtab] = useState<'now' | 'care' | 'vet'>('now');

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

      {(() => {
        const photoSection = (
          <Section icon="info" title="사진·기본 분석">
            <p>{stripRefs(preview.photoAnalysis.coatSkinNotes)}</p>
            <div className="meta-grid">
              <span className="meta-pill">체형<b>{preview.photoAnalysis.bodyCondition}</b></span>
              <span className="meta-pill">품종 추정<b>{preview.photoAnalysis.breedGuess}</b></span>
            </div>
          </Section>
        );
        const breedSection = (
          <Section icon="tag" title="품종 특성">
            <p>{stripRefs(preview.breedTraits.summary)}</p>
            {preview.breedTraits.healthRisks.length > 0 && (
              <>
                <div className="sub">조심할 질환</div>
                <div className="food-chips" style={{ marginTop: 6 }}>
                  {preview.breedTraits.healthRisks.map((r, i) => <span className="food-chip" key={i}>{stripRefs(r)}</span>)}
                </div>
              </>
            )}
          </Section>
        );

        // 결제 완료 + 카드 로드됨 → 3챕터 탭 (인쇄 시 전체 펼침)
        if (unlocked && premium) {
          return (
            <>
              <div className="report-tabs" role="tablist">
                <button type="button" role="tab" className={rtab === 'now' ? 'on' : ''} onClick={() => setRtab('now')}>
                  <Icon name="info" size={15} /> 지금 상태
                </button>
                <button type="button" role="tab" className={rtab === 'care' ? 'on' : ''} onClick={() => setRtab('care')}>
                  <Icon name="calendar" size={15} /> 케어 방법
                </button>
                <button type="button" role="tab" className={rtab === 'vet' ? 'on' : ''} onClick={() => setRtab('vet')}>
                  <Icon name="cross" size={15} /> 병원 신호
                </button>
              </div>
              <div className={`rtab-panel ${rtab === 'now' ? 'on' : ''}`}>
                <VerdictCard petName={petName} card={premium} />
                <SymptomCard card={premium} />
                {photoSection}
                {breedSection}
              </div>
              <div className={`rtab-panel ${rtab === 'care' ? 'on' : ''}`}>
                <CareSections species={species} petName={petName} card={premium} />
              </div>
              <div className={`rtab-panel ${rtab === 'vet' ? 'on' : ''}`}>
                <VetSection card={premium} />
              </div>
            </>
          );
        }

        // 미결제(미리보기+페이월) 또는 로딩/오류
        return (
          <>
            {photoSection}
            {breedSection}
            {unlocked ? (
              premiumErr ? (
                <div className="alert"><Icon name="alert" size={16} /> 리포트를 불러오지 못했어요. 새로고침해 주세요.</div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)' }}>
                  <span className="spinner" style={{ borderColor: 'rgba(17,160,122,.25)', borderTopColor: 'var(--brand)' }} /> 전체 리포트를 불러오는 중…
                </div>
              )
            ) : (
              <Paywall petName={petName} onUnlock={onUnlock} />
            )}
          </>
        );
      })()}

      <button className="btn btn--secondary btn--block" onClick={onReset}>다른 아이 등록하기</button>

      <SourceBadges sources={preview.sources} />
    </div>
  );
}
