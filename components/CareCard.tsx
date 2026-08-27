'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CareCard as CareCardType, PreviewCard, Species } from '@/lib/types';
import { TOXIC_FOODS, GOOD_FOODS } from '@/lib/petData';
import { daysUntil, dDayLabel } from '@/lib/careSchedule';
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

/** 목록·칩용: 근거 마커 제거 + 문장 끝 마침표 제거(목록은 마침표 없는 게 깔끔). */
function tidy(s: string): string {
  return stripRefs(s).replace(/[.。]\s*$/, '');
}

function Bullets({ items, warn }: { items: string[]; warn?: boolean }) {
  return (
    <ul className={`list ${warn ? 'warn' : ''}`}>
      {items.map((x, i) => (
        <li key={i}>
          <Icon name={warn ? 'alert' : 'check'} size={14} strokeWidth={2} />
          {tidy(x)}
        </li>
      ))}
    </ul>
  );
}

/** 입력한 증상에 대한 직접 답변 — '판별 기준' 중심 (지켜봐도 되는 경우 vs 바로 병원). */
function SymptomCard({ card }: { card: CareCardType }) {
  const s = card.symptomAnswer;
  if (!s || s.causes.length === 0) return null;
  const hasNew = (s.watchOk?.length ?? 0) > 0 || (s.goNow?.length ?? 0) > 0;
  return (
    <Section icon="cross" title="말씀하신 증상, 왜 그럴까요?">
      <div className="sa-block">
        <div className="sa-tag">가능성 높은 원인</div>
        <ol className="sa-causes">
          {s.causes.map((c, i) => <li key={i}>{tidy(c)}</li>)}
        </ol>
      </div>

      {hasNew && (
        <div className="sa-judge">
          {(s.watchOk?.length ?? 0) > 0 && (
            <div className="sa-judge-col sa-judge--ok">
              <div className="sa-judge-head"><Icon name="check" size={14} strokeWidth={2.2} /> 이러면 지켜봐도 돼요</div>
              <ul>{s.watchOk!.map((x, i) => <li key={i}>{tidy(x)}</li>)}</ul>
            </div>
          )}
          {(s.goNow?.length ?? 0) > 0 && (
            <div className="sa-judge-col sa-judge--now">
              <div className="sa-judge-head"><Icon name="alert" size={14} /> 이러면 바로 병원</div>
              <ul>{s.goNow!.map((x, i) => <li key={i}>{tidy(x)}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {(s.homeCheck?.length ?? 0) > 0 && (
        <div className="sa-block">
          <div className="sa-tag">오늘 확인해 보세요</div>
          <Bullets items={s.homeCheck!} />
        </div>
      )}

      {s.careNow.length > 0 && (
        <div className="sa-block">
          <div className="sa-tag sa-tag--do">지금 집에서 할 것</div>
          <Bullets items={s.careNow} />
        </div>
      )}

      {s.vetPrep && (s.vetPrep.tests || s.vetPrep.script) && (
        <div className="sa-vetprep">
          <div className="sa-vetprep-head"><Icon name="cross" size={14} /> 병원 가시면</div>
          {s.vetPrep.tests && <p><b>예상 검사</b> — {stripRefs(s.vetPrep.tests)}</p>}
          {s.vetPrep.script && (
            <p><b>수의사에게 이렇게 말하세요</b><br /><span className="sa-script">&ldquo;{stripRefs(s.vetPrep.script)}&rdquo;</span></p>
          )}
        </div>
      )}

      <p className="sa-caution">
        <Icon name="info" size={13} /> 위 기준은 AI가 정리한 참고 정보예요. &lsquo;괜찮다&rsquo;고 판단하는 근거로 삼지 마시고,
        조금이라도 이상하면 병원 진료가 항상 우선이에요.
      </p>
    </Section>
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

/* ═══════════════════════════════════════════════════════════════════════
   결제 후 전체 리포트 — **문서 한 장**으로 그린다 (2026-08-28).

   그전에는 3개 탭(지금 상태 / 케어 방법 / 병원 신호)이었다. 스캔은 쉬웠지만
   **보고서로 읽히지 않았다.** 2,900원을 내고 받는 것이 탭 UI면 "웹페이지"지만,
   한 장으로 이어지면 "결과지"다. 인쇄·저장·공유가 이 제품의 실제 쓰임인데
   탭은 그 셋 모두와 어긋났다(인쇄하면 어차피 전부 펼쳐야 했다).

   ⚠️ 담지 않기로 한 것들 — 참고한 예시 시안에는 있었지만 근거가 없어 뺐다:
      · **가상의 수의사 코멘트·사진** — 실재하지 않는 사람의 소견은 만들지 않는다.
      · **"3개월 후 피모 +25%" 류의 예측 수치** — 측정한 적 없는 숫자다.
      · **브랜드 사료·영양제 추천** — 우리는 제품 데이터를 갖고 있지 않다.
        대신 체중에서 계산한 **급여량**과 품종 기준 식이 주의사항으로 대체했다.
   ⚠️ '핵심 요약'에 AI를 붙이지 않는다. 이 블록은 전부 데이터에서 계산된 값이고,
      제미나이가 쓰는 것은 보호자가 직접 적은 증상 답변 하나뿐이다(그 블록에만 표시한다).
   ═══════════════════════════════════════════════════════════════════════ */

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

/** "2026-08-28" → "2026.08.28". 값이 없거나 형식이 다르면 그리지 않는다. */
function dotDate(ymd?: string): string | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  return ymd.replace(/-/g, '.');
}

function RpCard({ title, icon, tone, children, wide }: {
  title: string; icon: string; tone?: string; children: ReactNode; wide?: boolean;
}) {
  return (
    <section className={`rp-card ${wide ? 'rp-card--wide' : ''}`}>
      <div className="rp-card-head">
        <span className={`rp-ico ${tone ?? ''}`}><Icon name={icon} size={17} /></span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

/** 프로필 — 사진 대신 이름 첫 글자. 사진 분석을 폐지해서 올릴 사진 자체가 없다. */
function ProfileCard({ petName, species, card }: { petName: string; species: Species; card: CareCardType }) {
  const p = card.profile;
  if (!p) return null;
  const chips = [p.breedKo, p.ageLabel, p.sexKo].filter(Boolean);
  return (
    <div className="rp-profile">
      <div className="rp-avatar" aria-hidden>{petName.trim().charAt(0) || (species === 'dog' ? '견' : '묘')}</div>
      <div className="rp-profile-main">
        <h2 className="rp-name">{petName}</h2>
        <div className="rp-profile-chips">{chips.join(' · ')}</div>
      </div>
      <dl className="rp-stats">
        <div>
          <dt>체중</dt>
          <dd>{p.weightKg ? `${p.weightKg} kg` : '미입력'}</dd>
        </div>
        <div>
          <dt>체형</dt>
          <dd className={p.bodyTone ? `rp-t-${p.bodyTone}` : ''}>{p.bodyLabel ?? p.sizeLabel ?? '—'}</dd>
        </div>
        <div>
          <dt>활동량</dt>
          <dd>{p.activityLabel}</dd>
        </div>
        <div>
          <dt>건강 상태</dt>
          <dd className={`rp-h-${p.healthTone}`}>{p.healthLabel}</dd>
        </div>
      </dl>
    </div>
  );
}

/** 핵심 요약 — 소견 + 지금 챙길 것 3가지. */
function SummaryCard({ petName, card }: { petName: string; card: CareCardType }) {
  const v = card.verdict;
  const p = card.profile;
  const risks = card.breedTraits.healthRisks.slice(0, 2).map((r) => tidy(r).split('—')[0].trim());
  const nextCheck = card.schedule?.find((s) => s.type === 'checkup');
  return (
    <RpCard title="핵심 요약" icon="activity" tone="rp-ico--green">
      <div className="rp-sum">
        <div className={`rp-sum-state rp-h-${p?.healthTone ?? 'routine'}`}>
          <span className="rp-sum-label">현재 건강 상태</span>
          <strong>{p?.healthLabel ?? '—'}</strong>
          {v && <p>{stripRefs(v.summary)}</p>}
        </div>
        <ul className="rp-sum-rows">
          {risks.length > 0 && (
            <li>
              <span className="rp-row-ico"><Icon name="shield" size={15} /></span>
              <div><b>주의가 필요한 부분</b>{risks.join(' · ')}</div>
            </li>
          )}
          <li>
            <span className="rp-row-ico"><Icon name="repeat" size={15} /></span>
            <div><b>이번 주 집중 케어</b>{(card.weekly ?? [card.routine.grooming]).slice(0, 2).join(' · ')}</div>
          </li>
          {nextCheck && (
            <li>
              <span className="rp-row-ico"><Icon name="calendar" size={15} /></span>
              <div><b>다음 검진</b>{nextCheck.title.replace(/^정기 /, '')} · {dotDate(nextCheck.dueDate)}</div>
            </li>
          )}
        </ul>
      </div>
      {v && v.todo.length > 0 && (
        <div className="rp-todo">
          <div className="rp-todo-head">{petName}에게 오늘 할 일</div>
          <ol>{v.todo.map((t, i) => <li key={i}>{tidy(t)}</li>)}</ol>
        </div>
      )}
    </RpCard>
  );
}

/** 관리 꿀팁 — 품종 데이터의 미용·운동·호발 질환에서 뽑는다. */
function TipsCard({ card }: { card: CareCardType }) {
  const tips = [
    { icon: 'scissors', title: '털 · 피부 관리', body: stripRefs(card.grooming.summary) },
    { icon: 'activity', title: '운동 · 산책', body: `하루 ${card.exercise.walkMinutesPerDay}. ${stripRefs(card.exercise.summary)}` },
    ...card.breedTraits.healthRisks.slice(0, 1).map((r) => {
      const [name, note] = tidy(r).split('—').map((x) => x.trim());
      return { icon: 'shield', title: `${name} 관리`, body: note || '정기 검진으로 미리 확인하는 것이 좋아요.' };
    }),
  ];
  // 품종 데이터의 미용·운동 주의사항 — 옛 리포트에서 '그루밍/운동' 섹션에만 있던 내용이다.
  const cautions = [...card.grooming.cautions, ...card.exercise.cautions].map(tidy);
  return (
    <RpCard title="맞춤 관리 꿀팁" icon="sparkle" tone="rp-ico--sage">
      <ul className="rp-tips">
        {tips.map((t) => (
          <li key={t.title}>
            <span className="rp-tip-ico"><Icon name={t.icon} size={16} /></span>
            <div><b>{t.title}</b><p>{t.body}</p></div>
          </li>
        ))}
      </ul>
      {cautions.length > 0 && (
        <>
          <div className="rp-sub">이 품종에서 특히 챙길 것</div>
          <ul className="rp-notes">{cautions.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </>
      )}
    </RpCard>
  );
}

/** 식단 — 브랜드 추천 대신 **체중에서 계산한 급여량**과 품종 기준 주의사항. */
function FoodCard({ species, petName, card }: { species: Species; petName: string; card: CareCardType }) {
  const f = card.feeding;
  const goodFoods = Array.from(new Set([...GOOD_FOODS[species], ...card.food.goodFoods]));
  return (
    <RpCard title="맞춤 식단 · 영양" icon="bowl" tone="rp-ico--green">
      {f && (
        <div className="rp-feed">
          <div className="rp-feed-num">
            <span>하루 급여량</span>
            <strong>{f.dailyGram ?? '체중을 넣으면 계산돼요'}</strong>
            {/* kcal을 함께 보여주는 이유: 사료 포장지에는 kcal/kg이 찍혀 있어서,
                열량을 알면 보호자가 자기 사료 기준으로 정확히 환산할 수 있다. */}
            {f.dailyKcal && <i>{f.dailyKcal}</i>}
            <em>{f.meals}</em>
          </div>
          <ul className="rp-feed-notes">
            {f.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
      <div className="rp-sub">이런 건 줘도 괜찮아요</div>
      <div className="rp-chips">{goodFoods.map((x) => <span key={x}>{x}</span>)}</div>
      {card.food.cautionFoods.length > 0 && (
        <>
          <div className="rp-sub">{petName} 품종에서 특히 주의</div>
          <ul className="rp-notes">{card.food.cautionFoods.map((x, i) => <li key={i}>{stripRefs(x)}</li>)}</ul>
        </>
      )}
    </RpCard>
  );
}

/** 금지 음식 — 검증된 표를 격자로. 이유는 인쇄본에 전부 들어간다. */
function ToxicCard({ species, petName }: { species: Species; petName: string }) {
  const toxic = TOXIC_FOODS[species];
  return (
    <RpCard title="먹으면 안 되는 음식" icon="alert" tone="rp-ico--rose">
      <div className="rp-toxic">
        {toxic.map((f) => (
          <div key={f.name} className={`rp-toxic-item ${f.severity === 'danger' ? 'is-danger' : ''}`} title={f.reason}>
            <b>{f.name}</b>
            <span>{f.reason}</span>
          </div>
        ))}
      </div>
      <p className="rp-foot-note">위 음식은 {petName}에게 중독 증상을 일으킬 수 있어요. 먹었다면 양과 시각을 확인해 병원에 먼저 연락하세요.</p>
    </RpCard>
  );
}

/** 접종·검진 일정 — 저장된 날짜에서 D-day를 **볼 때마다 다시** 센다. */
function ScheduleCard({ card }: { card: CareCardType }) {
  const rows = card.schedule ?? [];
  if (rows.length === 0) return null;
  return (
    <RpCard title="예방접종 · 건강 관리 일정" icon="calendar" tone="rp-ico--green">
      <ol className="rp-timeline">
        {rows.map((s) => {
          const left = daysUntil(s.dueDate);
          return (
            <li key={s.title + s.dueDate}>
              <span className="rp-tl-dot" aria-hidden />
              <div className="rp-tl-body">
                <b>{s.title}</b>
                <span className="rp-tl-date">{dotDate(s.dueDate)}</span>
              </div>
              <span className={`rp-dday ${left <= 7 ? 'is-soon' : ''}`}>{dDayLabel(s.dueDate)}</span>
            </li>
          );
        })}
      </ol>
      <p className="rp-foot-note">
        마지막 접종일을 입력하지 않은 항목은 <b>병원에서 이력 확인</b>으로 잡혀 있어요. 실제 접종은 수의사와 확인해 주세요.
      </p>
    </RpCard>
  );
}

/** 주간 체크리스트 — 인쇄해서 쓰는 표라 화면에서도 채워지지 않는다(가짜 저장을 만들지 않는다). */
function WeeklyCard({ card }: { card: CareCardType }) {
  const items = card.weekly ?? [];
  if (items.length === 0) return null;
  return (
    <RpCard title="주간 케어 체크리스트" icon="check" tone="rp-ico--amber">
      <div className="rp-week">
        {items.map((it) => (
          <div className="rp-week-row" key={it}>
            <span className="rp-week-label">{it}</span>
            <span className="rp-week-days">
              {WEEKDAYS.map((d) => <span key={d} className="rp-dot">{d}</span>)}
            </span>
          </div>
        ))}
      </div>
      <p className="rp-foot-note">인쇄해서 눈에 띄는 곳에 붙여두고 하나씩 지워가면 좋아요.</p>
    </RpCard>
  );
}

/**
 * 나이별 케어 + 권장 주기.
 * ⚠️ 옛 3탭 리포트의 '나이별 케어'·'권장 주기' 섹션이 여기로 왔다. 체중 판정·생애 단계·중성화
 *    안내는 **입력값으로만 만들어지는 개인화 내용**이라, 문서로 바꾸면서 빠뜨리면
 *    유료 리포트에서 가장 개인적인 부분이 사라진다.
 */
function AgeRoutineCard({ card }: { card: CareCardType }) {
  const tips = card.ageCare.tips;
  return (
    <RpCard title={`나이별 케어 · ${card.ageCare.stage}`} icon="calendar" tone="rp-ico--sage">
      {tips.length > 0 && (
        <ul className="rp-notes">
          {tips.map((t, i) => {
            const [head, ...rest] = tidy(t).split('—');
            return <li key={i}><b>{head.trim()}</b>{rest.length > 0 && ` — ${rest.join('—').trim()}`}</li>;
          })}
        </ul>
      )}
      <div className="rp-sub">권장 주기</div>
      <dl className="rp-routine">
        <div><dt>목욕</dt><dd>{card.routine.bath}</dd></div>
        <div><dt>산책·놀이</dt><dd>{card.routine.walk}</dd></div>
        <div><dt>빗질·미용</dt><dd>{card.routine.grooming}</dd></div>
      </dl>
    </RpCard>
  );
}

function ReportDocument({ species, petName, card, onReset }: {
  species: Species; petName: string; card: CareCardType; onReset: () => void;
}) {
  const made = dotDate(card.generatedAt);
  return (
    <div className="rp">
      <header className="rp-top">
        <span className="rp-brand"><span className="rp-brand-mark"><Icon name="paw" size={15} filled /></span>mypet</span>
        {made && <span className="rp-made">생성일 {made}</span>}
      </header>

      <div className="rp-hero">
        <div>
          <h1 className="rp-title">우리 아이를 위한<br /><em>맞춤 케어 보고서</em></h1>
          <p className="rp-lede">
            수의사 가이드라인과 188개 품종 데이터를 기반으로<br />{petName}에게 맞는 관리 방법을 정리했어요.
          </p>
        </div>
        <ProfileCard petName={petName} species={species} card={card} />
      </div>

      <div className="rp-grid">
        <SummaryCard petName={petName} card={card} />
        <TipsCard card={card} />
        <FoodCard species={species} petName={petName} card={card} />
        <ToxicCard species={species} petName={petName} />
        <ScheduleCard card={card} />
        <WeeklyCard card={card} />
        <AgeRoutineCard card={card} />
      </div>

      {card.symptomAnswer && card.symptomAnswer.causes.length > 0 && (
        <div className="rp-wide"><SymptomCard card={card} /></div>
      )}

      <div className="rp-wide rp-vet">
        <VetSection card={card} />
      </div>

      <div className="rp-close">
        <b>{petName} 맞춤 케어를 꾸준히 실천하면</b>
        <span>더 건강하고 행복한 반려 생활을 함께할 수 있어요</span>
      </div>

      <SourceBadges sources={card.sources} />
      <button className="btn btn--secondary btn--block" onClick={onReset} style={{ marginTop: 14 }}>
        다른 아이 등록하기
      </button>
    </div>
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
  /*
    ⚠️ 2026-08-28 사진 분석 폐지. 옛 리포트에는 photoAnalysis가 남아 있어 있으면 그대로 쓰고,
       없으면 '입력 정보 기준'으로 표기한다. 없는 값을 그럴듯하게 채우지 않는다.
  */
  // PreviewCard 타입에서는 이미 빠졌지만, 옛 리포트 데이터에는 값이 남아 있다.
  const pa = (preview as { photoAnalysis?: CareCardType['photoAnalysis'] }).photoAnalysis;
  const conf = pa?.confidence;

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

  // 결제 완료 + 카드 로드됨 → **문서형 전체 리포트**. 아래 미리보기 껍데기를 타지 않는다.
  if (unlocked && premium) {
    return <ReportDocument species={species} petName={petName} card={premium} onReset={onReset} />;
  }


  return (
    <div className="report">
      {/* 리포트 헤더 */}
      <div className="report-hero">
        <div>
          <div className="report-eyebrow">맞춤 케어 리포트</div>
          <h2 className="report-title">{petName}</h2>
          <div className="report-chips">
            <span className="chip chip--solid">{speciesKo}</span>
            {pa?.breedGuess && <span className="chip">{pa.breedGuess}</span>}
            {conf && conf !== 'low'
              ? <span className={`chip conf-${conf}`}>신뢰도 {CONF_KO[conf] ?? conf}</span>
              : <span className="chip">입력 정보 기준</span>}
          </div>
        </div>
        <button className="btn btn--ghost" onClick={onReset}>
          <Icon name="refresh" size={14} /> 다시
        </button>
      </div>

      {(() => {
        // 옛 리포트에만 있는 블록. 새 리포트는 사진을 읽지 않으므로 그리지 않는다.
        const photoSection = pa ? (
          <Section icon="info" title="사진·기본 분석">
            <p>{stripRefs(pa.coatSkinNotes)}</p>
            <div className="meta-grid">
              <span className="meta-pill">체형<b>{pa.bodyCondition}</b></span>
              <span className="meta-pill">품종 추정<b>{pa.breedGuess}</b></span>
            </div>
          </Section>
        ) : null;
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
      {!(unlocked && premium) && <SourceBadges sources={preview.sources} />}
    </div>
  );
}
