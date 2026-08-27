import breedData from '@/lib/breedKnowledge.json';
import { TOXIC_FOODS, GOOD_FOODS } from '@/lib/petData';
import { VACCINE_REFERENCE } from '@/lib/careSchedule';
import { SYMPTOMS, SYMPTOM_INFO } from '@/lib/symptomData';
import { humanAge } from '@/lib/guidePersonal';
import type { Guide } from '@/lib/guides';
import type { Species } from '@/lib/types';
import { Icon } from './icons';

/*
  가이드 본문 — **전부 우리 데이터에서 만든다.**
  여기에 사실을 새로 적지 않는다. 적는 순간 lib/petData·breedKnowledge와 갈라지고,
  두 곳이 다른 말을 하기 시작하면 어느 쪽이 맞는지 아무도 모르게 된다.
  새 표가 필요하면 원본 데이터에 필드를 더하고 여기서 읽어 오는 순서로 간다.
*/

type BreedRow = {
  breed_ko: string; breed_en: string; species: Species;
  size: string; weight_kg: string; life_years: string;
};

function ToxicTable({ species }: { species: Species }) {
  const rows = TOXIC_FOODS[species];
  const danger = rows.filter((r) => r.severity === 'danger');
  const caution = rows.filter((r) => r.severity !== 'danger');
  const good = GOOD_FOODS[species];
  return (
    <>
      <h2>절대 주면 안 되는 것</h2>
      <div className="gtable-wrap">
        <table className="gtable">
          <thead><tr><th style={{ width: '38%' }}>음식</th><th>왜 위험한가</th></tr></thead>
          <tbody>
            {danger.map((f) => (
              <tr key={f.name}>
                <td><span className="gsev gsev--danger">위험</span> {f.name}</td>
                <td>{f.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>되도록 피할 것</h2>
      <div className="gtable-wrap">
        <table className="gtable">
          <thead><tr><th style={{ width: '38%' }}>음식</th><th>이유</th></tr></thead>
          <tbody>
            {caution.map((f) => (
              <tr key={f.name}>
                <td><span className="gsev gsev--caution">주의</span> {f.name}</td>
                <td>{f.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>대신 줘도 괜찮은 것</h2>
      <div className="gchips">{good.map((g) => <span className="gchip gchip--ok" key={g}>{g}</span>)}</div>
      <p className="gnote">
        <Icon name="info" size={15} /> 사람 음식은 간을 하지 않은 상태로, 하루 총 열량의 10%를 넘지 않게 주는 것이 기준입니다.
      </p>

      <h2>이미 먹었다면</h2>
      <ol className="gsteps">
        <li><b>무엇을, 언제, 얼마나</b> 먹었는지 먼저 확인하세요. 포장지가 있으면 챙깁니다.</li>
        <li>동물병원에 <b>전화부터</b> 하세요. 이동할지 집에서 지켜볼지 병원이 판단합니다.</li>
        <li><b>억지로 토하게 하지 마세요.</b> 수의사 지시 없이 구토를 유도하면 흡인성 폐렴·식도 손상 위험이 있습니다.</li>
        <li>잇몸 색, 호흡, 구토·설사 여부를 시간과 함께 적어 두면 진료가 빨라집니다.</li>
      </ol>
    </>
  );
}

function VaccineTable({ species }: { species: Species }) {
  const rows = VACCINE_REFERENCE[species];
  return (
    <>
      <h2>접종·예방 기준표</h2>
      <div className="gtable-wrap">
        <table className="gtable">
          <thead>
            <tr><th>항목</th><th>시작 시기</th><th>간격·횟수</th><th>이후 주기</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td><b>{r.name}</b><span className="gcell-note">{r.note}</span></td>
                <td>{r.first}</td>
                <td>{r.interval}</td>
                <td>{r.booster}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="gnote">
        <Icon name="info" size={15} /> 추가접종 12개월은 국내에서 통상적으로 쓰이는 주기입니다.
        WSAVA 국제 지침은 성견·성묘의 코어 백신에 3년 간격을 제시하며, 항체가 검사로 필요 여부를 확인하기도 합니다.
        접종 이력과 생활 환경에 따라 달라지므로 병원과 상의해 정하세요.
      </p>
    </>
  );
}

/** 나이 환산 — 화면에 쓰는 숫자를 리포트와 같은 humanAge()로 계산한다(값이 갈라지지 않도록). */
function HumanAgeTable() {
  const years = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
  const cols: { label: string; species: Species; size?: string }[] = [
    { label: '소형견', species: 'dog', size: '소형' },
    { label: '중형견', species: 'dog', size: '중형' },
    { label: '대형견', species: 'dog', size: '대형' },
    { label: '고양이', species: 'cat' },
  ];
  return (
    <>
      <h2>나이 환산표</h2>
      <div className="gtable-wrap">
        <table className="gtable gtable--num">
          <thead>
            <tr><th>실제 나이</th>{cols.map((c) => <th key={c.label}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {years.map((y) => (
              <tr key={y}>
                <td><b>{y}살</b></td>
                {cols.map((c) => (
                  <td key={c.label}>{humanAge(c.species, y * 12, c.size)}세</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>노령기가 시작되는 시점</h2>
      <div className="gtable-wrap">
        <table className="gtable">
          <thead><tr><th>구분</th><th>노령기 시작</th><th>이때부터 달라지는 것</th></tr></thead>
          <tbody>
            <tr><td><b>소형견</b></td><td>10~12세</td><td>치아·심장(승모판) 관리 비중이 커집니다.</td></tr>
            <tr><td><b>중형견</b></td><td>8~10세</td><td>체중 변화와 관절을 함께 봅니다.</td></tr>
            <tr><td><b>대형견</b></td><td>7~8세</td><td>관절·종양 검진을 앞당기는 것이 권장됩니다.</td></tr>
            <tr><td><b>고양이</b></td><td>11세</td><td>신장 수치와 갑상선을 특히 확인합니다.</td></tr>
          </tbody>
        </table>
      </div>
      <p className="gnote">
        <Icon name="info" size={15} /> 노령기에 접어들면 건강검진을 연 1회에서 6개월 간격으로 줄이는 것이 일반적입니다.
      </p>
    </>
  );
}

function WalkTable() {
  const rows = [
    { size: '초소형견', ex: '치와와 · 말티즈 · 포메라니안', time: '20~30분', tip: '한 번에 몰지 말고 두 번으로 나누세요. 기관허탈이 있으면 목줄 대신 하네스를 씁니다.' },
    { size: '소형견', ex: '시츄 · 푸들(토이) · 닥스훈트', time: '30~40분', tip: '허리가 긴 품종은 계단·점프를 줄이는 편이 좋습니다.' },
    { size: '중형견', ex: '비글 · 코커스패니얼 · 웰시코기', time: '40~60분', tip: '냄새 맡을 시간을 충분히 주면 같은 시간에도 만족도가 올라갑니다.' },
    { size: '대형·초대형견', ex: '리트리버 · 셰퍼드 · 그레이트데인', time: '60~90분', tip: '성장기에는 관절 부담을 줄이기 위해 짧게 자주가 원칙입니다.' },
    { size: '고양이', ex: '품종 무관', time: '놀이 10~15분씩 하루 2~3회', tip: '산책보다 사냥 놀이(낚싯대)가 본능에 맞고 스트레스가 적습니다.' },
  ];
  return (
    <>
      <h2>체급별 권장 운동량</h2>
      <div className="gtable-wrap">
        <table className="gtable">
          <thead><tr><th>체급</th><th>하루 권장</th><th>참고</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size}>
                <td><b>{r.size}</b><span className="gcell-note">{r.ex}</span></td>
                <td className="gtime">{r.time}</td>
                <td>{r.tip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="gnote">
        <Icon name="info" size={15} /> 여름철에는 손등을 아스팔트에 5초간 대 보고, 뜨거우면 산책을 미루세요.
        기온보다 노면 온도가 훨씬 높아 발바닥 화상을 입을 수 있습니다.
      </p>
    </>
  );
}

function BreedWeightTable() {
  const all = breedData as BreedRow[];
  const dogs = all.filter((b) => b.species === 'dog');
  const cats = all.filter((b) => b.species === 'cat');
  const order = ['초소형', '소형', '중형', '대형', '초대형'];
  const sorted = (rows: BreedRow[]) =>
    [...rows].sort((a, b) => {
      const d = order.indexOf(a.size) - order.indexOf(b.size);
      return d !== 0 ? d : a.breed_ko.localeCompare(b.breed_ko, 'ko');
    });

  const Table = ({ rows, caption }: { rows: BreedRow[]; caption: string }) => (
    <>
      <h2>{caption} <span className="gcount">{rows.length}종</span></h2>
      <div className="gtable-wrap gtable-wrap--tall">
        <table className="gtable">
          <thead><tr><th>품종</th><th>체급</th><th>표준 체중</th><th>평균 수명</th></tr></thead>
          <tbody>
            {sorted(rows).map((b) => (
              <tr key={b.breed_ko}>
                <td>
                  <a href={`/breed/${encodeURIComponent(b.breed_ko)}`}>{b.breed_ko}</a>
                  <span className="gcell-note">{b.breed_en}</span>
                </td>
                <td>{b.size}</td>
                <td className="gtime">{b.weight_kg} kg</td>
                <td>{b.life_years}년</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <>
      <Table rows={dogs} caption="개 품종" />
      <Table rows={cats} caption="고양이 품종" />
      <p className="gnote">
        <Icon name="info" size={15} /> 체중 숫자보다 체형이 정확합니다. 갈비뼈가 살짝 힘을 줘 만져지고,
        위에서 봤을 때 허리선이 보이면 적정 체형입니다.
      </p>
    </>
  );
}

function SymptomTable() {
  const emergency = SYMPTOMS.filter((s) => s.emergency);
  return (
    <>
      <h2>지체하면 안 되는 응급 신호</h2>
      <ul className="glist glist--warn">
        <li>숨을 가쁘게 쉬거나 입을 벌리고 헐떡인다 (특히 고양이는 그 자체가 응급입니다)</li>
        <li>잇몸이 창백하거나 푸르스름하다</li>
        <li>발작·경련을 하거나 의식이 흐리다</li>
        <li>피를 토하거나 혈변을 본다</li>
        <li>소변을 보지 못한다 (수컷 고양이는 몇 시간 내 생명이 위험합니다)</li>
        <li>배가 팽팽하게 부풀고 헛구역질을 한다 (위염전 의심)</li>
        <li>중독 물질을 삼킨 정황이 있다</li>
      </ul>

      <h2>증상별 원인과 판단 기준</h2>
      <div className="gtable-wrap">
        <table className="gtable">
          <thead><tr><th style={{ width: '24%' }}>증상</th><th>흔한 원인</th><th>병원에 가야 할 때</th></tr></thead>
          <tbody>
            {SYMPTOMS.map((s) => {
              const info = SYMPTOM_INFO[s.id];
              if (!info) return null;
              return (
                <tr key={s.id}>
                  <td>
                    <b>{s.label}</b>
                    {s.emergency && <span className="gsev gsev--danger" style={{ marginTop: 5 }}>응급</span>}
                  </td>
                  <td>{info.causes}</td>
                  <td>{info.vet}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="gnote">
        <Icon name="info" size={15} /> 위 {emergency.length > 0 ? '‘응급’ 표시 항목과 ' : ''}응급 신호 목록에 해당하면
        시간을 두고 지켜보지 마세요. 나머지 증상도 24시간 이상 이어지거나 기력 저하가 함께 오면 진료 대상입니다.
      </p>
    </>
  );
}

export default function GuideBody({ guide }: { guide: Guide }) {
  switch (guide.body) {
    case 'toxic-foods':  return <ToxicTable species={guide.species ?? 'dog'} />;
    case 'vaccine':      return <VaccineTable species={guide.species ?? 'dog'} />;
    case 'human-age':    return <HumanAgeTable />;
    case 'walk-time':    return <WalkTable />;
    case 'breed-weight': return <BreedWeightTable />;
    case 'symptom-vet':  return <SymptomTable />;
  }
}
