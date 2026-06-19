'use client';

import { useState, type ReactNode, type FormEvent, type ChangeEvent } from 'react';
import { Species, SymptomInput, SymptomTriage } from '@/lib/types';
import { SYMPTOMS } from '@/lib/symptomData';
import { Icon } from './icons';
import { fileToImage } from '@/lib/imageClient';
import SourceBadges from './SourceBadges';

const VET_SEARCH = 'https://map.naver.com/p/search/%EB%8F%99%EB%AC%BC%EB%B3%91%EC%9B%90'; // 동물병원

const URGENCY: Record<string, { label: string; cls: string; icon: string }> = {
  emergency: { label: '지금 즉시 병원', cls: 'u-emergency', icon: 'alert' },
  soon: { label: '가능한 빨리 병원', cls: 'u-soon', icon: 'cross' },
  monitor: { label: '집에서 경과 관찰', cls: 'u-monitor', icon: 'shield' },
};

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
        <li key={i}><Icon name={warn ? 'alert' : 'check'} size={14} strokeWidth={2} />{x}</li>
      ))}
    </ul>
  );
}

export default function SymptomChecker() {
  const [species, setSpecies] = useState<Species>('dog');
  const [selected, setSelected] = useState<string[]>([]);
  const [desc, setDesc] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SymptomTriage | null>(null);
  const [image, setImage] = useState<{ data: string; mediaType: string } | null>(null);
  const [preview, setPreview] = useState('');

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data, mediaType, preview } = await fileToImage(file);
      setPreview(preview);
      setImage({ data, mediaType });
    } catch {
      setPreview('');
      setImage(null);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (selected.length === 0 && !desc.trim()) {
      setError('증상을 하나 이상 선택하거나 설명을 적어주세요.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const input: SymptomInput = {
        species,
        symptomIds: selected,
        description: desc.trim() || undefined,
        duration: duration.trim() || undefined,
      };
      const res = await fetch('/api/symptom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, image }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '오류가 발생했습니다.');
      setResult(json.triage as SymptomTriage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const u = URGENCY[result.urgency] ?? URGENCY.monitor;
    return (
      <div className="report">
        <div className={`triage-hero ${u.cls}`}>
          <span className="triage-badge"><Icon name={u.icon} size={15} /> {u.label}</span>
          <h2 className="triage-headline">{result.headline}</h2>
        </div>

        {result.urgency === 'emergency' && (
          <a className="btn btn--primary btn--lg btn--block" href={VET_SEARCH} target="_blank" rel="noreferrer">
            <Icon name="cross" size={17} /> 주변 동물병원 찾기
          </a>
        )}

        <SourceBadges sources={result.sources} />

        <Section icon="info" title="가능한 원인"><Bullets items={result.possibleCauses} /></Section>
        <Section icon="shield" title="집에서 확인·조치할 것"><Bullets items={result.homeCare} /></Section>
        <Section icon="cross" title="이런 신호면 즉시 병원" variant="flags"><Bullets items={result.vetSigns} warn /></Section>

        <p className="disclaimer"><Icon name="info" size={14} /> {result.note} · 일반 정보이며 진단·진료를 대체하지 않습니다.</p>

        {result.urgency !== 'emergency' && (
          <a className="btn btn--secondary btn--block" href={VET_SEARCH} target="_blank" rel="noreferrer">주변 동물병원 찾기</a>
        )}
        <button className="btn btn--ghost btn--block" onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          다시 체크하기
        </button>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-head">
        <h2 className="card-title">증상 체크</h2>
        <p className="card-desc">증상을 고르면 가능한 원인과 응급도를 안내해 드려요.</p>
      </div>

      <div className="field">
        <label className="label">종류</label>
        <div className="choice-grid">
          <button type="button" className={`choice ${species === 'dog' ? 'on' : ''}`} onClick={() => setSpecies('dog')}>
            <Icon name="paw" size={22} filled /><span className="choice-label">강아지</span>
            {species === 'dog' && <span className="choice-check"><Icon name="check" size={12} strokeWidth={2.4} /></span>}
          </button>
          <button type="button" className={`choice ${species === 'cat' ? 'on' : ''}`} onClick={() => setSpecies('cat')}>
            <Icon name="paw" size={22} filled /><span className="choice-label">고양이</span>
            {species === 'cat' && <span className="choice-check"><Icon name="check" size={12} strokeWidth={2.4} /></span>}
          </button>
        </div>
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
          <label className="upload-btn">
            <Icon name="camera" size={18} /> 카메라
            <input type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
          </label>
          <label className="upload-btn">
            <Icon name="image" size={18} /> 갤러리
            <input type="file" accept="image/*" onChange={onFile} hidden />
          </label>
        </div>
        <p className="hint">피부·눈·잇몸 등 증상 부위 (선택)</p>
      </div>

      <div className="field">
        <label className="label">어떤 증상인가요? <span className="opt">복수 선택</span></label>
        <div className="symptom-grid">
          {SYMPTOMS.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`symptom-chip ${selected.includes(s.id) ? 'on' : ''} ${s.emergency ? 'danger' : ''}`}
              onClick={() => toggle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="label">자세한 설명 <span className="opt">선택</span></label>
        <textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="예: 자다가 갑자기 켁켁거리고 5분쯤 지속됐어요" />
      </div>

      <div className="field">
        <label className="label">언제부터 그랬나요? <span className="opt">선택</span></label>
        <input className="input" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="예: 오늘 아침부터 / 3일째" />
      </div>

      {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}

      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> 분석 중…</> : <><Icon name="sparkle" size={18} filled /> 응급도 체크하기</>}
      </button>
      <p className="hint center">⚠️ 위급해 보이면 분석을 기다리지 말고 바로 병원에 연락하세요.</p>
    </form>
  );
}
