'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icons';
import { dDayLabel, daysUntil, SCHEDULE_META, type ScheduleType } from '@/lib/careSchedule';

type Sched = { id: string; type: ScheduleType; title: string; due_date: string; status: string };
type Rec = { id: string; kind: string; value: any; note: string | null; recorded_at: string };

const KIND_LABEL: Record<string, string> = { weight: '체중', symptom: '증상', vet_visit: '병원', memo: '메모', med: '약' };

export default function PetCare({ petId, schedules, records }: { petId: string; schedules: Sched[]; records: Rec[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'weight' | 'memo' | null>(null);
  const [weight, setWeight] = useState('');
  const [memo, setMemo] = useState('');

  async function patchSchedule(id: string, status: string) {
    setBusy(true);
    try {
      await fetch('/api/schedules', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      router.refresh();
    } finally { setBusy(false); }
  }
  async function generate() {
    setBusy(true);
    try {
      await fetch('/api/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ petId }) });
      router.refresh();
    } finally { setBusy(false); }
  }
  async function addRecord(kind: 'weight' | 'memo') {
    const body: any = { petId, kind };
    if (kind === 'weight') {
      const kg = Number(weight);
      if (!kg || kg <= 0) return;
      body.value = { kg };
    } else {
      if (!memo.trim()) return;
      body.note = memo.trim();
    }
    setBusy(true);
    try {
      await fetch('/api/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setWeight(''); setMemo(''); setTab(null);
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="report" style={{ marginTop: 14 }}>
      {/* 케어 일정 */}
      <section className="section">
        <div className="section-head"><span className="section-ico"><Icon name="calendar" size={18} /></span><h3 className="section-title">케어 일정</h3></div>
        {schedules.length === 0 ? (
          <div className="dash-empty-row">
            <span>등록된 일정이 없어요.</span>
            <button className="btn btn--secondary btn--sm" onClick={generate} disabled={busy}>기본 일정 만들기</button>
          </div>
        ) : (
          <ul className="sched-list">
            {schedules.map((s) => {
              const done = s.status === 'done';
              const d = daysUntil(s.due_date);
              return (
                <li key={s.id} className={`sched-item ${done ? 'done' : d < 0 ? 'overdue' : ''}`}>
                  <span className="sched-ico"><Icon name={SCHEDULE_META[s.type].icon} size={16} /></span>
                  <span className="sched-body">
                    <span className="sched-title">{s.title}</span>
                    <span className="sched-sub">{s.due_date} · {SCHEDULE_META[s.type].label}</span>
                  </span>
                  {done ? (
                    <button className="sched-toggle done" onClick={() => patchSchedule(s.id, 'upcoming')} disabled={busy}><Icon name="check" size={14} strokeWidth={2.4} /> 완료</button>
                  ) : (
                    <>
                      <span className={`sched-dday ${d <= 7 ? 'soon' : ''}`}>{dDayLabel(s.due_date)}</span>
                      <button className="sched-toggle" onClick={() => patchSchedule(s.id, 'done')} disabled={busy} aria-label="완료 처리"><Icon name="check" size={14} strokeWidth={2.2} /></button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="dash-note"><Icon name="info" size={13} /> 권장 예상 일정이에요. 실제 접종 이력에 맞춰 조정하세요.</p>
      </section>

      {/* 기록 */}
      <section className="section">
        <div className="section-head"><span className="section-ico"><Icon name="repeat" size={18} /></span><h3 className="section-title">기록</h3></div>

        <div className="rec-add-btns">
          <button className={`rec-add-btn ${tab === 'weight' ? 'on' : ''}`} onClick={() => setTab(tab === 'weight' ? null : 'weight')}>⚖️ 체중</button>
          <button className={`rec-add-btn ${tab === 'memo' ? 'on' : ''}`} onClick={() => setTab(tab === 'memo' ? null : 'memo')}>📝 메모</button>
        </div>

        {tab === 'weight' && (
          <div className="rec-add-form">
            <input className="input" type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="몸무게 (kg)" />
            <button className="btn btn--primary btn--sm" onClick={() => addRecord('weight')} disabled={busy}>저장</button>
          </div>
        )}
        {tab === 'memo' && (
          <div className="rec-add-form">
            <input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (예: 사료 바꿈, 컨디션 좋음)" maxLength={500} />
            <button className="btn btn--primary btn--sm" onClick={() => addRecord('memo')} disabled={busy}>저장</button>
          </div>
        )}

        {records.length === 0 ? (
          <p className="dash-empty">아직 기록이 없어요. 체중·메모를 남겨보세요.</p>
        ) : (
          <ul className="rec-list">
            {records.map((r) => (
              <li key={r.id} className="rec-item">
                <span className="rec-kind">{KIND_LABEL[r.kind] ?? r.kind}</span>
                <span className="rec-body">{r.kind === 'weight' && r.value?.kg ? `${r.value.kg}kg` : r.note || '—'}</span>
                <span className="rec-date">{r.recorded_at.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
