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

function GuideCard({ icon, title, variant, children }: { icon: string; title: string; variant?: string; children: ReactNode }) {
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
function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list">
      {items.map((x, i) => (<li key={i}><Icon name="check" size={14} strokeWidth={2} />{x}</li>))}
    </ul>
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
    );
  }

  // ═══════════ 1.5단계: 무료 품종 가이드 ═══════════
  if (stage === 'guide' && result) {
    const { guide, ageLabel, foods } = result;
    return (
      <div className="bguide">
        {guide.matched ? (
          <>
            <div className="bguide-hero">
              <span className="bguide-badge"><Icon name="shield" size={13} /> 공식 자료 기반 일반 가이드</span>
              <h2 className="bguide-name">{guide.breedKo}</h2>
              <p className="bguide-en">{guide.breedEn}{ageLabel ? ` · ${name} ${ageLabel}` : ''}</p>
            </div>

            <div className="stats bguide-stats">
              <div className="stat"><div className="stat-ico"><Icon name="tag" size={18} /></div><div className="stat-label">크기</div><div className="stat-value">{guide.size ?? '-'}</div></div>
              <div className="stat"><div className="stat-ico"><Icon name="activity" size={18} /></div><div className="stat-label">체중</div><div className="stat-value">{guide.weightKg ? `${guide.weightKg}kg` : '-'}</div></div>
              <div className="stat"><div className="stat-ico"><Icon name="calendar" size={18} /></div><div className="stat-label">기대수명</div><div className="stat-value">{guide.lifeYears ? `${guide.lifeYears}년` : '-'}</div></div>
            </div>

            <GuideCard icon="paw" title="이런 강아지예요">
              {guide.intro && <p>{guide.intro}</p>}
              {guide.traits && guide.traits.length > 0 && <Bullets items={guide.traits} />}
            </GuideCard>

            {guide.grooming && guide.grooming.length > 0 && (
              <GuideCard icon="scissors" title="털·그루밍" variant="section--mint"><Bullets items={guide.grooming} /></GuideCard>
            )}

            <GuideCard icon="activity" title="산책·운동 주의" variant="section--sky">
              <Bullets items={guide.exercise && guide.exercise.length > 0 ? guide.exercise : ['적절한 산책과 놀이로 활동량을 채워주세요. 우리 아이에게 맞는 정확한 운동량은 2단계 맞춤 진단에서 알려드려요.']} />
            </GuideCard>

            {guide.diseases && guide.diseases.length > 0 && (
              <GuideCard icon="cross" title="주의할 질환" variant="flags"><Bullets items={guide.diseases} /></GuideCard>
            )}

            <GuideCard icon="bowl" title={`${speciesKo}가 먹는 음식`}>
              <div className="food">
                <div className="food-col good">
                  <div className="food-col-head"><Icon name="check" size={15} strokeWidth={2.2} /> 먹어도 좋아요</div>
                  <ul className="food-list">{foods.good.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
                <div className="food-col bad">
                  <div className="food-col-head"><Icon name="alert" size={15} /> 절대 주면 안돼요</div>
                  <ul className="food-list">{foods.toxic.map((f) => <li key={f.name}><b>{f.name}</b> — {f.reason}</li>)}</ul>
                </div>
              </div>
            </GuideCard>

            {guide.sourceOrg && (
              <SourceBadges sources={[{ org: guide.sourceOrg, title: guide.sourceTitle ?? null, url: guide.sourceUrl ?? null }]} />
            )}
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="gate-ico" style={{ margin: '0 auto 10px' }}><Icon name="paw" size={22} filled /></div>
            <h2 className="card-title">{breed ? `'${breed}'` : speciesKo} 일반 가이드를 못 찾았어요</h2>
            <p className="card-desc" style={{ marginTop: 6 }}>
              믹스견이거나 등록 전 품종일 수 있어요(예: 폼피츠 = 포메라니안×스피츠 믹스).
              순종이면 <b>정확한 품종명</b>으로 다시 입력하거나, 2단계에서 <b>사진으로 분석</b>해 드립니다.
            </p>
          </div>
        )}

        <div className="bguide-next">
          <p>여기까지는 <b>일반 가이드</b>예요.<br /><b>{name}</b>의 사진·증상을 더하면 <b>우리 아이 맞춤 진단</b>을 받을 수 있어요.</p>
          <button className="btn btn--primary btn--lg btn--block" onClick={() => { setStage('form2'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            증상 진단 · 맞춤 가이드 받기 (2단계) →
          </button>
          <button className="btn btn--ghost btn--block" style={{ marginTop: 6 }} onClick={() => setStage('form1')}>← 정보 수정</button>
        </div>
      </div>
    );
  }

  // ═══════════ 2단계: 사진·증상 → 결제 ═══════════
  return (
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
  );
}
