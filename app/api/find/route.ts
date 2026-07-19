import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { finderHash } from '@/lib/finder';

export const runtime = 'nodejs';

// 무차별 대입 방지 — IP당 10분 10회
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 10;
const MAX_KEYS = 5000;
const hits = new Map<string, { n: number; ts: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > MAX_KEYS) hits.clear();
  const h = hits.get(ip);
  if (!h || now - h.ts > RATE_WINDOW_MS) { hits.set(ip, { n: 1, ts: now }); return false; }
  h.n += 1;
  return h.n > RATE_MAX;
}

/** 내 리포트 찾기 — 휴대폰+PIN 해시가 일치하는 결제 완료 진단 목록. */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-real-ip') || 'unknown';
    if (rateLimited(ip)) {
      return NextResponse.json({ error: '시도가 너무 많아요. 10분 후 다시 시도해 주세요.' }, { status: 429 });
    }
    const body = await req.json().catch(() => null);
    const h = finderHash(body?.phone, body?.pin);
    if (!h) return NextResponse.json({ error: '휴대폰번호와 PIN 숫자 6자리를 확인해 주세요.' }, { status: 400 });

    const admin = createAdminClient();
    const { data } = await admin
      .from('diagnoses')
      .select('token, input, created_at, status')
      .eq('finder_hash', h)
      .not('paid_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    const items = (data ?? []).map((d) => ({
      token: d.token as string,
      name: (d.input as { name?: string } | null)?.name ?? '우리 아이',
      date: (d.created_at as string).slice(0, 10),
      done: d.status === 'done',
    }));
    // 불일치·없음은 동일 응답 (존재 여부 노출 방지)
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: '조회 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}
