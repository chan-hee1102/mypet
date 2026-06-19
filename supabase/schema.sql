-- ============================================================================
-- mypet — Supabase 스키마 (테이블 + Storage + RLS)
-- 실행: Supabase 대시보드 → SQL Editor → 아래 전체 붙여넣기 → Run
-- 안전하게 여러 번 실행 가능 (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================================================

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

create index if not exists pets_user_id_idx       on public.pets (user_id);
create index if not exists care_cards_pet_id_idx  on public.care_cards (pet_id);

-- ============================================================================
-- RLS (행 수준 보안) — 사용자는 "자기 데이터"만 접근 가능
-- ============================================================================
alter table public.pets       enable row level security;
alter table public.care_cards enable row level security;
alter table public.unlocks    enable row level security;

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
