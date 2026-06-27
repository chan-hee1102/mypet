import DiagnoseForm from '@/components/DiagnoseForm';

export const metadata = { title: '반려동물 진단하기 — mypet' };
export const dynamic = 'force-dynamic';

export default function DiagnosePage() {
  return (
    <main className="container container--narrow">
      <DiagnoseForm />
    </main>
  );
}
