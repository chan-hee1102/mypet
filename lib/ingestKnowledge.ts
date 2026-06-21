import { createAdminClient } from './supabase/admin';
import { embed } from './rag';
import { KNOWLEDGE_SEED } from './knowledgeSeed';

/**
 * 시드 지식을 임베딩해 knowledge 테이블에 적재(멱등 — 매번 전량 교체).
 * 서버에서만 호출(service_role). /admin 의 "지식베이스 적재/갱신" 버튼이 사용.
 */
export async function ingestKnowledge(): Promise<{ inserted: number; failed: number; total: number }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 가 없어 임베딩을 만들 수 없습니다.');
  }
  const admin = createAdminClient();

  // 멱등: 기존 시드 전량 삭제 후 재적재 (impossible id로 전체 매칭)
  await admin.from('knowledge').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  let inserted = 0;
  let failed = 0;
  const BATCH = 8; // 임베딩 병렬 — 서버리스 타임아웃 회피

  for (let i = 0; i < KNOWLEDGE_SEED.length; i += BATCH) {
    const batch = KNOWLEDGE_SEED.slice(i, i + BATCH);
    const rows = await Promise.all(
      batch.map(async (item) => {
        const vec = await embed(`${item.topic} ${item.content}`);
        if (!vec) return null;
        return {
          species: item.species,
          topic: item.topic,
          content: item.content,
          source_org: item.source_org,
          source_title: item.source_title ?? null,
          source_url: item.source_url ?? null,
          embedding: '[' + vec.join(',') + ']', // pgvector 텍스트 형식
        };
      }),
    );
    const ok = rows.filter((r): r is NonNullable<typeof r> => r !== null);
    failed += rows.length - ok.length;
    if (ok.length) {
      const { error } = await admin.from('knowledge').insert(ok);
      if (error) {
        console.error('[ingestKnowledge] insert error:', error.message);
        failed += ok.length;
      } else {
        inserted += ok.length;
      }
    }
  }

  return { inserted, failed, total: KNOWLEDGE_SEED.length };
}
