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
