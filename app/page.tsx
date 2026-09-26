import Link from 'next/link';
import HomeHero from '@/components/HomeHero';
import { heroSample } from '@/lib/sample';
import { GUIDES } from '@/lib/guides';
import { diseaseSign } from '@/lib/diseaseSigns';
import { dDayLabel } from '@/lib/careSchedule';
import { TOXIC_FOODS } from '@/lib/petData';

export const metadata = {
  title: 'mypet — 반려동물 맞춤 케어 리포트',
  description:
    '품종·나이·몸무게를 알려 주시면 188개 품종 데이터와 수의 지침을 기준으로 하루 급여량, 접종 일정, 조심할 질환, 먹으면 안 되는 음식을 정리해 드려요. 결제 전에 무료 가이드를 먼저 볼 수 있어요.',
};

// 예시의 날짜·남은 일수가 오늘 기준으로 맞도록 한 시간마다 다시 만든다.
export const revalidate = 3600;

/*
  랜딩 — 2026-09-26 두 번째 판(토스식). 사장님 평 「딱딱하고 AI 같다」로 건강수첩 판(괘선 표·왼쪽 제목 칸)을 걷어냈다.
    · 첫 화면: 큰 제목 + 휴대폰 속 실제 리포트(components/HomeHero)
    · 리포트 내용: 설명 대신 **실제 화면 조각**(급여량 숫자, 접종 날짜, 체중 눈금자, 질환과 신호)을 카드에
      값은 전부 예시 강아지를 리포트 계산 코드로 만든 것이다(지어내지 않는다)
    · 번호·눈썹 라벨·같은 카드 반복을 쓰지 않는다(2026-09-26 디자인 감사: 진행 카드 3장·출처 카드 6장을 걷어냄)
    · 「AI」는 실제로 AI가 쓰는 자리(보호자가 직접 적은 증상에 대한 답)에만
*/

const SOURCES: { org: string; use: string }[] = [
  { org: '미국·국제 켄넬클럽(AKC, FCI)', use: '강아지 품종별 표준 체중, 수명, 자주 보고되는 질환' },
  { org: '국제고양이협회(TICA, CFA)', use: '고양이 품종 특성과 관리' },
  { org: '세계소동물수의사회(WSAVA)', use: '예방접종 시작 시기와 추가접종 주기, 영양 기준' },
  { org: '미국 반려동물기생충협의회(CAPC)', use: '심장사상충·구충 예방 주기' },
  { org: 'ASPCA 동물독극물통제센터', use: '먹으면 안 되는 음식과 위험한 이유' },
  { org: '미국동물병원협회(AAHA)', use: '하루 필요 열량 계산식과 백신 지침' },
];

export default function LandingPage() {
  const { hero: d, card } = heroSample('dog');
  const sched = (card.schedule ?? []).filter((s) => !/확인/.test(s.title)).slice(0, 3);
  const risk = d.risks[0];
  const sign = risk ? diseaseSign(risk) : null;
  const toxic = TOXIC_FOODS.dog.slice(0, 7);

  return (
    <main>
      <HomeHero species="dog" petName={d.name} card={card} />

      <section className="ld-sec" id="contents">
        <div className="ld-wrap">
          <h2>리포트에 이런 내용이 들어가요</h2>
          <p className="ld-sec-lead">
            검색해서 하나씩 찾던 기준을 우리 아이 숫자로 바꿔 모았어요. 아래 값은 예시 강아지 {d.name}({d.breedKo}, {d.ageYears}살, {d.weightKg}kg)로 계산한 거예요.
          </p>
          <div className="ld-features">
            <article className="ld-feat">
              <h3>하루 급여량</h3>
              <p>몸무게와 나이, 중성화 여부로 계산해요.</p>
              <div className="ld-feat-ui">
                <p className="mini-k">하루에 필요한 열량</p>
                <p className="mini-big">{d.dailyKcal}</p>
                <p className="mini-sub">건사료로 {d.dailyGram}, 하루 2회로 나눠서</p>
              </div>
            </article>
            <article className="ld-feat">
              <h3>다음 접종 날짜</h3>
              <p>마지막 접종 달을 알면 날짜를, 모르면 병원에서 확인할 것을 적어요.</p>
              <div className="ld-feat-ui">
                <ul className="mini-rows">
                  {sched.map((s) => {
                    const [, m, day] = s.dueDate.split('-').map(Number);
                    return (
                      <li key={s.title}>
                        <b>{s.title.replace(/\s*\(.*?\)/g, '')}</b>
                        <span>{m}월 {day}일 <span className="tag tag--info">{dDayLabel(s.dueDate)}</span></span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
            <article className="ld-feat">
              <h3>조심할 질환과 신호</h3>
              <p>품종에서 자주 보고되는 질환과, 집에서 알아챌 수 있는 모습이에요.</p>
              <div className="ld-feat-ui">
                <div className="mini-chips">
                  {d.risks.map((r) => <span key={r} className="soft">{r}</span>)}
                </div>
                {sign && <p className="mini-sign"><b>이럴 때 병원에</b> {sign}</p>}
              </div>
            </article>
            <article className="ld-feat">
              <h3>먹으면 안 되는 음식</h3>
              <p>{d.toxicCount}가지와 각각 위험한 이유, 먹었을 때 먼저 할 일이에요.</p>
              <div className="ld-feat-ui">
                <div className="mini-chips">
                  {toxic.map((t) => <span key={t.name} className={t.severity === 'danger' ? '' : 'soft'}>{t.name.split(/[·(]/)[0]}</span>)}
                </div>
                <p className="mini-sign">빨간색은 적은 양으로도 위험한 것, 주황색은 피하는 게 좋은 것이에요.</p>
              </div>
            </article>
          </div>
          <p className="ld-sec-lead" style={{ marginTop: 24 }}>
            이 밖에도 체중 판정, 나이별 관리, 인쇄용 주간 체크리스트가 들어가요.{' '}
            <Link href="/sample" className="linklike">예시 리포트 전체 보기</Link>
          </p>
        </div>
      </section>

      <section className="ld-sec" id="sources">
        <div className="ld-wrap">
          <h2>무엇을 근거로 쓰나요</h2>
          <p className="ld-sec-lead">
            리포트의 숫자는 아래 기관의 표와 계산식에서 나와요. AI는 보호자가 직접 적은 증상에 답할 때만 쓰고, 그 부분은 리포트에 따로 표시해요.
          </p>
          <dl className="ld-srcs">
            {SOURCES.map((s) => (
              <div key={s.org}>
                <dt>{s.org}</dt>
                <dd>{s.use}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="ld-sec ld-sec--grey">
        <div className="ld-wrap ld-two">
          <div id="guides">
            <h2>정보 가이드</h2>
            <div className="linklist">
              {GUIDES.map((g) => (
                <Link key={g.slug} href={`/guide/${g.slug}`}>
                  <b>{g.title}</b>
                  <span>{g.lead}</span>
                </Link>
              ))}
            </div>
          </div>
          <div id="faq">
            <h2>자주 묻는 질문</h2>
            <div className="faq">
              <details>
                <summary>결제한 뒤 창을 닫았어요. 리포트는 어디서 보나요?</summary>
                <p>
                  결제할 때 적은 이메일로 리포트 링크를 보내 드려요. 결제 때 다시 찾기 번호를 정했다면 <Link href="/find" className="linklike">리포트 찾기</Link>에서
                  휴대폰 번호와 그 번호로도 열 수 있어요. 링크는 60일 동안 열리고, PDF로 저장하면 계속 볼 수 있어요.
                </p>
              </details>
              <details>
                <summary>동물병원 진료를 대신할 수 있나요?</summary>
                <p>아니요. 품종 표준과 수의 지침으로 계산한 일반적인 관리 정보예요. 이상 증상이 보이면 동물병원 진료가 먼저예요.</p>
              </details>
              <details>
                <summary>믹스견이거나 품종을 모르면요?</summary>
                <p>
                  말티푸, 폼피츠, 비숑푸들처럼 자주 쓰는 믹스견 이름은 부모 품종을 기준으로 계산해요.
                  품종을 모르면 넘어가셔도 돼요. 강아지·고양이 일반 기준으로 정리해 드려요.
                </p>
              </details>
              <details>
                <summary>환불이 되나요?</summary>
                <p>
                  리포트는 결제하면 바로 열리는 디지털 콘텐츠라서, 연 뒤에는 단순 변심으로는 환불되지 않아요.
                  리포트를 받지 못했거나 내용에 문제가 있으면 환불해 드려요. 자세한 기준은 <Link href="/refund" className="linklike">환불정책</Link>에 있어요.
                </p>
              </details>
              <details>
                <summary>입력한 정보는 어떻게 쓰이나요?</summary>
                <p>
                  아이 정보는 리포트를 만드는 데만 써요. 이메일은 리포트 링크를 보내는 데 쓰고,
                  휴대폰 번호와 다시 찾기 번호는 알아볼 수 없게 바꿔서 저장해요.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      <section className="ld-end">
        <div className="ld-wrap">
          <h2>무료 가이드부터 보세요</h2>
          <p>결제는 가이드를 보고 정하셔도 돼요.</p>
          <Link href="/diagnose" className="btn btn--primary btn--lg">무료로 시작하기</Link>
        </div>
      </section>
    </main>
  );
}
