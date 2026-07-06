'use client';

import { useState, useEffect, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PetInput, Species, Sex } from '@/lib/types';
import type { BreedGuide } from '@/lib/diagnose';
import { Icon } from './icons';
import SourceBadges from './SourceBadges';
import { fileToImage } from '@/lib/imageClient';
import { SITE } from '@/lib/site';
import { SYMPTOMS, SYMPTOM_INFO, symptomLabels, detectEmergency } from '@/lib/symptomData';
import { parseWeightRange, humanAge, weightCheck, stagePoint, neuterTip, type PersonalCheck } from '@/lib/guidePersonal';
import { getBreedTips } from '@/lib/breedTips';

const PAYMENTS_LIVE = !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const LS_KEY = 'mypet_diagnose_v1';

type Foods = { good: string[]; toxic: { name: string; reason: string; severity: string }[] };
type GuideResult = { guide: BreedGuide; ageLabel: string | null; foods: Foods };

/** "몇 살" → 내부 birth("YYYY-MM") 근사값. */
function ageToBirth(age: string): string | undefined {
  const n = Number(age);
  if (!age || isNaN(n) || n < 0 || n > 40) return undefined;
  const now = new Date();
  return `${now.getFullYear() - Math.floor(n)}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function GuideCard({
  icon, title, variant, collapsible, defaultOpen, count, children,
}: {
  icon: string; title: string; variant?: string; collapsible?: boolean; defaultOpen?: boolean; count?: number; children: ReactNode;
}) {
  const head = (
    <>
      <span className="section-ico"><Icon name={icon} size={18} /></span>
      <h3 className="section-title">{title}</h3>
      {count != null && <span className="section-count">{count}</span>}
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
function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list">
      {items.map((x, i) => (<li key={i}><Icon name="check" size={14} strokeWidth={2} />{x}</li>))}
    </ul>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="stepbar">
      <span className={`stepbar-item ${step >= 1 ? 'on' : ''}`}><span className="stepbar-n">1</span>무료 정보</span>
      <span className="stepbar-line" />
      <span className={`stepbar-item ${step >= 2 ? 'on' : ''}`}><span className="stepbar-n">2</span>AI 맞춤 진단</span>
    </div>
  );
}

/** 1단계 무료 가이드 — 입력값 기반 맞춤 체크 + 슬림 스냅샷 + 결제 유도 잠금 카드. */
function GuideView({
  result, name, speciesKo, species, breed, symptomIds, age, weight, sex, neutered, onNext, onEdit,
}: {
  result: GuideResult; name: string; speciesKo: string; species: Species; breed: string; symptomIds: string[];
  age: string; weight: string; sex: Sex | ''; neutered: '' | 'yes' | 'no';
  onNext: () => void; onEdit: () => void;
}) {
  const { guide, ageLabel, foods } = result;

  // ── 입력값 × 품종 DB 맞춤 체크 (AI 불필요 — 즉시 판정) ──
  const months = age !== '' && !isNaN(Number(age)) ? Math.max(0, Number(age)) * 12 : null;
  const personAge = months != null && guide.matched ? humanAge(species, months, guide.size) : null;
  const jointRisk = (guide.hereditary ?? []).some((h) => /슬개골|고관절|관절/.test(h.name));
  const checks = [
    weightCheck({
      name, breedKo: guide.breedKo ?? speciesKo,
      weight: weight ? Number(weight) : undefined,
      range: parseWeightRange(guide.weightKg), jointRisk,
    }),
    months != null ? stagePoint({ species, months, breedKo: guide.breedKo ?? speciesKo, topDisease: (guide.hereditary ?? [])[0]?.name }) : null,
    neuterTip({ species, sex: sex || undefined, neutered: neutered === '' ? undefined : neutered === 'yes' }),
  ].filter(Boolean) as PersonalCheck[];

  // 품종 꿀팁 — 최고 임팩트 1개만 공개, 나머지는 유료 리포트에서(careAdvisor에 주입되므로 정직한 업셀)
  const tips = getBreedTips(species, guide.breedKo ?? breed);
  const shownTips = tips.slice(0, 1);
  const lockedTips = tips.length - shownTips.length;

  const emergency = detectEmergency(symptomIds, '');
  const symCards = symptomIds
    .map((id) => ({ label: SYMPTOMS.find((s) => s.id === id)?.label || id, info: SYMPTOM_INFO[id] }))
    .filter((x) => x.info);
  const symptomBlock =
    symptomIds.length > 0 ? (
      <>
        {emergency && (
          <div className="emerg-banner">
            <Icon name="alert" size={18} />
            <div><b>지금 바로 병원에 가세요</b><span>응급일 수 있는 증상이에요. 아래는 참고용 일반 안내입니다.</span></div>
          </div>
        )}
        <section className="section flags">
          <div className="section-head"><span className="section-ico"><Icon name="cross" size={18} /></span><h3 className="section-title">걱정되는 증상, 일반 안내</h3></div>
          {symCards.map((c, i) => (
            <div className="sym-card" key={i}>
              <b>{c.label}</b>
              <p>{c.info!.causes}</p>
              <p className="sym-vet"><Icon name="alert" size={13} /> {c.info!.vet}</p>
            </div>
          ))}
          <p className="sym-note">※ 일반 정보예요. <b>{name}</b>의 정확한 원인·조치는 사진·증상을 분석하는 맞춤 진단에서 알려드려요.</p>
        </section>
      </>
    ) : null;

  if (!guide.matched) {
    return (
      <div className="bguide">
        <Stepper step={1} />
        {symptomBlock}
        {checks.length > 0 && (
          <section className="section pcheck">
            <div className="section-head">
              <span className="section-ico"><Icon name="check" size={18} /></span>
              <h3 className="section-title">{name} 맞춤 체크</h3>
              <span className="pcheck-badge">입력값 기준</span>
            </div>
            <div className="pcheck-list">
              {checks.map((c, i) => (
                <div className={`pcheck-item pcheck--${c.tone}`} key={i}>
                  <span className="pcheck-dot"><Icon name={c.tone === 'ok' ? 'check' : c.tone === 'warn' ? 'alert' : 'info'} size={14} /></span>
                  <div><b>{c.title}</b><p>{c.body}</p></div>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="gate-ico" style={{ margin: '0 auto 10px' }}><Icon name="paw" size={22} filled /></div>
          <h2 className="card-title">{breed ? `'${breed}'` : speciesKo} 일반 가이드를 못 찾았어요</h2>
          <p className="card-desc" style={{ marginTop: 6 }}>
            믹스견이거나 등록 전 품종일 수 있어요(예: 폼피츠 = 포메라니안×스피츠 믹스).
            순종이면 <b>정확한 품종명</b>으로 다시 입력하거나, 2단계에서 <b>사진으로 분석</b>해 드립니다.
          </p>
          <button className="btn btn--ghost btn--block" style={{ marginTop: 12 }} onClick={onEdit}>← 정보 수정</button>
        </div>
        <div className="sticky-cta"><div className="sticky-cta-inner">
          <button className="btn btn--primary btn--lg btn--block" onClick={onNext}>2단계 · AI 맞춤 진단 ({SITE.pricePerPet.toLocaleString()}원) →</button>
        </div></div>
      </div>
    );
  }

  const diseases = guide.hereditary ?? [];
  const shown = diseases.slice(0, 2);
  const more = Math.max(0, diseases.length - shown.length);

  return (
    <div className="bguide">
      <Stepper step={1} />
      {symptomBlock}

      <div className="gcard">
        <div className="gcard-top">
          <span className="gcard-badge"><Icon name="shield" size={12} /> 공식 자료 기반</span>
          <button type="button" className="gcard-edit" onClick={onEdit}>정보 수정</button>
        </div>
        <h2 className="gcard-name">{guide.breedKo}</h2>
        <p className="gcard-sub">{guide.breedEn}{ageLabel ? ` · ${name} ${ageLabel}` : ''}</p>
        <div className="gcard-stats">
          <div className="gcard-stat"><span>크기</span><b>{guide.size ?? '-'}</b></div>
          <div className="gcard-stat"><span>표준체중</span><b>{guide.weightKg ? `${guide.weightKg}kg` : '-'}</b></div>
          <div className="gcard-stat"><span>기대수명</span><b>{guide.lifeYears ? `${guide.lifeYears}년` : '-'}</b></div>
          {personAge != null && <div className="gcard-stat"><span>사람 나이로</span><b>약 {personAge}살</b></div>}
        </div>
        <p className="gcard-note">※ 품종 평균 기준이에요</p>
      </div>

      {checks.length > 0 && (
        <section className="section pcheck">
          <div className="section-head">
            <span className="section-ico"><Icon name="check" size={18} /></span>
            <h3 className="section-title">{name} 맞춤 체크</h3>
            <span className="pcheck-badge">입력값 기준</span>
          </div>
          <div className="pcheck-list">
            {checks.map((c, i) => (
              <div className={`pcheck-item pcheck--${c.tone}`} key={i}>
                <span className="pcheck-dot"><Icon name={c.tone === 'ok' ? 'check' : c.tone === 'warn' ? 'alert' : 'info'} size={14} /></span>
                <div><b>{c.title}</b><p>{c.body}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {shownTips.length > 0 && (
        <section className="tipcard">
          <div className="tipcard-head">
            <span className="tipcard-bulb">💡</span>
            <h3>아는 사람만 아는 {guide.breedKo} 꿀팁</h3>
          </div>
          {shownTips.map((t, i) => (
            <div className="tipcard-item" key={i}>
              <span className="tipcard-ico"><Icon name={t.icon} size={15} /></span>
              <div><b>{t.title}</b><p>{t.body}</p></div>
            </div>
          ))}
          <p className="tipcard-src">AKC·AVMA 등 공식 수의 자료에서 확인된 내용만 담았어요</p>
        </section>
      )}

      {/* 전체 리포트 잠금 목차 — 실제 내용 첫 부분만 보여주고 잠금(궁금증 유발) */}
      <section className="rlock">
        <div className="rlock-head">
          <Icon name="sparkle" size={15} filled />
          <h3>{name} 전체 리포트에 준비된 것</h3>
        </div>
        <div className="rlock-list">
          {diseases.length > 0 && (
            <div className="rlock-row">
              <span className="rlock-ico"><Icon name="cross" size={15} /></span>
              <div className="rlock-txt">
                <b>조심할 질환 {diseases.length}가지 전체</b>
                <p className="rlock-tease">{diseases[0].name}{diseases.length > 1 ? ` 외 ${diseases.length - 1}가지 — ${diseases[1]?.name.slice(0, 4)}` : ''}</p>
              </div>
              <Icon name="lock" size={14} />
            </div>
          )}
          {lockedTips > 0 && (
            <div className="rlock-row">
              <span className="rlock-ico">💡</span>
              <div className="rlock-txt">
                <b>남은 꿀팁 {lockedTips}개</b>
                <p className="rlock-tease">{tips[1]?.title}</p>
              </div>
              <Icon name="lock" size={14} />
            </div>
          )}
          {(guide.traits?.length ?? 0) > 0 && (
            <div className="rlock-row">
              <span className="rlock-ico"><Icon name="paw" size={15} /></span>
              <div className="rlock-txt">
                <b>성격·성향과 훈련 포인트</b>
                <p className="rlock-tease">{guide.traits![0]}</p>
              </div>
              <Icon name="lock" size={14} />
            </div>
          )}
          <div className="rlock-row">
            <span className="rlock-ico"><Icon name="activity" size={15} /></span>
            <div className="rlock-txt">
              <b>산책·운동량 & 미용 주기</b>
              <p className="rlock-tease">{guide.exercise?.[0] ?? guide.grooming?.[0] ?? `${name} 나이·체중 기준 맞춤 가이드`}</p>
            </div>
            <Icon name="lock" size={14} />
          </div>
          <div className="rlock-row">
            <span className="rlock-ico"><Icon name="bowl" size={15} /></span>
            <div className="rlock-txt">
              <b>음식 가이드 전체 + 맞춤 급여량</b>
              <p className="rlock-tease">절대 금지 {(foods?.toxic ?? []).length}가지 · 좋은 음식 {(foods?.good ?? []).length}가지 · {name} 급여량</p>
            </div>
            <Icon name="lock" size={14} />
          </div>
          <div className="rlock-row">
            <span className="rlock-ico"><Icon name="camera" size={15} /></span>
            <div className="rlock-txt">
              <b>사진으로 체형·피부·털 상태 분석</b>
              <p className="rlock-tease">사진 올리면 AI가 {name} 상태를 직접 봐드려요</p>
            </div>
            <Icon name="lock" size={14} />
          </div>
        </div>
        <p className="price-anchor">동물병원 초진 전에, 커피 한 잔 값으로 먼저 확인해 보세요</p>
      </section>

      <p className="dz-safety"><Icon name="alert" size={13} /> 초콜릿·포도·양파·자일리톨은 어떤 {speciesKo}든 절대 금지예요</p>

      {guide.sourceOrg && (
        <SourceBadges sources={[{ org: guide.sourceOrg, title: guide.sourceTitle ?? null, url: guide.sourceUrl ?? null }]} />
      )}
      <p className="disclaimer"><Icon name="info" size={13} /> 일반 가이드이며 수의사의 진단을 대체하지 않습니다.</p>

      <div className="sticky-cta"><div className="sticky-cta-inner">
        <button className="btn btn--primary btn--lg btn--block" onClick={onNext}>2단계 · {name} AI 맞춤 진단 ({SITE.pricePerPet.toLocaleString()}원) →</button>
      </div></div>
    </div>
  );
}

export default function DiagnoseForm() {
  const router = useRouter();
  const [species, setSpecies] = useState<Species>('dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [neutered, setNeutered] = useState<'' | 'yes' | 'no'>('');
  const [weight, setWeight] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [symptomIds, setSymptomIds] = useState<string[]>([]);
  const [image, setImage] = useState<{ data: string; mediaType: string } | null>(null);
  const [preview, setPreview] = useState('');
  // 결제 필수 정보 (이니시스 V2 요건: 구매자 이메일 등) — 결과 링크 안내 겸용
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  const [stage, setStage] = useState<'form1' | 'guide' | 'form2'>('form1');
  const [result, setResult] = useState<GuideResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);

  const speciesKo = species === 'dog' ? '강아지' : '고양이';

  // 입력값 복원 (끄기 전까지 유지 — 사진 제외)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.species) setSpecies(d.species);
        if (d.name) setName(d.name);
        if (d.breed) setBreed(d.breed);
        if (d.age) setAge(d.age);
        if (d.sex) setSex(d.sex);
        if (d.neutered) setNeutered(d.neutered);
        if (d.weight) setWeight(d.weight);
        if (d.symptoms) setSymptoms(d.symptoms);
        if (Array.isArray(d.symptomIds)) setSymptomIds(d.symptomIds);
      }
    } catch { /* ignore */ }
    setRestored(true);
  }, []);

  // 입력값 저장
  useEffect(() => {
    if (!restored) return;
    try {
      // ⚠️ buyerEmail/buyerPhone(개인정보)은 의도적으로 저장하지 않는다 — 화면 안내 문구와 일치해야 함.
      localStorage.setItem(LS_KEY, JSON.stringify({ species, name, breed, age, sex, neutered, weight, symptoms, symptomIds }));
    } catch { /* ignore */ }
  }, [restored, species, name, breed, age, sex, neutered, weight, symptoms, symptomIds]);

  // 랜딩 증상 칩(?s=)에서 들어오면 미리 선택
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search).get('s');
      if (sp && SYMPTOMS.some((s) => s.id === sp)) setSymptomIds((prev) => (prev.includes(sp) ? prev : [...prev, sp]));
    } catch { /* ignore */ }
  }, []);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const r = await fileToImage(file);
      setPreview(r.preview);
      setImage({ data: r.data, mediaType: r.mediaType });
    } catch {
      setError('사진을 처리하지 못했어요. 다른 사진을 시도해 주세요.');
    }
  }

  const toggleSymptom = (id: string) =>
    setSymptomIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  function buildInput(): PetInput {
    const notes = [symptomLabels(symptomIds), symptoms.trim()].filter(Boolean).join(' / ');
    return {
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      birth: ageToBirth(age),
      sex: sex || undefined,
      neutered: neutered === '' ? undefined : neutered === 'yes',
      weightKg: weight ? Number(weight) : undefined,
      notes: notes || undefined,
    };
  }

  async function showGuide(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('아이 이름을 입력해 주세요.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/breed-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species, breed: breed.trim(), birth: ageToBirth(age) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '오류가 발생했습니다.');
      setResult(json as GuideResult);
      setStage('guide');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function pay() {
    setError('');
    // 이니시스 V2 결제창 필수: 구매자 이메일·연락처 (결과 링크 안내 겸용)
    if (PAYMENTS_LIVE) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim())) { setError('결제 확인을 위해 이메일을 입력해 주세요.'); return; }
      if (buyerPhone.replace(/\D/g, '').length < 10) { setError('휴대폰 번호를 입력해 주세요. (숫자만)'); return; }
    }
    setPaying(true);
    try {
      const startRes = await fetch('/api/diagnose/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: buildInput(), image }),
      });
      const started = await startRes.json();
      if (!startRes.ok) throw new Error(started.error || '오류가 발생했습니다.');
      const token = started.token as string;

      let paymentId: string | null = null;
      if (PAYMENTS_LIVE) {
        const PortOne = await import('@portone/browser-sdk/v2');
        const pid = `mypet-${token}`;
        const resp = await PortOne.requestPayment({
          storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID as string,
          channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY as string,
          paymentId: pid,
          orderName: `mypet 맞춤 진단 (${name})`,
          totalAmount: SITE.pricePerPet,
          currency: 'CURRENCY_KRW' as any,
          payMethod: 'CARD' as any,
          customer: {
            fullName: `${name} 보호자`,
            email: buyerEmail.trim(),
            phoneNumber: buyerPhone.replace(/\D/g, ''),
          },
        });
        if (!resp || resp.code != null) throw new Error(resp?.message || '결제가 취소되었어요.');
        paymentId = resp.paymentId ?? pid;
      }

      const finRes = await fetch('/api/diagnose/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, paymentId }),
      });
      const fin = await finRes.json();
      if (!finRes.ok) throw new Error(fin.error || '결제 처리 중 오류가 발생했습니다.');
      try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
      router.push(`/r/${token}`);
    } catch (err: any) {
      setError(err?.message || '결제 처리 중 오류가 발생했습니다.');
      setPaying(false);
    }
  }

  // ═══════════ 1단계: 정보 입력 ═══════════
  if (stage === 'form1') {
    return (
      <>
      <section className="hero">
        <span className="eyebrow"><Icon name="shield" size={14} /> 수의 가이드라인 기반 AI</span>
        <h1>우리 아이 정보를 알려주세요</h1>
        <p className="hero-sub">어떻게 키울지 궁금해도, 어디가 아파 보여도 — 입력하면 <b>무료 정보</b>부터 바로 보여드려요.</p>
      </section>
      <Stepper step={1} />
      <form className="card" onSubmit={showGuide}>
        <div className="card-head">
          <h2 className="card-title">1단계 · 우리 아이 정보 (무료)</h2>
          <p className="card-desc">품종·나이·걱정되는 증상을 입력하세요. 30초면 됩니다.</p>
        </div>

        <div className="field">
          <label className="label">종류</label>
          <div className="choice-grid">
            <button type="button" className={`choice ${species === 'dog' ? 'on' : ''}`} onClick={() => setSpecies('dog')}>
              <Icon name="paw" size={22} filled /><span className="choice-label">강아지</span>
            </button>
            <button type="button" className={`choice ${species === 'cat' ? 'on' : ''}`} onClick={() => setSpecies('cat')}>
              <Icon name="paw" size={22} filled /><span className="choice-label">고양이</span>
            </button>
          </div>
        </div>

        <div className="field">
          <label className="label">이름 <span className="req">필수</span></label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 구름이" />
        </div>

        <div className="field">
          <label className="label">품종</label>
          <input className="input" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder={species === 'dog' ? '예: 포메라니안' : '예: 코리안숏헤어'} />
          <p className="hint">정확한 품종명을 적어주세요. 믹스견이거나 모르면 2단계에서 사진으로 분석해 드려요.</p>
        </div>

        <div className="row2">
          <div className="field">
            <label className="label">나이</label>
            <div className="input-suffix">
              <input className="input" type="number" inputMode="numeric" min="0" max="40" value={age} onChange={(e) => setAge(e.target.value)} placeholder="예: 3" />
              <span className="input-suffix-unit">살</span>
            </div>
            <p className="hint">만 나이(숫자만). 1살 미만은 0.</p>
          </div>
          <div className="field">
            <label className="label">성별</label>
            <div className="seg">
              <button type="button" className={`seg-opt ${sex === 'female' ? 'on' : ''}`} onClick={() => setSex('female')}>암컷</button>
              <button type="button" className={`seg-opt ${sex === 'male' ? 'on' : ''}`} onClick={() => setSex('male')}>수컷</button>
            </div>
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <label className="label">중성화</label>
            <div className="seg">
              <button type="button" className={`seg-opt ${neutered === 'yes' ? 'on' : ''}`} onClick={() => setNeutered('yes')}>했어요</button>
              <button type="button" className={`seg-opt ${neutered === 'no' ? 'on' : ''}`} onClick={() => setNeutered('no')}>안 했어요</button>
            </div>
          </div>
          <div className="field">
            <label className="label">몸무게 (kg)</label>
            <input className="input" type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="예: 3.2" />
          </div>
        </div>

        <div className="field">
          <label className="label">무엇이 궁금하세요?</label>
          <div className="sym-select">
            <button
              type="button"
              className={`sym-opt sym-opt--none ${symptomIds.length === 0 ? 'on' : ''}`}
              onClick={() => setSymptomIds([])}
            >
              <Icon name="paw" size={14} filled /> 증상 없어요 · 그냥 케어가 궁금해요
            </button>
            <div className="sym-sub-label">또는, 이런 증상이 걱정되면 선택하세요</div>
            {SYMPTOMS.map((s) => (
              <button type="button" key={s.id} className={`sym-opt ${symptomIds.includes(s.id) ? 'on' : ''}`} onClick={() => toggleSymptom(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="hint">자세한 상황(예: 어제부터 다리를 절뚝거려요)은 <b>2단계 AI 맞춤 진단</b>에서 적을 수 있어요.</p>
        </div>

        {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}

        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> 불러오는 중…</> : <><Icon name="shield" size={18} /> 무료로 알아보기</>}
        </button>
      </form>
      </>
    );
  }

  // ═══════════ 1.5단계: 무료 품종 가이드 ═══════════
  if (stage === 'guide' && result) {
    return (
      <GuideView
        result={result}
        name={name}
        speciesKo={speciesKo}
        species={species}
        breed={breed}
        symptomIds={symptomIds}
        age={age}
        weight={weight}
        sex={sex}
        neutered={neutered}
        onNext={() => { setStage('form2'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onEdit={() => setStage('form1')}
      />
    );
  }

  // ═══════════ 2단계: 사진·증상 → 결제 ═══════════
  return (
    <>
    <Stepper step={2} />
    <div className="card">
      <div className="card-head">
        <h2 className="card-title">2단계 · {name} AI 맞춤 진단</h2>
        <p className="card-desc">사진을 더하면 입력하신 증상까지 종합해, {result?.guide.breedKo ?? speciesKo}에 맞춰 정밀 분석해 드려요.</p>
      </div>

      <div className="field">
        <label className="label">사진 <span className="opt">선택</span></label>
        {preview && (
          <div className="upload-preview-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="미리보기" className="upload-preview-img" />
          </div>
        )}
        <div className="upload-actions">
          <label className="upload-btn"><Icon name="camera" size={18} /> 카메라<input type="file" accept="image/*" capture="environment" onChange={onFile} hidden /></label>
          <label className="upload-btn"><Icon name="image" size={18} /> 갤러리<input type="file" accept="image/*" onChange={onFile} hidden /></label>
        </div>
        <p className="hint">사진이 있으면 체형·털 상태·품종까지 더 정확하게 분석해요.</p>
      </div>

      {symptomIds.length > 0 && (
        <div className="field">
          <label className="label">선택한 증상 <button type="button" className="linklike" style={{ fontSize: 12, marginLeft: 6 }} onClick={() => setStage('form1')}>수정</button></label>
          <div className="sym-summary">{symptomLabels(symptomIds)}</div>
        </div>
      )}

      <div className="field">
        <label className="label">증상·상황 자세히 <span className="opt">선택 · AI가 함께 분석</span></label>
        <textarea className="input" rows={4} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="어떤 상황인지 자유롭게 적어주세요 (예: 어제부터 다리를 절뚝거려요, 닭고기 알레르기, 사료를 안 먹어요). 적어주실수록 더 정확해요." />
      </div>

      <div className="row2">
        <div className="field">
          <label className="label">이메일 <span className="req">필수</span></label>
          <input className="input" type="email" inputMode="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="예: mypet@naver.com" />
        </div>
        <div className="field">
          <label className="label">휴대폰 <span className="req">필수</span></label>
          <input className="input" type="tel" inputMode="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="010-0000-0000" />
        </div>
      </div>
      <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>결제 확인용으로 결제사(KG이니시스)에 전달돼요. 저희 서버에는 저장하지 않아요.</p>

      <div className="teaser-locked">
        <div className="teaser-locked-head"><Icon name="sparkle" size={15} filled /> 결제하면 받는 {name} 맞춤 진단</div>
        <ul className="teaser-list">
          <li><Icon name="info" size={15} /> 사진·증상 기반 {name} 상태 분석</li>
          <li><Icon name="cross" size={15} /> 증상의 가능 원인과 지금 할 조치</li>
          <li><Icon name="shield" size={15} /> {result?.guide.breedKo ?? speciesKo} 호발질환 전체 + 병원 가야 할 신호</li>
          <li><Icon name="calendar" size={15} /> 앞으로의 맞춤 케어 가이드</li>
        </ul>
      </div>

      {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}

      <button className="btn btn--primary btn--lg btn--block" onClick={pay} disabled={paying}>
        {paying ? <><span className="spinner" /> 진단 생성 중… (최대 1분)</> : `${SITE.pricePerPet.toLocaleString()}원 결제하고 맞춤 진단 보기`}
      </button>
      {!PAYMENTS_LIVE && <p className="hint center" style={{ marginTop: 8 }}>※ 현재 테스트 결제 모드 (실결제 키 연동 전)</p>}
      <p className="teaser-terms">
        결제 시 <Link href="/terms" target="_blank">이용약관</Link> · <Link href="/refund" target="_blank">환불정책</Link>에 동의하며,
        디지털 콘텐츠 특성상 생성·열람 후 청약철회가 제한될 수 있습니다.
      </p>
      <button className="btn btn--ghost btn--block" style={{ marginTop: 6 }} onClick={() => setStage('guide')} disabled={paying}>← 품종 가이드로</button>
    </div>
    </>
  );
}
