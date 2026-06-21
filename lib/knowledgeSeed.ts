import { Species } from './types';

/**
 * RAG 지식베이스 시드 — 검증된 수의 가이드라인 요약.
 *
 * ⚠️ 원칙
 *  - 신뢰 가능한 기관(WSAVA/AAHA/AVMA/ASPCA/CAPC/대한수의사회 등)의 널리 합의된 일반 지침만 담는다.
 *  - 진단/처방이 아닌 '보호자용 일반 가이드'. 구체 수치는 보수적으로.
 *  - 이 시드는 출발점이다. 운영하며 출처·내용을 검토·확장할 것.
 *
 * 적재: /admin → "지식베이스 적재/갱신" 버튼 (embed 후 knowledge 테이블에 저장).
 */

export type KnowledgeSeed = {
  species: Species | 'both';
  topic: string;
  content: string;
  source_org: string;
  source_title?: string;
  source_url?: string;
};

export const KNOWLEDGE_SEED: KnowledgeSeed[] = [
  // ── 예방접종 ──────────────────────────────────────────────
  {
    species: 'dog',
    topic: '예방접종',
    content:
      '강아지 코어 백신은 DAP(디스템퍼/홍역, 아데노바이러스/간염, 파보바이러스)입니다. 보통 생후 6~8주에 시작해 16주령 이후까지 2~4주 간격으로 접종합니다. 마지막 퍼피 접종 후 6~12개월에 1차 추가접종을 하고, 이후에는 3년마다 재접종이 권장됩니다.',
    source_org: 'WSAVA',
    source_title: 'Vaccination Guidelines for Dogs and Cats',
    source_url: 'https://wsava.org',
  },
  {
    species: 'dog',
    topic: '예방접종',
    content:
      '광견병 백신은 법적으로 필수이며 지역 규정에 따라 접종 주기를 지켜야 합니다. 켄넬코프(보데텔라·파라인플루엔자), 렙토스피라 등은 생활 환경과 노출 위험에 따라 선택 접종하는 논코어 백신입니다.',
    source_org: 'AAHA',
    source_title: 'Canine Vaccination Guidelines',
    source_url: 'https://www.aaha.org',
  },
  {
    species: 'cat',
    topic: '예방접종',
    content:
      '고양이 코어 백신은 FVRCP(허피스바이러스1/바이러스성 비기관염, 칼리시바이러스, 범백혈구감소증/파보)입니다. 생후 6~8주에 시작해 16주령 이후까지 3~4주 간격으로 접종하고, 이후 추가접종과 정기 재접종을 합니다.',
    source_org: 'WSAVA',
    source_title: 'Vaccination Guidelines for Dogs and Cats',
    source_url: 'https://wsava.org',
  },
  {
    species: 'cat',
    topic: '예방접종',
    content:
      '고양이 백혈병바이러스(FeLV) 백신은 1년 미만 어린 고양이와 외출·다묘 환경 고양이에게 특히 권장됩니다. 광견병 백신은 지역 규정에 따라 접종합니다.',
    source_org: 'AAFP',
    source_title: 'Feline Vaccination Guidelines',
    source_url: 'https://catvets.com',
  },

  // ── 기생충 예방 ───────────────────────────────────────────
  {
    species: 'both',
    topic: '심장사상충',
    content:
      '심장사상충은 모기를 매개로 감염되며 강아지·고양이 모두 위험합니다. 감염 후 치료는 위험하고 비용이 크므로 예방이 핵심입니다. 월 1회 예방약을 연중 꾸준히 투여하는 것이 권장됩니다.',
    source_org: 'CAPC',
    source_title: 'Heartworm Guidelines',
    source_url: 'https://capcvet.org',
  },
  {
    species: 'both',
    topic: '내부기생충',
    content:
      '어린 동물은 내부기생충(회충·구충 등) 감염이 흔해 어릴 때 2주 간격으로 반복 구충하고, 성체는 분변검사 결과에 따라 정기적으로 구충합니다. 일부 기생충은 사람에게도 전파될 수 있어 위생 관리가 중요합니다.',
    source_org: 'CAPC',
    source_title: 'Intestinal Parasite Guidelines',
    source_url: 'https://capcvet.org',
  },
  {
    species: 'both',
    topic: '외부기생충',
    content:
      '벼룩과 진드기는 월 1회 예방제로 관리합니다. 진드기는 바베시아·라임병 등 질병을 옮길 수 있으므로 야외 활동 후 몸을 살펴 제거하는 것이 좋습니다.',
    source_org: 'CAPC',
    source_title: 'Flea and Tick Guidelines',
    source_url: 'https://capcvet.org',
  },

  // ── 영양 ─────────────────────────────────────────────────
  {
    species: 'both',
    topic: '영양',
    content:
      '성장기(퍼피·키튼)는 성장 단계 전용 사료로 충분한 단백질과 균형 잡힌 영양을 공급해야 합니다. 사료는 AAFCO 등 공인 영양 기준을 충족하는 "완전·균형식(complete and balanced)"인지 확인하는 것이 좋습니다.',
    source_org: 'WSAVA',
    source_title: 'Global Nutrition Guidelines',
    source_url: 'https://wsava.org',
  },
  {
    species: 'dog',
    topic: '영양',
    content:
      '대형견 강아지는 성장기에 칼슘·열량이 과하면 정형외과적 발달 문제 위험이 있어 대형견 성장기 전용 사료가 권장됩니다. 급격한 체중 증가보다 완만한 성장이 관절 건강에 유리합니다.',
    source_org: 'WSAVA',
    source_title: 'Global Nutrition Guidelines',
    source_url: 'https://wsava.org',
  },
  {
    species: 'cat',
    topic: '영양',
    content:
      '고양이는 절대적 육식동물로 타우린 등 동물성 영양소가 필수입니다. 개 사료에는 타우린이 부족해 고양이에게 적합하지 않으므로 반드시 고양이 전용식을 급여해야 합니다.',
    source_org: 'Cornell Feline Health Center',
    source_title: 'Feeding Your Cat',
    source_url: 'https://www.vet.cornell.edu',
  },
  {
    species: 'both',
    topic: '사료전환',
    content:
      '사료를 바꿀 때는 소화기 적응을 위해 5~7일에 걸쳐 기존 사료에 새 사료 비율을 점진적으로 늘리며 전환합니다. 급격한 전환은 구토·설사를 유발할 수 있습니다.',
    source_org: 'WSAVA',
    source_title: 'Global Nutrition Guidelines',
    source_url: 'https://wsava.org',
  },

  // ── 체중·비만 ─────────────────────────────────────────────
  {
    species: 'both',
    topic: '체중관리',
    content:
      '신체충실지수(BCS, 9단계)에서 4~5점이 이상적입니다. 갈비뼈가 과한 지방 없이 만져지고 위에서 봤을 때 허리선이 보이는 상태가 적정 체중입니다. 비만은 당뇨·관절염·심장 부담·수명 단축과 연관됩니다.',
    source_org: 'WSAVA',
    source_title: 'Body Condition Score',
    source_url: 'https://wsava.org',
  },

  // ── 치아 ─────────────────────────────────────────────────
  {
    species: 'both',
    topic: '치아관리',
    content:
      '치주질환은 3세 이상 반려동물에서 매우 흔합니다. 매일 반려동물 전용 칫솔·치약으로 양치하는 것이 가장 효과적이며, 수의사의 정기 구강검진과 필요 시 스케일링이 권장됩니다. 사람 치약은 사용하지 않습니다.',
    source_org: 'AVMA',
    source_title: 'Pet Dental Care',
    source_url: 'https://www.avma.org',
  },

  // ── 중성화 ───────────────────────────────────────────────
  {
    species: 'both',
    topic: '중성화',
    content:
      '중성화는 자궁축농증, 유선·생식기 종양 등 일부 질환 위험을 낮추고 원치 않는 번식·행동 문제를 줄이는 데 도움이 됩니다. 다만 적절한 시기는 품종·크기·성별에 따라 다르므로 수의사와 상담해 결정합니다(특히 대형견은 시기를 늦추기도 합니다).',
    source_org: 'AVMA',
    source_title: 'Spaying and Neutering',
    source_url: 'https://www.avma.org',
  },

  // ── 그루밍 ───────────────────────────────────────────────
  {
    species: 'dog',
    topic: '그루밍',
    content:
      '포메라니안·시베리안허스키 같은 더블코트 견종은 피부에 바짝 미는 클리핑 시 모질이 거칠어지거나 재성장이 잘 안 되는 문제(클리퍼 알로페시아)가 생길 수 있습니다. 클리핑보다 규칙적인 빗질과 언더코트 제거로 관리하는 것이 권장됩니다.',
    source_org: '대한수의사회',
    source_title: '반려동물 그루밍 일반 지침',
    source_url: 'https://www.kvma.or.kr',
  },
  {
    species: 'cat',
    topic: '그루밍',
    content:
      '고양이는 스스로 그루밍하지만 장모종은 매일 빗질로 엉킴과 헤어볼을 예방하는 것이 좋습니다. 과도한 그루밍이나 탈모는 스트레스·피부질환 신호일 수 있어 관찰이 필요합니다.',
    source_org: 'Cornell Feline Health Center',
    source_title: 'Grooming',
    source_url: 'https://www.vet.cornell.edu',
  },

  // ── 응급 신호 ─────────────────────────────────────────────
  {
    species: 'both',
    topic: '응급신호',
    content:
      '다음은 즉시 병원 방문이 필요한 응급 신호입니다: 호흡곤란, 잇몸이 창백하거나 푸른색, 반복적인 구토·설사(특히 혈변), 24시간 이상 식음 거부, 배뇨 곤란, 발작, 의식 저하, 심한 복부 팽만.',
    source_org: 'AVMA',
    source_title: 'Emergency Care',
    source_url: 'https://www.avma.org',
  },
  {
    species: 'cat',
    topic: '응급신호',
    content:
      '수컷 고양이가 화장실에서 힘을 주지만 소변을 보지 못하는 경우 요도폐색일 수 있으며, 수 시간 내 생명을 위협하는 응급 상황입니다. 즉시 동물병원에 가야 합니다.',
    source_org: 'Cornell Feline Health Center',
    source_title: 'Feline Lower Urinary Tract Disease',
    source_url: 'https://www.vet.cornell.edu',
  },
  {
    species: 'dog',
    topic: '응급신호',
    content:
      '대형견·흉심부가 깊은 견종에서 배가 빵빵하게 부풀고 헛구역질을 반복하며 침을 흘리고 안절부절못하면 위확장염전(GDV)일 수 있는 응급 상황입니다. 즉시 병원에 가야 합니다.',
    source_org: 'AVMA',
    source_title: 'Bloat (GDV)',
    source_url: 'https://www.avma.org',
  },

  // ── 독성 (검증 데이터 보강) ───────────────────────────────
  {
    species: 'both',
    topic: '독성식품',
    content:
      '초콜릿·카페인, 포도·건포도, 양파·마늘·파속 채소, 알코올, 자일리톨(주로 개), 마카다미아(개)는 반려동물에게 중독을 일으킬 수 있는 대표적 위험 식품입니다. 의심 섭취 시 즉시 수의사 또는 동물 중독관리에 연락합니다.',
    source_org: 'ASPCA',
    source_title: 'People Foods to Avoid Feeding Your Pets',
    source_url: 'https://www.aspca.org/pet-care/animal-poison-control',
  },
  {
    species: 'cat',
    topic: '독성식물',
    content:
      '백합(Lily)류는 고양이에게 매우 위험해 꽃가루나 꽃병 물 같은 소량 노출로도 치명적인 급성 신부전을 일으킬 수 있습니다. 고양이가 있는 집에는 백합을 두지 않는 것이 안전합니다.',
    source_org: 'ASPCA',
    source_title: 'Toxic and Non-Toxic Plants',
    source_url: 'https://www.aspca.org/pet-care/animal-poison-control',
  },

  // ── 수분·환경 (고양이) ────────────────────────────────────
  {
    species: 'cat',
    topic: '수분섭취',
    content:
      '고양이는 갈증 감각이 둔해 만성적으로 수분이 부족하기 쉽습니다. 습식사료 급여와 신선한 식수 접근성을 높이면 하부요로질환·만성신장병 관리에 도움이 됩니다. 화장실은 고양이 수보다 하나 더 두는 것이 권장됩니다(N+1).',
    source_org: 'AAFP',
    source_title: 'Environmental Needs Guidelines',
    source_url: 'https://catvets.com',
  },

  // ── 노령 케어 ─────────────────────────────────────────────
  {
    species: 'both',
    topic: '노령케어',
    content:
      '노령기(소형견·고양이는 약 7세 이상, 대형견은 더 이른 시기)에는 6~12개월마다 건강검진과 혈액·소변검사로 신장·간·갑상선·관절 상태를 점검하는 것이 권장됩니다. 조기 발견이 관리에 중요합니다.',
    source_org: 'AAHA',
    source_title: 'Senior Care Guidelines',
    source_url: 'https://www.aaha.org',
  },

  // ── 운동 (단두종) ─────────────────────────────────────────
  {
    species: 'both',
    topic: '운동',
    content:
      '불독·퍼그·페르시안 같은 단두종(코가 짧은 품종)은 더위와 격한 운동에 호흡곤란이 오기 쉽습니다. 시원한 시간대에 짧고 가벼운 운동을 하고, 한낮의 무더위·과격한 활동은 피해야 합니다.',
    source_org: 'AVMA',
    source_title: 'Brachycephalic Breeds',
    source_url: 'https://www.avma.org',
  },
];
