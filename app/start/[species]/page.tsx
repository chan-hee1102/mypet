import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CareIcon, type CareIconName } from '@/components/board/CareIcon';
import { Disclosure, ShopCards } from '@/components/board/ShopCards';
import { FaqList, JsonLd, faqJsonLd, type Faq } from '@/components/seo/SeoBits';
import { careOf, careProfiles, rulesById, type CareRule } from '@/lib/care';
import { COAT_LABEL, SIZE_LABEL } from '@/lib/careProfile';
import { breedPath } from '@/lib/breedSlug';
import { socialMeta } from '@/lib/breedSeo';
import { hasLive, picksById } from '@/lib/shop';
import { SITE } from '@/lib/site';

/**
 * 처음 데려온다면 — 강아지·고양이(2026-11-19 개편). 「강아지 입양 준비물」 같은 검색어를 받는 페이지.
 * 첫날 준비물 체크리스트 → 첫 주에 할 일(순서) → 법으로 정해진 것(동물등록 — care-rules.json 조문) → 준비물 카드 → 품종 안내판.
 * 준비물 카드는 품종이 정해지지 않은 자리라 체구와 상관없는 것만 고른다(사료·하네스 크기는 품종 안내판에서).
 */

type Sp = 'dog' | 'cat';
type Item = { icon: CareIconName; name: string; why: string };
type Step = { when: string; title: string; body: string };

const DATA: Record<Sp, { ko: string; title: string; lead: string; items: Item[]; steps: Step[]; shop: string[]; popular: string[]; faq: Faq[] }> = {
  dog: {
    ko: '강아지',
    title: '강아지를 처음 데려온다면 — 첫날 준비물과 첫 주에 할 일',
    lead: '데려오기 전날까지 아래 준비물을 갖춰 두고, 첫 주는 새집에 익숙해지는 데 쓰세요.',
    items: [
      { icon: 'bag', name: '먹던 사료', why: '처음 며칠은 전에 먹던 사료 그대로 — 바꿀 땐 일주일 넘게 조금씩 섞어요' },
      { icon: 'bowl', name: '밥그릇·물그릇', why: '물은 하루 종일 마실 수 있게 떨어지지 않게 채워 둬요' },
      { icon: 'pad', name: '배변패드·배변판', why: '잠자리에서 떨어진 곳 한 자리에 고정해요' },
      { icon: 'crate', name: '켄넬이나 하우스', why: '혼자 숨어 쉴 수 있는 굴 같은 자리가 있으면 빨리 안정돼요' },
      { icon: 'bed', name: '방석', why: '몸을 쭉 펴고 누울 수 있는 크기로요' },
      { icon: 'harness', name: '가슴줄·리드줄', why: '외출할 땐 줄 길이 2m 이내가 법으로 정해져 있어요' },
      { icon: 'tag', name: '인식표', why: '보호자 이름·연락처·동물등록번호를 달아야 해요' },
      { icon: 'nose', name: '장난감 2~3개', why: '씹는 것 하나, 머리 쓰는 것 하나(노즈워크)면 충분해요' },
      { icon: 'tooth', name: '칫솔·치약·발톱깎이', why: '어릴 때부터 입과 발을 만지는 데 익숙해지게 해요' },
      { icon: 'spray', name: '탈취제', why: '실수한 자리는 냄새까지 지워야 같은 곳에 또 싸지 않아요' },
    ],
    steps: [
      { when: '첫날', title: '조용한 자리 하나', body: '집 안을 다 보여 주기보다 잠자리·배변 자리·물그릇이 있는 공간 하나에서 시작해요. 손님은 며칠 뒤로 미뤄요.' },
      { when: '1~3일', title: '같은 시간에 밥·배변', body: '밥 주는 시간과 배변 자리를 매일 같게 하면 배변을 빨리 익혀요. 잘했을 때 바로 칭찬하고 간식을 줘요.' },
      { when: '첫 주', title: '동물병원 첫 검진', body: '분양처에서 받은 접종 기록을 들고 가서 다음 접종 날짜와 구충 일정을 잡아요.' },
      { when: '30일 안', title: '동물등록 신청', body: '2개월령 이상 강아지는 데려온 날부터 30일 안에 동물등록을 해야 해요. 동물병원 같은 등록대행기관에서 신청해요.' },
      { when: '2주부터', title: '혼자 있는 연습', body: '몇 분 나갔다 오기부터 시작해 조금씩 늘려요. 나갈 때·돌아올 때 크게 반기지 않아요.' },
      { when: '접종 끝나면', title: '바깥 산책 시작', body: '수의사가 괜찮다고 할 때부터 짧게 시작해요. 그 전엔 안고 나가 바깥 소리·사람에 익숙해지게 해요.' },
    ],
    shop: ['dog-potty-pad', 'dog-potty-tray', 'dog-home-crate', 'dog-home-bed', 'dog-walk-vest', 'dog-walk-leash', 'dog-walk-tag', 'dog-toy-nose', 'dog-treat-training', 'dog-groom-tooth', 'dog-groom-nail', 'dog-potty-odor'],
    popular: ['말티즈', '토이푸들', '포메라니안', '비숑프리제', '시츄', '말티푸', '진돗개', '웰시코기(펨브로크)'],
    faq: [
      { q: '강아지 데려오기 전 꼭 사야 하는 건 뭔가요?', a: '먹던 사료, 밥·물그릇, 배변패드와 배변판, 잠자리(켄넬이나 방석), 가슴줄·리드줄, 인식표면 첫날은 충분해요. 나머지는 지내면서 맞춰 가요.' },
      { q: '동물등록은 언제 해야 하나요?', a: '2개월령 이상 강아지는 데려온 날(또는 2개월령이 된 날)부터 30일 안에 등록해야 해요. 동물병원 같은 등록대행기관에서 신청하고, 등록하지 않으면 과태료가 있어요.' },
      { q: '사료는 바로 바꿔도 되나요?', a: '처음 며칠은 전에 먹던 사료를 그대로 주고, 바꿀 땐 일주일 넘게 새 사료 비율을 조금씩 늘려요. 갑자기 바꾸면 설사하기 쉬워요.' },
    ],
  },
  cat: {
    ko: '고양이',
    title: '고양이를 처음 데려온다면 — 첫날 준비물과 첫 주에 할 일',
    lead: '고양이는 낯선 곳에서 숨는 게 정상이에요. 준비물을 갖춰 두고, 첫 주는 기다려 주는 데 쓰세요.',
    items: [
      { icon: 'box', name: '화장실', why: '고양이 수보다 하나 더(한 마리면 두 개), 코에서 꼬리 시작점까지의 1.5배 넘는 크기로요' },
      { icon: 'litter', name: '모래', why: '처음엔 전에 쓰던 모래 그대로 — 바꾸면 화장실을 안 쓸 수 있어요' },
      { icon: 'bag', name: '먹던 사료', why: '처음 며칠은 전에 먹던 사료 그대로, 바꿀 땐 천천히 섞어요' },
      { icon: 'fountain', name: '물그릇이나 정수기', why: '밥그릇·화장실과 떨어진 곳에 둬요' },
      { icon: 'house', name: '숨숨집', why: '숨을 곳이 있어야 빨리 안정돼요 — 상자 하나도 괜찮아요' },
      { icon: 'scratcher', name: '스크래처', why: '발톱을 긁는 건 본능이에요 — 없으면 소파를 긁어요' },
      { icon: 'carrier', name: '이동장', why: '데려올 때와 병원 갈 때 — 위가 열리는 게 편해요' },
      { icon: 'wand', name: '낚싯대 장난감', why: '사냥 놀이가 고양이와 친해지는 가장 빠른 길이에요' },
      { icon: 'window', name: '방묘창', why: '방충망만으로는 밀고 나갈 수 있어요' },
      { icon: 'clipper', name: '발톱깎이·칫솔', why: '어릴 때부터 발과 입을 만지는 데 익숙해지게 해요' },
    ],
    steps: [
      { when: '첫날', title: '작은 방 하나에서 시작', body: '화장실·물·밥·숨숨집을 한 방에 두고 그 방에서만 지내게 해요. 숨어 있어도 억지로 꺼내지 않아요.' },
      { when: '1~3일', title: '먹고 싸는지 확인', body: '밥을 먹고 화장실을 쓰는지가 가장 중요해요. 하루 넘게 안 먹거나 소변을 못 보면 병원에 연락해요.' },
      { when: '첫 주', title: '동물병원 첫 검진', body: '접종 기록을 들고 가서 다음 접종과 구충 일정을 잡아요. 이동장에 담요를 깔아 두면 덜 무서워해요.' },
      { when: '첫 주', title: '창문·현관 점검', body: '방묘창을 달고 현관문을 열 때 고양이가 어디 있는지 확인하는 습관을 들여요.' },
      { when: '익숙해지면', title: '집 전체로 넓히기', body: '방 밖으로 스스로 나오기 시작하면 문을 열어 줘요. 캣타워·스크래처를 거실에 놓아요.' },
    ],
    shop: ['cat-potty-bento', 'cat-potty-boxbig', 'cat-potty-mat', 'cat-food-kitten', 'cat-food-wet', 'cat-home-fountain', 'cat-home-hide', 'cat-home-scratchv', 'cat-home-carrier', 'cat-home-screen', 'cat-toy-wand', 'cat-play-tower'],
    popular: ['코리안숏헤어', '러시안블루', '스코티시폴드', '페르시안', '브리티시숏헤어', '랙돌', '먼치킨', '노르웨이숲고양이'],
    faq: [
      { q: '고양이 데려오기 전 꼭 사야 하는 건 뭔가요?', a: '화장실과 모래, 먹던 사료, 물그릇, 숨을 곳, 스크래처, 이동장이면 첫날은 충분해요. 창문엔 방묘창을 미리 달아 두세요.' },
      { q: '고양이가 숨어서 안 나와요.', a: '낯선 곳에서 며칠 숨는 건 정상이에요. 억지로 꺼내지 말고 밥·물·화장실을 가까이 두세요. 하루 넘게 안 먹거나 소변을 못 보면 병원에 연락해요.' },
      { q: '고양이도 동물등록을 해야 하나요?', a: '지금 고양이 등록은 의무가 아니고 원하면 할 수 있어요. 잃어버렸을 때 찾는 데 도움이 돼요.' },
    ],
  },
};

export const dynamicParams = false;
export function generateStaticParams() {
  return [{ species: 'dog' }, { species: 'cat' }];
}

export function generateMetadata({ params }: { params: { species: string } }): Metadata {
  const d = DATA[params.species as Sp];
  if (!d) return {};
  const url = `${SITE.url}/start/${params.species}`;
  const description = `${d.ko} 입양 첫날 준비물 체크리스트와 첫 주에 할 일 — ${d.items.slice(0, 6).map((i) => i.name).join(', ')}부터 병원·등록까지 순서대로.`;
  return { title: { absolute: `${d.title} | 마이펫` }, description, alternates: { canonical: url }, ...socialMeta(d.title, description, url) };
}

function LawList({ rules }: { rules: CareRule[] }) {
  if (!rules.length) return null;
  return (
    <ul className="law">
      {rules.map((r) => (
        <li key={r.id}>
          <span className="law-ico">
            <CareIcon name={r.kind === 'law' ? 'law' : 'heart'} size={26} />
          </span>
          <div>
            <b>{r.title}</b>
            <p>
              {r.body}
              {r.penalty ? <span className="law-pen"> {r.penalty}</span> : null}
            </p>
            <a href={r.url} target="_blank" rel="noopener" className="law-ref">
              {r.ref}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function StartPage({ params }: { params: { species: string } }) {
  const sp = params.species as Sp;
  const d = DATA[sp];
  if (!d) notFound();
  const picks = picksById(d.shop);
  const live = hasLive(picks);
  const other: Sp = sp === 'dog' ? 'cat' : 'dog';
  const total = [...careProfiles().values()].filter((p) => p.species === sp).length;
  const laws = sp === 'dog' ? rulesById('dog-registration', 'walk-leash-2m', 'walk-id-tag', 'puppy-socialization') : rulesById('cat-registration-optional', 'litter-box-count-size', 'lily-toxic-cat');

  return (
    <main className="tz">
      <JsonLd data={[faqJsonLd(d.faq)]} />
      <div className="tz-wrap">
        {/* 사진 표지(2026-11-19) — 첫 화면 「처음 데려온다면」 카드와 같은 새끼 사진(public/pet-puppy·pet-kitten, unoptimized) */}
        <header className="pic-hero">
          <div className="pic-hero-txt">
            <nav className="st-switch" aria-label="강아지·고양이">
              <Link href="/start/dog" aria-current={sp === 'dog' ? 'page' : undefined}>
                강아지
              </Link>
              <Link href="/start/cat" aria-current={sp === 'cat' ? 'page' : undefined}>
                고양이
              </Link>
            </nav>
            <h1>{d.ko}를 처음 데려온다면</h1>
            <p className="tz-lead">{d.lead}</p>
            {live ? <Disclosure /> : null}
          </div>
          <Image
            className="pic-hero-img"
            src={sp === 'dog' ? '/pet-puppy.webp' : '/pet-kitten.webp'}
            alt={sp === 'dog' ? '앉아 있는 크림색 새끼 강아지' : '앉아 있는 회색 줄무늬 새끼 고양이'}
            width={520}
            height={sp === 'dog' ? 711 : 831}
            priority
            unoptimized
          />
        </header>

        <section className="sheet">
          <header className="sec-head">
            <span className="sec-ico shop-ico--food">
              <CareIcon name="paw" size={30} />
            </span>
            <h2>첫날 준비물</h2>
          </header>
          <ul className="st-check">
            {d.items.map((it) => (
              <li key={it.name}>
                <span className="st-check-ico">
                  <CareIcon name={it.icon} size={32} />
                </span>
                <div>
                  <b>{it.name}</b>
                  <span>{it.why}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="sheet">
          <header className="sec-head">
            <span className="sec-ico shop-ico--home">
              <CareIcon name="house" size={30} />
            </span>
            <h2>첫 주에 할 일</h2>
          </header>
          <ol className="st-steps">
            {d.steps.map((s) => (
              <li key={s.title}>
                <span className="st-when">{s.when}</span>
                <b>{s.title}</b>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
          <LawList rules={laws} />
        </section>

        <section className="sheet">
          <header className="sec-head">
            <span className="sec-ico shop-ico--toy">
              <CareIcon name="tag" size={30} />
            </span>
            <h2>준비물 고르기</h2>
          </header>
          <p className="sec-note">사료·가슴줄·빗처럼 크기와 털에 따라 달라지는 건 품종 안내판에서 그 품종에 맞춰 골라 드려요.</p>
          <ShopCards picks={picks} label="체구와 상관없이 다 쓰는 것" />
        </section>

        <section className="sheet">
          <header className="sec-head">
            <span className="sec-ico shop-ico--grooming">
              <CareIcon name="heart" size={30} />
            </span>
            <h2>품종을 알면 더 정확해요</h2>
          </header>
          <ul className="chips">
            {d.popular.map((n) => {
              const p = careOf(n);
              return (
                <li key={n}>
                  <Link href={breedPath(n)} className="chip">
                    <b>{n.replace(/\s*\([^)]*\)\s*/g, '')}</b>
                    <span>{p ? `${SIZE_LABEL[p.sizeClass]} · ${COAT_LABEL[p.coat]}` : '안내판 보기'}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href={`/breed#${sp}`} className="sheet-more">
            {d.ko} {total}종 전체 보기
          </Link>
        </section>
        {/* 품종을 모르거나 길에서 데려온 아이 — 믹스 안내판의 「길에서 데려왔다면」 칸으로(2026-11-19) */}
        <Link href={`${breedPath(sp === 'dog' ? '믹스견(잡종)' : '믹스/혼혈 고양이')}#rescue`} className="row-link" style={{ marginTop: 12 }}>
          품종을 모르거나 길에서 데려왔다면
        </Link>

        <section className="sheet">
          <FaqList items={d.faq} />
        </section>

        <p className="tz-src">
          일반적인 안내이며 수의사의 진찰과 진료를 대신하지 않아요. {d.ko === '강아지' ? '' : ''}
          <Link href={`/start/${other}`}>{other === 'dog' ? '강아지' : '고양이'}를 데려온다면</Link>
        </p>
      </div>
    </main>
  );
}
