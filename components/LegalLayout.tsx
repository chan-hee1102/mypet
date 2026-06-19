import Link from 'next/link';
import type { ReactNode } from 'react';

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="container container--narrow">
      <article className="legal">
        <h1 className="legal-title">{title}</h1>
        {updated && <p className="legal-updated">최종 개정일 · {updated}</p>}
        {children}
      </article>
      <p className="hint center" style={{ marginTop: 24 }}>
        <Link href="/" className="linklike">← 홈으로</Link>
      </p>
    </main>
  );
}
