'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PetInput, Species, Sex } from '@/lib/types';
import type { Teaser } from '@/lib/diagnose';
import { Icon } from './icons';
import { fileToImage } from '@/lib/imageClient';
import { SITE } from '@/lib/site';

const PAYMENTS_LIVE = !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID;

export default function DiagnoseForm() {
  const router = useRouter();
  const [species, setSpecies] = useState<Species>('dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birth, setBirth] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [neutered, setNeutered] = useState<'' | 'yes' | 'no'>('');
  const [weight, setWeight] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [image, setImage] = useState<{ data: string; mediaType: string } | null>(null);
  const [preview, setPreview] = useState('');

  const [stage, setStage] = useState<'form' | 'teaser'>('form');
  const [token, setToken] = useState<string | null>(null);
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

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
      const res = await fetch('/api/diagnose/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, image }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '오류가 발생했습니다.');
      setToken(json.token);
      setTeaser(json.teaser);
      setStage('teaser');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function pay() {
    if (!token) return;
    setPaying(true);
    setError('');
    try {
      // 실결제(PortOne)는 키 발급 후 이 자리에서 requestPayment → paymentId 획득.
      // 현재는 키가 없어 샌드박스(테스트) 결제로 바로 생성 단계 진행.
      let paymentId: string | null = null;
      // TODO(PortOne): if (PAYMENTS_LIVE) { const r = await requestPayment({...}); paymentId = r.paymentId; }

      const res = await fetch('/api/diagnose/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, paymentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '결제 처리 중 오류가 발생했습니다.');
      router.push(`/r/${token}`);
    } catch (err: any) {
      setError(err?.message || '결제 처리 중 오류가 발생했습니다.');
      setPaying(false);
    }
  }

  // ── 티저 화면 ──
  if (stage === 'teaser' && teaser) {
    const speciesKo = species === 'dog' ? '강아지' : '고양이';
    return (
      <div className="card teaser-card">
        <div className="teaser-badge"><Icon name="sparkle" size={15} filled /> 분석 준비 완료</div>
        <h2 className="teaser-title">{name}의 맞춤 진단이 준비됐어요</h2>

        {teaser.breedMatched ? (
          <div className="teaser-hit">
            <Icon name="check" size={18} strokeWidth={2.4} />
            <div>
              <b>품종 인식: {teaser.breedMatched}</b>
              <span>
                {teaser.size && `${teaser.size} · `}
                {teaser.lifeYears && `평균수명 ${teaser.lifeYears}년 · `}
                공식 자료 기반 분석 포함
              </span>
            </div>
          </div>
        ) : (
          <div className="teaser-hit">
            <Icon name="check" size={18} strokeWidth={2.4} />
            <div>
              <b>{breed ? `${breed}` : `${speciesKo}`} 맞춤 분석 준비됨</b>
              <span>사진·정보 기반 전문 진단 포함</span>
            </div>
          </div>
        )}

        <div className="teaser-locked">
          <div className="teaser-locked-head"><Icon name="lock" size={15} /> 결제하면 전체 공개</div>
          <ul className="teaser-list">
            <li><Icon name="tag" size={15} /> 품종 특성·호발/유전질환 (수의 가이드라인 근거)</li>
            <li><Icon name="bowl" size={15} /> 먹어도 되는 음식 · 절대 금지 독성식품</li>
            <li><Icon name="scissors" size={15} /> 그루밍·운동·나이별 맞춤 케어</li>
            <li><Icon name="cross" size={15} /> 병원 방문이 필요한 신호</li>
          </ul>
        </div>

        {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}

        <button className="btn btn--primary btn--lg btn--block" onClick={pay} disabled={paying}>
          {paying ? <><span className="spinner" /> 진단 생성 중… (최대 1분)</> : `${SITE.pricePerPet.toLocaleString()}원 결제하고 전체 진단 보기`}
        </button>
        {!PAYMENTS_LIVE && <p className="hint center" style={{ marginTop: 8 }}>※ 현재 테스트 결제 모드 (실결제 키 연동 전)</p>}
        <p className="teaser-terms">
          결제 시 <Link href="/terms" target="_blank">이용약관</Link> · <Link href="/refund" target="_blank">환불정책</Link>에 동의하며,
          디지털 콘텐츠 특성상 생성·열람 후 청약철회가 제한될 수 있습니다.
        </p>
        <button className="btn btn--ghost btn--block" onClick={() => setStage('form')} disabled={paying} style={{ marginTop: 6 }}>
          정보 다시 입력
        </button>
      </div>
    );
  }

  // ── 입력 폼 ──
  return (
    <form className="card" onSubmit={submit}>
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
        <p className="hint">사진이 있으면 품종·체형까지 더 정확하게 분석해요.</p>
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
        <p className="hint">모르면 비워두세요 — 사진으로 추정해 드려요.</p>
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
        <label className="label">증상·특이사항 <span className="opt">선택</span></label>
        <textarea className="input" rows={3} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="요즘 신경 쓰이는 증상이나 지병·알레르기를 적어주세요 (예: 다리를 절뚝거림, 기침, 닭고기 알레르기)" />
      </div>

      {error && <div className="alert"><Icon name="alert" size={16} /> {error}</div>}

      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> 분석 준비 중…</> : <><Icon name="sparkle" size={18} filled /> 진단하기</>}
      </button>
      <p className="hint center">결제는 다음 단계에서 진행돼요 · 1회 {SITE.pricePerPet.toLocaleString()}원</p>
    </form>
  );
}
