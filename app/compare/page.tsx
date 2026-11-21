import type { Metadata } from 'next';
import Link from 'next/link';
import { comparePairs, comparePath } from '@/lib/seoPages';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { SITE } from '@/lib/site';

/** 품종 비교 모음(2026-11-22) — 비슷한 체구의 인기 품종끼리 비교한 페이지로 가는 허브 */
const TITLE = '강아지·고양이 품종 비교';
const DESC = '말티즈와 푸들, 코리안숏헤어와 러시안블루처럼 비슷한 체구의 인기 품종끼리 몸무게·털 빠짐·짖음·미용·산책·사료량을 비교했어요.';

export const metadata: Metadata = {
  title: `${TITLE} | 마이펫`,
  description: DESC,
  alternates: { canonical: `${SITE.url}/compare` },
  robots: NAVER_BING_ONLY,
};

const short = (n: string) => n.replace(/\(.*\)/, '');

export default function CompareHub() {
  const pairs = comparePairs();
  return (
    <main className="container guide">
      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> 품종 비교
      </nav>
      <h1 className="gtitle">{TITLE}</h1>
      <p className="gquestion">{DESC}</p>
      {(['dog', 'cat'] as const).map((s) => (
        <section key={s} className="bsec">
          <h2>{s === 'dog' ? '강아지' : '고양이'}</h2>
          <div className="blinks">
            {pairs
              .filter(([a]) => a.species === s)
              .map(([a, b]) => (
                <Link key={comparePath(a, b)} href={comparePath(a, b)}>
                  {short(a.breed_ko)} vs {short(b.breed_ko)}
                </Link>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
