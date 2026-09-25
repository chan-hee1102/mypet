'use client';

import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PetInput, Species, Sex } from '@/lib/types';
import type { BreedGuide } from '@/lib/diagnose';
import { Icon } from './icons';
import WeightRuler from './WeightRuler';
import { SITE } from '@/lib/site';
import { SYMPTOMS, symptomInfo, detectEmergency } from '@/lib/symptomData';
import { parseWeightRange, humanAge, weightCheck, stagePoint, neuterTip, type PersonalCheck } from '@/lib/guidePersonal';
import { getBreedTips } from '@/lib/breedTips';
import { friendlyError } from '@/lib/friendlyError';

const PAYMENTS_LIVE = !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const LS_KEY = 'mypet_diagnose_v1';

type Foods = { good: string[]; toxic: { name: string; reason: string; severity: string }[] };
type GuideResult = { guide: BreedGuide; ageLabel: string | null; foods: Foods };
type Stage = 'form1' | 'guide' | 'form2';

const TONE: Record<string, { cls: string; label: string }> = {
  ok: { cls: 'tag--ok', label: '적정' },
  warn: { cls: 'tag--warn', label: '주의' },
  info: { cls: 'tag--info', label: '참고' },
};

/** "몇 살" → 내부 birth("YYYY-MM") 근사값. */
function ageToBirth(age: string): string | undefined {
  const n = Number(age);
  if (!age || isNaN(n) || n < 0 || n > 40) return undefined;
  const now = new Date();
  return `${now.getFullYear() - Math.floor(n)}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** 최근 24개월 — 마지막 접종 시기 고르기용. 값은 "YYYY-MM". */
function recentMonths(): { v: string; label: string }[] {
  const out: { v: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < 24; i++) {
    out.push({ v: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월` });
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

/** 품종 이름 오타 제안용 — 편집 거리(글자 단위). */
function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}
function suggestBreed(input: string, names: string[]): string | null {
  const q = input.replace(/\s+/g, '');
  if (q.length < 2) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const n of names) {
    const d = editDistance(q, n.replace(/\s+|\(.*?\)/g, ''));
    if (d < bestD) { bestD = d; best = n; }
  }
  return best && bestD <= (q.length <= 3 ? 1 : 2) ? best : null;
}

/** 진행 표시 — 입력 → 무료 가이드 → 결제. 실제 순서다. */
function Steps({ step }: { step: 1 | 2 | 3 }) {
  const items = ['아이 정보', '무료 가이드', '결제'];
  return (
    <ol className="dx-steps" aria-label={`3단계 중 ${step}단계`}>
      {items.map((t, i) => (
        <li key={t} className={i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''} aria-current={i + 1 === step ? 'step' : undefined}>
          {t}
        </li>
      ))}
    </ol>
  );
}

/**
 * 무료 가이드 — 입력값을 품종 표준과 대조한 판정 + 리포트에 추가로 들어가는 것.
 * 카드 여러 장을 쌓지 않고 **문서 한 장**(칸을 헤어라인으로 나눔)으로 그린다 — 결제 뒤 받는
 * 리포트의 앞 장처럼 보이게. (2026-09-26 디자인 검수: 흰 카드 반복은 건강수첩 문법과 가장 멀다)
 */
function GuideView({
  result, name, speciesKo, species, breed, breedNames, symptomIds, age, weight, sex, neutered, onNext, onEdit, onSuggest,
}: {
  result: GuideResult; name: string; speciesKo: string; species: Species; breed: string; breedNames: string[];
  symptomIds: string[]; age: string; weight: string; sex: Sex | ''; neutered: '' | 'yes' | 'no';
  onNext: () => void; onEdit: () => void; onSuggest: (breed: string) => void;
}) {
  const { guide, foods } = result;
  const breedKo = guide.breedKo ?? speciesKo;
  const mixWord = species === 'dog' ? '믹스견' : '믹스묘';

  // ── 입력값 × 품종 DB 판정 (AI 없이 즉시) ──
  const months = age !== '' && !isNaN(Number(age)) ? Math.max(0, Number(age)) * 12 : null;
  const personAge = months != null ? humanAge(species, months, guide.size) : null;
  const jointRisk = (guide.hereditary ?? []).some((h) => /슬개골|고관절|관절/.test(h.name));
  // 믹스견·믹스묘의 「표준 체중」은 범위가 너무 넓어 판정에 쓰지 않는다
  const range = guide.breedKo?.startsWith('믹스') ? null : parseWeightRange(guide.weightKg);
  const w = weight ? Number(weight) : undefined;
  const wCheck = weightCheck({ name, breedKo, weight: w, range, jointRisk });
  const others = [
    months != null ? stagePoint({ species, months, breedKo, size: guide.size, topDisease: (guide.hereditary ?? [])[0]?.name, personAge }) : null,
    neuterTip({ species, sex: sex || undefined, neutered: neutered === '' ? undefined : neutered === 'yes' }),
  ].filter(Boolean) as PersonalCheck[];

  const tips = getBreedTips(species, guide.breedKo ?? breed);
  const tip = tips[0];
  const moreTips = Math.max(0, tips.length - 1);

  const emergency = detectEmergency(symptomIds, '');
  const symCards = symptomIds
    .map((id) => ({ label: SYMPTOMS.find((s) => s.id === id)?.label || id, info: symptomInfo(id, species) }))
    .filter((x) => x.info);
  const diseases = guide.hereditary ?? [];
  const toxicCount = (foods?.toxic ?? []).length;
  const suggestion = !guide.matched && breed ? suggestBreed(breed, breedNames) : null;

  const meta = [guide.matched ? breedKo : (breed || speciesKo), age !== '' ? `${age}살` : null, w ? `${w}kg` : null].filter(Boolean).join(', ');

  return (
    <div className="gv stage">
      <Steps step={2} />
      <div className="dx-head dx-head-row">
        <div>
          <h1>{name}의 무료 가이드</h1>
          <p>{meta}</p>
        </div>
        <button type="button" className="btn btn--quiet" onClick={onEdit}>정보 수정</button>
      </div>

      {emergency && (
        <div className="emergency" role="alert">
          <b>지금 동물병원에 먼저 연락하세요</b>
          <span>고르신 증상은 응급일 수 있어요. 리포트는 진료를 받은 뒤에 보셔도 돼요.</span>
        </div>
      )}

      <div className="gv-doc">
        {!guide.matched && (
          <section className="gv-sec">
            <h2>{breed ? `‘${breed}’ 품종 정보를 찾지 못했어요` : '품종을 적지 않았어요'}</h2>
            {suggestion ? (
              <>
                <p className="gv-desc">혹시 <b>{suggestion}</b>인가요?</p>
                <div className="gv-actions">
                  <button type="button" className="btn btn--primary" onClick={() => onSuggest(suggestion)}>{suggestion} 가이드 보기</button>
                  <button type="button" className="btn btn--secondary" onClick={onEdit}>직접 고치기</button>
                </div>
              </>
            ) : (
              <>
                <p className="gv-desc">
                  {breed
                    ? `줄여 쓰셨다면 정확한 품종명으로 다시 적어 주세요. ${mixWord}이면 비워 두셔도 돼요. 리포트는 ${speciesKo} 일반 기준으로 만들어요.`
                    : `리포트는 ${speciesKo} 일반 기준으로 만들어요. 품종을 알면 적어 주세요. 체중과 질환 판정이 정확해져요.`}
                </p>
                <div className="gv-actions">
                  <button type="button" className="btn btn--secondary" onClick={onEdit}>품종 적기</button>
                </div>
              </>
            )}
          </section>
        )}

        {(wCheck || others.length > 0) && (
          <section className="gv-sec">
            <h2>지금 확인할 것</h2>
            <ul className="block-list">
              {wCheck && (
                <li className="check">
                  <span className={`tag ${TONE[wCheck.tone].cls}`}>{TONE[wCheck.tone].label}</span>
                  <b>{wCheck.title}</b>
                  <p>{wCheck.body}</p>
                  {range && w && <WeightRuler weight={w} range={range} />}
                </li>
              )}
              {others.map((c) => (
                <li className="check" key={c.title}>
                  <span className={`tag ${TONE[c.tone].cls}`}>{TONE[c.tone].label}</span>
                  <b>{c.title}</b>
                  <p>{c.body}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {symCards.length > 0 && (
          <section className="gv-sec">
            <h2>고르신 증상, 일반 안내</h2>
            <ul className="block-list">
              {symCards.map((c) => (
                <li className="sym" key={c.label}>
                  <b>{c.label}</b>
                  <p>{c.info!.causes}</p>
                  <p className="sym-vet">{c.info!.vet}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {guide.matched && tip && (
          <section className="gv-sec">
            <h2>{breedKo} 관리에서 먼저 알아 둘 것</h2>
            <ul className="block-list">
              <li className="sym">
                <b>{tip.title}</b>
                <p>{tip.body}</p>
              </li>
            </ul>
            <p className="gv-desc gv-desc--small">AKC, AVMA 등 공개된 수의 자료를 바탕으로 정리했어요.</p>
          </section>
        )}

        <section className="gv-sec gv-sec--lock">
          <h2>리포트에 더 들어가는 것</h2>
          <p className="gv-desc">결제하면 {name} 기준으로 계산해서 리포트로 정리해 드려요.</p>
          <ul className="block-list">
            {diseases.length > 0 && (
              <li className="lockrow">
                <b>조심할 질환 {diseases.length}가지와 병원에 가야 할 신호</b>
                <span className="lock-tease">{diseases.map((d) => d.name).join(', ')}</span>
                <Icon name="lock" size={15} />
              </li>
            )}
            <li className="lockrow">
              <b>하루 급여량</b>
              <span className="lock-tease">{w ? `${w}kg 기준 열량과 건사료 g수` : '체중을 적으면 열량과 g수를 계산해요'}</span>
              <Icon name="lock" size={15} />
            </li>
            <li className="lockrow">
              <b>접종·검진 날짜</b>
              <span className="lock-tease">마지막 접종 달을 적으면 다음 접종일을 계산해요</span>
              <Icon name="lock" size={15} />
            </li>
            <li className="lockrow">
              <b>먹으면 안 되는 음식 {toxicCount}가지와 이유</b>
              <span className="lock-tease">{(foods?.toxic ?? []).map((f) => f.name.split(/[·(]/)[0]).join(', ')}</span>
              <Icon name="lock" size={15} />
            </li>
            {moreTips > 0 && (
              <li className="lockrow">
                <b>{breedKo} 관리 포인트 {moreTips}가지 더</b>
                <span className="lock-tease">{tips[1]?.title}</span>
                <Icon name="lock" size={15} />
              </li>
            )}
            {(guide.exercise?.[0] || guide.grooming?.[0]) && (
              <li className="lockrow">
                <b>{species === 'cat' ? '놀이·미용 기준' : '산책·미용 기준'}</b>
                <span className="lock-tease">{guide.exercise?.[0] ?? guide.grooming?.[0]}</span>
                <Icon name="lock" size={15} />
              </li>
            )}
            <li className="lockrow">
              <b>주간 체크리스트</b>
              <span className="lock-tease">요일별로 표시하는 인쇄용 표</span>
              <Icon name="lock" size={15} />
            </li>
          </ul>
        </section>
      </div>

      <div className="gv-foot">
        <p>초콜릿, 포도, 양파, 자일리톨은 어떤 {speciesKo}에게도 주면 안 돼요.</p>
        {guide.sourceOrg && (
          <p>
            출처{' '}
            {guide.sourceUrl
              ? <a href={guide.sourceUrl} target="_blank" rel="noreferrer" className="source-badge">{guide.sourceOrg}</a>
              : guide.sourceOrg}
            . 일반적인 관리 정보이며 수의사의 진찰을 대신하지 않아요.
          </p>
        )}
      </div>

      <div className="sticky-cta">
        <div className="sticky-cta-inner">
          <p className="sticky-cta-price">{name} 리포트<b>{SITE.pricePerPet.toLocaleString()}원</b></p>
          <button className="btn btn--primary btn--lg" onClick={onNext}>리포트 받기</button>
        </div>
      </div>
    </div>
  );
}

export default function DiagnoseForm({ breedNames }: { breedNames: Record<Species, string[]> }) {
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
  // 마지막 접종 시기(선택) — 알면 리포트가 다음 접종 날짜를 계산한다
  const [vCombo, setVCombo] = useState('');
  const [vRabies, setVRabies] = useState('');
  const [vHeart, setVHeart] = useState('');
  // 결제 필수 정보 (이니시스 V2 요건: 구매자 이메일 등) — 결과 링크 안내 겸용
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  // 다시 찾기 번호(6자리) — 휴대폰번호와 함께 해시로만 저장, /find에서 재조회용
  const [pin, setPin] = useState('');
  const [agree, setAgree] = useState(false);
  // 이 기기에서 최근 결제 진행한 리포트 (복귀 배너용)
  const [lastDx, setLastDx] = useState<string | null>(null);

  const [stage, setStage] = useState<Stage>('form1');
  const [result, setResult] = useState<GuideResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);

  /*
    같은 내용으로 결제를 다시 누르면 **같은 주문번호(token)를 다시 쓴다.**
    예전에는 누를 때마다 새 주문을 만들어서, 결제가 끝났는데 화면이 실패로 보인 사람이 다시 누르면
    새 paymentId로 **두 번째 결제**가 열렸다. 같은 paymentId면 포트원이 「이미 결제됨」으로 막는다.
  */
  const attemptRef = useRef<{ sig: string; token: string } | null>(null);

  const speciesKo = species === 'dog' ? '강아지' : '고양이';
  const months = useMemo(() => (stage === 'form2' ? recentMonths() : []), [stage]);

  // 입력값 복원 (끄기 전까지 유지)
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
        if (d.vCombo) setVCombo(d.vCombo);
        if (d.vRabies) setVRabies(d.vRabies);
        if (d.vHeart) setVHeart(d.vHeart);
        /*
          단계와 가이드 결과를 되살린다 — 새로고침·복귀해도 하던 자리에서 이어서.
          24시간이 지난 것은 되살리지 않는다. 가이드 결과가 없으면 stage도 form1로.
        */
        const fresh = typeof d.at === 'number' && Date.now() - d.at < 24 * 3600_000;
        if (fresh && d.result && (d.stage === 'guide' || d.stage === 'form2')) {
          setResult(d.result);
          setStage(d.stage);
        }
      }
    } catch { /* ignore */ }
    try {
      const l = JSON.parse(localStorage.getItem('mypet_last') || 'null');
      if (l?.token && Date.now() - (l.at || 0) < 90 * 86400000) setLastDx(l.token);
    } catch { /* ignore */ }
    /*
      URL 프리필: 랜딩 이름·종류(?name=&sp=), 품종 페이지(?breed=&sp=), 증상(?s=).
      저장된 값을 복원한 **다음에** 적용한다 — 방금 적은 이름이 옛 입력에 덮이면 안 된다.
      ⚠️ 적용한 뒤에는 주소에서 지운다. 남겨 두면 결제 단계에서 새로고침할 때마다 다시 적용돼
         **1단계로 돌아갔다**(사용성 테스트에서 발견).
    */
    try {
      const q = new URLSearchParams(window.location.search);
      const sp = q.get('s');
      if (sp && SYMPTOMS.some((s) => s.id === sp)) setSymptomIds((prev) => (prev.includes(sp) ? prev : [...prev, sp]));
      const b = q.get('breed');
      if (b && b.trim()) setBreed(b.trim().slice(0, 60));
      const spc = q.get('sp');
      if (spc === 'dog' || spc === 'cat') setSpecies(spc);
      const nm = q.get('name');
      if (nm && nm.trim()) setName(nm.trim().slice(0, 30));
      if (b || nm || spc || sp) {
        setStage('form1');
        window.history.replaceState(window.history.state, '', window.location.pathname);
      }
    } catch { /* ignore */ }
    setRestored(true);
  }, []);

  // 입력값 저장
  useEffect(() => {
    if (!restored) return;
    try {
      // ⚠️ 이메일·휴대폰·다시 찾기 번호(개인정보)는 의도적으로 저장하지 않는다 — 화면 안내 문구와 일치해야 함.
      localStorage.setItem(LS_KEY, JSON.stringify({
        species, name, breed, age, sex, neutered, weight, symptoms, symptomIds, vCombo, vRabies, vHeart,
        stage, result, at: Date.now(),
      }));
    } catch { /* ignore */ }
  }, [restored, species, name, breed, age, sex, neutered, weight, symptoms, symptomIds, vCombo, vRabies, vHeart, stage, result]);

  /*
    ── 뒤로가기를 단계에 연결한다 ──────────────────────────────────────────
    이 폼은 한 페이지 안에서 stage로 화면을 바꾼다. history 항목을 단계마다 쌓고 popstate에서 되돌린다.
    주소는 그대로 /diagnose다 — 단계를 URL에 노출하면 공유했을 때 남의 입력이 없는 빈 2단계가 열린다.
    ⚠️ popstate로 되돌릴 때는 pushState를 하지 않는다(뒤로가기로 못 떠나게 가두게 된다).
  */
  const skipPushRef = useRef(false);
  useEffect(() => {
    if (!restored) return;
    if (skipPushRef.current) { skipPushRef.current = false; return; }
    if (stage === 'form1') return;
    try { window.history.pushState({ mypetStage: stage }, ''); } catch { /* ignore */ }
  }, [stage, restored]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = (e.state as { mypetStage?: string } | null)?.mypetStage;
      skipPushRef.current = true;
      setStage(st === 'form2' ? 'form2' : st === 'guide' ? 'guide' : 'form1');
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const toggleSymptom = (id: string) =>
    setSymptomIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  function go(next: Stage) {
    setError('');
    setStage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildInput(): PetInput {
    // notes에는 보호자가 직접 적은 것만. 선택 칩은 id 그대로 — 검증된 표로 답하고 AI를 부르지 않는다.
    const notes = symptoms.trim();
    return {
      symptomIds,
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      birth: ageToBirth(age),
      sex: sex || undefined,
      neutered: neutered === '' ? undefined : neutered === 'yes',
      weightKg: weight ? Number(weight) : undefined,
      notes: notes || undefined,
      lastVaccineCombo: vCombo || undefined,
      lastVaccineRabies: vRabies || undefined,
      lastHeartworm: vHeart || undefined,
    };
  }

  async function loadGuide(breedValue: string) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/breed-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species, breed: breedValue.trim(), birth: ageToBirth(age) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '가이드를 불러오지 못했어요.');
      setResult(json as GuideResult);
      go('guide');
    } catch (err: unknown) {
      setError(friendlyError(err, '가이드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }

  function showGuide(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('아이 이름을 적어 주세요.'); return; }
    if (age !== '' && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 40)) { setError('나이는 0에서 40 사이 숫자로 적어 주세요.'); return; }
    if (weight !== '' && (isNaN(Number(weight)) || Number(weight) <= 0 || Number(weight) >= 150)) { setError('체중은 kg 단위 숫자로 적어 주세요. 예: 3.2'); return; }
    void loadGuide(breed);
  }

  async function pay() {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim())) { setError('리포트 링크를 받을 이메일을 적어 주세요.'); return; }
    if (buyerPhone.replace(/\D/g, '').length < 10) { setError('휴대폰 번호를 숫자로 적어 주세요.'); return; }
    if (pin.replace(/\D/g, '').length !== 6) { setError('다시 찾기 번호로 쓸 숫자 6자리를 정해 주세요.'); return; }
    if (!agree) { setError('결제 전에 아래 동의 항목을 확인해 주세요.'); return; }
    setPaying(true);
    try {
      const body = { input: buildInput(), finderPhone: buyerPhone, finderPin: pin, buyerEmail: buyerEmail.trim() };
      const sig = JSON.stringify(body);
      let token = attemptRef.current?.sig === sig ? attemptRef.current.token : null;
      if (!token) {
        const startRes = await fetch('/api/diagnose/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: sig,
        });
        const started = await startRes.json();
        if (!startRes.ok) throw new Error(started.error || '접수하지 못했어요.');
        token = started.token as string;
        attemptRef.current = { sig, token };
      }
      // 이 기기 복귀용 — 결제창이 끊겨도 배너로 결과 페이지 재진입 가능
      try { localStorage.setItem('mypet_last', JSON.stringify({ token, at: Date.now() })); } catch { /* ignore */ }

      if (PAYMENTS_LIVE) {
        const PortOne = await import('@portone/browser-sdk/v2');
        // 이니시스 oid 길이 제한(40자) — 토큰 앞 24자만 사용 (서버가 동일 규칙으로 재계산해 검증)
        const pid = `mypet-${token.slice(0, 24)}`;
        const resp = await PortOne.requestPayment({
          storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID as string,
          channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY as string,
          paymentId: pid,
          orderName: `mypet 케어 리포트 (${name.trim()})`,
          totalAmount: SITE.pricePerPet,
          currency: 'CURRENCY_KRW' as never,
          payMethod: 'CARD' as never,
          customer: {
            fullName: `${name.trim()} 보호자`,
            email: buyerEmail.trim(),
            phoneNumber: buyerPhone.replace(/\D/g, ''),
          },
          // 모바일: 결제창이 페이지 이동(리디렉션)으로 동작 — 완료 후 돌아올 주소 (필수)
          redirectUrl: `${window.location.origin}/pay/return?token=${token}`,
        });
        if (!resp || resp.code != null) {
          // 이미 결제된 주문이면(다시 누른 경우) 결과 페이지로 보낸다 — 다시 결제시키지 않는다
          if (resp && /ALREADY_PAID|이미/.test(`${resp.code} ${resp.message ?? ''}`)) {
            router.push(`/r/${token}`);
            return;
          }
          setError(resp?.message ? `결제가 완료되지 않았어요. ${resp.message}` : '결제를 취소했어요. 입력하신 내용은 그대로 있어요.');
          setPaying(false);
          return;
        }
      }

      /*
        ⚠️ 결제가 끝나면 여기서 생성을 기다리지 않고 결과 페이지로 바로 넘긴다.
           예전에는 이 버튼 안에서 생성을 기다리다 실패하면 이 화면에 오류가 뜨고 결제 버튼이
           다시 켜져서, 이미 돈을 낸 사람이 **또 결제할 수 있었다.** 결과 페이지가 확인·재시도를 맡는다.
      */
      try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
      router.push(`/r/${token}`);
    } catch (err: unknown) {
      setError(friendlyError(err, '결제를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'));
      setPaying(false);
    }
  }

  // ═══════════ 1단계: 정보 입력 ═══════════
  if (stage === 'form1') {
    return (
      <div className="stage" key="form1">
        <Steps step={1} />
        <div className="dx-head">
          <h1>아이 정보</h1>
          <p>적어 주신 정보로 무료 가이드를 먼저 보여 드려요.</p>
        </div>
        {lastDx && (
          <Link href={`/r/${lastDx}`} className="lastdx">
            <span>이 기기에서 최근에 결제를 진행한 리포트가 있어요.</span>
            <b>확인하기</b>
          </Link>
        )}
        <form className="form" onSubmit={showGuide} noValidate>
          <div className="form-row">
            <span className="label" id="lbl-species">종류</span>
            <div className="seg" role="radiogroup" aria-labelledby="lbl-species">
              {(['dog', 'cat'] as const).map((sp) => (
                <button key={sp} type="button" role="radio" aria-checked={species === sp}
                  className={`seg-opt ${species === sp ? 'on' : ''}`} onClick={() => setSpecies(sp)}>
                  {sp === 'dog' ? '강아지' : '고양이'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label className="label" htmlFor="f-name">이름</label>
            <input id="f-name" className="input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="예: 구름이" autoComplete="off" />
          </div>

          <div className="form-row">
            <label className="label" htmlFor="f-breed">품종</label>
            <div>
              <input id="f-breed" className="input" value={breed} list={`breeds-${species}`} onChange={(e) => setBreed(e.target.value)}
                placeholder={species === 'dog' ? '예: 포메라니안' : '예: 코리안숏헤어'} autoComplete="off" />
              <datalist id={`breeds-${species}`}>
                {breedNames[species].map((b) => <option key={b} value={b} />)}
              </datalist>
              <p className="hint">목록에서 고르면 가장 정확해요. {species === 'dog' ? '믹스견' : '믹스묘'}이거나 모르면 비워 두세요.</p>
            </div>
          </div>

          <div className="form-row">
            <label className="label" htmlFor="f-age">나이</label>
            <div>
              <div className="input-suffix">
                <input id="f-age" className="input" type="number" inputMode="numeric" min="0" max="40" step="1" value={age} onChange={(e) => setAge(e.target.value)} placeholder="예: 3" />
                <span className="input-suffix-unit">살</span>
              </div>
              <p className="hint">한 살이 안 됐으면 0으로 적어 주세요.</p>
            </div>
          </div>

          <div className="form-row">
            <label className="label" htmlFor="f-weight">체중</label>
            <div className="input-suffix">
              <input id="f-weight" className="input" type="number" inputMode="decimal" step="any" min="0" max="150" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="예: 3.2" />
              <span className="input-suffix-unit">kg</span>
            </div>
          </div>

          <div className="form-row">
            <span className="label" id="lbl-sex">성별</span>
            <div className="seg" role="radiogroup" aria-labelledby="lbl-sex">
              {([['female', '암컷'], ['male', '수컷']] as const).map(([v, t]) => (
                <button key={v} type="button" role="radio" aria-checked={sex === v}
                  className={`seg-opt ${sex === v ? 'on' : ''}`} onClick={() => setSex(sex === v ? '' : v)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <span className="label" id="lbl-neut">중성화</span>
            <div className="seg" role="radiogroup" aria-labelledby="lbl-neut">
              {([['yes', '했어요'], ['no', '안 했어요']] as const).map(([v, t]) => (
                <button key={v} type="button" role="radio" aria-checked={neutered === v}
                  className={`seg-opt ${neutered === v ? 'on' : ''}`} onClick={() => setNeutered(neutered === v ? '' : v)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="form-row form-row--top">
            <span className="label" id="lbl-sym">걱정되는 증상 <span className="opt">선택</span></span>
            <div>
              <div className="chips" role="group" aria-labelledby="lbl-sym">
                {SYMPTOMS.map((s) => {
                  const on = symptomIds.includes(s.id);
                  return (
                    <button type="button" key={s.id} aria-pressed={on} className={`chip-toggle ${on ? 'on' : ''}`} onClick={() => toggleSymptom(s.id)}>
                      <span className="chip-box"><Icon name="check" size={12} strokeWidth={3} /></span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="hint">고르지 않으면 일반 관리 기준으로 정리해요. 자세한 상황은 결제 단계에서 적을 수 있어요.</p>
            </div>
          </div>

          <div className="form-foot">
            {error && <div className="alert" role="alert"><Icon name="alert" size={16} /> {error}</div>}
            <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> 불러오는 중</> : '무료 가이드 보기'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ═══════════ 2단계: 무료 가이드 ═══════════
  if (stage === 'guide' && result) {
    return (
      <GuideView
        key="guide"
        result={result}
        name={name}
        speciesKo={speciesKo}
        species={species}
        breed={breed}
        breedNames={breedNames[species]}
        symptomIds={symptomIds}
        age={age}
        weight={weight}
        sex={sex}
        neutered={neutered}
        onNext={() => go('form2')}
        onEdit={() => go('form1')}
        onSuggest={(b) => { setBreed(b); void loadGuide(b); }}
      />
    );
  }

  // ═══════════ 3단계: 결제 ═══════════
  const breedKo = result?.guide.matched ? result.guide.breedKo : (breed.trim() || speciesKo);
  const basis = [breedKo, age !== '' ? `${age}살` : null, weight ? `${weight}kg` : null].filter(Boolean).join(', ');
  const missing = [weight ? null : '체중', age !== '' ? null : '나이'].filter(Boolean) as string[];
  return (
    <div className="stage" key="form2">
      <Steps step={3} />
      <div className="dx-head">
        <h1>결제 정보</h1>
        <p>결제하면 바로 {name} 리포트를 만들어 드려요.</p>
      </div>

      <section className="block" style={{ marginBottom: 14 }}>
        <ul className="order">
          <li><span>상품</span><b>{name} 케어 리포트</b></li>
          <li><span>계산 기준</span><b>{basis}</b></li>
          <li><span>열람</span><b>60일, PDF 저장 가능</b></li>
          <li><span>결제 수단</span><b>신용·체크카드</b></li>
          <li className="total"><span>결제 금액</span><b>{SITE.pricePerPet.toLocaleString()}원</b></li>
        </ul>
        {missing.length > 0 && (
          <p className="order-warn">
            {missing.length === 2 ? '체중과 나이를' : missing[0] === '체중' ? '체중을' : '나이를'} 적지 않으면{' '}
            {missing.length === 2 ? '급여량, 체중 판정, 나이별 관리가' : missing[0] === '체중' ? '급여량과 체중 판정이' : '나이별 관리가'} 빠져요.{' '}
            <button type="button" className="linklike" onClick={() => go('form1')}>{missing.join(', ')} 적기</button>
          </p>
        )}
      </section>

      <div className="form">
        <div className="form-row form-row--top">
          <label className="label" htmlFor="f-notes">증상·상황 <span className="opt">선택</span></label>
          <div>
            <textarea id="f-notes" className="input" rows={4} maxLength={1000} value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
              placeholder="예: 어제부터 오른쪽 뒷다리를 절어요. 산책을 싫어해요." />
            <p className="hint">
              적어 주시면 AI가 가능한 원인과 병원에 가야 할 기준을 정리해 리포트에 넣어요. 비워 두면 AI를 쓰지 않아요.
              {symptomIds.length > 0 && <> 앞에서 고른 증상({symptomIds.length}개)은 따로 적지 않아도 반영돼요.</>}
            </p>
          </div>
        </div>

        <div className="form-row form-row--top">
          <span className="label">마지막 접종·예방약 <span className="opt">선택</span></span>
          <div>
            <div className="form-pair">
              <label>
                <span className="sub-label">종합백신</span>
                <select className="input" value={vCombo} onChange={(e) => setVCombo(e.target.value)}>
                  <option value="">모름</option>
                  {months.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
                </select>
              </label>
              <label>
                <span className="sub-label">광견병</span>
                <select className="input" value={vRabies} onChange={(e) => setVRabies(e.target.value)}>
                  <option value="">모름</option>
                  {months.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
                </select>
              </label>
              <label>
                <span className="sub-label">심장사상충약</span>
                <select className="input" value={vHeart} onChange={(e) => setVHeart(e.target.value)}>
                  <option value="">모름</option>
                  {months.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
                </select>
              </label>
            </div>
            <p className="hint">알면 다음 날짜를 계산해 드려요. 모르면 병원에서 확인할 항목으로 적어요.</p>
          </div>
        </div>

        <div className="form-row">
          <label className="label" htmlFor="f-email">이메일</label>
          <div>
            <input id="f-email" className="input" type="email" inputMode="email" autoComplete="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="name@example.com" />
            <p className="hint">리포트 링크를 이 주소로 보내 드려요.</p>
          </div>
        </div>

        <div className="form-row">
          <label className="label" htmlFor="f-phone">휴대폰</label>
          <input id="f-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="010-0000-0000" />
        </div>

        <div className="form-row">
          <label className="label" htmlFor="f-pin">다시 찾기 번호</label>
          <div>
            <input id="f-pin" className="input" type="tel" inputMode="numeric" value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="숫자 6자리" autoComplete="off" />
            <p className="hint">지금 새로 정하는 숫자 6자리예요. 카드 비밀번호가 아니에요. 링크를 잃어버려도 휴대폰 번호와 이 번호로 리포트를 다시 찾을 수 있어요.</p>
          </div>
        </div>

        <div className="form-foot">
          <p className="hint" style={{ marginTop: 0, marginBottom: 14 }}>
            이메일과 휴대폰 번호는 결제 확인을 위해 결제대행사(KG이니시스)에 전달돼요. 휴대폰 번호와 다시 찾기 번호는
            원문을 저장하지 않고 되돌릴 수 없게 바꾼 값만 남기며, 이메일은 리포트 링크를 보내는 데만 써요.
          </p>
          <label className="agree">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              <Link href="/terms" target="_blank">이용약관</Link>과 <Link href="/refund" target="_blank">환불정책</Link>을 확인했어요.
              리포트는 결제하면 바로 열리는 디지털 콘텐츠라서, 연 뒤에는 단순 변심에 따른 환불이 제한된다는 데 동의해요.
            </span>
          </label>
          <p className="terms">리포트를 받지 못했거나 내용에 문제가 있으면 환불해 드려요.</p>
          {error && <div className="alert" role="alert" style={{ marginTop: 12 }}><Icon name="alert" size={16} /> {error}</div>}
          <button className="btn btn--primary btn--lg btn--block" style={{ marginTop: 12 }} onClick={pay} disabled={paying}>
            {paying ? <><span className="spinner" /> 결제창을 여는 중</> : `${SITE.pricePerPet.toLocaleString()}원 결제하기`}
          </button>
          {!PAYMENTS_LIVE && <p className="hint center">테스트 모드예요. 실제 결제는 일어나지 않아요.</p>}
          <button type="button" className="btn btn--quiet" style={{ marginTop: 10 }} onClick={() => go('guide')} disabled={paying || !result}>
            무료 가이드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
