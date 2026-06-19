import PetForm from '@/components/PetForm';
import { Icon } from '@/components/icons';

export const metadata = {
  title: '케어 리포트 만들기 — mypet',
};

export default function CreatePage() {
  return (
    <main className="container">
      <section className="hero">
        <span className="eyebrow"><Icon name="sparkle" size={14} filled /> AI 케어 리포트</span>
        <h1>우리 아이 정보를 입력하세요</h1>
        <p className="hero-sub">사진과 기본 정보로 맞춤 케어 리포트를 만들어 드립니다.</p>
      </section>
      <PetForm />
    </main>
  );
}
