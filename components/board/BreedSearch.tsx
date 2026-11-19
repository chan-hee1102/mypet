'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, type FormEvent } from 'react';

/**
 * 품종 찾기 칸(첫 화면 표지 아래) — 이름 일부만 적어도 찾는다(별칭 포함). 결과는 링크 목록.
 * 「찾기」 단추·Enter는 맨 위 결과로 바로 간다(없으면 188종 목록, 빈칸이면 칸에 커서만).
 * 「길고양이·유기견·품종 모름」 같은 말은 믹스 안내판의 별칭(breedKnowledge aliases)으로 잡힌다. 결과가 없으면 믹스 안내판을 권한다.
 * 품종 데이터(파일 읽기)는 서버가 넘겨준다 — 이 컴포넌트는 lib/care를 가져오지 않는다.
 */
export type BreedLite = { name: string; path: string; species: 'dog' | 'cat'; tag: string; aliases: string[] };

const norm = (s: string) => s.replace(/[\s()·×/]/g, '').toLowerCase();

export function BreedSearch({ breeds, unknown }: { breeds: BreedLite[]; unknown?: { dog: string; cat: string } }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const k = norm(q);
    if (!k) return [];
    return breeds.filter((b) => norm(b.name).includes(k) || b.aliases.some((a) => norm(a).includes(k))).slice(0, 8);
  }, [q, breeds]);

  const go = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return input.current?.focus();
    router.push(hits[0]?.path ?? '/breed');
  };

  return (
    <div className="hs">
      <form className="hs-box" role="search" onSubmit={go}>
        <label className="hs-field">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <span className="sr-only">품종 찾기</span>
          <input ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="품종 이름 (예: 말티즈)" autoComplete="off" enterKeyHint="search" />
        </label>
        <button type="submit" className="hs-go" data-track={`품종 찾기:${hits[0]?.name ?? '찾기 단추'}`}>
          찾기
        </button>
      </form>
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
            맞는 품종이 없어요.{' '}
            {unknown ? (
              <>
                품종을 모르면 <Link href={unknown.dog}>믹스견</Link> · <Link href={unknown.cat}>믹스 고양이</Link> 안내판을, 아니면{' '}
              </>
            ) : null}
            <Link href="/breed">전체 목록</Link>을 보세요.
          </p>
        )
      ) : null}
    </div>
  );
}
