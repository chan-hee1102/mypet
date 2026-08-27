'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * 랜딩(/)에서는 자식을 그리지 않는다 — 전역 앱바·푸터를 숨기는 데 쓴다.
 *
 * 왜 필요한가: 랜딩을 Bento 디자인(떠 있는 알약 내비 + 풀블리드 색 띠)으로 다시 만들었다.
 * 그 위에 기존 sticky 앱바가 겹치면 내비가 두 줄이 되고, 색 띠로 끝나는 리듬 뒤에 회색 푸터가
 * 붙으면 마무리가 깨진다. 랜딩은 자기 내비와 푸터를 스스로 들고 있다.
 *
 * ⚠️ 랜딩 **외의 모든 화면은 그대로다.** 앱(진단 폼·리포트·관리자)은 globals.css 위쪽의
 *    '토스 문법'을 쓰고 전역 앱바·푸터가 그 언어에 맞춰져 있다. 경로 하나만 예외로 둔다.
 */
export default function HideOnLanding({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <>{children}</>;
}
