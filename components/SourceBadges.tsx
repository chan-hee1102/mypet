import type { Source } from '@/lib/types';
import { Icon } from './icons';

/** RAG 근거 출처 배지. "GPT와 다른 이유" — 검증된 가이드라인 기반임을 보여준다. */
export default function SourceBadges({ sources }: { sources?: Source[] | null }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="sources">
      <div className="sources-label"><Icon name="shield" size={13} /> 검증된 수의 가이드라인 근거</div>
      <div className="sources-badges">
        {sources.map((s, i) =>
          s.url ? (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" className="source-badge" title={s.title ?? undefined}>
              {s.org}
            </a>
          ) : (
            <span key={i} className="source-badge" title={s.title ?? undefined}>{s.org}</span>
          ),
        )}
      </div>
    </div>
  );
}
