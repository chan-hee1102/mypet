import { createAdminClient } from './supabase/admin';
import { embed } from './rag';
import { KNOWLEDGE_SEED } from './knowledgeSeed';
import breedData from './breedKnowledge.json';

type IngestRow = {
  species: string;
  topic: string;
  content: string;
  source_org: string;
  source_title: string | null;
  source_url: string | null;
  breed: string | null;
  embedText: string; // 임베딩 입력(매칭 강화를 위해 별도 구성)
};

/** 일반 가이드라인(KNOWLEDGE_SEED) + 품종 프로필(breedKnowledge.json)을 적재용 행으로. */
function buildRows(): IngestRow[] {
  const general: IngestRow[] = KNOWLEDGE_SEED.map((it) => ({
    species: it.species,
    topic: it.topic,
    content: it.content,
    source_org: it.source_org,
    source_title: it.source_title ?? null,
    source_url: it.source_url ?? null,
    breed: null,
    embedText: `${it.topic} ${it.content}`,
  }));

  const breeds: IngestRow[] = (breedData as any[]).map((b) => {
    const aliases = Array.isArray(b.aliases) ? b.aliases.join(' ') : '';
    return {
      species: b.species,
      topic: '품종',
      content: `${b.breed_ko}(${b.breed_en}) — ${b.content}`,
      source_org: b.source_org,
      source_title: b.source_title ?? null,
      source_url: b.source_url ?? null,
      breed: b.breed_ko,
      // 품종명·영문·별칭을 임베딩 입력 앞에 넣어 품종 질의 매칭을 강화
      embedText: `${b.breed_ko} ${b.breed_en} ${aliases} 품종 특성 호발질환 그루밍 케어 ${b.content}`,
    };
  });

  return [...general, ...breeds];
}

/**
 * 지식(일반 가이드라인 + 품종 프로필)을 임베딩해 knowledge 테이블에 적재(멱등 — 매번 전량 교체).
 * 서버에서만 호출(service_role). /admin 의 "지식베이스 적재/갱신" 버튼이 사용.
 */
export async function ingestKnowledge(): Promise<{ inserted: number; failed: number; total: number }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 가 없어 임베딩을 만들 수 없습니다.');
  }
  const admin = createAdminClient();
  const rows = buildRows();

  // 멱등: 기존 전량 삭제 후 재적재 (impossible id로 전체 매칭)
  await admin.from('knowledge').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  let inserted = 0;
  let failed = 0;
  const BATCH = 8; // 임베딩 병렬 — 서버리스 타임아웃 회피

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const built = await Promise.all(
      batch.map(async (r) => {
        const vec = await embed(r.embedText);
        if (!vec) return null;
        return {
          species: r.species,
          topic: r.topic,
          content: r.content,
          source_org: r.source_org,
          source_title: r.source_title,
          source_url: r.source_url,
          breed: r.breed,
          embedding: '[' + vec.join(',') + ']', // pgvector 텍스트 형식
        };
      }),
    );
    const ok = built.filter((r): r is NonNullable<typeof r> => r !== null);
    failed += built.length - ok.length;
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

  return { inserted, failed, total: rows.length };
}
