import { buildCardFromData, findBreed } from './careCardFromData';
import { TOXIC_FOODS, computeAge } from './petData';
import { parseWeightRange } from './guidePersonal';
import { daysUntil } from './careSchedule';
import type { CareCard, PetInput, Species } from './types';

/*
  예시 기록지·예시 리포트에 쓰는 가상의 두 마리.
  값은 전부 실제 리포트 계산 코드(buildCardFromData)로 뽑는다 — 화면에 보이는 숫자를 따로 적지 않는다.
  날짜가 들어가서(접종일·남은 날) 부르는 쪽 페이지는 주기적으로 다시 만들어야 한다(revalidate).
*/
export function ymAgo(months: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function sampleInput(species: Species): PetInput {
  return species === 'dog'
    ? {
        name: '구름이', species: 'dog', breed: '포메라니안', birth: ymAgo(38), sex: 'male', neutered: true, weightKg: 3.4,
        lastVaccineCombo: ymAgo(11), lastVaccineRabies: ymAgo(5), lastHeartworm: ymAgo(0),
      }
    : {
        name: '보리', species: 'cat', breed: '코리안숏헤어', birth: ymAgo(50), sex: 'female', neutered: true, weightKg: 4.3,
        lastVaccineCombo: ymAgo(10), lastVaccineRabies: ymAgo(7), lastHeartworm: ymAgo(0),
      };
}

export function sampleCard(species: Species): CareCard {
  return buildCardFromData(sampleInput(species));
}

/** 첫 화면 기록지에 들어가는 값 */
export type HeroSample = {
  species: Species;
  name: string;
  breedKo: string;
  sizeLabel?: string;
  ageYears: number;
  humanAge?: number;
  sexKo?: string;
  weightKg: number;
  range: [number, number] | null;
  bodyLabel?: string;
  bodyTone?: 'ok' | 'warn' | 'info';
  dailyKcal?: string;
  dailyGram?: string;
  nextVaccine?: { title: string; dateLabel: string; dday: number };
  risks: string[];
  toxicExamples: string[];
  toxicCount: number;
};

function monthDay(ymd: string): string {
  const [, m, d] = ymd.split('-').map(Number);
  return `${m}월 ${d}일`;
}

export function heroSample(species: Species): { hero: HeroSample; card: CareCard } {
  const input = sampleInput(species);
  const card = buildCardFromData(input);
  const b = findBreed(species, input.breed);
  const p = card.profile!;
  const vaccine = card.schedule?.find((x) => x.type === 'vaccine');
  const toxic = TOXIC_FOODS[species];
  const hero: HeroSample = {
    species,
    name: input.name,
    breedKo: p.breedKo,
    sizeLabel: p.sizeLabel ? `${p.sizeLabel}${species === 'dog' ? '견' : '묘'}` : undefined,
    ageYears: Math.floor((computeAge(input.birth)?.months ?? 0) / 12),
    humanAge: p.humanAgeYears,
    sexKo: p.sexKo,
    weightKg: input.weightKg!,
    range: parseWeightRange(b?.weight_kg),
    bodyLabel: p.bodyLabel,
    bodyTone: p.bodyTone,
    dailyKcal: card.feeding?.dailyKcal,
    dailyGram: card.feeding?.dailyGram,
    nextVaccine: vaccine
      ? { title: vaccine.title.replace(/\s*\(.*?\)/, ''), dateLabel: monthDay(vaccine.dueDate), dday: daysUntil(vaccine.dueDate) }
      : undefined,
    risks: card.breedTraits.healthRisks.slice(0, 2).map((r) => r.split('—')[0].trim()),
    toxicExamples: toxic.filter((f) => f.severity === 'danger').slice(0, 3).map((f) => f.name.split(/[·(]/)[0].trim()),
    toxicCount: toxic.length,
  };
  return { hero, card };
}
