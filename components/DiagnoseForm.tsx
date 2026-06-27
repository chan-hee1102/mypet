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
      <span className={`stepbar-item ${step >= 1 ? 'on' : ''}`}><span className="stepbar-n">1</span>품종 가이드 <b>무료</b></span>
      <span className="stepbar-line" />
      <span className={`stepbar-item ${step >= 2 ? 'on' : ''}`}><span className="stepbar-n">2</span>맞춤 진단</span>
    </div>
  );
}

/** 1단계 무료 가이드 — 슬림 스냅샷 + 결제 유도 잠금 카드. */
function GuideView({
  result, name, speciesKo, breed, onNext, onEdit,
}: {
  result: GuideResult; name: string; speciesKo: string; breed: string; onNext: () => void; onEdit: () => void;
}) {
  const { guide, ageLabel } = result;

  if (!guide.matched) {
    return (
      <div className="bguide">
        <Stepper step={1} />
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
          <button className="btn btn--primary btn--lg btn--block" onClick={onNext}>2단계 · 맞춤 진단 받기 ({SITE.pricePerPet.toLocaleString()}원) →</button>
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

      <div className="gcard">
        <div className="gcard-top">
          <span className="gcard-badge"><Icon name="shield" size={12} /> 공식 자료 기반</span>
          <button type="button" className="gcard-edit" onClick={onEdit}>정보 수정</button>
        </div>
        <h2 className="gcard-name">{guide.breedKo}</h2>
        <p className="gcard-sub">{guide.breedEn}{ageLabel ? ` · ${name} ${ageLabel}` : ''}</p>
        <div className="gcard-stats">
          <div className="gcard-stat"><span>크기</span><b>{guide.size ?? '-'}</b></div>
          <div className="gcard-stat"><span>체중</span><b>{guide.weightKg ? `${guide.weightKg}kg` : '-'}</b></div>
          <div className="gcard-stat"><span>기대수명</span><b>{guide.lifeYears ? `${guide.lifeYears}년` : '-'}</b></div>
        </div>
        <p className="gcard-note">※ 품종 평균 기준이에요</p>
      </div>

      <section className="section">
        <div className="section-head"><span className="section-ico"><Icon name="paw" size={18} /></span><h3 className="section-title">이런 아이예요</h3></div>
        {guide.summary && <p>{guide.summary}</p>}
        {guide.traits && guide.traits.length > 0 && <Bullets items={guide.traits.slice(0, 3)} />}
      </section>

      {shown.length > 0 && (
        <section className="section flags">
          <div className="section-head"><span className="section-ico"><Icon name="cross" size={18} /></span><h3 className="section-title">이 품종, 이런 걸 조심해요</h3></div>
          <div className="dz-grid">
            {shown.map((h, i) => (<div className="dz-item" key={i}><b>{h.name}</b>{h.note && <span>{h.note}</span>}</div>))}
          </div>
          {more > 0 && <p className="dz-more">+ 호발·유전질환 {more}가지 더는 맞춤 진단에서 전체 공개</p>}
          <p className="dz-safety"><Icon name="alert" size={13} /> 초콜릿·포도·양파·자일리톨은 어떤 {speciesKo}든 절대 금지예요</p>
        </section>
      )}

      <section className="lockcard">
        <div className="lockcard-head"><Icon name="lock" size={15} /> {name} 맞춤 진단에서 받는 것</div>
        <ul className="lockcard-list">
          <li><Icon name="camera" size={15} /> 사진으로 체형·피부·품종 분석</li>
          <li><Icon name="cross" size={15} /> 입력한 증상의 가능 원인과 조치</li>
          <li><Icon name="shield" size={15} /> 이 품종 전체 호발질환 + 예방 케어</li>
          <li><Icon name="bowl" size={15} /> 먹어도 되는 · 절대 금지 음식 (특이사항 반영)</li>
          <li><Icon name="activity" size={15} /> 병원에 가야 하는 신호</li>
        </ul>
      </section>

      {guide.sourceOrg && (
        <SourceBadges sources={[{ org: guide.sourceOrg, title: guide.sourceTitle ?? null, url: guide.sourceUrl ?? null }]} />
      )}
      <p className="disclaimer"><Icon name="info" size={13} /> 일반 가이드이며 수의사의 진단을 대체하지 않습니다.</p>

      <div className="sticky-cta"><div className="sticky-cta-inner">
        <button className="btn btn--primary btn--lg btn--block" onClick={onNext}>2단계 · {name} 맞춤 진단 받기 ({SITE.pricePerPet.toLocaleString()}원) →</button>
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
  const [image, setImage] = useState<{ data: string; mediaType: string } | null>(null);
  const [preview, setPreview] = useState('');

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
      }
    } catch { /* ignore */ }
    setRestored(true);
  }, []);

  // 입력값 저장
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ species, name, breed, age, sex, neutered, weight, symptoms }));
    } catch { /* ignore */ }
  }, [restored, species, name, breed, age, sex, neutered, weight, symptoms]);

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

  function buildInput(): PetInput {
    return {
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      birth: ageToBirth(age),
      sex: sex || undefined,
      neutered: neutered === '' ? undefined : neutered === 'yes',
      weightKg: weight ? Number(weight) : undefined,
      notes: symptoms.trim() || undefined,
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
    setPaying(true);
    setError('');
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
        <span className="eyebrow"><Icon name="sparkle" size={14} filled /> AI 맞춤 진단</span>
        <h1>우리 아이 정보를 알려주세요</h1>
        <p className="hero-sub">품종·나이만 입력하면, 그 품종의 일반 가이드를 무료로 보여드려요.</p>
      </section>
      <Stepper step={1} />
      <form className="card" onSubmit={showGuide}>
        <div className="card-head">
          <h2 className="card-title">1단계 · 우리 아이 정보</h2>
          <p className="card-desc">품종·나이만 입력하면 그 품종의 일반 가이드를 무료로 보여드려요.</p>
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

        {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}

        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> 불러오는 중…</> : <><Icon name="tag" size={18} /> 이 품종 가이드 보기 (무료)</>}
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
        breed={breed}
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
        <h2 className="card-title">2단계 · {name} 맞춤 진단</h2>
        <p className="card-desc">사진과 증상을 더하면 AI가 {result?.guide.breedKo ?? speciesKo}에 맞춰 분석해 드려요.</p>
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

      <div className="field">
        <label className="label">증상·특이사항 <span className="opt">선택</span></label>
        <textarea className="input" rows={4} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="요즘 신경 쓰이는 증상이나 지병·알레르기를 적어주세요 (예: 다리를 절뚝거림, 기침, 닭고기 알레르기)" />
      </div>

      <div className="teaser-locked">
        <div className="teaser-locked-head"><Icon name="sparkle" size={15} filled /> 결제하면 받는 맞춤 진단</div>
        <ul className="teaser-list">
          <li><Icon name="info" size={15} /> 사진·증상 기반 우리 아이 상태 분석</li>
          <li><Icon name="cross" size={15} /> 증상별 조치 · 병원 방문이 필요한 신호</li>
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
