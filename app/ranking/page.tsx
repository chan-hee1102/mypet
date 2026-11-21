import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { FaqList, JsonLd, breadcrumbJsonLd, faqJsonLd } from '@/components/seo/SeoBits';
import ranking from '@/lib/data/breed-ranking.json';
import { ORG_REF, socialMeta } from '@/lib/breedSeo';
import { breedPath } from '@/lib/growth';
import { SITE } from '@/lib/site';

/**
 * 인기 품종 순위(2026-11-22 사장님 「AI로 직접 서치해서 최신화」) — 국내 KB경영연구소 2025 보고서, AKC 2025 등록 순위, CFA 2026 발표 순위.
 * 자료: lib/data/breed-ranking.json(원문 열어 확인 — KB는 표 이미지로 7위까지 공개). 품종 이름은 우리 품종 페이지로 잇는다(breed_ko가 null이면 글자만).
 * 대량 생성 페이지가 아니라서 구글에도 연다(sitemap.xml).
 */
type Row = { rank: number; name?: string; name_en?: string; pct?: number | string; breed_ko: string | null };
type Src = { org: string; title: string; url: string; published?: string };
const R = ranking as unknown as {
  korea: { year: string; dog: Row[]; cat: Row[]; source: Src };
  akc: { year: string; top: Row[]; source: Src };
  cfa: { year: string; top: Row[]; source: Src };
};

const nameOf = (r: Row) => r.name ?? r.name_en ?? '';
/** 문장 속 이름은 표와 같게 — 우리 품종 이름(괄호 뺌)이 있으면 그것 */
const disp = (r: Row) => (r.breed_ko ? r.breed_ko.replace(/\(.*\)/, '') : nameOf(r));

const TITLE = '강아지·고양이 인기 품종 순위 (2025~2026 최신)';
const k1 = R.korea.dog[0];
const c1 = R.korea.cat[0];
const ANSWER = `국내에서 가장 많이 키우는 강아지는 ${disp(k1)}(${k1.pct}%), 고양이는 ${disp(c1)}(${c1.pct}%)예요(KB경영연구소 「${R.korea.year} 한국 반려동물 보고서」). 미국 AKC ${R.akc.year}년 등록 순위 1위는 프렌치불도그, CFA 발표 고양이 1위는 메인쿤이에요.`;
const DESC = `${ANSWER} 국내·미국 인기 견종·묘종 순위를 표로 정리했어요.`.slice(0, 155);
const URL = `${SITE.url}/ranking`;

export const metadata: Metadata = { title: `${TITLE} | 마이펫`, description: DESC, alternates: { canonical: URL }, ...socialMeta(TITLE, DESC, URL) };


function Table({ rows, pct }: { rows: Row[]; pct?: boolean }) {
  return (
    <div className="gtable-wrap">
      <table className="gtable gtable--fit gtable--num">
        <thead>
          <tr>
            <th>순위</th>
            <th>품종</th>
            {pct ? <th className="num">비율</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank}>
              <td>
                <b>{r.rank}위</b>
              </td>
              <td>
                {r.breed_ko ? <Link href={breedPath(r.breed_ko)}>{r.breed_ko}</Link> : nameOf(r)}
                {r.name_en && r.breed_ko ? <span style={{ color: 'var(--tz-sub)' }}> {r.name_en}</span> : null}
              </td>
              {pct ? <td className="num">{r.pct}%</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FAQ = [
  { q: '우리나라에서 가장 많이 키우는 강아지 품종은요?', a: `KB경영연구소 「${R.korea.year} 한국 반려동물 보고서」에서 1위는 ${disp(k1)}(${k1.pct}%)이고, ${R.korea.dog.slice(1, 4).map((r) => `${disp(r)}(${r.pct}%)`).join(', ')}가 뒤를 이어요.` },
  { q: '우리나라에서 가장 많이 키우는 고양이 품종은요?', a: `같은 보고서에서 1위는 ${disp(c1)}(${c1.pct}%), 2위는 ${disp(R.korea.cat[1])}(${R.korea.cat[1].pct}%)예요.` },
  { q: '미국에서 가장 인기 있는 개는요?', a: `AKC ${R.akc.year}년 등록 순위 1위는 프렌치불도그, 2위 래브라도리트리버, 3위 골든리트리버예요.` },
  { q: '순위가 높으면 키우기 쉬운 품종인가요?', a: '아니에요. 많이 키운다는 뜻일 뿐이라, 품종마다 산책 시간·털 빠짐·조심할 질환을 따로 확인하세요. 품종 이름을 누르면 키우기 안내판이 나와요.' },
];

export default function RankingPage() {
  const srcs = [R.korea.source, R.akc.source, R.cfa.source];
  return (
    <main className="container guide">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: TITLE,
            description: DESC,
            inLanguage: 'ko',
            datePublished: '2026-11-22',
            dateModified: '2026-11-22',
            mainEntityOfPage: URL,
            image: `${SITE.url}/opengraph-image`,
            author: ORG_REF,
            publisher: ORG_REF,
            citation: srcs.map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url })),
          },
          faqJsonLd([{ q: '가장 인기 있는 강아지·고양이 품종은요?', a: ANSWER }, ...FAQ]),
          breadcrumbJsonLd([
            { name: '홈', url: SITE.url },
            { name: '인기 품종 순위', url: URL },
          ]),
        ]}
      />
      <nav className="gcrumb">
        <Link href="/">처음</Link> <span>›</span> 인기 품종 순위
      </nav>
      <h1 className="gtitle">{TITLE}</h1>
      <p className="gquestion">우리나라와 미국에서 많이 키우는 강아지·고양이 품종을 가장 최근 자료로 정리했어요.</p>

      <div className="ganswer">
        <div className="ganswer-head">가장 인기 있는 강아지·고양이 품종은요?</div>
        <p>{ANSWER}</p>
      </div>

      <section className="bsec">
        <h2>국내 강아지 품종 순위 ({R.korea.year})</h2>
        <Table rows={R.korea.dog} pct />
        <p className="gnote">
          <Icon name="info" size={14} />
          KB경영연구소 「{R.korea.year} 한국 반려동물 보고서」 설문 결과예요. 보고서에 7위까지 공개돼 있어요. 「푸들」은 크기를 나누지 않은 값이에요.
        </p>
      </section>

      <section className="bsec">
        <h2>국내 고양이 품종 순위 ({R.korea.year})</h2>
        <Table rows={R.korea.cat} pct />
        <p className="gnote">
          <Icon name="info" size={14} />
          4위 「잘 모르겠다」는 품종을 모른다는 응답이에요. 품종을 몰라도 <Link href={breedPath('믹스/혼혈 고양이')}>믹스 고양이 안내판</Link>으로 키울 수 있어요.
        </p>
      </section>

      <section className="bsec">
        <h2>미국 AKC 강아지 등록 순위 ({R.akc.year})</h2>
        <Table rows={R.akc.top} />
      </section>

      <section className="bsec">
        <h2>CFA 고양이 인기 순위 ({R.cfa.year} 발표)</h2>
        <Table rows={R.cfa.top} />
      </section>

      <FaqList items={FAQ} />

      <section className="grelated">
        <h2>더 보기</h2>
        <div className="blinks">
          <Link href="/breed">품종 안내판 188종</Link>
          <Link href="/compare">인기 품종끼리 비교</Link>
          <Link href="/guide/dog-breed-weight">품종별 표준 체중·수명</Link>
        </div>
      </section>

      <section className="gsources">
        <h2>근거 자료</h2>
        <ul>
          {srcs.map((s) => (
            <li key={s.url}>
              <span className="gsrc-org">{s.org}</span>
              <a href={s.url} target="_blank" rel="noopener noreferrer nofollow">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
