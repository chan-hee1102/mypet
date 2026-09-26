import type { Metadata } from 'next';
import Link from 'next/link';
import { socialMeta } from '@/lib/breedSeo';
import { NAVER_BING_ONLY } from '@/lib/searchScope';
import { SITE } from '@/lib/site';

/** 계산기 목록 — 계산기 두 개를 잇는 작은 허브(빵부스러기의 중간 단계) */

const TITLE = '반려동물 계산기';
const DESCRIPTION = '강아지·고양이 하루 사료량 계산기와, 지금 나이·몸무게로 다 큰 몸무게를 알려 주는 계산기.';

export const metadata: Metadata = {
  title: `${TITLE} | mypet`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/tools` },
  robots: NAVER_BING_ONLY,
  ...socialMeta(TITLE, DESCRIPTION, `${SITE.url}/tools`, 'website'),
};

export default function ToolsHub() {
  return (
    <main className="container guide">
      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> 계산기
      </nav>
      <h1 className="gtitle">{TITLE}</h1>
      <p className="gquestion">숫자 몇 개만 넣으면 바로 계산해요. 회원가입 없이 무료예요.</p>
      <div className="linklist" style={{ marginTop: 28 }}>
        <Link href="/tools/food">
          <b>사료량 계산기</b>
          <span>몸무게·나이·중성화로 하루 열량과 건사료 g</span>
        </Link>
        <Link href="/tools/adult-weight">
          <b>다 큰 몸무게 계산기</b>
          <span>지금 나이·몸무게로 다 컸을 때 몸무게와 성장이 끝나는 때</span>
        </Link>
        <Link href="/guide/dog-age-in-human-years">
          <b>사람 나이 환산표</b>
          <span>강아지·고양이 나이를 사람 나이로</span>
        </Link>
      </div>
    </main>
  );
}
