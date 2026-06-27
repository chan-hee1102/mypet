'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PetInput, Species, Sex } from '@/lib/types';
import type { BreedGuide } from '@/lib/diagnose';
import { Icon } from './icons';
import SourceBadges from './SourceBadges';
import { fileToImage } from '@/lib/imageClient';
import { SITE } from '@/lib/site';

const PAYMENTS_LIVE = !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID;

export default function DiagnoseForm() {
  const router = useRouter();
  // 1단계 정보
  const [species, setSpecies] = useState<Species>('dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birth, setBirth] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [neutered, setNeutered] = useState<'' | 'yes' | 'no'>('');
  const [weight, setWeight] = useState('');
  // 2단계 정보
  const [symptoms, setSymptoms] = useState('');
  const [image, setImage] = useState<{ data: string; mediaType: string } | null>(null);
  const [preview, setPreview] = useState('');

  const [stage, setStage] = useState<'form1' | 'guide' | 'form2'>('form1');
  const [guide, setGuide] = useState<BreedGuide | null>(null);
  const [ageLabel, setAgeLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const speciesKo = species === 'dog' ? '강아지' : '고양이';

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

  // ── 1단계 → 무료 가이드 조회 ──
  async function showGuide(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('아이 이름을 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/breed-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species, breed: breed.trim(), birth: birth || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '오류가 발생했습니다.');
      setGuide(json.guide as BreedGuide);
      setAgeLabel(json.ageLabel ?? null);
      setStage('guide');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // ── 2단계 결제 → 생성 ──
  async function pay() {
    setPaying(true);
    setError('');
    try {
      const input: PetInput = {
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        birth: birth || undefined,
        sex: sex || undefined,
        neutered: neutered === '' ? undefined : neutered === 'yes',
        weightKg: weight ? Number(weight) : undefined,
        notes: symptoms.trim() || undefined,
      };
      const startRes = await fetch('/api/diagnose/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, image }),
      });
      const started = await startRes.json();
      if (!startRes.ok) throw new Error(started.error || '오류가 발생했습니다.');
      const token = started.token as string;

      // 실결제(PortOne)는 키 발급 후 여기서 requestPayment → paymentId. 현재는 샌드박스.
      let paymentId: string | null = null;
      const finRes = await fetch('/api/diagnose/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, paymentId }),
      });
      const fin = await finRes.json();
      if (!finRes.ok) throw new Error(fin.error || '결제 처리 중 오류가 발생했습니다.');
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
          <p className="card-desc">품종·나이 등을 입력하면 그 품종의 일반 가이드를 무료로 보여드려요.</p>
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
          <p className="hint">정확히 입력할수록 좋은 가이드를 보여드려요. 모르면 2단계에서 사진으로 추정합니다.</p>
        </div>

        <div className="row2">
          <div className="field">
            <label className="label">태어난 시기</label>
            <input className="input" type="month" value={birth} onChange={(e) => setBirth(e.target.value)} />
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
  if (stage === 'guide' && guide) {
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

            <section className="section">
              <div className="section-head">
                <span className="section-ico"><Icon name="paw" size={18} filled /></span>
                <h3 className="section-title">이 품종은 이런 아이예요</h3>
              </div>
              <ul className="list">
                {(guide.points ?? []).map((p, i) => (
                  <li key={i}><Icon name="check" size={14} strokeWidth={2} />{p}</li>
                ))}
              </ul>
            </section>

            {guide.sourceOrg && (
              <SourceBadges sources={[{ org: guide.sourceOrg, title: guide.sourceTitle ?? null, url: guide.sourceUrl ?? null }]} />
            )}
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="gate-ico" style={{ margin: '0 auto 10px' }}><Icon name="paw" size={22} filled /></div>
            <h2 className="card-title">{breed ? `'${breed}'` : speciesKo} 일반 가이드를 못 찾았어요</h2>
            <p className="card-desc" style={{ marginTop: 6 }}>
              품종명을 다르게 적었거나 등록 전 품종일 수 있어요. 2단계에서 <b>사진으로 품종을 추정</b>해 맞춤 진단해 드립니다.
            </p>
          </div>
        )}

        <div className="bguide-next">
          <p>여기까지는 <b>일반 가이드</b>예요.<br /><b>{name}</b>의 사진·증상을 더하면 <b>우리 아이 맞춤 진단</b>을 받을 수 있어요.</p>
          <button className="btn btn--primary btn--lg btn--block" onClick={() => { setStage('form2'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            2단계 · 우리 아이 맞춤 진단받기 →
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
        <p className="card-desc">사진과 증상을 더하면 AI가 {guide?.breedKo ?? speciesKo}에 맞춰 분석해 드려요.</p>
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
          <li><Icon name="bowl" size={15} /> 음식 가이드 · 절대 금지 독성식품</li>
          <li><Icon name="cross" size={15} /> 병원 방문이 필요한 신호 · 앞으로의 케어</li>
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
