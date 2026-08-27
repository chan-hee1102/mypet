'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * 방문 기록 수집기 — 유입 경로 · 클릭 흐름 · 이탈 화면.
 *
 * ⚠️ **쿠키를 만들지 않는다.** 방문 키는 sessionStorage 난수라 탭을 닫으면 사라지고
 *    방문끼리 이어지지 않는다. 개인정보처리방침이 「쿠키를 사용하지 않는」다고 적고 있어
 *    그 문장을 코드가 지켜야 한다. localStorage로 바꾸면 방문이 이어져 사람 추적이 되므로
 *    쓰지 않는다 — sessionStorage인 것이 설계다.
 *
 * ⚠️ 화면에 아무것도 그리지 않고, 실패해도 조용하다. 수집이 서비스를 방해하면 안 된다.
 *
 * 보내는 시점을 셋으로 나눈 이유(= 요청 수를 아끼면서 이탈을 놓치지 않기 위해):
 *   ① 첫 진입 1회 — 유입 정보는 이때만 보낸다(이후에 보내면 referrer가 우리 자신으로 덮인다)
 *   ② 화면 이동 시 — 지금 어디 있나(이탈 화면의 근거)
 *   ③ 탭을 숨기거나 닫을 때 — 모아둔 클릭 + 체류시간. sendBeacon이라 페이지가 죽어도 나간다
 */

const KEY_NAME = 'mypet_visit';
const ENDPOINT = '/api/track';

/** 눌린 것의 이름 — 사람이 읽을 수 있게. 없으면 경로로 대신한다. */
function labelOf(el: Element): string {
  const a = el as HTMLElement;
  const explicit = a.getAttribute('data-track');
  if (explicit) return explicit;
  const text = (a.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (text) return text.slice(0, 60);
  return a.getAttribute('aria-label') ?? a.getAttribute('title') ?? '(이름 없음)';
}

function newKey(): string {
  // 36진수 난수 두 개를 이어 붙여 24자 안팎 — 서버의 KEY_RE(영소문자+숫자 12~40자)와 맞춘다.
  const r = () => Math.random().toString(36).slice(2, 14);
  return (r() + r()).replace(/[^a-z0-9]/g, '').slice(0, 32);
}

export default function VisitTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const keyRef = useRef<string | null>(null);
  const clicksRef = useRef<{ t: string; p: string; at: string }[]>([]);
  const startedRef = useRef<number>(Date.now());
  const viewsRef = useRef(0);
  const initedRef = useRef(false);

  /** 모아둔 클릭 + 현재 화면을 보낸다. keepalive(또는 sendBeacon)라 페이지가 닫혀도 나간다. */
  const flush = (path: string, useBeacon: boolean) => {
    const key = keyRef.current;
    if (!key) return;
    const body = JSON.stringify({
      key,
      path,
      clicks: clicksRef.current,
      pageviews: viewsRef.current,
      duration: Math.round((Date.now() - startedRef.current) / 1000),
    });
    clicksRef.current = [];   // 보낸 것은 비운다(다음 flush에서 중복되지 않게)
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      } else {
        void fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch { /* 수집 실패는 조용히 */ }
  };

  // ── ① 첫 진입: 유입 정보를 1회만 보낸다 ────────────────────────────────
  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    let key: string | null = null;
    try {
      key = sessionStorage.getItem(KEY_NAME);
      if (!key) {
        key = newKey();
        sessionStorage.setItem(KEY_NAME, key);
      }
    } catch {
      // 사생활 보호 모드 등으로 sessionStorage가 막히면 수집을 포기한다(임시 키를 만들지 않는다 —
      // 새로고침마다 새 방문으로 잡혀 숫자가 부풀기 때문).
      return;
    }
    keyRef.current = key;
    viewsRef.current = 1;

    const q = new URLSearchParams(window.location.search);
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        init: true,
        path: window.location.pathname,
        referrer: document.referrer || null,
        utm_source: q.get('utm_source'),
        utm_medium: q.get('utm_medium'),
        utm_campaign: q.get('utm_campaign'),
        device: window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop',
      }),
    }).catch(() => {});
  }, []);

  // ── ② 화면 이동: 지금 어디 있나 ──────────────────────────────────────
  useEffect(() => {
    if (!keyRef.current) return;
    // 첫 진입은 ①이 이미 보냈다 — 여기서 또 보내면 pageviews가 2부터 시작한다.
    if (viewsRef.current === 0) { viewsRef.current = 1; return; }
    viewsRef.current += 1;
    flush(pathname, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  // ── ③ 클릭 모으기 + 나갈 때 보내기 ───────────────────────────────────
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest('a, button, [data-track]');
      if (!el) return;
      clicksRef.current.push({
        t: labelOf(el),
        p: (el as HTMLAnchorElement).getAttribute?.('href') ?? window.location.pathname,
        at: new Date().toISOString(),
      });
      // 너무 쌓이기 전에 한 번 내보낸다 — 탭이 갑자기 죽어도 앞부분은 남는다.
      if (clicksRef.current.length >= 10) flush(window.location.pathname, false);
    };

    /*
      탭을 닫을 때는 'beforeunload'가 모바일에서 잘 안 뜬다(백그라운드로 넘어가며 그냥 죽는다).
      visibilitychange의 hidden이 훨씬 안정적이라 그걸 주로 쓰고, pagehide를 함께 건다.
    */
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush(window.location.pathname, true);
    };
    const onPageHide = () => flush(window.location.pathname, true);

    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('click', onClick, { capture: true } as EventListenerOptions);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
