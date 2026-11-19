'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

/**
 * 품종 안내판 목록(/breed) — 이름 찾기 + 체구·털 빠짐 거르기(2026-11-19).
 * 「털 덜 빠지는 강아지」「소형견 종류」처럼 조건으로 찾는 사람이 많아서 거르기를 붙였다.
 * ⚠️ 거르기 전에는 전부 그린다 — 서버 HTML에 188개 링크가 다 있어야 검색엔진이 품종 페이지에 닿는다.
 */
export type FinderItem = { name: string; path: string; species: 'dog' | 'cat'; size: string; sizeLabel: string; coatLabel: string; shedding: number | null };

const norm = (s: string) => s.replace(/[\s()·×/]/g, '').toLowerCase();
const SIZES: Record<'dog' | 'cat', [string, string][]> = {
  dog: [['toy', '초소형'], ['small', '소형'], ['medium', '중형'], ['large', '대형'], ['giant', '초대형']],
  cat: [['small', '작은 편'], ['medium', '보통'], ['large', '큰 편']],
};

function List({ items }: { items: FinderItem[] }) {
  if (!items.length) return <p className="bf-none">조건에 맞는 품종이 없어요.</p>;
  return (
    <ul className="bf-grid">
      {items.map((b) => (
        <li key={b.path}>
          <Link href={b.path} className="bf-card">
            <b>{b.name}</b>
            <span>
              {b.sizeLabel}
              {b.coatLabel ? ` · ${b.coatLabel}` : ''}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function BreedFinder({ items }: { items: FinderItem[] }) {
  const [q, setQ] = useState('');
  const [dogSize, setDogSize] = useState<string | null>(null);
  const [catSize, setCatSize] = useState<string | null>(null);
  const [lowShed, setLowShed] = useState(false);

  const pass = (b: FinderItem, size: string | null) =>
    (!q.trim() || norm(b.name).includes(norm(q))) && (!size || b.size === size) && (!lowShed || (b.shedding !== null && b.shedding <= 2));
  const dogs = useMemo(() => items.filter((b) => b.species === 'dog' && pass(b, dogSize)), [items, q, dogSize, lowShed]); // eslint-disable-line react-hooks/exhaustive-deps
  const cats = useMemo(() => items.filter((b) => b.species === 'cat' && pass(b, catSize)), [items, q, catSize, lowShed]); // eslint-disable-line react-hooks/exhaustive-deps

  const Seg = ({ sp, value, set }: { sp: 'dog' | 'cat'; value: string | null; set: (v: string | null) => void }) => (
    <div className="bf-seg" role="group" aria-label={`${sp === 'dog' ? '강아지' : '고양이'} 체구`}>
      <button type="button" aria-pressed={value === null} onClick={() => set(null)}>
        전체
      </button>
      {SIZES[sp].map(([k, label]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => set(value === k ? null : k)}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bf">
      <div className="bf-tools">
        <label className="hs-box bf-search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <span className="sr-only">품종 찾기</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="품종 이름으로 찾기" autoComplete="off" />
        </label>
        <button type="button" className="bf-toggle" aria-pressed={lowShed} onClick={() => setLowShed((v) => !v)}>
          털이 덜 빠지는 품종만
        </button>
      </div>

      <section className="bf-sec">
        <div className="bf-head">
          <h2>
            강아지 <span>{dogs.length}종</span>
          </h2>
          <Seg sp="dog" value={dogSize} set={setDogSize} />
        </div>
        <List items={dogs} />
      </section>
      <section className="bf-sec">
        <div className="bf-head">
          <h2>
            고양이 <span>{cats.length}종</span>
          </h2>
          <Seg sp="cat" value={catSize} set={setCatSize} />
        </div>
        <List items={cats} />
      </section>
    </div>
  );
}
