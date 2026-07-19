import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { finderHash } from '@/lib/finder';

export const runtime = 'nodejs';

// 무차별 대입 방지 — 2중 제한:
//  ① IP당 10분 10회 (x-real-ip는 Vercel 플랫폼이 설정 — 클라이언트 위조 불가)
//  ② 전화번호당 1시간 8회 — IP를 바꿔가며 특정 번호의 PIN을 대입하는 공격 차단
const MAX_KEYS = 5000;
const ipHits = new Map<string, { n: number; ts: number }>();
const phoneHits = new Map<string, { n: number; ts: number }>();
function limited(map: Map<string, { n: number; ts: number }>, key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  if (map.size > MAX_KEYS) map.clear();
  const h = map.get(key);
  if (!h || now - h.ts > windowMs) { map.set(key, { n: 1, ts: now }); return false; }
  h.n += 1;
  return h.n > max;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 내 리포트 찾기 — 휴대폰+PIN 해시가 일치하는 결제 완료 진단 목록. */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-real-ip') || 'unknown';
    if (limited(ipHits, ip, 10 * 60 * 1000, 10)) {
      return NextResponse.json({ error: '시도가 너무 많아요. 10분 후 다시 시도해 주세요.' }, { status: 429 });
    }
    const body = await req.json().catch(() => null);
    const phoneKey = typeof body?.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
    if (phoneKey && limited(phoneHits, phoneKey, 60 * 60 * 1000, 8)) {
      return NextResponse.json({ error: '이 번호로 시도가 너무 많아요. 1시간 후 다시 시도해 주세요.' }, { status: 429 });
    }
    const h = finderHash(body?.phone, body?.pin);
    if (!h) return NextResponse.json({ error: '휴대폰번호와 PIN 숫자 6자리를 확인해 주세요.' }, { status: 400 });
    await sleep(350); // 대입 공격 비용 증가 (정상 사용자 체감 미미)

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
