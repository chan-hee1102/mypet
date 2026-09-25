/**
 * 차트 계산 — 라이브러리 없이 SVG로 그리기 위한 최소한의 척도·곡선 함수.
 * (taif.kr 관리자와 같은 계산. 차트가 단순해서 라이브러리(~100KB)를 들이지 않았다)
 */

/** 값 → 픽셀 */
export function linear(d0: number, d1: number, r0: number, r1: number) {
  return (v: number) => (d1 === d0 ? r0 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0));
}

/** y축 최댓값을 「보기 좋은」 수로 — 눈금 4칸이 정수로 떨어지게 */
export function niceMax(v: number, ticks = 4): number {
  if (!Number.isFinite(v) || v <= 0) return ticks;
  const raw = v / ticks;
  if (raw <= 1) return ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s >= n) ?? 10;
  return Math.ceil(step * pow) * ticks;
}

export function ticksOf(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => Math.round((max * i) / count));
}

/** 보기 좋은 축 숫자 — 1,200 → 1.2k */
export function shortNum(n: number): string {
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

/**
 * 단조 3차 곡선(monotoneX, Fritsch–Carlson) — 점을 지나며 넘치지 않는다(방문 수가 음수로 휘지 않게).
 * 점이 하나면 점, 둘이면 직선.
 */
export function monotonePath(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  if (n === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    dy.push(pts[i + 1][1] - pts[i][1]);
    m.push(dy[i] / (dx[i] || 1));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t.push(0);
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t.push((w1 + w2) / (w1 / m[i - 1] + w2 / m[i]));
    }
  }
  t.push(m[n - 2]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}
