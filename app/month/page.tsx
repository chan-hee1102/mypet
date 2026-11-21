import type { Metadata } from 'next';
import Link from 'next/link';
import { MONTHS } from '@/lib/seoPages';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { SITE } from '@/lib/site';

/** 개월별 몸무게·사료량 모음(2026-11-22) — 강아지·고양이 2~12개월 페이지로 가는 허브 */
const TITLE = '개월별 강아지·고양이 몸무게·사료량';
const DESC = '2개월부터 12개월까지, 강아지와 아기 고양이의 예상 몸무게와 하루 사료량을 다 큰 몸무게별·인기 품종별 표로 정리했어요.';

export const metadata: Metadata = {
  title: `${TITLE} | 마이펫`,
  description: DESC,
  alternates: { canonical: `${SITE.url}/month` },
  robots: NAVER_BING_ONLY,
};

export default function MonthHub() {
  return (
    <main className="container guide">
      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> 개월별 몸무게·사료량
      </nav>
      <h1 className="gtitle">{TITLE}</h1>
      <p className="gquestion">{DESC}</p>
      {(['dog', 'cat'] as const).map((s) => (
        <section key={s} className="bsec">
          <h2>{s === 'dog' ? '강아지' : '고양이'}</h2>
          <div className="blinks">
            {MONTHS.map((m) => (
              <Link key={m} href={`/month/${s}/${m}`}>
                {m}개월 {s === 'dog' ? '강아지' : '고양이'} 몸무게·사료량
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
