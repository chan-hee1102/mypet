import type { Metadata } from 'next';
import Link from 'next/link';
import { VERDICT, VERDICT_ORDER, foodPath, foodsFor } from '@/lib/foodSafety';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { SITE } from '@/lib/site';

/** 「먹어도 되나요」 모음(2026-11-22) — 강아지·고양이 음식별 페이지로 가는 허브. 위험한 것부터 */
const TITLE = '강아지·고양이 먹어도 되나요? 음식별 정리';
const DESC = '포도·초콜릿·양파처럼 먹으면 안 되는 음식부터 사과·고구마처럼 조금은 괜찮은 음식까지, 강아지와 고양이로 나눠 이유와 먹었을 때 할 일을 정리했어요.';

export const metadata: Metadata = { title: `${TITLE} | 마이펫`, description: DESC, alternates: { canonical: `${SITE.url}/can-eat` }, robots: NAVER_BING_ONLY };

export default function CanEatHub() {
  return (
    <main className="container guide">
      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> 먹어도 되나요
      </nav>
      <h1 className="gtitle">{TITLE}</h1>
      <p className="gquestion">{DESC}</p>
      {(['dog', 'cat'] as const).map((s) => (
        <section key={s} className="bsec">
          <h2>{s === 'dog' ? '강아지' : '고양이'}</h2>
          {VERDICT_ORDER.map((vd) => {
            const list = foodsFor(s).filter((f) => f[s].verdict === vd);
            if (!list.length) return null;
            return (
              <div key={vd} style={{ marginTop: 14 }}>
                <p>
                  <span className={VERDICT[vd].cls}>{VERDICT[vd].word}</span>
                </p>
                <div className="blinks">
                  {list.map((f) => (
                    <Link key={f.slug} href={foodPath(s, f.slug)}>
                      {s === 'dog' ? '강아지' : '고양이'} {f.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </main>
  );
}
