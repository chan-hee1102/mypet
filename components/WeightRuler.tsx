import type { CSSProperties } from 'react';

/**
 * 체중 눈금자 — 품종 표준 범위(녹색 띠) 위에 지금 체중을 바늘로 꽂는다.
 * 「몸무게 3.4kg, 적정」이라는 말보다 **범위 안의 어디쯤인지**가 한눈에 읽힌다.
 *
 * 눈금은 표준 범위의 절반~1.5배를 보여 준다. 그 밖의 값은 양 끝에 붙인다
 * (바늘이 눈금자 밖으로 나가면 오히려 잘못 읽힌다).
 * 눈금 간격은 **실제 kg 단위**(0.5·1·2·5kg 중 하나)로 찍는다 — 10% 간격은 가짜 정밀도처럼 보였다.
 *
 * ⚠️ 바늘은 서버에서 그릴 때부터 **제자리(현재 체중)**에 있다. 움직임은 CSS 애니메이션이
 *    왼쪽 끝에서 제자리로 한 번 보여 줄 뿐이다. 예전에는 스크립트가 뜬 뒤에야 바늘을 옮겨서,
 *    느린 폰에서는 바늘이 왼쪽 끝에 멈춰 **저체중처럼 잘못 읽혔다.**
 *    움직임 줄이기 설정이면 globals.css가 애니메이션을 끈다.
 */
function stepFor(span: number): number {
  for (const s of [0.5, 1, 2, 5, 10]) if (span / s <= 12) return s;
  return 20;
}

export default function WeightRuler({
  weight,
  range,
  animate = true,
  delayMs = 250,
}: {
  weight: number;
  range: [number, number];
  animate?: boolean;
  delayMs?: number;
}) {
  const [lo, hi] = range;
  const min = Math.max(0, lo * 0.5);
  const max = hi * 1.5;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  const x = pct(weight);
  const out = weight > hi * 1.05 || weight < lo * 0.95;

  const step = stepFor(max - min);
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) ticks.push(Number(t.toFixed(2)));

  // 바늘 위 숫자가 눈금자 밖으로 삐져나가지 않게 가장자리에서는 한쪽으로 붙인다
  const labelAlign = x > 86 ? 'is-right' : x < 14 ? 'is-left' : '';

  return (
    <div className="ruler" role="img" aria-label={`표준 ${lo}~${hi}kg 중 현재 ${weight}kg`}>
      <div className="ruler-track" />
      <div className="ruler-band" style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }} />
      {ticks.map((t) => (
        <span key={t} className="ruler-tick" style={{ left: `${pct(t)}%` }} />
      ))}
      <div
        className={`ruler-needle ${out ? 'is-warn' : ''} ${animate ? '' : 'is-static'}`}
        style={{ left: `${x}%`, ['--d' as string]: `${delayMs}ms` } as CSSProperties}
      >
        <span className={`ruler-now num ${labelAlign}`}>{weight}kg</span>
      </div>
      <span className="ruler-mark num" style={{ left: `${pct(lo)}%` }}>{lo}</span>
      <span className="ruler-mark num" style={{ left: `${pct(hi)}%` }}>{hi}</span>
    </div>
  );
}
