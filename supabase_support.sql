-- ============================================================
--  FindTheWay — QO'LLAB-QUVVATLASH CHATI (Support)
--  Supabase → SQL Editor → New query → shu faylni to'liq
--  nusxalab qo'ying va RUN bosing.
--
--  Nima beradi?
--   • Foydalanuvchi (o'quvchi yoki markaz egasi) "Yordam" orqali
--     ticket ochadi va xabar yozadi.
--   • Admin panelda barcha ticketlar ko'rinadi, admin javob yozadi.
--   • Admin javobini Groq orqali "silliqlash" (polish-message
--     edge function) mumkin — ma'no saqlanadi, odobli qilinadi.
--   • Realtime — ikkala tomon xabarni jonli ko'radi.
--
--  ⚠️ MUHIM: admin huquqlari uchun avval `supabase_admin.sql`
--  (is_admin() funksiyasi) ishga tushirilgan bo'lishi kerak.
--  Fayl xavfsiz: qayta ishga tushirsangiz ham xato bermaydi.
-- ============================================================


-- is_admin() bo'lmasa yaratamiz (mustaqil ishlash uchun)
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


-- ------------------------------------------------------------
-- 1) support_tickets
-- ------------------------------------------------------------
create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  user_name       text,
  user_role       text not null default 'student' check (user_role in ('student', 'owner')),
  subject         text not null,
  status          text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx
  on public.support_tickets (status, updated_at desc);
create index if not exists support_tickets_user_idx
  on public.support_tickets (user_id);

alter table public.support_tickets enable row level security;

-- Ko'rish: yaratgan foydalanuvchi yoki admin
drop policy if exists "support_tickets_select" on public.support_tickets;
create policy "support_tickets_select"
  on public.support_tickets for select
  using (user_id = auth.uid() or public.is_admin());

-- Yaratish: har kim o'z nomidan
drop policy if exists "support_tickets_insert" on public.support_tickets;
create policy "support_tickets_insert"
  on public.support_tickets for insert
  with check (user_id = auth.uid());

-- Yangilash: yaratgan foydalanuvchi (status/oxirgi xabar triggerda) yoki admin
drop policy if exists "support_tickets_update" on public.support_tickets;
create policy "support_tickets_update"
  on public.support_tickets for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());


-- ------------------------------------------------------------
-- 2) support_messages
-- ------------------------------------------------------------
create table if not exists public.support_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  sender_name text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists support_messages_ticket_idx
  on public.support_messages (ticket_id, created_at);

alter table public.support_messages enable row level security;

-- Ko'rish: ticket egasi yoki admin
drop policy if exists "support_messages_select" on public.support_messages;
create policy "support_messages_select"
  on public.support_messages for select
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = support_messages.ticket_id
        and (t.user_id = auth.uid() or public.is_admin())
    )
  );

-- Yozish: ticket egasi yoki admin (o'z nomidan)
drop policy if exists "support_messages_insert" on public.support_messages;
create policy "support_messages_insert"
  on public.support_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.support_tickets t
      where t.id = support_messages.ticket_id
        and (t.user_id = auth.uid() or public.is_admin())
    )
  );


-- ------------------------------------------------------------
-- 3) Xabar yozilganda ticket holati va vaqti yangilanadi
-- ------------------------------------------------------------
create or replace function public.touch_support_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_tickets
     set last_message_at = new.created_at,
         updated_at = now(),
         status = case
           when new.sender_role = 'admin' then 'answered'
           else 'open'
         end
   where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists support_messages_touch_ticket on public.support_messages;
create trigger support_messages_touch_ticket
  after insert on public.support_messages
  for each row execute function public.touch_support_ticket();


-- ------------------------------------------------------------
-- 4) REALTIME
-- ------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.support_tickets;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.support_messages;
exception
  when duplicate_object then null;
end;
$$;

-- ============================================================
--  Tayyor. Frontend (Admin: /yordam, App/Biznes: /yordam).
-- ============================================================
