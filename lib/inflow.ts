/**
 * 유입 경로(referrer)를 채널 하나로 요약한다.
 *
 * 왜 lib으로 빼나: 이 분류가 틀리면 '어디서 사람이 오는가'라는 판단이 통째로 틀어진다.
 * 화면 안에 숨어 있으면 검증할 방법이 없다.
 *
 * ※ 같은 팀의 kostock 프로젝트에서 이미 값을 치른 판정들을 옮겨왔다. 아래 ⚠️ 표시는
 *   전부 그쪽에서 **실제로 통계를 틀리게 만들었던** 함정이다.
 *   mypet은 로그인이 없어 kostock의 「로그인 복귀」(OAuth 복귀를 구글 유입으로 세던 문제)
 *   갈래만 빼고 나머지는 그대로 쓴다.
 */

/**
 * 생성형 AI 답변에서 온 유입 — ChatGPT·퍼플렉시티 등이 답에 우리 페이지를 걸어 사람이 눌러 들어온 것.
 *
 * 왜 한 채널로 묶나: 서비스별로 두면 chatgpt.com·perplexity.ai·gemini.google.com이 각각
 * 다른 줄로 흩어져 **'AI 답변에서 얼마나 오는가'라는 숫자 자체가 만들어지지 않는다.**
 * 검색(순위 싸움)과 AI 인용(문서가 답의 재료가 되는 것)은 늘리는 방법이 아예 달라서
 * 합계가 먼저 보여야 한다. 어느 AI였는지는 방문 상세의 referrer 원문에 그대로 남는다.
 *
 * ⚠️ 반드시 CHANNELS(검색·소셜)보다 **먼저** 판정한다 — gemini.google.com은 `includes('google')`에
 *    걸려 '구글'(검색)로 둔갑한다.
 *
 * ⚠️ 부분일치를 쓰지 않고 **호스트 전체/서브도메인으로만** 맞춘다. 'you.com' 같은 짧은 이름을
 *    includes로 재면 관계없는 도메인(예: thankyou.com)이 AI로 잡힌다.
 *
 * 빙 코파일럿(edgeservices.bing.com)은 일부러 넣지 않았다 — 일반 빙 검색과 호스트가 겹쳐
 * 넣는 순간 검색 유입이 AI로 새기 시작한다. 빙은 '빙'으로 남긴다.
 */
const AI_ANSWER_HOSTS = [
  'chatgpt.com',
  'openai.com',            // chat.openai.com(구 주소) 포함
  'perplexity.ai',
  'claude.ai',
  'gemini.google.com',
  'copilot.microsoft.com',
  'you.com',
  'poe.com',
];

/** 호스트가 그 도메인이거나 그 하위 도메인인가. (부분일치와 달리 우연한 겹침이 없다) */
function isHost(host: string, domain: string): boolean {
  return host === domain || host.endsWith('.' + domain);
}

/**
 * 우리 개발 환경에서 온 것 — 유입이 아니라 **우리 자신**이다.
 * 조용히 버리지 않고 이름을 붙이는 이유: 버리면 나중에 '왜 방문 수가 안 맞지'를 다시 조사하게 된다.
 */
const DEV_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

/** 사설망 주소(같은 공유기 안의 다른 기기에서 접속) — 이것도 우리 쪽이다. */
function isPrivateHost(host: string): boolean {
  return /^10\./.test(host)
    || /^192\.168\./.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

/**
 * 짧은 도메인은 **정확일치**로만 판정한다.
 *
 * ⚠️ kostock에서 실제로 그랬다: 'X'가 `t.co`를 부분일치로 재고 있어서
 *    `chatgpt.com`(chatgp**t.co**m) · `mt.co.kr`(머니투데이)가 전부 트위터 유입으로 집계됐다.
 *    `t.co`처럼 짧은 도메인은 어떤 이름 안에든 우연히 들어간다.
 */
const EXACT_CHANNELS: ReadonlyArray<readonly [string[], string]> = [
  [['t.co', 'twitter.com', 'x.com'], 'X'],
];

/**
 * 검색·소셜 채널 — 앞에서부터 먼저 맞는 것을 쓴다.
 * 여기 있는 것들은 **브랜드 낱말**이라 부분일치가 맞다
 * (search.naver.com · www.google.co.kr · m.search.daum.net처럼 서브도메인·국가코드가 제각각이다).
 * ⚠️ 새 채널이 낱말이 아니라 **짧은 도메인이면 EXACT_CHANNELS에 넣을 것.**
 */
const CHANNELS: ReadonlyArray<readonly [string[], string]> = [
  [['naver'], '네이버'],
  [['google'], '구글'],
  [['daum'], '다음'],
  [['kakao'], '카카오'],
  [['bing'], '빙'],
  [['instagram'], '인스타그램'],
  [['facebook'], '페이스북'],
  [['youtube'], '유튜브'],
  [['tiktok'], '틱톡'],
  [['threads'], '스레드'],
  [['mypet.taif.kr'], '내부 이동'],
];

/**
 * referrer(+utm_source)를 채널 이름 하나로.
 * 판정 순서가 곧 정확도다 — 좁은 판정이 넓은 판정보다 **먼저** 와야 한다.
 */
export function inflowChannel(referrer: string | null, utmSource?: string | null): string {
  // UTM이 있으면 그게 우선 — 우리가 직접 붙인 태그라 referrer보다 정확하다.
  if (utmSource) return utmSource;
  if (!referrer) return '직접 유입';

  let host = referrer;
  try { host = new URL(referrer).hostname; } catch { /* 파싱 실패 → 원문 앞부분 */ }
  const h = host.toLowerCase();

  // 우리 개발 환경이 방문자로 둔갑하지 않게 가장 먼저 걸러낸다.
  if (DEV_HOSTS.includes(h) || isPrivateHost(h)) return '개발 환경';

  // ⚠️ 채널 매칭보다 먼저 — gemini.google.com이 '구글'로 새는 걸 막는다.
  if (AI_ANSWER_HOSTS.some((d) => isHost(h, d))) return 'AI 답변';

  // 정확일치가 부분일치보다 먼저 — 좁은 판정을 넓은 판정 앞에 둔다.
  for (const [domains, label] of EXACT_CHANNELS) {
    if (domains.some((d) => isHost(h, d))) return label;
  }
  for (const [needles, label] of CHANNELS) {
    if (needles.some((n) => h.includes(n))) return label;
  }
  return host.replace(/^www\./, '');
}

/** 경로를 사람이 읽게 — 퍼센트 인코딩된 한글이 '/breed/%ED%92%88%EC%A2%85'로 찍히면 못 알아본다. */
export function prettyPath(path: string | null): string {
  if (!path) return '(알 수 없음)';
  try { return decodeURIComponent(path); } catch { return path; }
}
