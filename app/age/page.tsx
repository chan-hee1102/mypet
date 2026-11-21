import type { Metadata } from 'next';
import Link from 'next/link';
import { AGES } from '@/lib/seoPages';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { SITE } from '@/lib/site';

/** 나이별 사람 나이 모음(2026-11-22) — 강아지 1~20살·고양이 1~22살 페이지로 가는 허브 */
const TITLE = '나이별 강아지·고양이 사람 나이';
const DESC = '강아지 1~20살, 고양이 1~22살을 사람 나이로 바꾸면 몇 살인지, 노령기인지, 이 나이에 챙길 것까지 정리했어요.';

export const metadata: Metadata = { title: `${TITLE} | 마이펫`, description: DESC, alternates: { canonical: `${SITE.url}/age` }, robots: NAVER_BING_ONLY };

export default function AgeHub() {
  return (
    <main className="container guide">
      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> 나이별 사람 나이
      </nav>
      <h1 className="gtitle">{TITLE}</h1>
      <p className="gquestion">{DESC}</p>
      {(['dog', 'cat'] as const).map((s) => (
        <section key={s} className="bsec">
          <h2>{s === 'dog' ? '강아지' : '고양이'}</h2>
          <div className="blinks">
            {AGES[s].map((y) => (
              <Link key={y} href={`/age/${s}/${y}`}>
                {y}살 {s === 'dog' ? '강아지' : '고양이'} 사람 나이
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
