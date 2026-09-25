'use client';

import { useEffect, useRef, useState } from 'react';

/** 요소의 실제 폭(px) — 차트 viewBox를 실제 크기로 잡아 글자가 늘어나지 않게 한다 */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
