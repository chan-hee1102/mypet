import Link from 'next/link';
import { ReportDocument } from './CareCard';
import type { CareCard, Species } from '@/lib/types';
import { SITE } from '@/lib/site';

/*
  첫 화면 — 2026-09-26 두 번째 판(토스식).
  큰 제목 한 줄, 버튼 두 개, 그리고 휴대폰 속 **실제 리포트**(예시 강아지를 리포트 계산 코드로 만든 것).
  휴대폰 속 리포트가 천천히 내려가는 것이 이 페이지에서 스스로 움직이는 유일한 것이다(마우스를 올리면 멈춤,
  움직임 줄이기 설정이면 멈춰 있음). 예전 판의 이름 입력칸·기록지 애니메이션은 입력 흐름(/diagnose)으로 넘겼다 —
  첫 질문이 그 자리다.
*/
export default function HomeHero({ species, petName, card }: { species: Species; petName: string; card: CareCard }) {
  return (
    <section className="ld-hero">
      <div className="ld-wrap ld-hero-in">
        <div>
          <h1>우리 아이 케어,<br />한 장으로 정리해 드려요</h1>
          <p className="ld-lead">
            하루 급여량, 다음 접종 날짜, 조심할 질환과 먹으면 안 되는 음식을 품종과 나이, 몸무게에 맞춰 한 번에 알려 드려요.
          </p>
          <div className="ld-cta">
            <Link href="/diagnose" className="btn btn--primary btn--lg" data-track="첫 화면에서 시작">무료로 시작하기</Link>
            <Link href="/sample" className="btn btn--secondary btn--lg">예시 리포트 보기</Link>
          </div>
          <p className="ld-note">무료 가이드를 먼저 보고, 전체 리포트는 {SITE.pricePerPet.toLocaleString()}원이에요. 회원가입은 없어요.</p>
        </div>
        <div className="ld-phone" aria-hidden="true" {...({ inert: '' } as object)}>
          <div className="ld-phone-screen">
            <div className="ld-phone-scroll">
              <ReportDocument species={species} petName={petName} card={card} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
