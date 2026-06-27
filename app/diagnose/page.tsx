import DiagnoseForm from '@/components/DiagnoseForm';
import { Icon } from '@/components/icons';

export const metadata = { title: '반려동물 진단하기 — mypet' };
export const dynamic = 'force-dynamic';

export default function DiagnosePage() {
  return (
    <main className="container container--narrow">
      <section className="hero">
        <span className="eyebrow"><Icon name="sparkle" size={14} filled /> AI 맞춤 진단</span>
        <h1>우리 아이 정보를 알려주세요</h1>
        <p className="hero-sub">사진과 기본 정보·증상을 입력하면, 품종에 꼭 맞는 전문 케어 진단을 만들어 드려요.</p>
      </section>
      <DiagnoseForm />
    </main>
  );
}
