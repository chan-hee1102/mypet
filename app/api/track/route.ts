/**
 * POST /api/track — 방문 기록 수집 (비인증, 브라우저가 직접 호출)
 *
 * 무엇을 받나: 탭 난수(visit_key) + 유입 원문 + 지금 보는 화면 + 눌린 것들.
 * 같은 탭이면 같은 키로 계속 덮어써서 **방문 하나당 한 행**만 남는다.
 *
 * ⚠️ 개인정보 최소화 — schema.sql의 visits 주석과 같은 원칙이다.
 *    IP를 읽지도 저장하지도 않는다. 쿠키를 만들지 않는다.
 *    여기서 하나라도 늘리려면 개인정보처리방침 ④부터 고쳐야 한다.
 *
 * ⚠️ 이 라우트는 **누구나 부를 수 있다**(비로그인 서비스라 인증할 것이 없다).
 *    그래서 방어는 '거절'이 아니라 **'담을 수 있는 크기를 서버가 정한다'**로 한다 —
 *    문자열 길이·클릭 개수·숫자 범위를 전부 서버에서 자른다. 위조된 방문이 섞일 수는 있어도
 *    한 요청이 DB를 부풀리지는 못한다.
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { inflowChannel } from '@/lib/inflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 방문 키 형식 — 클라이언트가 만드는 난수. 형식을 고정해 임의 문자열 주입을 막는다. */
const KEY_RE = /^[a-z0-9]{12,40}$/;

/** 한 방문에 담을 클릭 최대 개수. 넘으면 **최근 것**을 남긴다(지금 뭘 하고 있었나가 궁금한 값이라). */
const MAX_CLICKS = 40;

/** 문자열 길이 상한 — referrer는 UTM이 길게 붙는 경우가 있어 넉넉히, 나머지는 짧게. */
const LIMITS = { referrer: 500, path: 200, utm: 100, label: 60 } as const;

function clip(v: unknown, n: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  return s.length > n ? s.slice(0, n) : s;
}

/** 0 이상 정수로 자른다. 음수·NaN·거대값이 그대로 들어가지 않게. */
function nonNegInt(v: unknown, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), max);
}

interface ClickIn { t?: unknown; p?: unknown; at?: unknown }

/**
 * 30일 지난 방문을 지운다 — 보관기간 약속(개인정보처리방침)을 코드가 지키는 자리.
 *
 * 왜 크론이 아니라 여기인가: mypet은 크론이 없고, 이걸 위해 하나 두는 건 과하다.
 * 적재할 때 가끔 같이 지우면 트래픽이 있는 한 반드시 돌고, 트래픽이 없으면 지울 것도 없다.
 * 5%로 둔 이유는 방문마다 DELETE를 날리면 쓰기가 두 배가 되기 때문 —
 * 하루 20명만 와도 하루에 한 번은 넉넉히 돈다.
 */
async function purgeOld(admin: ReturnType<typeof createAdminClient>): Promise<void> {
  if (Math.random() > 0.05) return;
  const cutoff = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  try {
    await admin.from('visits').delete().lt('started_at', cutoff);
  } catch {
    /* 정리 실패가 수집을 막지 않는다 */
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const key = clip(body.key, 40);
  if (!key || !KEY_RE.test(key)) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = createAdminClient();
  const path = clip(body.path, LIMITS.path);

  /*
    첫 신호(init)에만 유입 정보를 쓴다. 이후 신호는 '지금 어디 있나'와 '뭘 눌렀나'만 갱신한다 —
    안 그러면 사이트 안에서 페이지를 옮길 때마다 referrer가 우리 자신으로 덮여
    **모든 방문이 「내부 이동」으로 바뀐다.**
  */
  const isInit = body.init === true;

  const clicksIn: ClickIn[] = Array.isArray(body.clicks) ? (body.clicks as ClickIn[]) : [];
  const clicks = clicksIn
    .map((c) => ({
      t: clip(c.t, LIMITS.label),
      p: clip(c.p, LIMITS.path),
      at: clip(c.at, 30),
    }))
    .filter((c) => c.t || c.p)
    .slice(-MAX_CLICKS);

  const now = new Date().toISOString();

  try {
    if (isInit) {
      const referrer = clip(body.referrer, LIMITS.referrer);
      const utmSource = clip(body.utm_source, LIMITS.utm);
      const row = {
        visit_key: key,
        started_at: now,
        last_at: now,
        referrer,
        channel: inflowChannel(referrer, utmSource),
        landing: path,
        exit_path: path,
        utm_source: utmSource,
        utm_medium: clip(body.utm_medium, LIMITS.utm),
        utm_campaign: clip(body.utm_campaign, LIMITS.utm),
        device: body.device === 'mobile' ? 'mobile' : 'desktop',
        pageviews: 1,
        clicks,
        duration_sec: 0,
      };
      // 새로고침으로 같은 키가 다시 오면 덮어쓴다(방문 하나 = 한 행).
      await admin.from('visits').upsert(row, { onConflict: 'visit_key' });
      await purgeOld(admin);
      return NextResponse.json({ ok: true });
    }

    /*
      갱신 신호 — 먼저 있던 행을 읽어 클릭을 이어 붙인다.
      행이 없으면(초기 신호가 유실됐거나 30일 정리에 걸림) **만들지 않고 조용히 넘긴다** —
      유입 정보 없는 반쪽 행을 만들면 채널 표에 정체불명 방문이 쌓인다.
    */
    const { data: prev } = await admin
      .from('visits').select('clicks').eq('visit_key', key).maybeSingle();
    if (!prev) return NextResponse.json({ ok: true });

    const merged = [...(Array.isArray(prev.clicks) ? prev.clicks : []), ...clicks].slice(-MAX_CLICKS);
    const patch: Record<string, unknown> = {
      last_at: now,
      clicks: merged,
      duration_sec: nonNegInt(body.duration, 12 * 3600),   // 12시간 넘는 체류는 값이 깨진 것
    };
    if (path) patch.exit_path = path;
    if (typeof body.pageviews !== 'undefined') patch.pageviews = nonNegInt(body.pageviews, 500);

    await admin.from('visits').update(patch).eq('visit_key', key);
    return NextResponse.json({ ok: true });
  } catch {
    // 수집 실패가 사용자 화면에 영향을 주면 안 된다 — 조용히 성공으로 답한다.
    return NextResponse.json({ ok: true });
  }
}
