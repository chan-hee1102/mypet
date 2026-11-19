-- 방문이 사람인지 봇인지 가를 신호(2026-11-19, 관리자 「실시간 접속·봇 수집」 — KOSTOCK 관리자와 같은 판정, lib/visitor.ts).
-- IP·UA 원문은 여전히 저장하지 않는다. 브라우저는 「크롬 141」처럼 이름+주버전만, 봇은 「search:네이버」처럼 분류:이름만.
alter table public.visits add column if not exists browser text;         -- browserOf(UA)
alter table public.visits add column if not exists bot text;             -- botOf(UA·힌트·webdriver) — 사람 쪽이면 null
alter table public.visits add column if not exists tz text;              -- 화면의 시간대(Asia/Seoul…)
alter table public.visits add column if not exists lang text;            -- 화면 언어(ko-KR…)
alter table public.visits add column if not exists interacted boolean not null default false; -- 스크롤·터치·마우스·키를 한 번이라도
alter table public.visits add column if not exists closed boolean not null default false;     -- 탭을 정상으로 닫음(pagehide)
alter table public.visits add column if not exists kind text;            -- kindOf 결과: human·likely·search·ai·preview·auto·suspect

create index if not exists visits_kind_started on public.visits (kind, started_at);

-- 이미 쌓인 행(신호 없음)은 행동만으로 — lib/visitor.ts kindOf의 2·4·5·6번과 같은 순서
update public.visits set kind = case
  when coalesce(jsonb_array_length(clicks), 0) > 0 or pageviews >= 2 then 'human'
  when coalesce(device, 'desktop') <> 'mobile' and duration_sec < 5 then 'suspect'
  when duration_sec >= 10 or device = 'mobile' then 'likely'
  else 'suspect'
end
where kind is null;
