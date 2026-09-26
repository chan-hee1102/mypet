'use client';

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
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
import { josa, ro } from '@/lib/josa';

/*
  리포트 만들기 — 2026-09-26 두 번째 판: 「입력도 토스처럼」.
  한 화면에 질문 하나. 질문마다 뒤로가기(휴대폰 뒤로 버튼 포함)가 한 칸씩 돌아간다.
  주 버튼은 화면 아래에 고정하고, 키보드가 올라오면 같이 올라간다(--kb).

  ⚠️ 사용성 테스트(2026-09-26, 페르소나 2 + 폼 전문가)에서 고친 것
     · 나이 「0살」 → 살 + 개월. 한 살 미만이 전부 0개월이 되던 계산 오류도 여기서 막힌다
     · 품종: 목록이 안 보이던 datalist → 많이 키우는 품종 + 검색(별칭·초성) + 믹스
     · 결제: 필수(이메일·휴대폰)를 먼저, 다시 찾기 번호는 선택, 결제를 취소해도 이메일·휴대폰은 탭 안에서 유지
     · 오류는 틀린 칸 바로 아래에, 첫 오류 칸으로 이동
*/

const PAYMENTS_LIVE = !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const LS_KEY = 'mypet_diagnose_v1';
const SS_CONTACT = 'mypet_contact';

export type BreedOption = { n: string; a: string[] };
type Foods = { good: string[]; toxic: { name: string; reason: string; severity: string }[] };
type GuideResult = { guide: BreedGuide; ageLabel: string | null; foods: Foods };
type Stage = 'form1' | 'guide' | 'form2';
type Q = 'who' | 'breed' | 'age' | 'weight' | 'sex' | 'symptom';
const QS: Q[] = ['who', 'breed', 'age', 'weight', 'sex', 'symptom'];
const MIX: Record<Species, string> = { dog: '믹스견(잡종)', cat: '믹스/혼혈 고양이' };
const POPULAR_N = 8;

const TONE: Record<string, { cls: string; label: string }> = {
  ok: { cls: 'tag--ok', label: '적정' },
  warn: { cls: 'tag--warn', label: '주의' },
  info: { cls: 'tag--info', label: '참고' },
};

/** 증상 칩 설명 — 「기침」과 「켁켁」이 헷갈린다는 테스트 지적으로 소리·모양을 한 줄씩 붙였다 */
/** 잠긴 목록 맨 위 「두부 기침, 자세히」에 쓰는 짧은 이름 */
const SYMPTOM_SHORT: Record<string, string> = {
  cough: '기침', gag: '구역질', vomit: '구토', diarrhea: '설사', tremble: '떨림',
  lethargy: '기운 없음', itch: '가려움', breathing: '숨 가쁨',
};
const SYMPTOM_HINT: Record<string, string> = {
  cough: '「콜록」 하고 목에서 터져 나와요',
  gag: '토하려는 듯 꺽꺽대지만 나오는 건 없어요',
  vomit: '먹은 것이나 노란 물을 게워 내요',
  diarrhea: '묽은 변을 보거나 횟수가 늘었어요',
  tremble: '춥지 않은데도 몸을 떨어요',
  lethargy: '평소보다 누워 있고 밥을 남겨요',
  itch: '긁거나 핥고, 피부가 빨개졌어요',
  breathing: '가만히 있어도 숨이 빠르거나 입을 벌리고 쉬어요',
};

/** 살 + 개월 → 내부 birth("YYYY-MM"). 둘 다 비면 undefined */
function ageToBirth(y: string, m: string): string | undefined {
  if (y === '' && m === '') return undefined;
  const total = (Number(y) || 0) * 12 + (Number(m) || 0);
  if (!Number.isFinite(total) || total < 0 || total > 40 * 12) return undefined;
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - total);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function ageMonths(y: string, m: string): number | null {
  if (y === '' && m === '') return null;
  return (Number(y) || 0) * 12 + (Number(m) || 0);
}
function ageText(y: string, m: string): string | null {
  const yy = Number(y) || 0;
  const mm = Number(m) || 0;
  if (y === '' && m === '') return null;
  if (yy === 0) return `${mm}개월`;
  return mm ? `${yy}살 ${mm}개월` : `${yy}살`;
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

/** 편집 거리(글자 단위) — 품종 오타 제안·이메일 도메인 오타 제안 */
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

/** 한글 초성 — 「ㅁㅌㅈ」로 말티즈를 찾게 */
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
function chosung(s: string): string {
  return Array.from(s).map((ch) => {
    const c = ch.charCodeAt(0);
    return c >= 0xac00 && c <= 0xd7a3 ? CHO[Math.floor((c - 0xac00) / 588)] : ch;
  }).join('');
}
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

type Hit = { n: string; via?: string; score: number };
function searchBreeds(q: string, list: BreedOption[]): Hit[] {
  const nq = norm(q);
  if (!nq) return [];
  const isCho = /^[ㄱ-ㅎ]+$/.test(nq);
  const out: Hit[] = [];
  for (const b of list) {
    const nn = norm(b.n);
    if (isCho) {
      const c = chosung(nn);
      if (c.startsWith(nq)) out.push({ n: b.n, score: 0 });
      else if (c.includes(nq)) out.push({ n: b.n, score: 1 });
      continue;
    }
    if (nn.startsWith(nq)) { out.push({ n: b.n, score: 0 }); continue; }
    if (nn.includes(nq)) { out.push({ n: b.n, score: 1 }); continue; }
    const al = b.a.find((a) => norm(a).includes(nq));
    if (al) out.push({ n: b.n, via: al, score: 2 });
  }
  return out.sort((x, y) => x.score - y.score).slice(0, 30);
}

/** 010-1234-5678 — 숫자만 받고 +82는 0으로 */
function formatPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('82')) d = '0' + d.slice(2);
  d = d.slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}
const phoneOk = (p: string) => /^01[016789]\d{7,8}$/.test(p.replace(/\D/g, ''));
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const DOMAINS = ['naver.com', 'gmail.com', 'daum.net', 'hanmail.net', 'kakao.com', 'nate.com', 'icloud.com'];
function domainFix(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const dom = email.slice(at + 1).toLowerCase();
  if (!dom || DOMAINS.includes(dom)) return null;
  const hit = DOMAINS.find((d) => editDistance(dom, d) <= 2);
  return hit ? email.slice(0, at + 1) + hit : null;
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
function Check() {
  return <span className="fx-check" aria-hidden><Icon name="check" size={15} strokeWidth={3} /></span>;
}

/** 위 막대 — 뒤로 가기 + 진행 */
function TopBar({ onBack, progress }: { onBack?: () => void; progress: number }) {
  return (
    <div className="fx-top">
      {onBack ? (
        <button type="button" className="fx-back" onClick={onBack} aria-label="이전으로">
          <BackIcon />
        </button>
      ) : <span style={{ width: 40 }} />}
      <div className="fx-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <span style={{ width: `${Math.max(4, progress * 100)}%` }} />
      </div>
      <Link href="/" className="fx-close" aria-label="그만두고 처음으로">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
      </Link>
    </div>
  );
}

/** 화면 아래 고정 버튼 */
function Cta({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="fx-cta">
      <div className="fx-cta-in">
        {note && <p className="fx-cta-note">{note}</p>}
        {children}
      </div>
    </div>
  );
}

/**
 * 무료 가이드 — 입력값을 품종 표준과 대조한 판정 + 리포트에 더 들어가는 것.
 * 회색 바탕 위 흰 카드(토스 결과 화면). 잠긴 목록 맨 위에는 고른 증상을 올린다 —
 * 「내가 궁금한 건 기침인데 2,900원 내면 그걸 알려 준다는 거야?」(테스트 페르소나)
 */
function GuideView({
  result, name, speciesKo, species, breed, breedNames, symptomIds, months, ageLabel, weight, sex, neutered, onNext, onBack, onEdit, onSuggest,
}: {
  result: GuideResult; name: string; speciesKo: string; species: Species; breed: string; breedNames: string[];
  symptomIds: string[]; months: number | null; ageLabel: string | null; weight: string; sex: Sex | ''; neutered: '' | 'yes' | 'no';
  onNext: () => void; onBack: () => void; onEdit: () => void; onSuggest: (breed: string) => void;
}) {
  const { guide, foods } = result;
  const breedKo = guide.breedKo ?? speciesKo;
  const mixWord = species === 'dog' ? '믹스견' : '믹스묘';

  const personAge = months != null ? humanAge(species, months, guide.size) : null;
  const jointRisk = (guide.hereditary ?? []).some((h) => /슬개골|고관절|관절/.test(h.name));
  // 믹스견·믹스묘의 「표준 체중」은 범위가 너무 넓어 판정에 쓰지 않는다
  const range = guide.breedKo?.startsWith('믹스') ? null : parseWeightRange(guide.weightKg);
  const w = weight ? Number(weight) : undefined;
  const wCheck = weightCheck({ name, breedKo, weight: w, range, jointRisk, months });
  const others = [
    months != null ? stagePoint({ species, months, breedKo, size: guide.size, topDisease: (guide.hereditary ?? [])[0]?.name, personAge }) : null,
    neuterTip({ species, sex: sex || undefined, neutered: neutered === '' ? undefined : neutered === 'yes' }),
  ].filter(Boolean) as PersonalCheck[];

  const tips = getBreedTips(species, guide.breedKo ?? breed);
  const tip = tips[0];
  const moreTips = Math.max(0, tips.length - 1);

  const emergency = detectEmergency(symptomIds, '');
  const symCards = symptomIds
    .map((id) => ({ id, label: SYMPTOMS.find((s) => s.id === id)?.label || id, info: symptomInfo(id, species) }))
    .filter((x) => x.info);
  const diseases = guide.hereditary ?? [];
  const toxicCount = (foods?.toxic ?? []).length;
  const suggestion = !guide.matched && breed ? suggestBreed(breed, breedNames) : null;
  const firstSym = symCards[0];

  const meta = [guide.matched ? breedKo : (breed || speciesKo), ageLabel, w ? `${w}kg` : null].filter(Boolean).join(', ');

  return (
    <div className="on-grey">
      <TopBar onBack={onBack} progress={0.8} />
      <div className="fx-q to-next">
        <header className="gd-head">
          <div>
            <h1>{name}의 무료 가이드</h1>
            <p>{meta}</p>
          </div>
          <button type="button" className="btn btn--sm btn--secondary gd-edit" onClick={onEdit}>정보 수정</button>
        </header>

        <div className="gd-cards">
          {emergency && (
            <div className="gd-alert" role="alert">
              <b>지금 동물병원에 먼저 연락하세요</b>
              <span>고르신 증상은 응급일 수 있어요. 리포트는 진료를 받은 뒤에 보셔도 돼요.</span>
            </div>
          )}

          {!guide.matched && (
            <section className="gd-card">
              <h2>{breed ? `‘${breed}’ 품종 정보를 찾지 못했어요` : '품종을 고르지 않았어요'}</h2>
              {suggestion ? (
                <>
                  <p className="gd-card-sub">혹시 <b>{suggestion}</b>인가요?</p>
                  <div className="gd-card-actions">
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => onSuggest(suggestion)}>{suggestion} 가이드 보기</button>
                    <button type="button" className="btn btn--secondary btn--sm" onClick={onEdit}>직접 고치기</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="gd-card-sub">
                    {breed
                      ? `리포트는 ${speciesKo} 일반 기준으로 만들어요. 줄여 쓰셨다면 정확한 품종으로 다시 골라 주세요. ${mixWord}이면 그대로 두셔도 돼요.`
                      : `리포트는 ${speciesKo} 일반 기준으로 만들어요. 품종을 알면 골라 주세요. 체중과 질환 판정이 정확해져요.`}
                  </p>
                  <div className="gd-card-actions">
                    <button type="button" className="btn btn--secondary btn--sm" onClick={onEdit}>품종 고르기</button>
                  </div>
                </>
              )}
            </section>
          )}

          {(wCheck || others.length > 0) && (
            <section className="gd-card">
              <h2>지금 확인할 것</h2>
              {wCheck && (
                <div className="gd-item">
                  <div className="gd-item-top"><span className={`tag ${TONE[wCheck.tone].cls}`}>{wCheck.growing ? '성장 중' : TONE[wCheck.tone].label}</span><b>{wCheck.title}</b></div>
                  <p>{wCheck.body}</p>
                  {range && w && !wCheck.growing && <WeightRuler weight={w} range={range} />}
                </div>
              )}
              {others.map((c) => (
                <div className="gd-item" key={c.title}>
                  <div className="gd-item-top"><span className={`tag ${TONE[c.tone].cls}`}>{TONE[c.tone].label}</span><b>{c.title}</b></div>
                  <p>{c.body}</p>
                </div>
              ))}
            </section>
          )}

          {symCards.length > 0 && (
            <section className="gd-card">
              <h2>고르신 증상, 먼저 알아 둘 것</h2>
              {symCards.map((c) => (
                <div className="gd-item" key={c.label}>
                  <div className="gd-item-top"><b>{c.label}</b></div>
                  <p>{c.info!.causes}</p>
                  <p className="gd-vet">{c.info!.vet}</p>
                </div>
              ))}
            </section>
          )}

          {guide.matched && tip && (
            <section className="gd-card">
              <h2>{breedKo} 관리에서 먼저 알아 둘 것</h2>
              <div className="gd-item">
                <div className="gd-item-top"><b>{tip.title}</b></div>
                <p>{tip.body}</p>
              </div>
              <p className="gd-src">미국켄넬클럽(AKC), 미국수의사회(AVMA) 등 공개된 수의 자료를 바탕으로 정리했어요.</p>
            </section>
          )}

          <section className="gd-card gd-lock">
            <div className="gd-lock-head">
              <h2>리포트에 더 들어가는 것</h2>
              <span className="gd-price num">{SITE.pricePerPet.toLocaleString()}원</span>
            </div>
            <p className="gd-card-sub">{name} 기준으로 계산해 한 장에 담아요.</p>
            <ul className="gd-locks">
              {firstSym && (
                <li className="hl">
                  <i><Icon name="lock" size={16} /></i>
                  <b>{name} {SYMPTOM_SHORT[firstSym.id] ?? '증상'}, 자세히</b>
                  <span className="wrap">지켜봐도 되는 경우와 바로 병원에 갈 경우, 집에서 확인할 것</span>
                </li>
              )}
              {diseases.length > 0 && (
                <li>
                  <i><Icon name="lock" size={16} /></i>
                  <b>조심할 질환 {diseases.length}가지와 병원에 가야 할 신호</b>
                  <span>이름과 쉬운 설명, 집에서 알아챌 수 있는 신호</span>
                </li>
              )}
              <li>
                <i><Icon name="lock" size={16} /></i>
                <b>하루 급여량</b>
                <span>{w ? `${w}kg 기준 열량과 건사료 g수` : '몸무게를 알려 주시면 열량과 g수를 계산해요'}</span>
              </li>
              <li>
                <i><Icon name="lock" size={16} /></i>
                <b>접종·검진 날짜</b>
                <span>마지막 접종 달을 알면 다음 날짜를, 모르면 병원에서 확인할 것을 적어요</span>
              </li>
              <li>
                <i><Icon name="lock" size={16} /></i>
                <b>먹으면 안 되는 음식 {toxicCount}가지와 이유</b>
                <span>{(foods?.toxic ?? []).map((f) => f.name.split(/[·(]/)[0]).join(', ')}</span>
              </li>
              {moreTips > 0 && (
                <li>
                  <i><Icon name="lock" size={16} /></i>
                  <b>{breedKo} 관리 포인트 {moreTips}가지 더</b>
                  <span>{tips[1]?.title}</span>
                </li>
              )}
              <li>
                <i><Icon name="lock" size={16} /></i>
                <b>주간 체크리스트</b>
                <span>요일별로 표시하는 인쇄용 표</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="gd-foot">
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
      </div>

      <Cta note={<>결제하면 바로 열리고, 60일 동안 다시 볼 수 있어요</>}>
        <button className="btn btn--primary btn--lg btn--block" onClick={onNext} data-track="리포트 받기">
          {SITE.pricePerPet.toLocaleString()}원에 전체 리포트 받기
        </button>
      </Cta>
    </div>
  );
}

export default function DiagnoseForm({ breeds }: { breeds: Record<Species, BreedOption[]> }) {
  const router = useRouter();
  const [species, setSpecies] = useState<Species | ''>('');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [breedQuery, setBreedQuery] = useState('');
  const [ageY, setAgeY] = useState('');
  const [ageM, setAgeM] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [neutered, setNeutered] = useState<'' | 'yes' | 'no'>('');
  const [weight, setWeight] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [symptomIds, setSymptomIds] = useState<string[]>([]);
  const [noSym, setNoSym] = useState(false);
  // 마지막 접종 시기(선택) — 알면 리포트가 다음 접종 날짜를 계산한다
  const [vCombo, setVCombo] = useState('');
  const [vRabies, setVRabies] = useState('');
  const [vHeart, setVHeart] = useState('');
  // 결제 필수 정보(이니시스 V2 요건) — 결과 링크를 보낼 곳 겸용
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  // 다시 찾기 번호(6자리, 선택) — 휴대폰 번호와 함께 해시로만 저장, /find에서 재조회용
  const [pin, setPin] = useState('');
  const [agree, setAgree] = useState(false);
  const [lastDx, setLastDx] = useState<string | null>(null);

  const [stage, setStage] = useState<Stage>('form1');
  const [qi, setQi] = useState(0);
  // 첫 화면은 미끄러지지 않는다(none) — 사용자가 넘긴 뒤부터 방향에 맞춰 움직인다
  const [dir, setDir] = useState<'next' | 'prev' | 'none'>('none');
  const [result, setResult] = useState<GuideResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [restored, setRestored] = useState(false);

  /*
    같은 내용으로 결제를 다시 누르면 **같은 주문번호(token)를 다시 쓴다.**
    누를 때마다 새 주문을 만들면, 결제가 끝났는데 화면이 실패로 보인 사람이 다시 눌렀을 때
    새 paymentId로 **두 번째 결제**가 열린다. 같은 paymentId면 포트원이 「이미 결제됨」으로 막는다.
  */
  const attemptRef = useRef<{ sig: string; token: string } | null>(null);

  const sp: Species = species || 'dog';
  const speciesKo = sp === 'dog' ? '강아지' : '고양이';
  const q = QS[qi];
  const months = useMemo(() => (stage === 'form2' ? recentMonths() : []), [stage]);
  const breedList = breeds[sp];
  const allNames = useMemo(() => breedList.map((b) => b.n), [breedList]);
  const nm = name.trim() || '아이';

  // ── 키보드 높이만큼 아래 버튼을 올린다(iOS 사파리는 고정 요소를 키보드 뒤에 둔다) ──
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const set = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb', `${kb > 80 ? kb : 0}px`);
    };
    vv.addEventListener('resize', set);
    vv.addEventListener('scroll', set);
    return () => {
      vv.removeEventListener('resize', set);
      vv.removeEventListener('scroll', set);
      document.documentElement.style.removeProperty('--kb');
    };
  }, []);

  // 입력값 복원 (끄기 전까지 유지)
  useEffect(() => {
    let startQ = 0;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.species === 'dog' || d.species === 'cat') setSpecies(d.species);
        if (d.name) setName(d.name);
        if (d.breed) setBreed(d.breed);
        if (typeof d.ageY === 'string') setAgeY(d.ageY);
        else if (d.age) setAgeY(String(d.age)); // 옛 판(살만 받던 때)
        if (typeof d.ageM === 'string') setAgeM(d.ageM);
        if (d.sex) setSex(d.sex);
        if (d.neutered) setNeutered(d.neutered);
        if (d.weight) setWeight(d.weight);
        if (d.symptoms) setSymptoms(d.symptoms);
        if (Array.isArray(d.symptomIds)) setSymptomIds(d.symptomIds);
        if (d.noSym) setNoSym(true);
        if (d.vCombo) setVCombo(d.vCombo);
        if (d.vRabies) setVRabies(d.vRabies);
        if (d.vHeart) setVHeart(d.vHeart);
        // 하던 자리에서 이어서 — 24시간이 지난 것은 처음부터
        const fresh = typeof d.at === 'number' && Date.now() - d.at < 24 * 3600_000;
        if (fresh && d.result && (d.stage === 'guide' || d.stage === 'form2')) {
          setResult(d.result);
          setStage(d.stage);
        } else if (fresh && typeof d.qi === 'number' && d.qi >= 0 && d.qi < QS.length) {
          startQ = d.qi;
        }
      }
    } catch { /* ignore */ }
    try {
      const c = JSON.parse(sessionStorage.getItem(SS_CONTACT) || 'null');
      if (c?.email) setBuyerEmail(c.email);
      if (c?.phone) setBuyerPhone(c.phone);
    } catch { /* ignore */ }
    try {
      const l = JSON.parse(localStorage.getItem('mypet_last') || 'null');
      if (l?.token && Date.now() - (l.at || 0) < 90 * 86400000) setLastDx(l.token);
    } catch { /* ignore */ }
    /*
      URL 프리필: 랜딩(?name=&sp=), 품종 페이지(?breed=&sp=), 증상(?s=).
      저장된 값을 복원한 **다음에** 적용하고, 적용한 뒤에는 주소에서 지운다
      (남겨 두면 새로고침할 때마다 다시 적용돼 처음으로 돌아갔다).
    */
    try {
      const u = new URLSearchParams(window.location.search);
      const s = u.get('s');
      if (s && SYMPTOMS.some((x) => x.id === s)) { setSymptomIds((prev) => (prev.includes(s) ? prev : [...prev, s])); setNoSym(false); }
      const b = u.get('breed');
      if (b && b.trim()) setBreed(b.trim().slice(0, 60));
      const spc = u.get('sp');
      if (spc === 'dog' || spc === 'cat') setSpecies(spc);
      const n = u.get('name');
      if (n && n.trim()) setName(n.trim().slice(0, 30));
      if (b || n || spc || s) {
        setStage('form1');
        startQ = n && n.trim() && (spc === 'dog' || spc === 'cat') ? 1 : 0;
        window.history.replaceState(window.history.state, '', window.location.pathname);
      }
    } catch { /* ignore */ }
    setQi(startQ);
    setRestored(true);
  }, []);

  // 입력값 저장 — ⚠️ 이메일·휴대폰·번호는 여기(localStorage)에 넣지 않는다. 연락처는 탭 안(sessionStorage)에만
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        species, name, breed, ageY, ageM, sex, neutered, weight, symptoms, symptomIds, noSym, vCombo, vRabies, vHeart,
        stage, qi, result, at: Date.now(),
      }));
    } catch { /* ignore */ }
  }, [restored, species, name, breed, ageY, ageM, sex, neutered, weight, symptoms, symptomIds, noSym, vCombo, vRabies, vHeart, stage, qi, result]);
  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(SS_CONTACT, JSON.stringify({ email: buyerEmail, phone: buyerPhone })); } catch { /* ignore */ }
  }, [restored, buyerEmail, buyerPhone]);

  /*
    ── 뒤로가기를 질문·단계에 연결한다 ─────────────────────────────────
    한 주소(/diagnose) 안에서 화면을 바꾸므로, 질문·단계마다 history 항목을 쌓고 popstate에서 되돌린다.
    ⚠️ popstate로 되돌릴 때는 pushState를 하지 않는다(뒤로가기로 못 떠나게 가두게 된다).
    ⚠️ 첫 질문은 쌓지 않는다 — 거기서 뒤로 가면 이 페이지를 떠나야 한다.
  */
  const skipPushRef = useRef(true);
  useEffect(() => {
    if (!restored) return;
    if (skipPushRef.current) { skipPushRef.current = false; return; }
    if (stage === 'form1' && qi === 0) return;
    try { window.history.pushState({ mypetStage: stage, qi }, ''); } catch { /* ignore */ }
  }, [stage, qi, restored]);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { mypetStage?: string; qi?: number } | null;
      skipPushRef.current = true;
      setDir('prev');
      setErrs({});
      setError('');
      setStage(st?.mypetStage === 'form2' ? 'form2' : st?.mypetStage === 'guide' ? 'guide' : 'form1');
      setQi(typeof st?.qi === 'number' ? st.qi : 0);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // 질문이 바뀌면 입력칸으로(숫자 질문만 — 목록·타일 질문에서 키보드가 가리지 않게)
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (stage !== 'form1') return;
    if (q === 'age' || q === 'weight') {
      const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 260);
      return () => clearTimeout(t);
    }
  }, [q, stage]);

  function goQ(i: number) {
    setError('');
    setErrs({});
    setDir(i >= qi ? 'next' : 'prev');
    setQi(i);
    window.scrollTo({ top: 0 });
  }
  function goStage(next: Stage, qIndex?: number) {
    setError('');
    setErrs({});
    setDir(next === 'form1' || (stage === 'form2' && next === 'guide') ? 'prev' : 'next');
    if (typeof qIndex === 'number') setQi(qIndex);
    setStage(next);
    window.scrollTo({ top: 0 });
  }
  /*
    화면 위 「이전」 버튼. 질문을 거쳐 온 경우엔 브라우저 뒤로가기와 같게(history.back),
    저장된 자리에서 바로 열린 경우엔 쌓인 기록이 없으니 한 칸 앞 화면으로 직접 옮긴다
    (그대로 history.back을 부르면 이 페이지를 떠나 버린다).
  */
  const back = () => {
    const st = window.history.state as { mypetStage?: string } | null;
    if (st?.mypetStage) { window.history.back(); return; }
    if (stage === 'form2') goStage('guide');
    else if (stage === 'guide') goStage('form1', QS.length - 1);
    else if (qi > 0) goQ(qi - 1);
  };

  function buildInput(): PetInput {
    // notes에는 보호자가 직접 적은 것만. 고른 증상은 id 그대로 — 검증된 표로 답하고 AI를 부르지 않는다.
    const notes = symptoms.trim();
    return {
      symptomIds,
      name: name.trim(),
      species: sp,
      breed: breed.trim() || undefined,
      birth: ageToBirth(ageY, ageM),
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
        body: JSON.stringify({ species: sp, breed: breedValue.trim(), birth: ageToBirth(ageY, ageM) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '가이드를 불러오지 못했어요.');
      setResult(json as GuideResult);
      goStage('guide');
    } catch (err: unknown) {
      setError(friendlyError(err, '가이드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }

  /** 지금 질문 확인 → 다음 */
  function next() {
    const e: Record<string, string> = {};
    if (q === 'who') {
      if (!species) e.species = '강아지인지 고양이인지 골라 주세요.';
      if (!name.trim()) e.name = '이름을 적어 주세요.';
    }
    if (q === 'breed' && breedQuery.trim() && !breed) {
      // 목록에서 고르지 않고 적기만 했다면 적은 그대로 쓴다
      setBreed(breedQuery.trim().slice(0, 60));
    }
    if (q === 'age') {
      const y = Number(ageY || 0);
      const m = Number(ageM || 0);
      if (ageY !== '' && (!Number.isInteger(y) || y < 0 || y > 30)) e.age = '살은 0에서 30 사이로 적어 주세요.';
      else if (ageM !== '' && (!Number.isInteger(m) || m < 0 || m > 11)) e.age = '개월은 0에서 11 사이로 적어 주세요.';
    }
    if (q === 'weight' && weight !== '' && (isNaN(Number(weight)) || Number(weight) <= 0 || Number(weight) >= 150)) {
      e.weight = 'kg 단위 숫자로 적어 주세요. 예: 3.2';
    }
    setErrs(e);
    if (Object.keys(e).length) return;
    if (q === 'symptom') { void loadGuide(breed || breedQuery); return; }
    goQ(qi + 1);
  }
  function skip(clear: () => void) {
    clear();
    setErrs({});
    if (q === 'symptom') { void loadGuide(breed); return; }
    goQ(qi + 1);
  }
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); next(); }
  };

  function pickBreed(n: string) {
    setBreed(n);
    setBreedQuery('');
    setErrs({});
    // 고르는 순간 다음 질문으로 — 한 번 더 누르게 하지 않는다
    setTimeout(() => goQ(QS.indexOf('breed') + 1), 160);
  }

  const toggleSymptom = (id: string) => {
    setNoSym(false);
    setSymptomIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  async function pay() {
    setError('');
    const e: Record<string, string> = {};
    if (!emailOk(buyerEmail)) e.email = buyerEmail.trim() ? '이메일 주소를 다시 확인해 주세요.' : '리포트 링크를 받을 이메일을 적어 주세요.';
    if (!phoneOk(buyerPhone)) e.phone = buyerPhone.trim() ? '휴대폰 번호를 다시 확인해 주세요. 예: 010-1234-5678' : '휴대폰 번호를 적어 주세요.';
    if (pin && pin.replace(/\D/g, '').length !== 6) e.pin = '숫자 6자리로 정해 주세요. 정하지 않으려면 비워 두세요.';
    if (!agree) e.agree = '확인하셨으면 동의에 체크해 주세요.';
    setErrs(e);
    const first = ['email', 'phone', 'pin', 'agree'].find((k) => e[k]);
    if (first) {
      const el = document.getElementById(`ck-${first}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el instanceof HTMLInputElement && first !== 'agree') setTimeout(() => el.focus({ preventScroll: true }), 300);
      return;
    }
    setPaying(true);
    try {
      const phoneDigits = buyerPhone.replace(/\D/g, '');
      const body = { input: buildInput(), finderPhone: phoneDigits, finderPin: pin || undefined, buyerEmail: buyerEmail.trim() };
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
      // 이 기기 복귀용 — 결제창이 끊겨도 첫 질문 위 안내로 결과 페이지에 다시 들어갈 수 있게
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
            phoneNumber: phoneDigits,
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
          setError(resp?.message ? `결제가 끝나지 않았어요. ${resp.message}` : '결제를 취소했어요. 적어 주신 내용은 그대로 있어요.');
          setPaying(false);
          return;
        }
      }

      /*
        ⚠️ 결제가 끝나면 여기서 생성을 기다리지 않고 결과 페이지로 바로 넘긴다.
           이 버튼 안에서 생성을 기다리다 실패하면 결제 버튼이 다시 켜져서, 이미 돈을 낸 사람이
           **또 결제할 수 있었다.** 결과 페이지가 확인·재시도를 맡는다.
      */
      try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
      router.push(`/r/${token}`);
    } catch (err: unknown) {
      setError(friendlyError(err, '결제를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'));
      setPaying(false);
    }
  }

  if (!restored) return <div className="fx-top" aria-hidden />;

  // ═══════════ 2단계: 무료 가이드 ═══════════
  if (stage === 'guide' && result) {
    return (
      <GuideView
        key="guide"
        result={result}
        name={nm}
        speciesKo={speciesKo}
        species={sp}
        breed={breed}
        breedNames={allNames}
        symptomIds={symptomIds}
        months={ageMonths(ageY, ageM)}
        ageLabel={ageText(ageY, ageM)}
        weight={weight}
        sex={sex}
        neutered={neutered}
        onNext={() => goStage('form2')}
        onBack={back}
        onEdit={() => goStage('form1', 0)}
        onSuggest={(b) => { setBreed(b); void loadGuide(b); }}
      />
    );
  }

  // ═══════════ 3단계: 결제 정보 ═══════════
  if (stage === 'form2') {
    const breedKo = result?.guide.matched ? result.guide.breedKo : (breed.trim() || speciesKo);
    const basis = [breedKo, ageText(ageY, ageM), weight ? `${weight}kg` : null].filter(Boolean).join(', ');
    const missing = [weight ? null : '몸무게', ageY !== '' || ageM !== '' ? null : '나이'].filter(Boolean) as string[];
    const emailFix = domainFix(buyerEmail.trim());
    const at = buyerEmail.indexOf('@');
    const domPart = at >= 0 ? buyerEmail.slice(at + 1).toLowerCase() : null;
    const domHints = domPart !== null && !DOMAINS.includes(domPart) ? DOMAINS.filter((d) => d.startsWith(domPart)).slice(0, 4) : [];
    return (
      <div key="form2">
        <TopBar onBack={back} progress={0.95} />
        <div className={`fx-q to-${dir}`}>
          <h1 className="fx-title">{nm} 리포트,<br />어디로 보낼까요?</h1>
          <p className="fx-sub">결제하면 바로 열리고, 이메일로도 링크가 가요.</p>

          <div className="ck-order">
            <div>
              <b>{nm} 케어 리포트</b>
              <span>{basis}</span>
            </div>
            <strong>{SITE.pricePerPet.toLocaleString()}원</strong>
          </div>
          {missing.length > 0 && (
            <p className="ck-warn">
              {missing.join('와 ')}를 모르면 {missing.includes('몸무게') ? '급여량과 체중 판정' : ''}{missing.length === 2 ? ', ' : ''}{missing.includes('나이') ? '나이별 관리' : ''}가 일반 기준으로 들어가요.{' '}
              <button type="button" className="linklike" onClick={() => goStage('form1', missing[0] === '몸무게' ? QS.indexOf('weight') : QS.indexOf('age'))}>지금 적기</button>
            </p>
          )}

          <div className="ck-fields">
            <div className="ck-field">
              <label className="fx-label" htmlFor="ck-email">이메일</label>
              <div className={`fx-field ${errs.email ? 'is-invalid' : ''}`}>
              <input id="ck-email" className="fx-input fx-input--sm" type="email" inputMode="email" autoComplete="email" enterKeyHint="next"
                value={buyerEmail} aria-invalid={!!errs.email} aria-describedby="ck-email-msg"
                onChange={(e) => { setBuyerEmail(e.target.value.replace(/\s/g, '')); if (errs.email) setErrs((x) => ({ ...x, email: '' })); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); document.getElementById('ck-phone')?.focus(); } }}
                placeholder="name@example.com" />
              </div>
              {domHints.length > 0 && (
                <div className="ck-suggest" aria-label="자주 쓰는 주소">
                  {domHints.map((d) => (
                    <button type="button" key={d} onClick={() => setBuyerEmail(buyerEmail.slice(0, at + 1) + d)}>@{d}</button>
                  ))}
                </div>
              )}
              {emailFix && !domHints.length && (
                <p className="ck-fix">혹시 <b>{emailFix}</b>인가요?<button type="button" className="linklike" onClick={() => setBuyerEmail(emailFix)}>바꾸기</button></p>
              )}
              <p id="ck-email-msg" className={errs.email ? 'field-error' : 'hint'}>{errs.email || '리포트 링크가 이 주소로 가요.'}</p>
            </div>

            <div className="ck-field">
              <label className="fx-label" htmlFor="ck-phone">휴대폰 번호</label>
              <div className={`fx-field ${errs.phone ? 'is-invalid' : ''}`}>
              <input id="ck-phone" className="fx-input fx-input--sm num" type="tel" inputMode="numeric" autoComplete="tel" enterKeyHint="done"
                value={buyerPhone} aria-invalid={!!errs.phone} aria-describedby="ck-phone-msg"
                onChange={(e) => { setBuyerPhone(formatPhone(e.target.value)); if (errs.phone) setErrs((x) => ({ ...x, phone: '' })); }}
                placeholder="010-0000-0000" />
              </div>
              <p id="ck-phone-msg" className={errs.phone ? 'field-error' : 'hint'}>{errs.phone || '결제 확인에 써요. 결제대행사(KG이니시스)에 전달돼요.'}</p>
            </div>
          </div>

          <ul className="ck-facts">
            <li><span>다시 보기</span><b>60일 동안 볼 수 있어요. PDF로 저장도 돼요</b></li>
            <li><span>결제 수단</span><b>신용·체크카드</b></li>
            <li><span>환불</span><b>리포트를 못 받았거나 내용에 문제가 있으면 전액 돌려드려요</b></li>
          </ul>

          <label className={`ck-agree ${errs.agree ? 'is-invalid' : ''}`} id="ck-agree">
            <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); if (errs.agree) setErrs((x) => ({ ...x, agree: '' })); }} />
            <span className="ck-box" aria-hidden><Icon name="check" size={15} strokeWidth={3} /></span>
            <span className="ck-agree-text">
              <b>주문 내용과 약관을 확인했어요</b> <span className="opt">필수</span>
              <small>
                <Link href="/terms" target="_blank">이용약관</Link>과 <Link href="/refund" target="_blank">환불정책</Link>에 동의해요.
                리포트는 결제하면 바로 열리는 디지털 콘텐츠라서, 연 뒤에는 단순 변심으로는 환불되지 않아요.
              </small>
            </span>
          </label>
          {errs.agree && <p className="field-error" style={{ marginLeft: 40 }}>{errs.agree}</p>}

          <p className="ck-privacy">
            휴대폰 번호와 다시 찾기 번호는 알아볼 수 없게 바꿔서 저장하고, 이메일은 리포트 링크를 보내는 데만 써요.{' '}
            <Link href="/privacy" target="_blank">개인정보처리방침</Link>
          </p>

          <p className="fx-list-title" style={{ margin: '28px 4px 10px' }}>더 알려 주시면 좋아요</p>
          <details className="fx-more" open={!!errs.pin || !!pin}>
            <summary><span>다시 찾기 번호 정하기 <span className="opt">선택</span></span></summary>
            <div className="fx-more-body">
              <input id="ck-pin" className="input num" type="text" inputMode="numeric" autoComplete="off" maxLength={6}
                value={pin} aria-invalid={!!errs.pin} aria-label="다시 찾기 번호 숫자 6자리"
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); if (errs.pin) setErrs((x) => ({ ...x, pin: '' })); }}
                placeholder="숫자 6자리" />
              <p className={errs.pin ? 'field-error' : 'hint'}>
                {errs.pin || '이메일을 못 찾을 때, 휴대폰 번호와 이 번호로 리포트 찾기에서 다시 열 수 있어요. 카드 비밀번호와는 상관없어요.'}
              </p>
            </div>
          </details>

          <details className="fx-more" style={{ marginTop: 10 }}>
            <summary><span>마지막 접종 날짜 알려 주기 <span className="opt">선택</span></span></summary>
            <div className="fx-more-body" style={{ display: 'grid', gap: 12 }}>
              {([
                ['종합백신', vCombo, setVCombo],
                ['광견병', vRabies, setVRabies],
                ['심장사상충약', vHeart, setVHeart],
              ] as const).map(([label, val, set]) => (
                <label key={label}>
                  <span className="label" style={{ marginBottom: 6 }}>{label}</span>
                  <select className="input" value={val} onChange={(e) => set(e.target.value)}>
                    <option value="">잘 몰라요</option>
                    {months.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
                  </select>
                </label>
              ))}
              <p className="hint" style={{ marginTop: 0 }}>알면 다음 날짜를 계산해 드려요. 몰라도 괜찮아요. 병원에서 확인할 항목으로 적어 드려요.</p>
            </div>
          </details>
          {!PAYMENTS_LIVE && <p className="ck-test">테스트 모드예요. 실제 결제는 일어나지 않아요.</p>}
          {error && <div className="alert" role="alert" style={{ marginTop: 16 }}><Icon name="alert" size={16} /> {error}</div>}
        </div>

        <Cta note={Object.values(errs).some(Boolean) ? <b style={{ color: 'var(--red700)' }}>{[errs.email && '이메일', errs.phone && '휴대폰 번호', errs.pin && '다시 찾기 번호', errs.agree && '동의 체크'].filter(Boolean).join(', ')}를 확인해 주세요</b> : undefined}>
          <button className="btn btn--primary btn--lg btn--block" onClick={pay} disabled={paying} data-track="결제하기">
            {paying ? <><span className="spinner" /> 결제창을 여는 중</> : `${SITE.pricePerPet.toLocaleString()}원 결제하기`}
          </button>
        </Cta>
      </div>
    );
  }

  // ═══════════ 1단계: 한 화면에 질문 하나 ═══════════
  const progress = (qi + 1) / (QS.length + 2);
  const popular = breedList.filter((b) => b.n !== MIX[sp]).slice(0, POPULAR_N);
  const hits = searchBreeds(breedQuery, breedList);
  const other: Species = sp === 'dog' ? 'cat' : 'dog';
  const otherHit = breedQuery.trim() && !hits.length ? searchBreeds(breedQuery, breeds[other])[0] : null;
  const exact = hits.some((h) => norm(h.n) === norm(breedQuery));

  let body: ReactNode = null;
  let title: ReactNode = null;
  let sub: ReactNode = null;
  let cta: ReactNode = (
    <button className="btn btn--primary btn--lg btn--block" onClick={next} disabled={loading}>다음</button>
  );

  if (q === 'who') {
    cta = <button className="btn btn--primary btn--lg btn--block" onClick={next} disabled={!species || !name.trim()}>다음</button>;
    title = <>어떤 아이의<br />리포트를 만들까요?</>;
    sub = '무료 가이드를 먼저 보고, 전체 리포트는 그다음에 정하면 돼요.';
    body = (
      <>
        {lastDx && (
          <Link href={`/r/${lastDx}`} className="lastdx" style={{ marginBottom: 20 }}>
            <span>이 기기에서 결제한 리포트가 있어요</span>
            <b>열기</b>
          </Link>
        )}
        <div className="fx-tiles" role="radiogroup" aria-label="종류">
          {(['dog', 'cat'] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={species === s} className={`fx-tile ${species === s ? 'on' : ''}`}
              onClick={() => { setSpecies(s); if (s !== species) { setBreed(''); setBreedQuery(''); } setErrs((x) => ({ ...x, species: '' })); }}>
              {s === 'dog' ? '강아지' : '고양이'}
            </button>
          ))}
        </div>
        {errs.species && <p className="fx-err">{errs.species}</p>}
        <div className="fx-gap" />
        <label className="fx-label" htmlFor="fx-name">이름</label>
        <div className={`fx-field ${errs.name ? 'is-invalid' : ''}`}>
          <input id="fx-name" className="fx-input" value={name} maxLength={30} enterKeyHint="next" autoComplete="off"
            onChange={(e) => { setName(e.target.value); if (errs.name) setErrs((x) => ({ ...x, name: '' })); }}
            onKeyDown={onEnter} placeholder={sp === 'cat' ? '예: 치즈' : '예: 두부'} />
        </div>
        {errs.name && <p className="fx-err">{errs.name}</p>}
      </>
    );
  }

  if (q === 'breed') {
    title = <>{josa(nm, '은/는')}<br />어떤 품종인가요?</>;
    const rows = breedQuery.trim() ? hits : popular;
    body = (
      <>
        <label className="fx-search">
          <SearchIcon />
          <input className="input" value={breedQuery} onChange={(e) => { setBreedQuery(e.target.value); setBreed(''); }}
            onKeyDown={onEnter} enterKeyHint="search" autoComplete="off" aria-label="품종 검색"
            placeholder={sp === 'dog' ? '품종 검색 (예: 말티즈, ㅍㅁ)' : '품종 검색 (예: 코숏, 러블)'} />
        </label>
        {breed && !breedQuery && !popular.some((b) => b.n === breed) && (
          <ul className="fx-list">
            <li><button type="button" className="fx-row on" onClick={() => pickBreed(breed)}><span className="fx-row-main"><b>{breed}</b><span>지금 고른 품종</span></span><Check /></button></li>
          </ul>
        )}
        {!breedQuery.trim() && <p className="fx-list-title">많이 키우는 품종</p>}
        <ul className="fx-list" style={{ marginTop: breedQuery.trim() ? 12 : 0 }}>
          {rows.map((h) => {
            const via = (h as Hit).via;
            return (
              <li key={h.n}>
                <button type="button" className={`fx-row ${breed === h.n ? 'on' : ''}`} onClick={() => pickBreed(h.n)}>
                  <span className="fx-row-main">
                    <b>{h.n}</b>
                    {via && <span>‘{via}’{ro(via)} 찾았어요</span>}
                  </span>
                  {breed === h.n ? <Check /> : <span className="fx-chev" aria-hidden />}
                </button>
              </li>
            );
          })}
          {breedQuery.trim() && !exact && (
            <li>
              <button type="button" className="fx-row" onClick={() => pickBreed(breedQuery.trim().slice(0, 60))}>
                <span className="fx-row-main"><b>‘{breedQuery.trim()}’{ro(breedQuery.trim())} 적을게요</b><span>목록에 없으면 적은 그대로 써요</span></span>
                <span className="fx-chev" aria-hidden />
              </button>
            </li>
          )}
          {otherHit && (
            <li>
              <button type="button" className="fx-row" onClick={() => { setSpecies(other); setBreed(otherHit.n); setBreedQuery(''); setTimeout(() => goQ(QS.indexOf('breed') + 1), 160); }}>
                <span className="fx-row-main"><b>{otherHit.n}</b><span>{other === 'cat' ? '고양이' : '강아지'} 품종이에요. {other === 'cat' ? '고양이' : '강아지'}로 바꿀게요</span></span>
                <span className="fx-chev" aria-hidden />
              </button>
            </li>
          )}
          {!breedQuery.trim() && (
            <>
              <li>
                <button type="button" className={`fx-row ${breed === MIX[sp] ? 'on' : ''}`} onClick={() => pickBreed(MIX[sp])}>
                  <span className="fx-row-main"><b>{sp === 'dog' ? '믹스견이에요' : '믹스묘예요'}</b><span>여러 품종이 섞였거나 품종이 없어요</span></span>
                  {breed === MIX[sp] ? <Check /> : <span className="fx-chev" aria-hidden />}
                </button>
              </li>
              <li>
                <button type="button" className="fx-row" onClick={() => skip(() => { setBreed(''); setBreedQuery(''); })}>
                  <span className="fx-row-main"><b>잘 몰라요</b><span>{sp === 'dog' ? '강아지' : '고양이'} 일반 기준으로 정리돼요</span></span>
                  <span className="fx-chev" aria-hidden />
                </button>
              </li>
            </>
          )}
        </ul>
      </>
    );
    cta = (
      <button className="btn btn--primary btn--lg btn--block" onClick={next} disabled={!breed && !(breedQuery.trim() && !hits.length)}>
        {breed || !breedQuery.trim() || hits.length ? '다음' : `‘${breedQuery.trim()}’${ro(breedQuery.trim())} 할게요`}
      </button>
    );
  }

  if (q === 'age') {
    title = <>{josa(nm, '은/는')}<br />몇 살이에요?</>;
    body = (
      <>
        <div className="fx-pair">
          <div>
            <label className="sr-only" htmlFor="fx-age-y">살</label>
            <div className={`fx-field ${errs.age ? 'is-invalid' : ''}`}>
              <input id="fx-age-y" ref={inputRef} className="fx-input" type="text" inputMode="numeric" enterKeyHint="next" maxLength={2}
                value={ageY} onChange={(e) => setAgeY(e.target.value.replace(/\D/g, '').slice(0, 2))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('fx-age-m')?.focus(); } }} placeholder="0" />
              <span className="fx-unit">살</span>
            </div>
          </div>
          <div>
            <label className="sr-only" htmlFor="fx-age-m">개월</label>
            <div className={`fx-field ${errs.age ? 'is-invalid' : ''}`}>
              <input id="fx-age-m" className="fx-input" type="text" inputMode="numeric" enterKeyHint="next" maxLength={2}
                value={ageM} onChange={(e) => setAgeM(e.target.value.replace(/\D/g, '').slice(0, 2))} onKeyDown={onEnter} placeholder="0" />
              <span className="fx-unit">개월</span>
            </div>
          </div>
        </div>
        {errs.age ? <p className="fx-err">{errs.age}</p> : <p className="fx-hint">한 살이 안 됐으면 개월만 적어 주세요. 어린 시기는 접종 일정이 달라요.</p>}
        <button type="button" className="fx-skip" onClick={() => skip(() => { setAgeY(''); setAgeM(''); })}>나이를 몰라요</button>
      </>
    );
    cta = <button className="btn btn--primary btn--lg btn--block" onClick={next} disabled={ageY === '' && ageM === ''}>다음</button>;
  }

  if (q === 'weight') {
    title = <>{nm} 몸무게는<br />얼마인가요?</>;
    body = (
      <>
        <label className="sr-only" htmlFor="fx-weight">몸무게</label>
        <div className={`fx-field ${errs.weight ? 'is-invalid' : ''}`}>
          <input id="fx-weight" ref={inputRef} className="fx-input" type="text" inputMode="decimal" enterKeyHint="next" maxLength={5}
            value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 5))}
            onKeyDown={onEnter} placeholder="3.2" />
          <span className="fx-unit">kg</span>
        </div>
        {errs.weight ? <p className="fx-err">{errs.weight}</p> : <p className="fx-hint">대략이어도 괜찮아요. 3kg 조금 넘으면 3.2처럼 적어 주세요. 하루 급여량을 계산하는 데 써요.</p>}
        <button type="button" className="fx-skip" onClick={() => skip(() => setWeight(''))}>몸무게를 몰라요</button>
      </>
    );
    cta = <button className="btn btn--primary btn--lg btn--block" onClick={next} disabled={weight === ''}>다음</button>;
  }

  if (q === 'sex') {
    title = <>{josa(nm, '은/는')}<br />남자아이인가요, 여자아이인가요?</>;
    const pickSex = (v: Sex) => {
      setSex(v);
      if (neutered) setTimeout(() => goQ(qi + 1), 220);
    };
    const pickNeut = (v: 'yes' | 'no') => {
      setNeutered(v);
      if (sex) setTimeout(() => goQ(qi + 1), 220);
    };
    body = (
      <>
        <span className="fx-label" id="lbl-sex">성별</span>
        <div className="fx-opts" role="radiogroup" aria-labelledby="lbl-sex">
          {([['male', '남자아이'], ['female', '여자아이']] as const).map(([v, t]) => (
            <button key={v} type="button" role="radio" aria-checked={sex === v} className={`fx-opt ${sex === v ? 'on' : ''}`} onClick={() => pickSex(v)}>{t}</button>
          ))}
        </div>
        <div className="fx-gap" />
        <span className="fx-label" id="lbl-neut">중성화</span>
        <div className="fx-opts" role="radiogroup" aria-labelledby="lbl-neut">
          {([['yes', '했어요'], ['no', '안 했어요']] as const).map(([v, t]) => (
            <button key={v} type="button" role="radio" aria-checked={neutered === v} className={`fx-opt ${neutered === v ? 'on' : ''}`} onClick={() => pickNeut(v)}>{t}</button>
          ))}
        </div>
        <button type="button" className="fx-skip" onClick={() => skip(() => undefined)}>잘 모르겠어요</button>
      </>
    );
  }

  if (q === 'symptom') {
    title = <>요즘 {josa(nm, '이/가')}<br />걱정되는 게 있나요?</>;
    sub = '여러 개 골라도 돼요. 헷갈리면 비슷한 것을 모두 골라 주세요.';
    body = (
      <>
        <ul className="fx-list" style={{ marginTop: 0 }}>
          <li>
            <button type="button" aria-pressed={noSym} className={`fx-row ${noSym ? 'on' : ''}`} onClick={() => { setNoSym(!noSym); setSymptomIds([]); }}>
              <span className="fx-row-main"><b>특별히 없어요</b><span>평소 관리 기준으로 정리돼요</span></span>
              <span className="fx-check" aria-hidden><Icon name="check" size={15} strokeWidth={3} /></span>
            </button>
          </li>
          {SYMPTOMS.map((s) => {
            const on = symptomIds.includes(s.id);
            return (
              <li key={s.id}>
                <button type="button" aria-pressed={on} className={`fx-row ${on ? 'on' : ''}`} onClick={() => toggleSymptom(s.id)}>
                  <span className="fx-row-main"><b>{s.label}</b><span>{SYMPTOM_HINT[s.id]}</span></span>
                  <span className="fx-check fx-check--box" aria-hidden><Icon name="check" size={15} strokeWidth={3} /></span>
                </button>
              </li>
            );
          })}
        </ul>
        <details className="fx-more" open={!!symptoms}>
          <summary><span>상황을 직접 적을게요 <span className="opt">선택</span></span></summary>
          <div className="fx-more-body">
            <textarea className="input" rows={4} maxLength={1000} value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
              placeholder="예: 어제부터 오른쪽 뒷다리를 절어요. 산책을 싫어해요." />
            <p className="hint">적어 주시면 결제 후 리포트에서 AI가 가능한 원인과 병원에 가야 할 기준을 정리해요. 비워 두면 AI를 쓰지 않아요.</p>
          </div>
        </details>
        {error && <div className="alert" role="alert" style={{ marginTop: 16 }}><Icon name="alert" size={16} /> {error}</div>}
      </>
    );
    cta = (
      <button className="btn btn--primary btn--lg btn--block" onClick={next} disabled={loading} data-track="무료 가이드 보기">
        {loading ? <><span className="spinner" /> 불러오는 중</> : `${nm} 가이드 보기`}
      </button>
    );
  }

  return (
    <div key="form1">
      <TopBar onBack={qi > 0 ? back : undefined} progress={progress} />
      <div className={`fx-q to-${dir}`} key={q}>
        <h1 className="fx-title">{title}</h1>
        {sub && <p className="fx-sub">{sub}</p>}
        <div className="fx-body">{body}</div>
      </div>
      <Cta>{cta}</Cta>
    </div>
  );
}
