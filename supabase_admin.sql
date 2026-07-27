-- =====================================================================
--  FindTheWay — Admin panel uchun Supabase sozlamalari
--  Supabase → SQL Editor → New query → shu faylni to'liq qo'yib "Run".
--  Bir necha marta ishga tushirsa ham xavfsiz (idempotent).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) profiles.role uchun 'admin' qiymatiga ruxsat
--    (agar CHECK cheklovi bo'lsa — uni yangilaymiz)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;

  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('student', 'owner', 'admin'));
end $$;


-- ---------------------------------------------------------------------
-- 2) is_admin() yordamchi funksiyasi
--    RLS siyosatlari ichida ishlatiladi. SECURITY DEFINER —
--    shunda profiles jadvalini o'qishda RLS rekursiyaga tushmaydi.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;


-- ---------------------------------------------------------------------
-- 3) Admin uchun to'liq huquq — har bir jadvalga bitta siyosat
--    (`for all` = select + insert + update + delete)
-- ---------------------------------------------------------------------
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists centers_admin_all on public.centers;
create policy centers_admin_all on public.centers
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists courses_admin_all on public.courses;
create policy courses_admin_all on public.courses
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists applications_admin_all on public.applications;
create policy applications_admin_all on public.applications
  for all
  using (public.is_admin())
  with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 4) Markaz o'chirilganda unga tegishli kurs va arizalar ham ketsin
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'courses_center_id_fkey'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses drop constraint courses_center_id_fkey;
  end if;

  alter table public.courses
    add constraint courses_center_id_fkey
    foreign key (center_id) references public.centers(id) on delete cascade;
end $$;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'applications_center_id_fkey'
      and conrelid = 'public.applications'::regclass
  ) then
    alter table public.applications drop constraint applications_center_id_fkey;
  end if;

  alter table public.applications
    add constraint applications_center_id_fkey
    foreign key (center_id) references public.centers(id) on delete cascade;
end $$;


-- ---------------------------------------------------------------------
-- 5) Tezkor indekslar — admin paneli hamma yozuvni birdan o'qiydi
-- ---------------------------------------------------------------------
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists centers_is_verified_idx on public.centers (is_verified);
create index if not exists centers_created_at_idx on public.centers (created_at desc);
create index if not exists applications_status_idx on public.applications (status);
create index if not exists applications_created_at_idx on public.applications (created_at desc);


-- =====================================================================
--  6) ⚠️ ENG MUHIM QADAM — o'zingizni admin qilib belgilash
--
--  a) Avval oddiy yo'l bilan hisob oching:
--     Supabase → Authentication → Users → "Add user"
--     (yoki FindTheWay_Desktop orqali ro'yxatdan o'ting).
--
--  b) So'ng quyidagi qatordagi emailni o'zingiznikiga almashtirib,
--     shu bitta buyruqni ishga tushiring:
-- =====================================================================

-- insert into public.profiles (id, role, full_name)
-- select id, 'admin', coalesce(raw_user_meta_data->>'full_name', 'Admin')
-- from auth.users
-- where email = 'SIZNING_EMAILINGIZ@example.com'
-- on conflict (id) do update set role = 'admin';


-- Tekshirish: quyidagi so'rov admin hisoblarni ko'rsatadi
-- select p.id, u.email, p.role, p.full_name
-- from public.profiles p join auth.users u on u.id = p.id
-- where p.role = 'admin';
