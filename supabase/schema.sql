-- ============================================================================
-- mypet — Supabase 스키마 (테이블 + Storage + RLS)
-- 실행: Supabase 대시보드 → SQL Editor → 아래 전체 붙여넣기 → Run
-- 안전하게 여러 번 실행 가능 (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================================================

-- 0) 확장 ---------------------------------------------------------------------
create extension if not exists vector;   -- RAG 임베딩 검색(pgvector)

-- 1) 반려동물 -----------------------------------------------------------------
create table if not exists public.pets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  species     text not null check (species in ('dog', 'cat')),
  breed       text,
  birth       text,                       -- "YYYY-MM"
  sex         text check (sex in ('female', 'male')),
  neutered    boolean,
  weight_kg   numeric,
  notes       text,
  photo_url   text,                        -- Storage 경로 또는 공개 URL
  created_at  timestamptz not null default now()
);

-- 2) AI가 생성한 케어 카드 (CareCard JSON 통째로 보관) -------------------------
create table if not exists public.care_cards (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references public.pets (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  card        jsonb not null,              -- lib/types.ts 의 CareCard 형태
  created_at  timestamptz not null default now()
);

-- 3) 결제/잠금 해제 (마리당 1회 결제) ----------------------------------------
create table if not exists public.unlocks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  pet_id        uuid not null references public.pets (id) on delete cascade,
  amount        integer,                     -- 결제 금액(원)
  provider      text,                        -- 'toss' | 'portone' | 'mock'
  -- ── 결제 추적 (PG 연동용) ──
  order_id      text,                        -- 멱등 주문번호
  payment_key   text,                        -- PG 결제 키 (중복결제 방지)
  status        text not null default 'paid' check (status in ('pending','paid','canceled','refunded')),
  receipt_url   text,                        -- 영수증 URL
  raw_response  jsonb,                       -- PG 승인 응답 원본
  paid_at       timestamptz not null default now(),
  unique (pet_id)                            -- 한 마리당 한 번만
);
create unique index if not exists unlocks_payment_key_uniq
  on public.unlocks (payment_key) where payment_key is not null;

-- 4) 문의 (Contact form) --------------------------------------------------------
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,  -- 비로그인 문의 허용
  name        text,
  email       text not null,
  category    text,                         -- '결제'|'환불'|'오류'|'제휴'|'기타'
  message     text not null,
  status      text not null default 'open' check (status in ('open','answered','closed')),
  created_at  timestamptz not null default now()
);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);

-- 5) 지식베이스 (RAG) — 검증된 수의 가이드라인 청크 + 임베딩 ------------------
create table if not exists public.knowledge (
  id           uuid primary key default gen_random_uuid(),
  species      text not null check (species in ('dog', 'cat', 'both')),
  topic        text not null,                 -- 예: '예방접종', '독성식품', '치아관리'
  content      text not null,                 -- 프롬프트에 주입될 근거 텍스트
  source_org   text not null,                 -- 출처 기관 (배지)
  source_title text,
  source_url   text,
  embedding    vector(768),                   -- gemini-embedding-001 (768차원)
  created_at   timestamptz not null default now()
);
-- 코사인 거리 인덱스 (행이 쌓이면 검색 가속)
create index if not exists knowledge_embedding_idx
  on public.knowledge using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 질문 임베딩과 가장 가까운 근거 청크 검색. species + 'both'(공통) 모두 포함.
-- (반환형 변경 시 CREATE OR REPLACE가 막히므로 먼저 DROP — 재실행 안전)
drop function if exists public.match_knowledge(vector, text, integer);
create or replace function public.match_knowledge(
  query_embedding vector(768),
  match_species   text,
  match_count     int default 6
)
returns table (
  topic        text,
  content      text,
  source_org   text,
  source_title text,
  source_url   text,
  similarity   float
)
language sql stable
as $$
  select
    k.topic, k.content, k.source_org, k.source_title, k.source_url,
    1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge k
  where k.embedding is not null
    and (k.species = match_species or k.species = 'both')
  order by k.embedding <=> query_embedding
  limit match_count;
$$;

create index if not exists pets_user_id_idx       on public.pets (user_id);
create index if not exists care_cards_pet_id_idx  on public.care_cards (pet_id);

-- ============================================================================
-- RLS (행 수준 보안) — 사용자는 "자기 데이터"만 접근 가능
-- ============================================================================
alter table public.pets       enable row level security;
alter table public.care_cards enable row level security;
alter table public.unlocks    enable row level security;
alter table public.inquiries  enable row level security;
-- 문의: 제출/열람 모두 서버(service_role)로만 처리한다 → 클라이언트 정책 없음(전체 차단).
--   · 제출: /api/inquiries 에서 검증 후 admin client로 INSERT
--   · 열람: /admin 페이지(관리자 이메일만)에서 admin client로 SELECT

alter table public.knowledge  enable row level security;
-- 지식베이스: 검색은 서버(admin client)에서만. 클라이언트 정책 없음(전체 차단).

drop policy if exists "pets_own" on public.pets;
create policy "pets_own" on public.pets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "care_cards_own" on public.care_cards;
create policy "care_cards_own" on public.care_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 잠금 해제 기록: 읽기는 본인만, 생성/수정은 서버(service_role)만 → INSERT 정책 없음.
drop policy if exists "unlocks_read_own" on public.unlocks;
create policy "unlocks_read_own" on public.unlocks
  for select using (auth.uid() = user_id);

-- ============================================================================
-- Storage — 반려동물 사진 버킷 (비공개)
-- 파일 경로 규칙: <user_id>/<파일명>  → 본인 폴더만 접근 가능
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', false)
on conflict (id) do nothing;

drop policy if exists "pet_photos_own_read"   on storage.objects;
drop policy if exists "pet_photos_own_write"  on storage.objects;
drop policy if exists "pet_photos_own_delete" on storage.objects;

create policy "pet_photos_own_read" on storage.objects
  for select using (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_own_write" on storage.objects
  for insert with check (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_own_delete" on storage.objects
  for delete using (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
