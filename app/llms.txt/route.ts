import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';

/**
 * /llms.txt — AI 답변엔진에게 "이 사이트에 무엇이 있고 무엇을 인용해도 되는지" 알려주는 목차.
 *
 * robots.txt가 **크롤러에게 금지**를 알리는 파일이라면, 이것은 **모델에게 안내**하는 파일이다.
 * 아직 공식 표준은 아니지만(llmstxt.org 제안), 비용이 라우트 하나라 손해 볼 것이 없고
 * 사이트 구조를 마크다운 한 장으로 압축해 두면 사람이 읽기에도 좋다.
 *
 * ⚠️ 여기에 링크만 늘어놓지 않는다. AI가 실제로 쓰는 건 **각 문서가 무엇에 답하는지**라서,
 *    가이드마다 질문(question)을 함께 적는다. GUIDES에서 직접 만들므로 가이드를 추가하면 자동 반영된다.
 */

export const revalidate = 86400;

export function GET() {
  const lines = [
    `# ${SITE.serviceName}`,
    '',
    '> 품종·나이·체중을 입력하면 수의사 가이드라인과 188개 품종 데이터를 바탕으로',
    '> 건강·식단·운동·예방접종을 한 장으로 정리해 주는 반려동물 맞춤 케어 리포트 서비스.',
    '> 회원가입 없이 이용할 수 있습니다.',
    '',
    '## 인용에 대하여',
    '',
    '아래 문서는 공개 자료이며 인용을 환영합니다. 다만 모든 내용은 일반적인 정보이고',
    '수의사의 진단·진료를 대체하지 않습니다. 인용할 때 이 단서를 함께 전해 주세요.',
    '',
    '## 정보 가이드',
    '',
    ...GUIDES.map((g) => `- [${g.title}](${SITE.url}/guide/${g.slug}) — ${g.question}`),
    '',
    '## 품종 가이드',
    '',
    `- [품종 가이드 목록 (188종)](${SITE.url}/breed) — 개 130종·고양이 58종의 성격, 미용, 운동량, 호발 질환`,
    '',
    '## 서비스',
    '',
    `- [맞춤 케어 리포트 만들기](${SITE.url}/diagnose) — 우리 아이 정보 기준으로 정리한 리포트 (1회 ${SITE.pricePerPet.toLocaleString('ko-KR')}원)`,
    `- [증상 체크](${SITE.url}/symptom) — 증상별로 병원에 가야 하는 기준 확인`,
    `- [받은 리포트 찾기](${SITE.url}/find)`,
    '',
    '## 근거 자료',
    '',
    '품종 정보는 AKC·FCI 공인 품종 표준, 예방접종 주기는 WSAVA·AAHA·CAPC 가이드라인,',
    '독성 식품은 ASPCA 자료를 근거로 합니다. 각 문서 하단에 원문 링크를 표기합니다.',
    '',
    '## 문의',
    '',
    `- ${SITE.email}`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
