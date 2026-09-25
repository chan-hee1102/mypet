'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order, OrderPg } from '@/lib/admin-types';
import { AdIcon } from '../icons';
import { ago, Card, dateTime, Empty, KpiCard, OrderBadge, orderState, Skeleton, won } from '../ui';

type Filter = 'all' | 'problem' | 'done' | 'left' | 'cancel';
const FILTERS: [Filter, string][] = [
  ['all', '전체'],
  ['problem', '확인 필요'],
  ['done', '완료'],
  ['left', '결제 전 이탈'],
  ['cancel', '결제 취소·실패'],
];

function bucket(o: Order): Filter {
  const s = orderState(o);
  if (s.problem) return 'problem';
  if (o.status === 'done') return 'done';
  if (s.label === '결제 취소' || s.label === '결제 실패') return 'cancel';
  return 'left';
}

const PG_LABEL: Record<string, string> = {
  PAID: '결제 완료',
  READY: '결제창만 열림',
  FAILED: '결제 실패',
  CANCELLED: '결제 취소',
  PARTIAL_CANCELLED: '부분 취소',
  PAY_PENDING: '결제 대기',
  VIRTUAL_ACCOUNT_ISSUED: '가상계좌 발급',
};

export type OrderAction = (token: string, action: 'check' | 'generate' | 'mail', extra?: { to?: string; note?: string }) => Promise<{ ok: boolean; message: string; pg?: OrderPg | null }>;

/** 주문 — 요약 · 필터 · 표(휴대폰은 카드) · 상세(결제사 대조, 리포트 만들기, 링크 메일) */
export function Orders({
  items,
  selected,
  setSelected,
  onAction,
}: {
  items: Order[] | null;
  selected: string | null;
  setSelected: (t: string | null) => void;
  onAction: OrderAction;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const list = useMemo(() => items ?? [], [items]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: list.length, problem: 0, done: 0, left: 0, cancel: 0 };
    for (const o of list) c[bucket(o)] += 1;
    return c;
  }, [list]);

  if (!items) {
    return (
      <div className="ad-stack">
        <div className="ad-kpis">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} h={110} />
          ))}
        </div>
        <Skeleton h={420} />
      </div>
    );
  }

  const done = list.filter((o) => o.status === 'done' && !o.test);
  const tests = list.filter((o) => o.test).length;
  const revenue = done.reduce((s, o) => s + (o.amount ?? 0), 0);
  const q = query.trim().toLowerCase();
  const shown = list.filter(
    (o) => (filter === 'all' || bucket(o) === filter) && (!q || `${o.petName} ${o.breed ?? ''} ${o.email ?? ''} ${o.pg?.email ?? ''} ${o.token}`.toLowerCase().includes(q)),
  );
  const current = list.find((o) => o.token === selected) ?? null;

  return (
    <div className="ad-stack">
      <div className="ad-kpis">
        <KpiCard label="완료된 리포트" value={`${done.length}건`} foot={tests ? `전체 기간, 테스트 ${tests}건 제외` : '전체 기간'} />
        <KpiCard label="매출" value={won(revenue)} foot="완료된 리포트 기준" />
        <KpiCard label="확인 필요" value={`${counts.problem}건`} alert={counts.problem > 0} foot={counts.problem ? '결제는 됐는데 리포트가 없어요' : '문제 없는 상태예요'} />
      </div>

      <div className="ad-filters">
        <div className="ad-chips" role="tablist" aria-label="주문 상태">
          {FILTERS.map(([f, label]) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} className={`ad-chip ${filter === f ? 'is-on' : ''}`} onClick={() => setFilter(f)}>
              {label}
              <span className="num">{counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="ad-search">
          <AdIcon name="search" size={14} />
          <input className="ad-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름, 품종, 이메일, 주문 번호" aria-label="주문 검색" />
        </label>
      </div>

      <Card flush>
        {shown.length === 0 ? (
          <Empty icon="orders" title={list.length ? '조건에 맞는 주문이 없어요' : '아직 주문이 없어요'} desc={list.length ? undefined : '결제창을 연 주문부터 여기 쌓여요.'} />
        ) : (
          <>
            <table className="ad-table">
              <colgroup>
                <col style={{ width: 176 }} />
                <col />
                <col style={{ width: 96 }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: 104 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>상태</th>
                  <th>반려동물</th>
                  <th>금액</th>
                  <th>받는 메일</th>
                  <th>주문</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => {
                  const st = orderState(o);
                  return (
                    <tr key={o.token} onClick={() => setSelected(o.token)} className={`${selected === o.token ? 'is-on' : ''} ${st.problem ? 'is-problem' : ''}`}>
                      <td>
                        <OrderBadge o={o} />
                      </td>
                      <td>
                        <div className="ad-cell" style={{ fontWeight: 600 }}>{o.petName}</div>
                        <div className="ad-cell ad-sub">{o.breed ?? (o.species === 'cat' ? '고양이' : '강아지')}</div>
                      </td>
                      <td className="num">{(o.status === 'done' && !o.test) || o.pg?.status === 'PAID' ? won(o.amount ?? o.pg?.amount ?? 0) : <span className="ad-muted">—</span>}</td>
                      <td>
                        <div className="ad-cell">{o.email ?? o.pg?.email ?? <span className="ad-muted">없음</span>}</div>
                        <div className="ad-cell ad-sub">{o.mailedAt ? `링크 보냄 ${ago(o.mailedAt)}` : o.status === 'done' ? '링크 안 보냄' : ''}</div>
                      </td>
                      <td className="ad-time">{ago(o.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ul className="ad-list ad-mobile-list">
              {shown.map((o) => (
                <li key={o.token}>
                  <button type="button" className="ad-mcard" onClick={() => setSelected(o.token)}>
                    <span className="ad-mcard-top">
                      <OrderBadge o={o} />
                      <span className="ad-time">{ago(o.createdAt)}</span>
                    </span>
                    <span className="ad-strong" style={{ marginTop: 6 }}>
                      {o.petName} <span className="ad-muted" style={{ fontWeight: 400 }}>{o.breed ?? (o.species === 'cat' ? '고양이' : '강아지')}</span>
                    </span>
                    <span className="ad-sub">{o.email ?? o.pg?.email ?? '이메일 없음'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {current ? <OrderDetail key={current.token} o={current} onClose={() => setSelected(null)} onAction={onAction} /> : null}
    </div>
  );
}

function OrderDetail({ o, onClose, onAction }: { o: Order; onClose: () => void; onAction: OrderAction }) {
  const st = orderState(o);
  const [busy, setBusy] = useState<'check' | 'generate' | 'mail' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [to, setTo] = useState(o.email ?? o.pg?.email ?? '');
  const [note, setNote] = useState('');
  const late = o.paidAt ? Date.now() - Date.parse(o.paidAt) > 86_400_000 : st.problem;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    if (!to && (o.email || o.pg?.email)) setTo(o.email ?? o.pg?.email ?? '');
  }, [o.email, o.pg?.email, to]);

  const run = async (action: 'check' | 'generate' | 'mail') => {
    setBusy(action);
    setMsg(null);
    const r = await onAction(o.token, action, action === 'mail' ? { to, note } : undefined);
    setBusy(null);
    setMsg({ ok: r.ok, text: r.message });
  };

  const canGenerate = o.status !== 'done' && (st.problem || o.pg?.status === 'PAID');

  return (
    <>
      <div className="ad-scrim" onClick={onClose} />
      <aside className="ad-panel" aria-label="주문 상세">
        <div className="ad-panel-grip" />
        <div className="ad-panel-head">
          <div style={{ minWidth: 0 }}>
            <OrderBadge o={o} />
            <h2 className="ad-panel-title">
              {o.petName} <span className="ad-muted" style={{ fontWeight: 500, fontSize: 15 }}>{o.breed ?? (o.species === 'cat' ? '고양이' : '강아지')}</span>
            </h2>
          </div>
          <button type="button" className="ad-iconbtn" onClick={onClose} aria-label="닫기">
            <AdIcon name="x" size={16} />
          </button>
        </div>

        <div className="ad-panel-body">
          <dl className="ad-dl">
            <dt>주문 번호</dt>
            <dd className="num">{o.token.slice(0, 12)}…</dd>
            <dt>주문</dt>
            <dd>{dateTime(o.createdAt)}</dd>
            <dt>결제</dt>
            <dd>{o.paidAt ? dateTime(o.paidAt) : o.pg?.paidAt ? `${dateTime(o.pg.paidAt)} (결제사 기록)` : '없음'}</dd>
            <dt>금액</dt>
            <dd>{o.test ? '테스트 주문(결제 키가 없던 때 만든 것)' : o.amount ? won(o.amount) : '—'}</dd>
            <dt>받는 메일</dt>
            <dd>{o.email ?? '저장된 주소 없음'}</dd>
            <dt>링크 발송</dt>
            <dd>{o.mailedAt ? dateTime(o.mailedAt) : '보낸 적 없음'}</dd>
          </dl>

          <div className="ad-box">
            <p className="ad-box-title">결제사(포트원) 기록</p>
            {o.pg ? (
              <dl className="ad-dl">
                <dt>상태</dt>
                <dd>
                  <b>{PG_LABEL[o.pg.status] ?? o.pg.status}</b>
                  {o.pg.amount ? `, ${won(o.pg.amount)}` : ''}
                </dd>
                {o.pg.paidAt ? (
                  <>
                    <dt>결제 시각</dt>
                    <dd>{dateTime(o.pg.paidAt)}</dd>
                  </>
                ) : null}
                <dt>결제자</dt>
                <dd>{[o.pg.name, o.pg.email, o.pg.phone].filter(Boolean).join(', ') || '정보 없음'}</dd>
              </dl>
            ) : (
              <p className="ad-note ad-muted" style={{ marginTop: 0 }}>
                {o.pgReason === 'not_found'
                  ? '결제사에 결제 기록이 없어요. 결제창을 열지 않았거나 닫은 주문이에요.'
                  : o.pgReason === 'no_secret'
                    ? '결제사 키가 설정되지 않아 조회할 수 없어요.'
                    : o.pgReason === 'error'
                      ? '결제사 조회가 실패했어요. 다시 확인해 주세요.'
                      : '받는 메일이 있는 완료 주문은 결제사를 따로 조회하지 않아요.'}
              </p>
            )}
            <button type="button" className="ad-btn ad-btn--secondary ad-btn--sm" style={{ marginTop: 12 }} onClick={() => run('check')} disabled={busy !== null}>
              <AdIcon name="refresh" size={14} className={busy === 'check' ? 'ad-spin' : ''} />
              결제사에서 다시 확인
            </button>
          </div>

          {canGenerate ? (
            <div className="ad-box" style={{ borderColor: 'rgba(176,50,31,.35)' }}>
              <p className="ad-box-title">리포트 만들기</p>
              <p className="ad-hint" style={{ marginTop: 0 }}>
                결제사에서 결제 완료와 금액을 다시 확인한 뒤에 만들어요. 결제가 확인되지 않으면 만들지 않아요.
                받는 메일이 저장돼 있으면 완성과 함께 링크가 가요.
              </p>
              <button type="button" className="ad-btn ad-btn--primary ad-btn--block" style={{ marginTop: 12 }} onClick={() => run('generate')} disabled={busy !== null}>
                {busy === 'generate' ? '만드는 중' : '리포트 만들기'}
              </button>
            </div>
          ) : null}

          {o.status === 'done' ? (
            <div className="ad-box">
              <p className="ad-box-title">리포트 링크 메일</p>
              <label className="ad-field-label" htmlFor="mail-to" style={{ marginTop: 0 }}>
                받는 주소
              </label>
              <input id="mail-to" className="ad-input" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@example.com" />
              <label className="ad-field-label" htmlFor="mail-note">
                덧붙일 말 <span className="ad-muted" style={{ fontWeight: 400 }}>선택</span>
              </label>
              <textarea
                id="mail-note"
                className="ad-textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={late ? '예: 결제 후 리포트 전달이 늦어져 죄송합니다. 환불을 원하시면 이 메일에 적힌 문의하기로 알려 주세요.' : '메일 맨 위에 들어가요'}
              />
              <button type="button" className="ad-btn ad-btn--primary ad-btn--block" style={{ marginTop: 12 }} onClick={() => run('mail')} disabled={busy !== null || !to}>
                <AdIcon name="mail" size={15} />
                {busy === 'mail' ? '보내는 중' : o.mailedAt ? '링크 다시 보내기' : '링크 보내기'}
              </button>
            </div>
          ) : null}

          {msg ? <p className={`ad-note ${msg.ok ? 'ad-note--ok' : 'ad-note--bad'}`}>{msg.text}</p> : null}
        </div>

        {o.status === 'done' ? (
          <div className="ad-panel-foot">
            <a className="ad-btn ad-btn--secondary ad-btn--block" href={`/r/${o.token}`} target="_blank" rel="noopener">
              <AdIcon name="external" size={15} />
              리포트 열기
            </a>
          </div>
        ) : null}
      </aside>
    </>
  );
}
