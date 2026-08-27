import breedData from './breedKnowledge.json';
import { TOXIC_FOODS, GOOD_FOODS, computeAge, lifeStage } from './petData';
import { SYMPTOMS, SYMPTOM_INFO, detectEmergency } from './symptomData';
import { weightCheck, stagePoint, neuterTip, parseWeightRange, humanAge } from './guidePersonal';
import type { CareCard, PetInput, Species } from './types';

/**
 * 데이터만으로 케어 카드를 만든다 — **API 호출 0회.**
 *
 * ⚠️ 왜 이렇게 바꿨나 (2026-08-28)
 *    예전에는 카드 10개 섹션을 **전부** 제미나이가 썼다. 그런데 그중 9개는 우리가 이미
 *    가진 데이터로 답할 수 있는 것들이었다 — 품종 특성·미용·운동·식단·연령 관리·루틴은
 *    188개 품종 데이터에 다 있고, 독성 식품과 접종 일정은 코드 안의 검증된 표에 있다.
 *    같은 답을 매번 돈 내고 생성하고 있었던 셈이고, 게다가 **생성할 때마다 조금씩 달라졌다**
 *    (같은 말티즈인데 어제와 오늘의 답이 다르면 그건 지식이 아니라 인상이다).
 *
 *    이제 제미나이는 **우리 데이터에 없는 것**에만 쓴다 — 보호자가 직접 적은 증상 같은 것.
 *    자세한 분기는 careAdvisor.ts 참고.
 *
 * ⚠️ 여기서 만드는 문장은 전부 **출처가 있는 사실**이거나 **입력값에서 계산한 값**이다.
 *    지어내지 않는다. 데이터에 없으면 그 항목을 비우고, 화면은 빈 항목을 그리지 않는다.
 *    (「모르는 것을 그럴듯하게 채우는 것」이 이 서비스에서 가장 큰 리스크다)
 */

type BreedRow = {
  breed_ko: string; breed_en: string; aliases?: string[]; species: Species;
  size?: string; weight_kg?: string; life_years?: string;
  source_org?: string; source_title?: string; source_url?: string;
  guide?: {
    summary?: string; traits?: string[]; grooming?: string[]; exercise?: string[];
    hereditary?: { name: string; note: string }[]; cautions?: string[];
  };
};
const BREEDS = breedData as BreedRow[];

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/** 품종 매칭 — 정확 일치 → 별칭 → 포함관계. (lib/diagnose.ts의 matchBreed와 같은 규칙) */
export function findBreed(species: Species, breed?: string | null): BreedRow | null {
  if (!breed) return null;
  const base = norm(breed.split(/[(,/·]/)[0]);
  if (base.length < 2) return null;
  const pool = BREEDS.filter((b) => b.species === species);
  for (const b of pool) {
    if (norm(b.breed_ko) === base || norm(b.breed_en) === base) return b;
    if ((b.aliases || []).some((a) => norm(a) === base)) return b;
  }
  for (const b of pool) {
    const ko = norm(b.breed_ko);
    if (ko.includes(base) || base.includes(ko)) return b;
  }
  return null;
}

/**
 * 크기별 하루 산책 시간 — 품종 데이터에 분 단위가 없어 크기에서 유도한다.
 * ⚠️ 범위로 적는다. 「30분」처럼 딱 떨어지는 숫자는 그 자체가 없는 정밀도를 주장하는 것이다.
 */
function walkMinutes(species: Species, size?: string): string {
  if (species === 'cat') return '실내 놀이 10~15분씩 하루 2~3회';
  switch (size) {
    case '초소형': return '20~30분';
    case '소형': return '30~40분';
    case '중형': return '40~60분';
    case '대형':
    case '초대형': return '60~90분';
    default: return '30~60분';
  }
}

/** 털 특성을 미용 문장에서 읽어 목욕·빗질 주기를 정한다. 근거가 없으면 일반 기준. */
function routineOf(species: Species, size: string | undefined, grooming: string[]): CareCard['routine'] {
  const g = grooming.join(' ');
  const daily = /매일|하루/.test(g);
  const double = /이중모|언더코트|털 빠짐|털빠짐/.test(g);
  return {
    bath: species === 'cat'
      ? '고양이는 스스로 그루밍하므로 목욕은 꼭 필요할 때만 (2~3개월에 1회 이내)'
      : '2~4주에 1회. 너무 잦으면 피부 보호막이 약해져요',
    walk: walkMinutes(species, size),
    grooming: daily ? '매일 빗질' : double ? '주 2~3회 빗질 (털갈이철엔 매일)' : '주 1~2회 빗질',
  };
}

/**
 * 종합 소견 — 규칙으로 정한다.
 * ⚠️ 증상이 있을 때 「괜찮다」고 말하지 않는다. 우리는 진료를 대체하지 않으므로,
 *    판단이 애매하면 항상 더 조심스러운 쪽(soon)으로 기운다.
 */
function buildVerdict(input: PetInput, symptomIds: string[], hasSymptomText: boolean): CareCard['verdict'] {
  const name = input.name || '우리 아이';
  const emergency = detectEmergency(symptomIds, input.notes ?? '');
  const anySymptom = symptomIds.length > 0 || hasSymptomText;

  if (emergency) {
    return {
      urgency: 'now',
      headline: '지금 병원에 연락해 주세요',
      summary: `${name}의 증상 중에 지체하면 위험할 수 있는 신호가 있어요. 이 리포트를 보기 전에 병원 연락이 먼저예요.`,
      todo: ['가까운 동물병원에 전화해 증상을 그대로 전달하세요', '이동 중에는 조용하고 어두운 환경을 유지해 주세요', '언제부터, 얼마나 자주인지 시간을 메모해 두세요'],
    };
  }
  if (anySymptom) {
    return {
      urgency: 'soon',
      headline: '집에서 관찰하되, 기준을 넘으면 병원으로',
      summary: `${name}의 증상은 집에서 지켜볼 수 있는 범위일 수 있어요. 다만 아래 '병원에 가야 하는 신호'에 하나라도 해당하면 미루지 마세요.`,
      todo: ['증상이 나타난 시각과 횟수를 기록해 주세요', '평소와 다른 점(밥·물·배변·활동량)을 함께 적어두면 진료가 빨라져요', '아래 판별 기준을 먼저 확인하세요'],
    };
  }
  return {
    urgency: 'routine',
    headline: '지금은 예방 관리에 집중할 때예요',
    summary: `${name}에게 당장 급한 신호는 없어요. 품종·나이에 맞춘 아래 관리 항목을 꾸준히 챙기는 것이 가장 효과가 큽니다.`,
    todo: ['아래 주간 관리 항목을 한 가지씩 시작해 보세요', '정기 검진 주기를 달력에 미리 넣어두세요', '체중을 주기적으로 기록하면 변화를 일찍 알 수 있어요'],
  };
}

/**
 * 선택형 증상에 대한 답 — SYMPTOM_INFO(검증된 표)에서 그대로 가져온다.
 * 보호자가 **직접 적은** 증상은 여기서 답하지 않는다(careAdvisor가 제미나이에 맡긴다).
 */
function answerFromTable(symptomIds: string[]): CareCard['symptomAnswer'] | undefined {
  const known = symptomIds.filter((id) => SYMPTOM_INFO[id]);
  if (known.length === 0) return undefined;
  const causes: string[] = [];
  const goNow: string[] = [];
  for (const id of known) {
    const info = SYMPTOM_INFO[id];
    const label = SYMPTOMS.find((s) => s.id === id)?.label ?? id;
    causes.push(`${label} — ${info.causes}`);
    goNow.push(`${label}: ${info.vet}`);
  }
  return {
    causes,
    careNow: [
      '증상이 나타난 시각·횟수·지속 시간을 적어두세요',
      '밥과 물을 평소만큼 먹는지 확인해 주세요',
      '토하거나 설사한 경우, 사진을 찍어두면 진료 때 도움이 돼요',
    ],
    goNow,
    homeCheck: [
      '잇몸 색이 분홍색인지 (창백하거나 푸르면 즉시 병원)',
      '호흡 수 — 편히 쉴 때 1분에 몇 번인지',
      '평소와 비교한 활동량·식욕 변화',
    ],
    vetPrep: {
      tests: '증상에 따라 신체검사·혈액검사·영상검사(X-ray/초음파)가 진행될 수 있어요.',
      script: '언제부터 시작됐고, 하루에 몇 번, 얼마나 지속되는지 — 이 세 가지를 먼저 말씀하시면 진료가 빨라집니다.',
    },
  };
}

/**
 * 데이터만으로 카드를 만든다.
 * symptomAnswer는 표에서 답할 수 있을 때만 채워지고, 나머지는 careAdvisor가 이어 붙인다.
 */
export function buildCardFromData(input: PetInput, symptomIds: string[] = []): CareCard {
  const b = findBreed(input.species, input.breed);
  const g = b?.guide ?? {};
  const age = computeAge(input.birth);
  const stage = age ? lifeStage(input.species, age.months) : '성장 단계 미상';
  const hasText = !!(input.notes && input.notes.trim().length > 1);

  // 연령 관리 — 계산으로 나오는 사실(체중 판정·단계·중성화)만 담는다.
  const ageTips: string[] = [];
  const breedKo = b?.breed_ko ?? (input.breed ?? '이 품종');
  const wc = weightCheck({
    name: input.name, breedKo, weight: input.weightKg,
    range: parseWeightRange(b?.weight_kg),
    // 무릎 질환이 호발 목록에 있으면 체중 안내에 그 이유를 함께 적는다.
    jointRisk: (b?.guide?.hereditary ?? []).some((h) => /슬개골|관절|고관절/.test(h.name)),
  });
  if (wc) ageTips.push(`${wc.title} — ${wc.body}`);
  if (age) {
    const sp = stagePoint({
      species: input.species, months: age.months, breedKo,
      topDisease: b?.guide?.hereditary?.[0]?.name,
      personAge: humanAge(input.species, age.months, b?.size),
    });
    if (sp) ageTips.push(`${sp.title} — ${sp.body}`);
  }
  const nt = neuterTip({ species: input.species, sex: input.sex, neutered: input.neutered });
  if (nt) ageTips.push(`${nt.title} — ${nt.body}`);
  if (b?.life_years) ageTips.push(`이 품종의 평균 수명은 ${b.life_years}년으로 알려져 있어요. 정기 검진 주기를 이 기준에 맞춰 잡으면 좋아요.`);

  const hereditary = g.hereditary ?? [];
  const grooming = g.grooming ?? [];

  return {
    verdict: buildVerdict(input, symptomIds, hasText),
    symptomAnswer: answerFromTable(symptomIds),

    breedTraits: {
      summary: g.summary
        ?? (b ? `${b.breed_ko}는 ${b.size ?? ''} 품종이에요.` : '입력하신 품종 정보를 확인하지 못해 일반 기준으로 안내해요.'),
      // 호발 질환은 '이름 — 설명'으로 붙여 근거를 함께 보여준다.
      healthRisks: hereditary.map((h) => `${h.name} — ${h.note}`),
    },

    grooming: {
      summary: grooming[0] ?? '주기적인 빗질과 발톱·귀 관리가 기본이에요.',
      cautions: grooming.slice(1),
    },

    exercise: {
      summary: g.exercise?.[0] ?? '매일 규칙적인 산책과 놀이가 필요해요.',
      walkMinutesPerDay: walkMinutes(input.species, b?.size),
      cautions: (g.exercise ?? []).slice(1),
    },

    food: {
      goodFoods: GOOD_FOODS[input.species] ?? [],
      // 품종 주의사항 중 식이·비만과 관련된 것만 골라 온다. 없으면 비운다(지어내지 않는다).
      cautionFoods: (g.cautions ?? []).filter((c) => /비만|체중|사료|급여|식이|치아|치주/.test(c)),
    },

    ageCare: { stage, tips: ageTips },
    routine: routineOf(input.species, b?.size, grooming),

    // 병원에 가야 하는 신호 — 품종 호발 질환 + 종 공통 응급 신호
    redFlags: [
      ...hereditary.slice(0, 3).map((h) => `${h.name} 관련 증상(${h.note.replace(/입니다\.$/, '')})이 보이면 진료를 받아보세요`),
      '잇몸이 창백하거나 푸르게 보일 때',
      '호흡이 가쁘거나 혀를 길게 빼고 힘들어할 때',
      '24시간 이상 아무것도 먹지 않을 때',
      '반복해서 토하거나 혈변·검은 변이 보일 때',
    ],

    // 출처를 함께 싣는다 — 「어디서 온 정보인가」가 이 리포트의 신뢰 근거다.
    sources: b?.source_org
      ? [{ org: b.source_org, title: b.source_title ?? null, url: b.source_url ?? null }]
      : undefined,
  };
}

/** 이 종에서 절대 주면 안 되는 음식 — 검증된 표에서 그대로. 화면이 별도 블록으로 그린다. */
export function toxicFoodsFor(species: Species) {
  return TOXIC_FOODS[species] ?? [];
}
