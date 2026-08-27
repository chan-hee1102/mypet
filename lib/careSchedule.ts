import { Species } from './types';
import { computeAge } from './petData';

export type ScheduleType = 'vaccine' | 'deworm' | 'medication' | 'checkup';

export type GeneratedSchedule = {
  type: ScheduleType;
  title: string;
  due_date: string; // "YYYY-MM-DD"
  remind_before: number;
};

export const SCHEDULE_META: Record<ScheduleType, { label: string; icon: string }> = {
  vaccine: { label: '예방접종', icon: 'shield' },
  deworm: { label: '구충·심장사상충', icon: 'bowl' },
  medication: { label: '약 복용', icon: 'cross' },
  checkup: { label: '건강검진', icon: 'activity' },
};

function addMonths(d: Date, m: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}
/** 로컬 기준 YYYY-MM-DD (toISOString의 UTC 하루 밀림 방지). */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
/** "YYYY-MM" → 그 달 1일 Date. 형식 틀리면 null. */
function fromMonth(s?: string | null): Date | null {
  if (!s || !/^\d{4}-\d{2}$/.test(s)) return null;
  const [y, m] = s.split('-').map(Number);
  return new Date(y, m - 1, 1);
}
function laterOf(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

export type ScheduleOpts = {
  birth?: string | null;
  lastVaccineCombo?: string | null; // 종합백신
  lastVaccineRabies?: string | null; // 광견병
  lastHeartworm?: string | null; // 심장사상충·구충
};

/**
 * 케어 일정 생성. 마지막 접종일을 알면 거기서 다음 권장일을 계산하고,
 * 모르면 가짜 날짜 대신 "병원에서 이력 확인" 안내(근시일)로 만든다.
 *
 * 주기 근거(WSAVA/AAHA/CAPC): 심장사상충=매월, 종합백신/광견병 추가접종=마지막+12개월(한국 통상,
 * 국제기준은 성견 코어 3년), 건강검진=연 1회(노령 6개월), 1세 미만은 자견/자묘 시리즈 접종 안내.
 * 모두 권장 예상치 — 실제 접종은 수의사와 확인. 사용자가 수정·삭제 가능.
 */
export function defaultSchedules(species: Species, opts: ScheduleOpts = {}): GeneratedSchedule[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const age = computeAge(opts.birth ?? undefined);
  const months = age ? age.months : null;
  const isPuppy = months !== null && months < 12;
  const isSenior =
    months !== null && ((species === 'dog' && months >= 84) || (species === 'cat' && months >= 132));
  const comboName = species === 'dog' ? '종합백신(DHPPL)' : '종합백신(FVRCP)';

  const out: GeneratedSchedule[] = [];

  // 1) 심장사상충·구충 — 매월
  const hw = fromMonth(opts.lastHeartworm);
  out.push({
    type: 'deworm',
    title: '심장사상충·구충 예방 (매월)',
    due_date: ymd(hw ? laterOf(addMonths(hw, 1), addMonths(today, 1)) : addMonths(today, 1)),
    remind_before: 3,
  });

  // 2) 종합백신
  const combo = fromMonth(opts.lastVaccineCombo);
  if (combo) {
    out.push({ type: 'vaccine', title: `${comboName} 추가접종`, due_date: ymd(addMonths(combo, 12)), remind_before: 14 });
  } else if (isPuppy) {
    out.push({ type: 'vaccine', title: `${comboName} 자견 시리즈 — 병원에서 접종 일정 확인`, due_date: ymd(addMonths(today, 1)), remind_before: 7 });
  } else {
    out.push({ type: 'vaccine', title: `${comboName} — 병원에서 접종 이력 확인`, due_date: ymd(addMonths(today, 1)), remind_before: 7 });
  }

  // 3) 광견병
  const rab = fromMonth(opts.lastVaccineRabies);
  if (rab) {
    out.push({ type: 'vaccine', title: '광견병 추가접종', due_date: ymd(addMonths(rab, 12)), remind_before: 14 });
  } else {
    out.push({ type: 'vaccine', title: '광견병 — 병원에서 접종 이력 확인', due_date: ymd(addMonths(today, 1)), remind_before: 7 });
  }

  // 4) 건강검진 — 노령 6개월, 그 외 연 1회
  out.push({
    type: 'checkup',
    title: isSenior ? '정기 건강검진 (노령 6개월 권장)' : '정기 건강검진 (연 1회)',
    due_date: ymd(addMonths(today, isSenior ? 6 : 12)),
    remind_before: 14,
  });

  return out;
}

/** due_date 까지 남은 일수 (음수면 지남). */
export function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

/** "D-7" / "D-DAY" / "7일 지남" 라벨. */
export function dDayLabel(dueDate: string): string {
  const d = daysUntil(dueDate);
  if (d === 0) return 'D-DAY';
  if (d > 0) return `D-${d}`;
  return `${-d}일 지남`;
}

/**
 * 접종·예방 기준표 — 공개 가이드(/guide/dog-vaccine-schedule)가 그리는 표의 원본.
 *
 * ⚠️ defaultSchedules()가 날짜를 계산할 때 쓰는 주기와 **같은 근거**를 문장으로 옮긴 것이다.
 *    가이드 페이지에서 따로 적지 않고 여기서 가져가는 이유는, 둘이 갈라지면 어느 쪽이 맞는지
 *    알 수 없게 되기 때문이다. 주기를 바꾸면 위 함수와 이 표를 **함께** 고칠 것.
 *
 * 근거: WSAVA 백신 가이드라인, AAHA 개 백신 가이드라인, CAPC 심장사상충 가이드라인.
 *       추가접종 12개월은 국내 통상 기준이다(WSAVA 국제 지침은 성견 코어 3년을 제시한다).
 */
export type VaccineRow = { name: string; first: string; interval: string; booster: string; note: string };

export const VACCINE_REFERENCE: Record<Species, VaccineRow[]> = {
  dog: [
    { name: '종합백신 (DHPPL)', first: '생후 6~8주', interval: '2~4주 간격 3~4회',
      booster: '마지막 접종 12개월 후', note: '마지막 회차는 반드시 생후 16주 이후에 맞춥니다.' },
    { name: '광견병', first: '생후 12주 이후', interval: '1회',
      booster: '12개월 후', note: '동물등록·반려견 관리에서 요구되는 경우가 많습니다.' },
    { name: '켄넬코프 (기관지염)', first: '생후 8주 이후', interval: '2~4주 간격 2회',
      booster: '12개월 후', note: '애견카페·호텔·미용 등 다른 개와 접촉이 잦으면 권장됩니다.' },
    { name: '심장사상충 예방', first: '생후 6~8주', interval: '매월 1회',
      booster: '연중 매월', note: '접종이 아니라 투약입니다. 거르면 예방 효과가 끊깁니다.' },
    { name: '정기 건강검진', first: '1세', interval: '연 1회',
      booster: '7세 이상은 6개월마다', note: '노령기에는 혈액·소변 검사를 함께 보는 것이 좋습니다.' },
  ],
  cat: [
    { name: '종합백신 (FVRCP)', first: '생후 6~8주', interval: '2~4주 간격 3회',
      booster: '마지막 접종 12개월 후', note: '완전 실내묘도 필요합니다 — 범백 바이러스는 신발·옷에 묻어 들어옵니다.' },
    { name: '광견병', first: '생후 12주 이후', interval: '1회',
      booster: '12개월 후', note: '국내에서 고양이는 법적 의무가 아니지만 외출묘라면 권장됩니다.' },
    { name: '백혈병 (FeLV)', first: '생후 8주 이후', interval: '3~4주 간격 2회',
      booster: '생활 환경에 따라', note: '접종 전 FeLV 검사를 먼저 합니다. 단독 실내묘는 병원과 상의해 결정합니다.' },
    { name: '심장사상충·구충', first: '생후 8주 이후', interval: '매월 1회',
      booster: '연중 매월', note: '고양이는 심장사상충 치료제가 없어 예방이 유일한 방법입니다.' },
    { name: '정기 건강검진', first: '1세', interval: '연 1회',
      booster: '11세 이상은 6개월마다', note: '노령묘는 신장 수치와 갑상선을 특히 확인합니다.' },
  ],
};
