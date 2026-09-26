'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { breedPath } from '@/lib/breedSlug';

/*
  품종 목록 — 검색칸 + 첫 자음(ㄱ·ㄴ·ㄷ…)으로 묶은 색인.
  예전에는 188개 알약 버튼이 벽처럼 쌓여 있어 40~60대가 품종을 찾기 어려웠다(2026-09-26 디자인 검수).
  ⚠️ 검색 전에는 전부 그린다 — 서버 렌더링된 HTML에 188개 링크가 다 있어야 검색엔진이 품종 페이지에 닿는다.
*/
const CHO = ['ㄱ', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂ', 'ㅅ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
function initial(name: string): string {
  const c = name.charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) return CHO[Math.floor((c - 0xac00) / 588)];
  return '기타';
}
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

function Groups({ names }: { names: string[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const n of names) {
      const k = initial(n);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(n);
    }
    return Array.from(m.entries());
  }, [names]);
  if (names.length === 0) return <p className="hint">맞는 품종이 없어요. 줄여 쓰셨다면 다른 이름으로 찾아보세요.</p>;
  return (
    <div className="bgroups">
      {groups.map(([k, list]) => (
        <div className="bgroup" key={k}>
          <h3>{k}</h3>
          <p>
            {list.map((n) => (
              <Link key={n} href={breedPath(n)}>{n}</Link>
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function BreedIndex({ dogs, cats }: { dogs: string[]; cats: string[] }) {
  const [q, setQ] = useState('');
  const f = (list: string[]) => (q.trim() ? list.filter((n) => norm(n).includes(norm(q))) : list);
  const d = f(dogs);
  const c = f(cats);
  return (
    <>
      <label className="bsearch">
        <span className="sr-only">품종 찾기</span>
        <input
          className="input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="품종 이름으로 찾기 (예: 말티즈)"
          autoComplete="off"
        />
      </label>
      <h2>강아지 <span className="gcount">{d.length}종</span></h2>
      <Groups names={d} />
      <h2>고양이 <span className="gcount">{c.length}종</span></h2>
      <Groups names={c} />
    </>
  );
}
