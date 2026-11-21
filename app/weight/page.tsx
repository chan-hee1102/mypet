import type { Metadata } from 'next';
import Link from 'next/link';
import { KGS } from '@/lib/seoPages';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { SITE } from '@/lib/site';

/** 체중별 사료량 모음(2026-11-22) — 강아지 1~40kg·고양이 2~10kg 페이지로 가는 허브 */
const TITLE = '체중별 강아지·고양이 하루 사료량';
const DESC = '몸무게만 알면 돼요. 강아지 1~40kg, 고양이 2~10kg의 하루 사료량을 중성화 여부·노령기별 g과 종이컵 환산으로 정리했어요.';

export const metadata: Metadata = {
  title: `${TITLE} | 마이펫`,
  description: DESC,
  alternates: { canonical: `${SITE.url}/weight` },
  robots: NAVER_BING_ONLY,
};

export default function WeightHub() {
  return (
    <main className="container guide">
      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> 체중별 사료량
      </nav>
      <h1 className="gtitle">{TITLE}</h1>
      <p className="gquestion">{DESC}</p>
      {(['dog', 'cat'] as const).map((s) => (
        <section key={s} className="bsec">
          <h2>{s === 'dog' ? '강아지' : '고양이'}</h2>
          <div className="blinks">
            {KGS[s].map((kg) => (
              <Link key={kg} href={`/weight/${s}/${kg}`}>
                {kg}kg {s === 'dog' ? '강아지' : '고양이'} 사료량
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
