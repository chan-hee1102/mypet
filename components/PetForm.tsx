'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { PetInput, Species, Sex, PreviewCard } from '@/lib/types';
import { Icon } from './icons';
import CareCardView from './CareCard';
import { fileToImage } from '@/lib/imageClient';

export default function PetForm() {
  const [species, setSpecies] = useState<Species>('dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birth, setBirth] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [neutered, setNeutered] = useState<'' | 'yes' | 'no'>('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [lastCombo, setLastCombo] = useState('');
  const [lastRabies, setLastRabies] = useState('');
  const [lastHeartworm, setLastHeartworm] = useState('');
  const [image, setImage] = useState<{ data: string; mediaType: string } | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState<PreviewCard | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [petId, setPetId] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const { data, mediaType, preview } = await fileToImage(file);
      setPreview(preview);
      setImage({ data, mediaType });
    } catch {
      setError('사진을 처리하지 못했어요. 다른 사진을 시도해 주세요.');
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('아이 이름을 입력해 주세요.');
      return;
    }
    setLoading(true);
    setCard(null);
    try {
      const input: PetInput = {
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        birth: birth || undefined,
        sex: sex || undefined,
        neutered: neutered === '' ? undefined : neutered === 'yes',
        weightKg: weight ? Number(weight) : undefined,
        notes: notes.trim() || undefined,
        lastVaccineCombo: lastCombo || undefined,
        lastVaccineRabies: lastRabies || undefined,
        lastHeartworm: lastHeartworm || undefined,
      };
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, image }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '오류가 발생했습니다.');
      setUnlocked(false);
      setPetId((json.petId as string | null) ?? null);
      setCard(json.card as PreviewCard);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (card) {
    return (
      <CareCardView
        species={species}
        petName={name}
        petId={petId}
        preview={card}
        unlocked={unlocked}
        onUnlock={async () => {
          // 로그인 사용자라 저장된 펫이면 잠금 해제를 서버에 기록한다.
          if (petId) {
            try {
              await fetch('/api/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ petId }),
              });
            } catch {
              /* 기록 실패해도 화면은 열어준다 */
            }
          }
          setUnlocked(true);
        }}
        onReset={() => {
          setCard(null);
          setUnlocked(false);
          setPetId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-head">
        <h2 className="card-title">우리 아이 정보</h2>
        <p className="card-desc">사진과 기본 정보를 입력하면 맞춤 케어 리포트를 만들어 드려요.</p>
      </div>

      {/* 사진 */}
      <div className="field">
        <label className="label">사진 <span className="opt">선택</span></label>
        {preview && (
          <div className="upload-preview-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="미리보기" className="upload-preview-img" />
          </div>
        )}
        <div className="upload-actions">
          <label className="upload-btn">
            <Icon name="camera" size={18} /> 카메라
            <input type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
          </label>
          <label className="upload-btn">
            <Icon name="image" size={18} /> 갤러리
            <input type="file" accept="image/*" onChange={onFile} hidden />
          </label>
        </div>
        <p className="hint">
          {preview ? '다시 선택하면 사진이 교체돼요 · 품종·체형 분석에 활용됩니다' : '품종·체형 분석에 활용됩니다'}
        </p>
      </div>

      {/* 종류 */}
      <div className="field">
        <label className="label">종류</label>
        <div className="choice-grid">
          <button type="button" className={`choice ${species === 'dog' ? 'on' : ''}`} onClick={() => setSpecies('dog')}>
            <Icon name="paw" size={22} filled />
            <span className="choice-label">강아지</span>
            {species === 'dog' && <span className="choice-check"><Icon name="check" size={12} strokeWidth={2.4} /></span>}
          </button>
          <button type="button" className={`choice ${species === 'cat' ? 'on' : ''}`} onClick={() => setSpecies('cat')}>
            <Icon name="paw" size={22} filled />
            <span className="choice-label">고양이</span>
            {species === 'cat' && <span className="choice-check"><Icon name="check" size={12} strokeWidth={2.4} /></span>}
          </button>
        </div>
      </div>

      {/* 이름 */}
      <div className="field">
        <label className="label">이름 <span className="req">필수</span></label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 콩이" />
      </div>

      {/* 품종 */}
      <div className="field">
        <label className="label">품종</label>
        <input
          className="input"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder={species === 'dog' ? '예: 폼피츠 / 푸들' : '예: 코리안숏헤어'}
        />
        <p className="hint">모르면 비워두세요 — 사진으로 추정해 드립니다.</p>
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

      <div className="field">
        <label className="label">특이사항 <span className="opt">선택</span></label>
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="알레르기·지병 등 (예: 닭고기 알레르기, 슬개골 탈구 이력)" />
      </div>

      {/* 최근 접종 기록 — 알면 입력. 비우면 케어 일정이 "병원에서 이력 확인"으로 표시됨 */}
      <details className="field">
        <summary className="label" style={{ cursor: 'pointer', listStyle: 'revert' }}>
          최근 접종 기록 <span className="opt">알면 입력</span>
        </summary>
        <p className="hint" style={{ marginTop: 6 }}>
          마지막으로 맞은 달을 넣으면 다음 일정을 정확히 계산해요. <b>모르면 비워두세요</b> — 그땐 “병원에서 이력 확인”으로 안내합니다.
        </p>
        <div className="field" style={{ marginTop: 8 }}>
          <label className="label">마지막 종합백신 ({species === 'dog' ? 'DHPPL' : 'FVRCP'})</label>
          <input className="input" type="month" value={lastCombo} onChange={(e) => setLastCombo(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">마지막 광견병 접종</label>
          <input className="input" type="month" value={lastRabies} onChange={(e) => setLastRabies(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">마지막 심장사상충·구충</label>
          <input className="input" type="month" value={lastHeartworm} onChange={(e) => setLastHeartworm(e.target.value)} />
        </div>
      </details>

      {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}

      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> 분석 중…</> : <><Icon name="sparkle" size={18} filled /> 케어 리포트 만들기</>}
      </button>
      {loading && <p className="hint center">맞춤 가이드를 생성하고 있어요 · 보통 20–40초</p>}
    </form>
  );
}
