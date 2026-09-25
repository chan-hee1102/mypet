-- 2026-09-26 diagnoses.status에 'generating'을 허용한다.
--
-- 왜: 2026-07-07(fbd8575)부터 finalize가 리포트 생성을 선점할 때 status를 'generating'으로 바꾸는데,
--     운영 DB의 제약은 ('pending','paid','done','failed')만 허용했다. 그래서 선점 update가
--     매번 제약 위반(23514)으로 실패했고, 결제를 해도 리포트가 자동으로 만들어지지 않았다.
--     (실제 피해: 2026-07-23 결제 1건 — PortOne PAID, DB pending)
--
-- 값만 넓히는 변경이라 기존 행에는 영향이 없다. 되돌리려면 generating 행이 없을 때 아래 두 줄을 반대로.
alter table public.diagnoses drop constraint if exists diagnoses_status_check;
alter table public.diagnoses add constraint diagnoses_status_check
  check (status in ('pending', 'paid', 'generating', 'done', 'failed'));
