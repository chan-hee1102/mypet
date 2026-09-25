'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Inquiry, InquiryStatus } from '@/lib/admin-types';
import { AdIcon } from '../icons';
import { ago, Card, dateTime, Empty, INQUIRY_LABEL, InquiryBadge } from '../ui';

const ORDER: InquiryStatus[] = ['open', 'answered', 'closed'];
type Filter = 'all' | InquiryStatus | 'refund';

/** 문의함 — 상태·환불 필터 · 검색 · 표(휴대폰은 카드) · 상세(데스크탑 오른쪽, 휴대폰 바닥 시트) */
export function Inbox({
  items,
  selectedId,
  setSelectedId,
  onStatus,
}: {
  items: Inquiry[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onStatus: (id: string, s: InquiryStatus) => Promise<void>;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, open: 0, answered: 0, closed: 0, refund: 0 };
    for (const i of items) {
      c[i.status] += 1;
      if (i.category === '환불') c.refund += 1;
    }
    return c;
  }, [items]);
  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (i) =>
      (filter === 'all' || (filter === 'refund' ? i.category === '환불' : i.status === filter)) &&
      (!q || `${i.name ?? ''} ${i.email} ${i.message} ${i.category ?? ''}`.toLowerCase().includes(q)),
  );
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const FILTERS: [Filter, string][] = [['all', '전체'], ...ORDER.map((s) => [s, INQUIRY_LABEL[s]] as [Filter, string]), ['refund', '환불']];

  return (
    <div className="ad-stack">
      <div className="ad-filters">
        <div className="ad-chips" role="tablist" aria-label="문의 상태">
          {FILTERS.map(([f, label]) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} className={`ad-chip ${filter === f ? 'is-on' : ''}`} onClick={() => setFilter(f)}>
              {label}
              <span className="num">{counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="ad-search">
          <AdIcon name="search" size={14} />
          <input className="ad-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름, 이메일, 내용" aria-label="문의 검색" />
        </label>
      </div>

      <Card flush>
        {shown.length === 0 ? (
          <Empty icon="inbox" title={items.length ? '조건에 맞는 문의가 없어요' : '아직 문의가 없어요'} desc={items.length ? undefined : '문의하기로 들어온 글이 여기 쌓여요.'} />
        ) : (
          <>
            <table className="ad-table">
              <colgroup>
                <col style={{ width: 120 }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: 84 }} />
                <col />
                <col style={{ width: 96 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>상태</th>
                  <th>보낸 사람</th>
                  <th>분류</th>
                  <th>내용</th>
                  <th>받은 때</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((i) => (
                  <tr key={i.id} onClick={() => setSelectedId(i.id)} className={selectedId === i.id ? 'is-on' : ''}>
                    <td>
                      <InquiryBadge s={i.status} />
                    </td>
                    <td>
                      <div className="ad-cell" style={{ fontWeight: 600 }}>{i.name ?? '이름 없음'}</div>
                      <div className="ad-cell ad-sub">{i.email}</div>
                    </td>
                    <td className="ad-cell" style={{ color: i.category === '환불' ? 'var(--ad-down)' : 'var(--ad-t2)', fontWeight: i.category === '환불' ? 600 : 400 }}>
                      {i.category ?? '기타'}
                    </td>
                    <td className="ad-cell" style={{ color: 'var(--ad-t2)' }}>{i.message}</td>
                    <td className="ad-time">{ago(i.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="ad-list ad-mobile-list">
              {shown.map((i) => (
                <li key={i.id}>
                  <button type="button" className="ad-mcard" onClick={() => setSelectedId(i.id)}>
                    <span className="ad-mcard-top">
                      <InquiryBadge s={i.status} />
                      <span className="ad-time">{ago(i.created_at)}</span>
                    </span>
                    <span className="ad-strong" style={{ marginTop: 6 }}>
                      {i.category ?? '기타'} <span className="ad-muted" style={{ fontWeight: 400 }}>{i.name ?? i.email}</span>
                    </span>
                    <span className="ad-sub">{i.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {selected ? <Detail key={selected.id} q={selected} onClose={() => setSelectedId(null)} onStatus={onStatus} /> : null}
    </div>
  );
}

function Detail({ q, onClose, onStatus }: { q: Inquiry; onClose: () => void; onStatus: (id: string, s: InquiryStatus) => Promise<void> }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const subject = encodeURIComponent(`[mypet] ${q.category ?? ''} 문의 답변`.replace(/\s+/g, ' '));
  return (
    <>
      <div className="ad-scrim" onClick={onClose} />
      <aside className="ad-panel" aria-label="문의 상세">
        <div className="ad-panel-grip" />
        <div className="ad-panel-head">
          <div style={{ minWidth: 0 }}>
            <InquiryBadge s={q.status} />
            <h2 className="ad-panel-title">{q.name ?? q.email}</h2>
          </div>
          <button type="button" className="ad-iconbtn" onClick={onClose} aria-label="닫기">
            <AdIcon name="x" size={16} />
          </button>
        </div>
        <div className="ad-panel-body">
          <dl className="ad-dl">
            <dt>분류</dt>
            <dd>{q.category ?? '기타'}</dd>
            <dt>이메일</dt>
            <dd>{q.email}</dd>
            <dt>받은 때</dt>
            <dd>{dateTime(q.created_at)}</dd>
          </dl>
          <p className="ad-quote">{q.message}</p>
          <p className="ad-field-label">상태</p>
          <div className="ad-seg-full" role="radiogroup" aria-label="문의 상태">
            {ORDER.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={q.status === s} className={q.status === s ? 'is-on' : ''} onClick={() => q.status !== s && onStatus(q.id, s)}>
                {INQUIRY_LABEL[s]}
              </button>
            ))}
          </div>
          {q.category === '환불' ? <p className="ad-hint">환불은 포트원 관리자 콘솔에서 결제를 취소한 뒤 답장해 주세요. 주문 화면에서 이메일로 찾으면 그 주문이 보여요.</p> : null}
        </div>
        <div className="ad-panel-foot">
          <a className="ad-btn ad-btn--primary ad-btn--block" href={`mailto:${q.email}?subject=${subject}`} onClick={() => q.status === 'open' && onStatus(q.id, 'answered')}>
            <AdIcon name="mail" size={15} />
            메일로 답장
          </a>
        </div>
      </aside>
    </>
  );
}
