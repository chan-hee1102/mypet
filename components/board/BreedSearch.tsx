'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

/**
 * 품종 찾기 칸(첫 화면) — 이름 일부만 적어도 찾는다(별칭 포함). 결과는 링크 목록.
 * 품종 데이터(파일 읽기)는 서버가 넘겨준다 — 이 컴포넌트는 lib/care를 가져오지 않는다.
 */
export type BreedLite = { name: string; path: string; species: 'dog' | 'cat'; tag: string; aliases: string[] };

const norm = (s: string) => s.replace(/[\s()·×/]/g, '').toLowerCase();

export function BreedSearch({ breeds }: { breeds: BreedLite[] }) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const k = norm(q);
    if (!k) return [];
    return breeds.filter((b) => norm(b.name).includes(k) || b.aliases.some((a) => norm(a).includes(k))).slice(0, 8);
  }, [q, breeds]);

  return (
    <div className="hs">
      <label className="hs-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span className="sr-only">품종 찾기</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="품종 이름 (예: 말티즈, 코숏)" autoComplete="off" enterKeyHint="search" />
      </label>
      {q.trim() ? (
        hits.length ? (
          <ul className="hs-list">
            {hits.map((b) => (
              <li key={b.path}>
                <Link href={b.path} data-track={`품종 찾기:${b.name}`}>
                  <b>{b.name}</b>
                  <span>
                    {b.species === 'dog' ? '강아지' : '고양이'} · {b.tag}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hs-none">
            맞는 품종이 없어요. <Link href="/breed">전체 목록</Link>에서 찾아보세요.
          </p>
        )
      ) : null}
    </div>
  );
}
