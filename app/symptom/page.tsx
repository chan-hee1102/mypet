import SymptomChecker from '@/components/SymptomChecker';
import AuthGate from '@/components/AuthGate';
import { Icon } from '@/components/icons';

export const metadata = {
  title: '증상 체크 — 병원 가야 할까요? · mypet',
};

export default function SymptomPage() {
  return (
    <main className="container">
      <section className="hero">
        <span className="eyebrow"><Icon name="cross" size={14} /> 증상 체크</span>
        <h1>기침·떨림, 병원 가야 할까요?</h1>
        <p className="hero-sub">증상을 입력하면 가능한 원인과 응급도를 바로 안내해 드립니다.</p>
      </section>
      <AuthGate featureName="증상 체크">
        <SymptomChecker />
      </AuthGate>
    </main>
  );
}
