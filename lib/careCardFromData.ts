import breedData from './breedKnowledge.json';
import { TOXIC_FOODS, GOOD_FOODS, computeAge, lifeStage } from './petData';
import { SYMPTOMS, symptomInfo, detectEmergency } from './symptomData';
import { weightCheck, stagePoint, neuterTip, parseWeightRange, humanAge } from './guidePersonal';
import { defaultSchedules } from './careSchedule';
import type { CareCard, PetInput, Species } from './types';
import { activityFactor } from './energy';

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

/** 로컬 기준 YYYY-MM-DD. toISOString은 UTC라 한국에서 하루 밀릴 수 있어 쓰지 않는다. */
function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 프로필 배지 라벨 — 판정 로직은 guidePersonal/buildVerdict에 있고 여기선 한 단어로만 옮긴다. */
const BODY_LABEL: Record<'ok' | 'warn' | 'info', string> = {
  ok: '적정', warn: '과체중 주의', info: '가벼운 편',
};
const HEALTH_LABEL: Record<'now' | 'soon' | 'routine', string> = {
  now: '진료 권장', soon: '관찰 필요', routine: '입력한 증상 없음',
};

/** "남아 · 중성화" 표기. 모르는 항목은 적지 않는다. */
function sexLabel(input: PetInput): string | undefined {
  const sex = input.sex === 'male' ? '수컷' : input.sex === 'female' ? '암컷' : null;
  const neuter = input.neutered === true ? '중성화' : input.neutered === false ? '중성화 전' : null;
  if (!sex && !neuter) return undefined;
  return [sex, neuter].filter(Boolean).join(', ');
}

/**
 * 하루 급여 기준 — **RER × 활동계수**로 계산한다. 체중을 모르면 g수 없이 원칙만 남긴다.
 *
 * ⚠️ 처음에는 "체중의 2~3%"로 계산했다가 갈아엎었다. 그 어림값은 **생식(생고기) 기준**이고
 *    건사료에 그대로 쓰면 크게 빗나간다. 38kg 리트리버에게 하루 760~1140g이 나왔는데
 *    실제 필요량은 500g 안팎이다 — 두 배를 먹이라고 적는 셈이었다.
 *    게다가 에너지 요구량은 체중에 **비례하지 않는다.** 큰 동물일수록 kg당 필요 열량이 적어서
 *    선형 비율은 소형견에선 맞는 듯 보여도 대형견에서 반드시 깨진다.
 *
 *    그래서 수의영양의 표준식을 쓴다:
 *      RER(휴식기 에너지) = 70 × 체중^0.75 kcal/일
 *      MER(하루 필요량)   = RER × 활동계수 (중성화·나이·성장기에 따라 다름)
 *      급여량(g)          = MER ÷ 사료 1g당 kcal
 *
 *    사료 열량 밀도는 제품마다 3.5~4.0 kcal/g로 갈리므로 **g은 범위로** 낸다.
 *    kcal을 함께 적는 이유도 같다 — 포장지에는 "kcal/kg"이 찍혀 있어서, 열량을 알면
 *    보호자가 자기 사료 기준으로 정확히 환산할 수 있다.
 */
function feedingPlan(
  species: Species, weightKg?: number, months?: number | null, neutered?: boolean, size?: string | null,
): CareCard['feeding'] {
  const meals = species === 'cat'
    ? '하루 2회 이상 나눠서 (자율급식이면 총량만 정해두기)'
    : '하루 2회로 나눠서';
  const notes = [
    '하루 열량을 사료 포장지의 kcal/kg 값으로 나누고 1,000을 곱하면, 지금 먹이는 사료 기준 g수가 나와요.',
    '간식은 하루 전체 열량의 10%를 넘지 않게 해주세요.',
    species === 'cat'
      ? '고양이는 물을 잘 안 마셔요. 습식사료를 섞으면 수분 섭취에 도움이 돼요.'
      : '깨끗한 물은 항상 마실 수 있게 두세요.',
  ];
  if (!weightKg || !Number.isFinite(weightKg) || weightKg <= 0) return { meals, notes };

  const rer = 70 * Math.pow(weightKg, 0.75);
  const factor = activityFactor(species, months, neutered, size);
  const kcal = rer * factor;
  // 건사료 열량 밀도의 통상 범위(3.5~4.0 kcal/g). 열량이 높은 사료일수록 g수는 적어진다.
  const hi = Math.round(kcal / 3.5 / 5) * 5;
  const lo = Math.round(kcal / 4.0 / 5) * 5;
  return {
    dailyKcal: `약 ${Math.round(kcal / 10) * 10} kcal`,
    // 작은 체구는 두 값이 5g 단위로 같아진다 — 「30~30g」 대신 「약 30g」
    dailyGram: lo === hi ? `약 ${lo}g` : `${lo}~${hi}g`,
    meals,
    notes,
  };
}


/**
 * 이번 주 실천 항목 — 루틴·미용·운동에서 **짧은 동사구**로 뽑는다.
 * 요일 체크박스로 그릴 것이라 문장이 길면 표가 무너진다. 그래서 원문을 그대로 쓰지 않고 요약한다.
 */
function weeklyItems(species: Species, routine: CareCard['routine'], grooming: string[], exercise: string[]): string[] {
  const g = grooming.join(' ');
  const items = [
    routine.grooming,                                    // "매일 빗질" 등
    species === 'cat' ? '놀이 시간 갖기' : `산책 ${routine.walk}`,
    '치아 닦기 (또는 덴탈껌)',
    '발톱·귀·발바닥 확인',
  ];
  if (/눈물|눈 주변/.test(g)) items.unshift('눈 주변 닦아주기');
  if (/이중모|털 빠짐|털빠짐/.test(g)) items.push('빠진 털 정리 (털갈이철엔 매일)');
  if (exercise.some((e) => /비만|체중/.test(e))) items.push('체중 재고 기록하기');
  // 요일 표는 6줄을 넘으면 세로로 길어져 읽히지 않는다.
  return items.slice(0, 6);
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
  const double = /이중모|더블코트|더블 코트|언더코트|털 빠짐|털빠짐/.test(g);
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
// 반환 타입에서 undefined를 뺀다 — 모든 분기가 소견을 만들고, 프로필의 건강 라벨이 이 값에 기댄다.
function buildVerdict(input: PetInput, symptomIds: string[], hasSymptomText: boolean): NonNullable<CareCard['verdict']> {
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
      headline: '증상을 기록하고, 아래 신호가 보이면 병원으로',
      summary: `${name}의 증상이 언제부터, 얼마나 자주 나타나는지 기록해 주세요. 아래 「병원에 가야 하는 신호」에 하나라도 해당하면 미루지 말고 동물병원에 연락하세요.`,
      todo: ['증상이 나타난 시각과 횟수를 기록해 주세요', '밥, 물, 배변, 활동량이 평소와 다른 점을 함께 적어 두세요', '아래 「병원에 가야 하는 신호」를 먼저 확인하세요'],
    };
  }
  return {
    urgency: 'routine',
    headline: '지금은 예방 관리에 집중할 때예요',
    summary: '입력하신 내용에는 급하게 볼 증상이 없어요. 품종과 나이에 맞춘 아래 관리 항목을 꾸준히 챙겨 주세요.',
    todo: ['아래 주간 체크리스트를 한 가지씩 시작해 보세요', '정기 검진 날짜를 달력에 미리 넣어 두세요', '한 달에 한 번 체중을 재서 적어 두세요'],
  };
}

/**
 * 선택형 증상에 대한 답 — SYMPTOM_INFO(검증된 표)에서 그대로 가져온다.
 * 보호자가 **직접 적은** 증상은 여기서 답하지 않는다(careAdvisor가 제미나이에 맡긴다).
 */
function answerFromTable(symptomIds: string[], species: Species): CareCard['symptomAnswer'] | undefined {
  const known = symptomIds.filter((id) => symptomInfo(id, species));
  if (known.length === 0) return undefined;
  const causes: string[] = [];
  const goNow: string[] = [];
  for (const id of known) {
    const info = symptomInfo(id, species)!;
    const label = SYMPTOMS.find((s) => s.id === id)?.label ?? id;
    causes.push(`${label} — ${info.causes}`);
    goNow.push(`${label}: ${info.vet}`);
  }
  return {
    causes,
    careNow: [
      '밥과 물을 평소만큼 먹는지 확인해 주세요',
      '토하거나 설사했다면 사진을 찍어 두세요. 진료 때 도움이 돼요',
    ],
    goNow,
    homeCheck: [
      '잇몸이 분홍색인지 확인해 주세요. 창백하거나 푸르스름하면 바로 병원에 가세요',
      '편히 쉴 때 1분 동안 숨을 몇 번 쉬는지 세어 보세요',
      '활동량과 식욕이 평소와 비교해 어떤지 봐 주세요',
    ],
    vetPrep: {
      tests: '증상에 따라 신체검사, 혈액검사, 엑스레이나 초음파 검사를 할 수 있어요.',
      script: '○일 전부터 하루 ○번쯤 그랬고, 한 번에 ○분 정도 이어져요.',
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
  const stage = age ? lifeStage(input.species, age.months, b?.size) : '성장 단계 미상';
  const hasText = !!(input.notes && input.notes.trim().length > 1);

  // 연령 관리 — 계산으로 나오는 사실(체중 판정·단계·중성화)만 담는다.
  const ageTips: string[] = [];
  const breedKo = b?.breed_ko ?? (input.breed ?? '이 품종');
  const wc = weightCheck({
    name: input.name, breedKo, weight: input.weightKg,
    range: b?.breed_ko?.startsWith('믹스') ? null : parseWeightRange(b?.weight_kg),
    // 무릎 질환이 호발 목록에 있으면 체중 안내에 그 이유를 함께 적는다.
    jointRisk: (b?.guide?.hereditary ?? []).some((h) => /슬개골|관절|고관절/.test(h.name)),
    months: age?.months ?? null,
  });
  if (wc) ageTips.push(`${wc.title} — ${wc.body}`);
  if (age) {
    const sp = stagePoint({
      species: input.species, months: age.months, breedKo, size: b?.size,
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
  const verdict = buildVerdict(input, symptomIds, hasText);
  const routine = routineOf(input.species, b?.size, grooming);

  return {
    verdict,
    symptomAnswer: answerFromTable(symptomIds, input.species),
    // 서버에서 만드는 값이라 사용자 시계에 영향받지 않는다(리포트는 서버에서 생성된다).
    generatedAt: todayYmd(),

    profile: {
      // 문장 안에서는 '이 품종'이 자연스럽지만 프로필 칸에 이름처럼 놓이면 어색하다.
      breedKo: b?.breed_ko ?? (input.breed?.trim() || '품종 미상'),
      breedEn: b?.breed_en,
      ageLabel: age?.label,
      stage,
      sexKo: sexLabel(input),
      weightKg: input.weightKg,
      weightRange: b?.weight_kg,
      bodyLabel: wc ? (wc.growing ? '성장 중' : BODY_LABEL[wc.tone]) : undefined,
      bodyTone: wc?.tone,
      growing: wc?.growing || undefined,
      sizeLabel: b?.size,
      /*
        프로필의 활동량은 4칸짜리 통계 자리라 **짧아야 한다.** 고양이의 전체 문구
        ("실내 놀이 10~15분씩 하루 2~3회")를 그대로 넣으면 모바일 2×2에서 뭉개진다.
        전체 문구는 exercise.walkMinutesPerDay와 routine.walk에 그대로 남아 있다.
      */
      activityLabel: input.species === 'cat' ? '놀이 2~3회/일' : walkMinutes(input.species, b?.size),
      healthLabel: HEALTH_LABEL[verdict.urgency],
      healthTone: verdict.urgency,
      humanAgeYears: age ? humanAge(input.species, age.months, b?.size) ?? undefined : undefined,
      lifeYears: b?.life_years,
    },

    /*
      접종·검진 일정. 마지막 접종일을 모르면 defaultSchedules가 가짜 날짜 대신
      "병원에서 이력 확인" 항목을 만들어 준다 — 그 처리는 careSchedule.ts에 있다.
    */
    schedule: defaultSchedules(input.species, {
      birth: input.birth,
      lastVaccineCombo: input.lastVaccineCombo,
      lastVaccineRabies: input.lastVaccineRabies,
      lastHeartworm: input.lastHeartworm,
      size: b?.size,
    })
      .map((s) => ({ type: s.type, title: s.title, dueDate: s.due_date }))
      // 날짜순으로 세운다 — defaultSchedules는 항목 종류 순서로 만들어서,
      // 그대로 그리면 타임라인에서 2027년이 2026년보다 위에 오는 일이 생긴다.
      .sort((x, y) => x.dueDate.localeCompare(y.dueDate)),

    weekly: weeklyItems(input.species, routine, grooming, g.exercise ?? []),
    feeding: feedingPlan(input.species, input.weightKg, age?.months ?? null, input.neutered, b?.size),

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
    routine,

    /*
      병원에 가야 하는 신호 — 눈으로 확인할 수 있는 종 공통 응급 신호만.
      ⚠️ 2026-09-26까지는 품종 질환 3개를 「○○ 증상이 보이면 진료를 받아 보세요」로 앞에 붙였다.
         같은 문장이 세 번 반복돼 기계가 쓴 글처럼 읽혔고, 질환 목록(breedTraits.healthRisks)과 겹쳤다.
         리포트는 질환을 같은 절 아래에 이름·설명으로 따로 보여 준다(components/CareCard.tsx).
    */
    redFlags: [
      '잇몸이 창백하거나 푸르게 보일 때',
      ...(input.species === 'cat'
        ? ['입을 벌리고 숨을 쉬거나, 쉬고 있는데도 숨이 빠를 때', '화장실을 들락거리는데 소변이 나오지 않을 때(특히 수컷)']
        : ['숨이 가쁘고 혀를 길게 빼고 힘들어할 때', '배가 갑자기 부풀고 헛구역질을 할 때']),
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
