import Link from 'next/link';
import { Icon } from '@/components/icons';

export const dynamic = 'force-dynamic';

// 증상 검색 유입자가 "내 얘기다" 하고 바로 누르게 하는 칩
const SYMPTOMS = [
  { id: 'vomit', label: '토해요' },
  { id: 'cough', label: '기침해요' },
  { id: 'diarrhea', label: '설사해요' },
  { id: 'lethargy', label: '안 먹어요' },
  { id: 'itch', label: '가려워해요' },
  { id: 'tremble', label: '떨어요' },
];

const STEPS = [
  { icon: 'paw', title: '우리 아이 정보 입력', desc: '품종·나이·걱정되는 증상을 30초면 입력해요.' },
  { icon: 'shield', title: '무료 일반 안내', desc: '이 품종·증상에 대한 일반 정보를 바로 보여드려요.' },
  { icon: 'sparkle', title: 'AI 맞춤 리포트 (2,900원)', desc: '정밀 원인 + 케어(사료·간식·산책·미용·영양제)까지. PDF 저장.' },
];

const FAQ = [
  { q: '수의사를 대체하나요?', a: '아니요. 병원에 가기 전 참고할 수 있는 일반 정보를 드리는 서비스예요. 이상 증상이 보이면 반드시 수의사 진료를 받으세요.' },
  { q: '정보가 정확한가요?', a: '공식 수의 가이드라인(AKC·WSAVA·ASPCA 등)과 188개 품종의 검증 데이터를 기반으로 합니다. 독성 음식 같은 핵심 안전 정보는 AI가 아니라 검증 데이터로 고정해 신뢰도를 높였어요.' },
  { q: '로그인해야 하나요?', a: '아니요. 로그인·회원가입 없이 바로 이용하고, 결제 후 결과는 비밀 링크로 다시 볼 수 있어요.' },
  { q: '강아지·고양이 둘 다 되나요?', a: '네, 강아지와 고양이 모두 지원합니다.' },
];

export default function Home() {
  return (
    <main className="container">
      {/* 히어로 — 신뢰 + 증상 의도 */}
      <section className="lhero">
        <span className="eyebrow"><Icon name="shield" size={14} /> 수의 가이드라인 기반</span>
        <h1>우리 아이 케어,<br /><em>믿을 수 있게</em></h1>
        <p className="lhero-sub">
          어떻게 키울지 궁금하거나, 어디가 아파 보이거나 — 공식 수의 가이드라인·검증 데이터 기반으로
          <b> 우리 아이 품종·나이·증상</b>에 맞는 정보를 알려드려요.
        </p>

        <div className="sym-hook">
          <span className="sym-hook-label">혹시 이런 게 걱정되세요?</span>
          <div className="sym-chips">
            {SYMPTOMS.map((s) => (
              <Link key={s.id} href={`/diagnose?s=${s.id}`} className="sym-chip">{s.label}</Link>
            ))}
          </div>
          <p className="sym-hook-care">증상이 없어도 괜찮아요 — <b>품종 맞춤 케어</b>를 무료로 알려드려요.</p>
        </div>

        <div className="lhero-cta">
          <Link href="/diagnose" className="btn btn--primary btn--lg"><Icon name="sparkle" size={17} filled /> 무료로 시작하기</Link>
        </div>
        <div className="trust">
          <span className="trust-item"><Icon name="shield" size={15} /> 수의 가이드라인 기반</span>
          <span className="trust-item"><Icon name="check" size={15} /> 공식 출처 AKC·WSAVA</span>
          <span className="trust-item"><Icon name="paw" size={15} filled /> 188개 품종 데이터</span>
        </div>

        {/* 제품 목업 */}
        <div className="hero-visual">
          <span className="float-chip float-a"><Icon name="check" size={14} strokeWidth={2.4} /> 수의 가이드라인 근거</span>
          <span className="float-chip float-b"><Icon name="shield" size={14} /> 공식 출처 표기</span>
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
              <span className="ic tint-sky"><Icon name="cross" size={15} /></span>
              <div><div className="tx">구토 가능 원인</div><div className="sub">식이 변화·이물·위장염 등</div></div>
            </div>
            <div className="mock-foods">
              <span className="mock-pill good"><Icon name="check" size={13} strokeWidth={2.4} /> 닭가슴살·당근</span>
              <span className="mock-pill bad"><Icon name="alert" size={13} /> 초콜릿·포도</span>
            </div>
            <div className="mock-schedule">
              <div><span>산책</span><b>하루 20분</b></div>
              <div><span>목욕</span><b>2주마다</b></div>
              <div><span>병원</span><b>이럴 때</b></div>
            </div>
          </div>
        </div>
      </section>

      {/* 작동 방식 */}
      <section className="lsec" id="how">
        <div className="lsec-head">
          <div className="lsec-eyebrow">How it works</div>
          <h2 className="lsec-title">30초면 시작, 무료로 먼저</h2>
          <p className="lsec-sub">정보를 입력하면 무료 일반 안내부터 바로 보여드려요.</p>
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

      {/* 왜 믿을 수 있나 */}
      <section className="lsec">
        <div className="safe">
          <div className="safe-ico"><Icon name="shield" size={24} /></div>
          <div>
            <h3>아무 말이나 지어내지 않아요</h3>
            <p>
              초콜릿·포도·양파 같은 <b>독성 음식</b>, 품종별 <b>호발질환</b> 같은 핵심 정보는
              공식 수의 가이드라인·검증 데이터로 고정합니다. AI는 그 위에서 <b>우리 아이 맞춤</b> 조언만 더해요.
              모든 결과에는 출처를 표기합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 요금 */}
      <section className="lsec" id="pricing">
        <div className="lsec-head">
          <div className="lsec-eyebrow">Pricing</div>
          <h2 className="lsec-title">무료로 보고, 필요하면 2,900원</h2>
          <p className="lsec-sub">부담 없이 무료부터. 더 정밀한 맞춤 리포트가 필요할 때만 결제하세요.</p>
        </div>
        <div className="price-grid">
          <div className="price-card">
            <div className="price-name">무료 정보</div>
            <div className="price-amt">₩0</div>
            <div className="price-note">로그인 없이 바로</div>
            <ul className="price-list">
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 품종 일반 정보·주의할 점</li>
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 걱정되는 증상의 일반 안내</li>
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 강아지·고양이 모두 지원</li>
            </ul>
            <Link href="/diagnose" className="btn btn--secondary btn--block">무료로 시작</Link>
          </div>
          <div className="price-card featured">
            <span className="price-badge">맞춤</span>
            <div className="price-name">맞춤 케어 리포트</div>
            <div className="price-amt">₩2,900<small> / 1회</small></div>
            <div className="price-note">결제 즉시 · PDF 저장</div>
            <ul className="price-list">
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 사진·증상 기반 정밀 분석</li>
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 사료·간식·산책·미용·영양제 케어</li>
              <li><Icon name="check" size={15} strokeWidth={2.2} /> 병원 가야 할 신호 + 비밀 링크 보관</li>
            </ul>
            <Link href="/diagnose" className="btn btn--primary btn--block">진단 시작하기</Link>
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
        <h2>우리 아이, 지금 무료로 확인해보세요</h2>
        <p>로그인 없이 30초. 걱정되는 증상부터 가볍게 시작하세요.</p>
        <Link href="/diagnose" className="btn btn--white btn--lg"><Icon name="sparkle" size={17} filled /> 무료로 시작하기</Link>
      </section>
    </main>
  );
}
