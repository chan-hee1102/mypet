'use client';

import { useState } from 'react';
import type { AdminShop, AdminShopSlot } from '@/lib/admin-types';
import { Card, KpiCard, Skeleton } from '../ui';

/*
 * 쿠팡 링크 — 준비물 카드(lib/shop.ts)마다 링크가 걸렸나 · 몇 품종에 붙나 · 최근 14일 몇 번 눌렸나(2026-11-19).
 * 링크 만드는 법: 「쿠팡에서 검색」으로 검색 결과를 연다 → 쿠팡 파트너스 「간편 링크 만들기」에 그 주소를 붙인다 →
 *   만든 링크(link.coupang.com/…)를 카드 id와 함께 lib/data/coupang-links.json에 넣는다(지금은 채팅으로 보내 주시면 넣는다).
 * 「붙는 품종」이 많은 카드부터 만들면 적은 수로 많은 페이지가 채워진다.
 */

const CAT_LABEL: Record<string, string> = { food: '사료', treat: '간식', toy: '장난감', walk: '산책·놀이', grooming: '미용', potty: '배변·화장실', home: '집' };

function Row({ s, copied, onCopy }: { s: AdminShopSlot; copied: string | null; onCopy: (key: string, text: string) => void }) {
  return (
    <li className="ad-shop-row">
      <div className="ad-shop-main">
        <span className={`ad-status ad-status--${s.linked ? 'ok' : 'off'}`}>{s.linked ? '연결됨' : '비어 있음'}</span>
        <b>{s.title}</b>
        <span className="ad-shop-meta">
          {CAT_LABEL[s.cat] ?? s.cat} · {s.breeds}품종 · 14일 {s.clicks}번 · <code>{s.id}</code>
        </span>
      </div>
      <div className="ad-shop-act">
        <a className="ad-btn ad-btn--secondary ad-btn--sm" href={s.searchUrl} target="_blank" rel="noopener noreferrer">
          쿠팡에서 검색
        </a>
        <button type="button" className="ad-btn ad-btn--secondary ad-btn--sm" onClick={() => onCopy(`u:${s.id}`, s.searchUrl)}>
          {copied === `u:${s.id}` ? '복사됨' : '주소 복사'}
        </button>
        <button type="button" className="ad-btn ad-btn--secondary ad-btn--sm" onClick={() => onCopy(`i:${s.id}`, s.id)}>
          {copied === `i:${s.id}` ? '복사됨' : 'id 복사'}
        </button>
      </div>
    </li>
  );
}

export function Shop({ data }: { data: AdminShop | null }) {
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  if (!data) {
    return (
      <div className="ad-stack">
        <div className="ad-kpis ad-kpis--4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} h={110} />
          ))}
        </div>
        <Skeleton h={420} />
      </div>
    );
  }
  const linked = data.slots.filter((s) => s.linked).length;
  const clicks = data.slots.reduce((n, s) => n + s.clicks, 0);
  const onCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
      },
      () => {},
    );
  };
  const groups: { sp: 'dog' | 'cat'; title: string }[] = [
    { sp: 'dog', title: '강아지' },
    { sp: 'cat', title: '고양이' },
  ];

  return (
    <div className="ad-stack">
      <div className="ad-kpis ad-kpis--4">
        <KpiCard label="링크 걸린 카드" value={`${linked}/${data.slots.length}`} foot={<span>링크 없는 카드는 사이트에 안 보여요</span>} />
        <KpiCard label="14일 쿠팡 카드 누름" value={`${clicks}번`} foot={<span>사람만 · 한 방문 한 번</span>} />
        <KpiCard label="14일 안내판 방문" value={`${data.boardViews}회`} foot={<span>품종 페이지를 본 사람</span>} />
        <KpiCard label="누른 비율" value={data.boardViews ? `${Math.round((clicks / data.boardViews) * 1000) / 10}%` : '—'} foot={<span>안내판 방문 중</span>} />
      </div>

      {groups.map((g) => {
        const rows = data.slots.filter((s) => s.species === g.sp && (!onlyEmpty || !s.linked)).sort((a, b) => b.breeds - a.breeds || b.clicks - a.clicks);
        return (
          <Card
            key={g.sp}
            flush
            title={`${g.title} 카드 ${rows.length}개`}
            action={
              <label className="ad-switch">
                <input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} />
                <span>비어 있는 것만</span>
              </label>
            }
          >
            <ul className="ad-list">
              {rows.map((s) => (
                <Row key={s.id} s={s} copied={copied} onCopy={onCopy} />
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
