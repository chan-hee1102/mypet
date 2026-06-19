import Link from 'next/link';
import { Icon } from '@/components/icons';

const STEPS = [
  { icon: 'camera', title: '사진·정보 입력', desc: '아이 사진과 이름·품종·나이를 간단히 입력해요.' },
  { icon: 'sparkle', title: 'AI 분석', desc: 'AI가 품종·체형을 분석해 맞춤 가이드를 만들어요.' },
  { icon: 'shield', title: '케어 리포트', desc: '음식·운동·그루밍·주기까지 한눈에 받아봐요.' },
];

const FEATURES = [
  { icon: 'tag', title: '품종 맞춤 분석', desc: '사진과 품종으로 우리 아이에게 꼭 맞는 케어를 안내해요.', tags: ['성격·기질', '주의 질환'] },
  { icon: 'bowl', title: '안전한 음식 가이드', desc: '먹어도 되는 음식과 절대 금지 독성식품을 구분해 드려요.', tags: ['추천 음식', '독성 식품'] },
  { icon: 'scissors', title: '그루밍 주의', desc: '더블코트 클리핑 등 품종별 미용 주의점을 알려줘요.', tags: ['더블코트', '미용 주기'] },
  { icon: 'calendar', title: '나이별 케어', desc: '퍼피·성견·노령 등 생애 단계에 맞는 관리법을 제안해요.', tags: ['퍼피', '성견', '노령'] },
  { icon: 'repeat', title: '권장 주기', desc: '목욕·산책·빗질을 얼마나 자주 하면 좋을지 안내해요.', tags: ['목욕', '산책', '빗질'] },
  { icon: 'cross', title: '병원 방문 신호', desc: '이런 증상이 보이면 병원에 가야 한다는 신호를 짚어줘요.', tags: ['응급 신호', '체크리스트'] },
];

const FAQ = [
  { q: '정말 정확한가요?', a: '품종·나이를 바탕으로 한 일반 케어 가이드입니다. 독성 음식 같은 핵심 안전 정보는 AI가 아니라 검증된 데이터로 제공해 신뢰도를 높였어요. 다만 질병 진단은 수의사의 몫입니다.' },
  { q: '수의사를 대체하나요?', a: '아니요. 일반 정보를 제공하는 서비스이며, 이상 증상이 보이면 반드시 병원 방문을 권장합니다.' },
  { q: '사진이 꼭 필요한가요?', a: '없어도 품종을 입력하면 리포트를 만들 수 있어요. 사진이 있으면 체형·털 상태까지 분석해 더 정확해집니다.' },
  { q: '강아지·고양이 둘 다 되나요?', a: '네, 강아지와 고양이 모두 지원합니다.' },
];

export default function Home() {
  return (
    <main className="container">
      {/* 히어로 */}
      <section className="lhero">
        <span className="eyebrow"><Icon name="sparkle" size={14} filled /> AI 반려동물 케어</span>
        <h1>우리 아이에게 꼭 맞는<br /><em>케어 리포트</em>를 1분 만에</h1>
        <p className="lhero-sub">사진과 간단한 정보만 입력하면, 품종·나이에 맞춘 음식·운동·그루밍 가이드를 만들어 드립니다.</p>
        <div className="lhero-cta">
          <Link href="/create" className="btn btn--primary btn--lg"><Icon name="sparkle" size={17} filled /> 무료로 시작하기</Link>
          <Link href="#how" className="btn btn--secondary btn--lg">어떻게 작동하나요</Link>
        </div>
        <div className="trust">
          <span className="trust-item"><Icon name="camera" size={15} /> 사진 분석</span>
          <span className="trust-item"><Icon name="tag" size={15} /> 품종 맞춤</span>
          <span className="trust-item"><Icon name="shield" size={15} /> 안전 검증</span>
        </div>

        {/* 제품 목업 */}
        <div className="hero-visual">
          <span className="float-chip float-a"><Icon name="check" size={14} strokeWidth={2.4} /> AI 분석 완료</span>
          <span className="float-chip float-b"><Icon name="shield" size={14} /> 안전 검증됨</span>
          <div className="mockcard">
            <div className="mock-head">
              <span className="mock-avatar"><Icon name="paw" size={20} filled /></span>
              <div>
                <div className="mock-name">콩이</div>
                <div className="mock-meta">포메라니안 · 2살 · 암컷</div>
              </div>
              <span className="mock-badge">맞춤 리포트</span>
            </div>
            <div className="mock-traits">
              <span>활발함</span>
              <span>애교 많음</span>
              <span className="risk">슬개골 주의</span>
            </div>
            <div className="mock-row">
              <span className="ic tint-mint"><Icon name="scissors" size={15} /></span>
              <div><div className="tx">그루밍</div><div className="sub">더블코트, 바짝 밀기 주의</div></div>
            </div>
            <div className="mock-row">
              <span className="ic tint-sky"><Icon name="activity" size={15} /></span>
              <div><div className="tx">하루 산책</div><div className="sub">20–30분 · 무리한 점프 주의</div></div>
            </div>
            <div className="mock-foods">
              <span className="mock-pill good"><Icon name="check" size={13} strokeWidth={2.4} /> 닭가슴살·당근</span>
              <span className="mock-pill bad"><Icon name="alert" size={13} /> 초콜릿·포도</span>
            </div>
            <div className="mock-schedule">
              <div><span>목욕</span><b>2주마다</b></div>
              <div><span>빗질</span><b>주 3회</b></div>
              <div><span>체형</span><b>표준</b></div>
            </div>
            <div className="mock-symptom">
              <span className="ic"><Icon name="cross" size={14} /></span>
              <div className="tx">증상 체크 · 기침·떨림 응급도 안내</div>
            </div>
          </div>
        </div>

        {/* 수치 */}
        <div className="proof">
          <div className="proof-item"><b>8가지</b><span>케어 항목 분석</span></div>
          <div className="proof-divider" />
          <div className="proof-item"><b>200+</b><span>품종 지원</span></div>
          <div className="proof-divider" />
          <div className="proof-item"><b>1분</b><span>이면 완성</span></div>
        </div>
      </section>

      {/* 작동 방식 */}
      <section className="lsec" id="how">
        <div className="lsec-head">
          <div className="lsec-eyebrow">How it works</div>
          <h2 className="lsec-title">3단계면 끝</h2>
          <p className="lsec-sub">복잡한 설정 없이, 사진 한 장과 기본 정보면 충분해요.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step-card" key={s.title}>
              <span className="step-num">0{i + 1}</span>
              <div className="step-ico"><Icon name={s.icon} size={23} /></div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 특징 */}
      <section className="lsec">
        <div className="lsec-head">
          <div className="lsec-eyebrow">Features</div>
          <h2 className="lsec-title">이만큼 꼼꼼하게 챙겨드려요</h2>
          <p className="lsec-sub">품종·나이·체형까지 분석해, 보호자가 놓치기 쉬운 것까지 알려드려요.</p>
        </div>
        <div className="feat-grid">
          {FEATURES.map((f) => (
            <div className="feat-card" key={f.title}>
              <div className="feat-ico"><Icon name={f.icon} size={20} /></div>
              <div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
                <div className="feat-tags">
                  {f.tags.map((t) => <span className="feat-tag" key={t}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 안전 강조 */}
      <section className="lsec">
        <div className="safe">
          <div className="safe-ico"><Icon name="shield" size={24} /></div>
          <div>
            <h3>틀리면 위험한 정보는 AI에 맡기지 않아요</h3>
            <p>초콜릿·포도·양파 같은 독성 음식 정보는 AI 생성이 아니라 <b>검증된 데이터</b>로 고정해 제공합니다. 그 위에서 AI가 우리 아이 맞춤 조언만 더해요.</p>
          </div>
        </div>
      </section>

      {/* 증상 체크 안내 */}
      <section className="lsec">
        <div className="symptom-band">
          <div className="symptom-band-ico"><Icon name="cross" size={26} /></div>
          <div className="symptom-band-tx">
            <h3>기침하거나 떨 때, 병원 가야 할까요?</h3>
            <p>증상을 입력하면 가능한 원인과 <b>응급도</b>를 바로 안내해 드려요. 한밤중 검색 대신.</p>
          </div>
          <Link href="/symptom" className="btn btn--primary">증상 체크하기</Link>
        </div>
      </section>

      {/* 우리의 약속 */}
      <section className="lsec">
        <div className="quote">
          <div className="quote-label"><Icon name="shield" size={14} /> mypet의 약속</div>
          <p>“반려동물의 건강 정보는 틀리면 안 되니까요. 독성 음식·응급 신호 같은 핵심은 검증된 데이터로 고정하고, 애매할 땐 언제나 병원을 권합니다.”</p>
          <div className="quote-author">
            <span className="quote-avatar"><Icon name="paw" size={18} filled /></span>
            <div>
              <b>mypet 팀</b>
              <span>안전을 가장 먼저</span>
            </div>
          </div>
        </div>
      </section>

      {/* 요금 */}
      <section className="lsec" id="pricing">
        <div className="lsec-head">
          <div className="lsec-eyebrow">Pricing</div>
          <h2 className="lsec-title">요금 안내</h2>
          <p className="lsec-sub">먼저 무료로 체험하고, 마음에 들면 전체 리포트를 받아보세요.</p>
        </div>
        <div className="price-grid">
          <div className="price-card">
            <div className="price-name">무료 체험</div>
            <div className="price-amt">₩0</div>
            <div className="price-note">로그인 없이 바로 체험</div>
            <ul className="price-list">
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 리포트 미리보기 (사진 분석·품종 특성)</li>
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 반려동물 1마리</li>
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 강아지·고양이 모두 지원</li>
            </ul>
            <Link href="/create" className="btn btn--secondary btn--block">무료로 시작</Link>
          </div>
          <div className="price-card featured">
            <span className="price-badge">추천</span>
            <div className="price-name">프리미엄 리포트</div>
            <div className="price-amt">₩3,900<small> / 마리</small></div>
            <div className="price-note">전체 리포트 해금</div>
            <ul className="price-list">
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 전체 리포트 (음식 금지·나이별·주기·병원 신호)</li>
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 여러 마리 저장·재열람</li>
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 목욕·예방접종 주기 알림 <small>(준비 중)</small></li>
            </ul>
            <Link href="/create" className="btn btn--primary btn--block">전체 리포트 받기</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lsec">
        <div className="lsec-head">
          <div className="lsec-eyebrow">FAQ</div>
          <h2 className="lsec-title">자주 묻는 질문</h2>
        </div>
        <div className="faq">
          {FAQ.map((item) => (
            <details className="faq-item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 최종 CTA */}
      <section className="cta-band">
        <h2>지금 우리 아이 케어 리포트를 받아보세요</h2>
        <p>사진 한 장이면 충분해요. 무료로 바로 시작할 수 있습니다.</p>
        <Link href="/create" className="btn btn--white btn--lg"><Icon name="sparkle" size={17} filled /> 무료로 시작하기</Link>
      </section>
    </main>
  );
}
