import { buildCardFromData } from './careCardFromData';
import type { CareCard, PetInput, Species } from './types';

/*
  예시 리포트(/sample)에 쓰는 가상의 두 마리.
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
