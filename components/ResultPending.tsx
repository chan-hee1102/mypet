'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';
import { SITE } from '@/lib/site';

/**
 * 결과 페이지의 '아직 완성 전' 상태 처리기.
 * 1) 마운트 시 finalize(토큰만)를 1회 호출 — 리디렉션이 끊겨 유실된 결제를 자동 복구
 * 2) 4초 간격으로 상태를 확인, 완성되면 자동 새로고침
 * 3) 결제 이력이 없으면(402) '아직 결제 전' 안내로 전환
 * 4) 2분이 지나면 기다리기를 멈추고 **길을 준다** (아래 참고)
 *
 * ⚠️ 4번이 없던 동안 이 화면은 **무한 폴링**이었다. finalize가 402나 성공이 아닌 다른 이유로
 *    실패하면(500·504·네트워크) 「보통 1분 안에 완성돼요」가 영원히 돌았다.
 *    이용자가 볼 수 있는 것은 도는 스피너뿐이고, 결제는 이미 끝난 상태다 —
 *    **가장 화나는 종류의 화면**이라 반드시 끝이 있어야 한다.
 *    끝났을 때 필요한 건 사과가 아니라 다음 행동이다: 메일 확인 · 새로고침 · 문의.
 */

/** 이만큼 지나면 기다리기를 멈춘다. 생성은 보통 1분 안이라 2분이면 무언가 잘못된 것이다. */
const GIVE_UP_MS = 120_000;
const POLL_MS = 4000;

export default function ResultPending({ token }: { token: string }) {
  const [notPaid, setNotPaid] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    let stop = false;
    const startedAt = Date.now();
    let iv: ReturnType<typeof setInterval> | undefined;

    // 경과 시간을 화면에 보여준다 — 스피너만 도는 것보다 '진행 중'이 훨씬 잘 읽힌다.
    const tick = setInterval(() => setWaited(Math.round((Date.now() - startedAt) / 1000)), 1000);

    (async () => {
      try {
        const r = await fetch('/api/diagnose/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (stop) return;
        if (r.ok) { window.location.reload(); return; }
        if (r.status === 402) { setNotPaid(true); return; }   // 실제로 결제 이력 없음
        // 그 외(500·504…)는 아래 폴링으로 넘어간다 — 생성이 백그라운드에서 끝날 수 있다.
      } catch { /* 네트워크 — 폴링으로 계속 */ }

      iv = setInterval(async () => {
        if (Date.now() - startedAt > GIVE_UP_MS) {
          clearInterval(iv);
          setStuck(true);
          return;
        }
        try {
          const s = await fetch(`/api/diagnose/status?token=${encodeURIComponent(token)}`).then((x) => x.json());
          if (s.status === 'done' || s.status === 'failed') { clearInterval(iv); window.location.reload(); }
        } catch { /* 다음 턴 */ }
      }, POLL_MS);
    })();

    return () => { stop = true; clearInterval(tick); if (iv) clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (notPaid) {
    return (
      <main className="container container--narrow">
        <div className="card gate">
          <div className="gate-ico"><Icon name="lock" size={24} /></div>
          <h2 className="gate-title">아직 결제 전이에요</h2>
          <p className="gate-desc">결제가 완료되면 이 페이지에서 전체 진단을 볼 수 있어요.</p>
          <Link href="/diagnose" className="btn btn--primary btn--lg btn--block">
            <Icon name="sparkle" size={17} filled /> 진단 이어서 하기
          </Link>
        </div>
      </main>
    );
  }

  /*
    2분을 넘긴 상태. 여기서 「기다려 주세요」를 반복하면 안 된다 —
    이용자가 지금 알아야 할 것은 ① 돈은 안전하다 ② 메일이 갈 것이다 ③ 사람에게 말할 방법이다.
  */
  if (stuck) {
    return (
      <main className="container container--narrow">
        <div className="card gate">
          <div className="gate-ico"><Icon name="alert" size={24} /></div>
          <h2 className="gate-title">생성이 오래 걸리고 있어요</h2>
          <p className="gate-desc">
            결제는 정상 처리됐고 <b>리포트는 계속 만들어지고 있어요.</b><br />
            완성되면 <b>입력하신 이메일로 링크를 보내드려요</b> — 이 창을 닫으셔도 괜찮아요.
          </p>
          <button className="btn btn--primary btn--lg btn--block" onClick={() => window.location.reload()}>
            <Icon name="sparkle" size={17} filled /> 지금 다시 확인하기
          </button>
          <p className="gate-note" style={{ marginTop: 10 }}>
            10분이 지나도 메일이 없으면{' '}
            <a href={`mailto:${SITE.adminEmail}?subject=${encodeURIComponent('[mypet] 결과가 오지 않아요')}&body=${encodeURIComponent(`결과 링크: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`} className="linklike">
              문의
            </a>
            해 주세요. 링크가 자동으로 담깁니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow">
      <div className="card gate">
        <div className="gate-ico"><Icon name="sparkle" size={24} filled /></div>
        <h2 className="gate-title">진단을 확인하고 있어요</h2>
        <p className="gate-desc">
          결제 내역을 확인하고 리포트를 만드는 중이에요.<br />
          완성되면 <b>자동으로 화면이 바뀌어요</b> — 잠시만 기다려 주세요.
        </p>
        <p className="gate-note">
          <span className="spinner" style={{ borderColor: 'rgba(16,163,124,.25)', borderTopColor: 'var(--brand)' }} />
          {' '}보통 1분 안에 완성돼요{waited > 20 ? ` · ${waited}초째 확인 중` : ''}
        </p>
        {/* 20초쯤부터는 '닫아도 된다'는 사실이 필요해진다 — 그걸 모르면 계속 붙잡혀 있게 된다. */}
        {waited > 20 && (
          <p className="gate-note" style={{ marginTop: 6 }}>
            완성되면 입력하신 <b>이메일로도 링크를 보내드려요.</b>
          </p>
        )}
      </div>
    </main>
  );
}
