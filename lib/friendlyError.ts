/**
 * 기술적 오류를 사용자 문구로 변환 (클라이언트 전용).
 * - 우리가 만든 한국어 메시지는 그대로 통과
 * - "Failed to fetch", "Unexpected token" 같은 영어 원문은 상황별 한국어로 대체
 */
export function friendlyError(err: unknown, fallback: string): string {
  const m = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (m && /[가-힣]/.test(m)) return m; // 한국어 메시지(서버/우리 코드 생성)는 신뢰
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return '인터넷 연결이 끊겨 있어요. 연결을 확인하고 다시 시도해 주세요.';
  }
  if (/fetch|network|load failed/i.test(m)) {
    return '서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }
  return fallback;
}
