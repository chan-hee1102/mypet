import { Species } from './types';

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
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * 종/생월 기반 기본 케어 일정(권장 예상치). 사용자가 수정·삭제 가능.
 * ⚠️ 실제 접종 이력이 아니라 일반 권장 주기 기반의 예상 일정. UI에서 "수의사와 확인" 고지.
 */
export function defaultSchedules(species: Species, _birth?: string | null): GeneratedSchedule[] {
  const today = new Date();
  return [
    { type: 'deworm', title: '심장사상충·구충 예방', due_date: ymd(addMonths(today, 1)), remind_before: 3 },
    {
      type: 'vaccine',
      title: species === 'dog' ? '종합백신(DHPPL) 추가접종' : '종합백신(FVRCP) 추가접종',
      due_date: ymd(addMonths(today, 12)),
      remind_before: 14,
    },
    { type: 'vaccine', title: '광견병 예방접종', due_date: ymd(addMonths(today, 12)), remind_before: 14 },
    { type: 'checkup', title: '정기 건강검진', due_date: ymd(addMonths(today, 12)), remind_before: 14 },
  ];
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
