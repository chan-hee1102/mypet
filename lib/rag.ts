import { createAdminClient } from './supabase/admin';
import { Species, Source } from './types';

const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIM = 768;

export type KnowledgeChunk = {
  topic: string;
  content: string;
  source_org: string;
  source_title: string | null;
  source_url: string | null;
  similarity: number;
};

export async function embed(text: string): Promise<number[] | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: EMBED_DIM }),
      },
    );
    if (!res.ok) return null;
    const j = await res.json();
    return j?.embedding?.values ?? null;
  } catch {
    return null;
  }
}

/**
 * 질문과 관련된 "검증된 수의 지식" 청크를 검색(RAG).
 * 임베딩 실패·KB 미적재여도 빈 배열을 반환해 생성은 정상 진행된다.
 */
export async function retrieveKnowledge(query: string, species: Species, count = 6): Promise<KnowledgeChunk[]> {
  const vec = await embed(query);
  if (!vec) return [];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('match_knowledge', {
      query_embedding: '[' + vec.join(',') + ']', // pgvector 텍스트 형식
      match_species: species,
      match_count: count,
    });
    if (error || !data) return [];
    return (data as KnowledgeChunk[]).filter((c) => (c.similarity ?? 0) > 0.45);
  } catch {
    return [];
  }
}

/**
 * 등록/추정 품종에 해당하는 품종 프로필 청크를 정확 매칭으로 가져온다.
 * 품종명에 괄호·쉼표가 있으면(예: "웰시코기(펨브로크)") 앞 토큰으로 매칭.
 * 정확 매칭이 우선이며, 실패 시 retrieveKnowledge의 의미검색이 폴백한다.
 */
export async function getBreedProfile(breed: string | undefined | null, species: Species): Promise<KnowledgeChunk | null> {
  if (!breed) return null;
  const base = breed.split(/[(,/·]/)[0].trim();
  if (base.length < 2) return null;
  try {
    const admin = createAdminClient();
    const sel = 'topic, content, source_org, source_title, source_url';
    // 1) breed 칼럼 정확 매칭 우선
    let { data } = await admin
      .from('knowledge')
      .select(sel)
      .eq('topic', '품종')
      .eq('species', species)
      .ilike('breed', `%${base}%`)
      .limit(1);
    // 2) 없으면 본문에서 품종명 포함 매칭
    if (!data || !data.length) {
      ({ data } = await admin
        .from('knowledge')
        .select(sel)
        .eq('topic', '품종')
        .eq('species', species)
        .ilike('content', `%${base}%`)
        .limit(1));
    }
    if (data && data.length) return { ...(data[0] as any), similarity: 1 } as KnowledgeChunk;
    return null;
  } catch {
    return null;
  }
}

/** 청크를 프롬프트 주입용 근거 텍스트로. */
export function knowledgeToPrompt(chunks: KnowledgeChunk[]): string {
  if (!chunks.length) return '';
  return chunks.map((c, i) => `[근거${i + 1} · 출처:${c.source_org}] ${c.content}`).join('\n');
}

/** 출처 목록(중복 제거). UI 배지용. */
export function knowledgeSources(chunks: KnowledgeChunk[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const c of chunks) {
    const k = (c.source_org || '') + '|' + (c.source_title || '');
    if (!c.source_org || seen.has(k)) continue;
    seen.add(k);
    out.push({ org: c.source_org, title: c.source_title ?? null, url: c.source_url ?? null });
  }
  return out.slice(0, 6);
}
