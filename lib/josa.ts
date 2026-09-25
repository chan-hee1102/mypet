/**
 * 받침에 따라 조사를 고른다 — "포메라니안는"처럼 기계가 붙인 티가 나는 문장을 막는다.
 * 한글이 아닌 글자로 끝나면(숫자·영문) 받침 없는 쪽을 쓴다.
 */
export function hasBatchim(word: string): boolean {
  // 「믹스견(잡종)」처럼 괄호로 끝나면 괄호 앞 글자로 판단한다
  const c = word.trim().replace(/\s*\([^)]*\)$/, '').slice(-1).charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}

const PAIRS = {
  '은/는': ['은', '는'],
  '이/가': ['이', '가'],
  '을/를': ['을', '를'],
  '과/와': ['과', '와'],
  '이라면/라면': ['이라면', '라면'],
  '이에요/예요': ['이에요', '예요'],
} as const;

/** josa('포메라니안', '은/는') → '포메라니안은' */
export function josa(word: string, pair: keyof typeof PAIRS): string {
  const [withB, withoutB] = PAIRS[pair];
  return word + (hasBatchim(word) ? withB : withoutB);
}
