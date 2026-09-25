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
    <main className="container container--doc">
      <article className="legal">
        <h1 className="legal-title">{title}</h1>
        {updated && <p className="legal-updated">최종 개정일 {updated}</p>}
        {children}
      </article>
    </main>
  );
}
