'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CareCard as CareCardType, PreviewCard, Species } from '@/lib/types';
import { TOXIC_FOODS, GOOD_FOODS } from '@/lib/petData';
import { daysUntil, dDayLabel } from '@/lib/careSchedule';
import { parseWeightRange } from '@/lib/guidePersonal';
import { getBreedTips } from '@/lib/breedTips';
import { diseaseSign } from '@/lib/diseaseSigns';
import { Icon } from './icons';
import { TagMark } from './Brand';
import WeightRuler from './WeightRuler';
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

/** 목록·칩용: 근거 마커 제거 + 문장 끝 마침표 제거(목록은 마침표 없는 게 깔끔). */
function tidy(s: string): string {
  return stripRefs(s).replace(/[.。]\s*$/, '');
}

/** 「이름 — 설명」 문장을 굵은 머리와 본문으로 나눈다. 없으면 통째로 본문. */
function headBody(s: string): { head: string | null; body: string } {
  const [head, ...rest] = tidy(s).split('—');
  if (rest.length === 0) return { head: null, body: head.trim() };
  return { head: head.trim(), body: rest.join('—').trim() };
}

/* ═══════════════════════════════════════════════════════════════════════
   결제 후 전체 리포트 — **문서 한 장** (2026-09-26 「건강수첩」 판)

   인쇄·PDF 저장·공유가 이 제품의 실제 쓰임이다. 그래서 화면도 문서처럼 그린다:
   머리(발행일) → 이름과 기본 정보 → 네 칸 요약 → 체중 눈금자 → 번호 붙은 절.
   절 번호는 장식이 아니라 인쇄본에서 「3번 식단」처럼 가리키기 위한 것이다.

   ⚠️ 담지 않기로 한 것들 — 근거가 없어 뺐다:
      · **가상의 수의사 코멘트·사진** — 실재하지 않는 사람의 소견은 만들지 않는다.
      · **"3개월 후 피모 +25%" 류의 예측 수치** — 측정한 적 없는 숫자다.
      · **브랜드 사료·영양제 추천** — 우리는 제품 데이터를 갖고 있지 않다.
   ⚠️ 「AI」 표시는 보호자가 직접 적은 증상에 AI(Gemini)가 답한 절에만 붙인다.
      나머지는 전부 품종 데이터와 수의 지침의 표·계산식이다(lib/careCardFromData.ts).
   ═══════════════════════════════════════════════════════════════════════ */

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const HEALTH_TAG: Record<string, string> = { routine: 'tag--ok', soon: 'tag--warn', now: 'tag--danger' };
const BODY_TAG: Record<string, string> = { ok: 'tag--ok', warn: 'tag--warn', info: 'tag--info' };

/** "2026-08-28" → "2026.08.28". 값이 없거나 형식이 다르면 그리지 않는다. */
function dotDate(ymd?: string): string | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  return ymd.replace(/-/g, '.');
}

function Sec({ n, title, ai, children }: { n: number; title: string; ai?: boolean; children: ReactNode }) {
  return (
    <section className="doc-sec">
      <h2>
        <span className="doc-n">{n}</span>
        <span>{title}{ai && <span className="doc-ai" title="보호자가 적은 증상에 AI(Gemini)가 답한 부분">AI</span>}</span>
      </h2>
      {children}
    </section>
  );
}

function List({ items, warn }: { items: string[]; warn?: boolean }) {
  return (
    <ul className={`doc-list ${warn ? 'doc-list--warn' : ''}`}>
      {items.map((x, i) => <li key={i}>{tidy(x)}</li>)}
    </ul>
  );
}

/** 결제 후 리포트 문서. 랜딩의 「리포트 미리보기」도 같은 컴포넌트를 쓴다(onReset 없이). */
export function ReportDocument({ species, petName, card, onReset }: {
  species: Species; petName: string; card: CareCardType; onReset?: () => void;
}) {
  const p = card.profile;
  const v = card.verdict;
  const made = dotDate(card.generatedAt);
  const range = parseWeightRange(p?.weightRange);
  const sa = card.symptomAnswer;
  const hasSym = !!sa && sa.causes.length > 0;
  const aiUsed = !!sa && (sa.ai ?? (sa.watchOk?.length ?? 0) > 0);
  const f = card.feeding;
  const goodFoods = Array.from(new Set([...GOOD_FOODS[species], ...card.food.goodFoods]));
  const toxic = TOXIC_FOODS[species];
  const schedule = card.schedule ?? [];
  const weekly = card.weekly ?? [];
  const risks = card.breedTraits.healthRisks.map(headBody);
  const nextCheck = schedule.find((s) => s.type === 'checkup');
  const careCautions = [...card.grooming.cautions, ...card.exercise.cautions].map(tidy);
  const tips = p ? getBreedTips(species, p.breedKo) : [];
  // 옛 카드의 redFlags에는 품종 질환 문장이 섞여 있다 — 질환은 따로 보여 주므로 여기서는 뺀다
  const riskNames = risks.map((r) => r.head).filter(Boolean) as string[];
  const urgentFlags = card.redFlags.filter((f) => !riskNames.some((nm) => f.startsWith(nm)));

  // 절 번호 — 빠지는 절(증상·일정)이 있어도 번호가 건너뛰지 않게 그릴 때 센다
  let n = 0;
  const next = () => ++n;

  const speciesKo = species === 'dog' ? '강아지' : '고양이';
  const bodyTag = p?.bodyTone ? BODY_TAG[p.bodyTone] : 'tag--info';

  return (
    <article className="doc">
      {/*
        머리는 랜딩 첫 화면의 「케어 기록지」와 같은 모양이다 — 광고에서 본 그 종이를 그대로 받는다.
        예전에는 로고 줄 → 제목 → 숫자 4칸 → 눈금자로 따로 놀아서, 랜딩에서 약속한 모양과 달랐다.
      */}
      <div className="sheet-head doc-head">
        <span className="doc-brand"><TagMark size={16} /> mypet 케어 리포트</span>
        {made && <span>{made} 발행</span>}
      </div>
      <div className="sheet-name doc-name">
        <h1>{petName}</h1>
        <span>{speciesKo}{p?.sexKo ? `, ${p.sexKo}` : ''}</span>
      </div>
      {p && (
        <>
          <div className="sheet-row">
            <span className="sheet-k">품종</span>
            <span className="sheet-v">{p.breedKo}{p.sizeLabel && <small>{p.sizeLabel}{species === 'dog' ? '견' : '묘'}</small>}</span>
          </div>
          {p.ageLabel && (
            <div className="sheet-row">
              <span className="sheet-k">나이</span>
              <span className="sheet-v num">{p.ageLabel}{p.humanAgeYears && <small>사람 나이로 약 {p.humanAgeYears}살</small>}</span>
            </div>
          )}
          <div className={`sheet-row ${p.weightKg && range ? 'sheet-row--ruler' : ''}`}>
            <div className="sheet-line">
              <span className="sheet-k">체중</span>
              <span className="sheet-v num">
                {p.weightKg ? `${p.weightKg}kg` : '미입력'}
                {p.bodyLabel && <span className={`tag ${bodyTag}`}>{p.bodyLabel}</span>}
                {range && <small>표준 {range[0]}~{range[1]}kg</small>}
              </span>
            </div>
            {p.weightKg && range && <WeightRuler weight={p.weightKg} range={range} animate={false} />}
          </div>
          <div className="sheet-row">
            <span className="sheet-k">하루 운동</span>
            <span className="sheet-v">{p.activityLabel}</span>
          </div>
          <div className="sheet-row">
            <span className="sheet-k">증상</span>
            <span className="sheet-v"><span className={`tag ${HEALTH_TAG[p.healthTone]}`} style={{ marginLeft: 0 }}>{p.healthLabel}</span></span>
          </div>
        </>
      )}

      <Sec n={next()} title="요약">
        {v && (
          <>
            <p className="doc-headline">{v.headline}</p>
            <p className="doc-lead">{stripRefs(v.summary)}</p>
          </>
        )}
        <dl className="doc-kv" style={{ marginTop: 16 }}>
          {risks.length > 0 && (<><dt>주의할 질환</dt><dd>{risks.slice(0, 3).map((r) => r.head ?? r.body).join(', ')}</dd></>)}
          <dt>이번 주 관리</dt><dd>{(weekly.length ? weekly : [card.routine.grooming]).slice(0, 2).join(', ')}</dd>
          {nextCheck && (<><dt>다음 검진</dt><dd className="num">{dotDate(nextCheck.dueDate)}</dd></>)}
        </dl>
        {v && v.todo.length > 0 && (
          <>
            <h3>{petName}에게 오늘 할 일</h3>
            {/* 인쇄해서 한 칸씩 표시할 수 있게 체크 칸으로 */}
            <ul className="doc-check">{v.todo.map((t, i) => <li key={i}>{tidy(t)}</li>)}</ul>
          </>
        )}
      </Sec>

      {hasSym && (
        <Sec n={next()} title="걱정되는 증상" ai={aiUsed}>
          <h3 style={{ marginTop: 0 }}>가능한 원인</h3>
          {/* 원인이 하나뿐이면 번호를 붙이지 않는다 — 「1」만 덩그러니 있으면 목록이 아니다 */}
          {sa!.causes.length === 1 ? (
            (() => {
              const hb = headBody(sa!.causes[0]);
              return hb.head ? <ul className="doc-tips"><li><b>{hb.head}</b><span>{hb.body}</span></li></ul> : <p>{hb.body}</p>;
            })()
          ) : (
            <ol className="doc-ol">
              {sa!.causes.map((c, i) => {
                const hb = headBody(c);
                return <li key={i}>{hb.head ? <><b>{hb.head}</b><br />{hb.body}</> : hb.body}</li>;
              })}
            </ol>
          )}
          {((sa!.watchOk?.length ?? 0) > 0 || (sa!.goNow?.length ?? 0) > 0) && (
            <div className="doc-judge">
              {(sa!.watchOk?.length ?? 0) > 0 && (
                <div className="ok"><h3>지켜보며 기록할 경우</h3><List items={sa!.watchOk!} /></div>
              )}
              {(sa!.goNow?.length ?? 0) > 0 && (
                <div className="now"><h3>이런 경우는 바로 병원으로</h3><List items={sa!.goNow!} warn /></div>
              )}
            </div>
          )}
          {(sa!.homeCheck?.length ?? 0) > 0 && (<><h3>오늘 확인해 보세요</h3><List items={sa!.homeCheck!} /></>)}
          {sa!.careNow.length > 0 && (<><h3>지금 집에서 할 것</h3><List items={sa!.careNow} /></>)}
          {sa!.vetPrep && (sa!.vetPrep.tests || sa!.vetPrep.script) && (
            <>
              <h3>병원에 가시면</h3>
              {sa!.vetPrep.tests && <p>{stripRefs(sa!.vetPrep.tests)}</p>}
              {sa!.vetPrep.script && <p className="doc-quote">수의사에게 이렇게 전해 주세요. &ldquo;{stripRefs(sa!.vetPrep.script)}&rdquo;</p>}
            </>
          )}
          <p className="doc-note">
            {aiUsed ? '적어 주신 내용에 대한 답은 AI가 정리했어요. ' : ''}
            괜찮다고 판단하는 근거로 쓰지 마시고, 조금이라도 이상하면 동물병원 진료가 먼저예요.
          </p>
        </Sec>
      )}

      <Sec n={next()} title="식단">
        {f && (
          <div className="doc-feed">
            <dl className="doc-feed-num">
              <dt>하루 급여량</dt>
              <dd>
                {f.dailyKcal ?? '체중을 입력하지 않아 계산하지 않았어요'}
                {f.dailyGram ? <small>건사료 {f.dailyGram}, {f.meals}</small> : <small>{f.meals}</small>}
              </dd>
            </dl>
            <ul className="doc-list">{f.notes.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        )}
        <h3>줘도 괜찮은 것</h3>
        <div className="doc-foods">{goodFoods.map((x) => <span key={x}>{x}</span>)}</div>
        {card.food.cautionFoods.length > 0 && (
          <>
            <h3>{p?.breedKo ?? '이 품종'} 식단에서 주의할 것</h3>
            <List items={card.food.cautionFoods} />
          </>
        )}
      </Sec>

      <Sec n={next()} title="먹으면 안 되는 음식">
        <div className="doc-toxic">
          {toxic.map((t) => (
            <div key={t.name} className={t.severity === 'danger' ? 'is-danger' : ''}>
              <b>{t.name}</b>
              <span>{t.reason}</span>
            </div>
          ))}
        </div>
        <p className="doc-note">빨간 점은 적은 양으로도 위험한 것, 주황 점은 피하는 게 좋은 것이에요. 먹었다면 무엇을, 언제, 얼마나 먹었는지 확인하고 동물병원에 먼저 전화하세요.</p>
      </Sec>

      {schedule.length > 0 && (
        <Sec n={next()} title="예방접종·검진 일정">
          <table className="doc-table">
            <thead><tr><th>항목</th><th>예정일</th><th>남은 날</th></tr></thead>
            <tbody>
              {schedule.map((s) => {
                const left = daysUntil(s.dueDate);
                // 마지막 접종일을 몰라 날짜를 계산하지 않은 항목(옛 리포트는 「병원에서 … 확인」이라는 이름)
                const unknown = /확인/.test(s.title) && s.type === 'vaccine';
                return (
                  <tr key={s.title + s.dueDate}>
                    <td>{s.title.replace(/\s*—\s*병원에서\s*/, ' ')}</td>
                    <td className="num">{unknown ? '—' : dotDate(s.dueDate)}</td>
                    <td className={`num dday ${!unknown && left <= 7 ? 'is-soon' : ''}`}>{unknown ? '병원에서 확인' : dDayLabel(s.dueDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="doc-note">「병원에서 확인」 항목은 마지막 접종일을 몰라 날짜를 계산하지 않았어요. 한 달 안에 다니는 병원에서 접종 이력을 확인해 주세요. 실제 접종 일정은 수의사와 정해 주세요.</p>
        </Sec>
      )}

      <Sec n={next()} title="관리 포인트">
        {tips.length > 0 && (
          <ul className="doc-tips" style={{ marginBottom: 18 }}>
            {tips.map((t) => <li key={t.title}><b>{t.title}</b><span>{t.body}</span></li>)}
          </ul>
        )}
        <dl className="doc-kv">
          <dt>털·피부</dt><dd>{stripRefs(card.grooming.summary)}</dd>
          <dt>{species === 'cat' ? '놀이' : '운동'}</dt><dd>{species === 'cat' ? card.exercise.walkMinutesPerDay : `하루 ${card.exercise.walkMinutesPerDay}`}. {stripRefs(card.exercise.summary)}</dd>
        </dl>
        {careCautions.length > 0 && (<><h3>이 품종에서 특히 챙길 것</h3><List items={careCautions} /></>)}
      </Sec>

      <Sec n={next()} title={`나이별 관리 (${card.ageCare.stage})`}>
        {card.ageCare.tips.length > 0 && (
          <ul className="doc-list">
            {card.ageCare.tips.map((t, i) => {
              const hb = headBody(t);
              return <li key={i}>{hb.head ? <><b>{hb.head}</b>. {hb.body}</> : hb.body}</li>;
            })}
          </ul>
        )}
        <h3>권장 주기</h3>
        <dl className="doc-kv">
          <dt>목욕</dt><dd>{card.routine.bath}</dd>
          <dt>산책·놀이</dt><dd>{card.routine.walk}</dd>
          <dt>빗질·미용</dt><dd>{card.routine.grooming}</dd>
        </dl>
      </Sec>

      {weekly.length > 0 && (
        <Sec n={next()} title="주간 체크리스트">
          <table className="doc-table doc-week">
            <thead><tr><th>할 일</th>{WEEKDAYS.map((d) => <th key={d} className="box">{d}</th>)}</tr></thead>
            <tbody>
              {weekly.map((it) => (
                <tr key={it}><td>{it}</td>{WEEKDAYS.map((d) => <td key={d} className="box"><span aria-hidden /></td>)}</tr>
              ))}
            </tbody>
          </table>
          <p className="doc-note">인쇄해서 눈에 띄는 곳에 붙여 두고 한 칸씩 표시해 보세요.</p>
        </Sec>
      )}

      <Sec n={next()} title="병원에 가야 하는 신호">
        {/*
          옛 리포트는 품종 질환을 「○○ 증상이 보이면 진료를 받아 보세요」로 세 번 반복해 적었다.
          질환은 아래에 이름과 설명으로 따로 두고, 여기에는 눈으로 확인할 수 있는 응급 신호만 남긴다.
        */}
        <List items={urgentFlags} warn />
        {risks.length > 0 && (
          <>
            <h3>{p?.breedKo ?? '이 품종'}에서 자주 보고되는 질환</h3>
            <ul className="doc-list">
              {risks.map((r, i) => (
                <li key={i}>
                  {r.head ? <><b>{r.head}</b>. {r.body}</> : r.body}
                  {diseaseSign(r.head ?? r.body) && <span className="doc-sign"><em>이럴 때 병원에</em> {diseaseSign(r.head ?? r.body)}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </Sec>

      {card.sources && card.sources.length > 0 && (
        <div className="doc-sources">
          품종 정보 출처{' '}
          {card.sources.map((s, i) => (
            <span key={i}>
              {i > 0 && ', '}
              {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.org}</a> : s.org}
            </span>
          ))}
          . 예방접종 주기는 WSAVA·AAHA, 심장사상충은 CAPC, 금지 음식은 ASPCA 자료를 따랐어요.
        </div>
      )}
      <div className="doc-end">
        이 리포트는 품종 표준과 수의 지침으로 계산한 일반적인 관리 정보이며, 수의사의 진찰과 진료를 대신하지 않아요.
        {onReset && (
          <button type="button" className="btn btn--quiet no-print" style={{ display: 'flex', marginTop: 10, paddingLeft: 0 }} onClick={onReset}>
            다른 아이 리포트 만들기
          </button>
        )}
      </div>
    </article>
  );
}

/* ── 아래는 옛 로그인 기능(/pets·/create)의 미리보기·잠금 화면. 스타일은 app/legacy.css ── */

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

  // 결제 완료 + 카드 로드됨 → **문서형 전체 리포트**.
  if (unlocked && premium) {
    return <ReportDocument species={species} petName={petName} card={premium} onReset={onReset} />;
  }

  return (
    <div className="report">
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

      {pa && (
        <Section icon="info" title="사진·기본 분석">
          <p>{stripRefs(pa.coatSkinNotes)}</p>
          <div className="meta-grid">
            <span className="meta-pill">체형<b>{pa.bodyCondition}</b></span>
            <span className="meta-pill">품종 추정<b>{pa.breedGuess}</b></span>
          </div>
        </Section>
      )}
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
      {unlocked ? (
        premiumErr ? (
          <div className="alert"><Icon name="alert" size={16} /> 리포트를 불러오지 못했어요. 새로고침해 주세요.</div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)' }}>
            <span className="spinner spinner--ink" /> 전체 리포트를 불러오는 중
          </div>
        )
      ) : (
        <Paywall petName={petName} onUnlock={onUnlock} />
      )}

      <button className="btn btn--secondary btn--block" onClick={onReset}>다른 아이 등록하기</button>
      <SourceBadges sources={preview.sources} />
    </div>
  );
}
