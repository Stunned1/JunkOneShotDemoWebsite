-- Groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Group members
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null check (amount > 0),
  paid_by uuid references auth.users(id) on delete set null not null,
  created_at timestamptz default now()
);

-- Expense splits
create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10,2) not null,
  unique(expense_id, user_id)
);

-- Profiles (mirrors auth.users for display names)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.profiles enable row level security;

-- Profiles: users can read all profiles, update their own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Groups: members can see their groups
create policy "groups_select" on public.groups for select
  using (exists (select 1 from public.group_members where group_id = id and user_id = auth.uid()));
create policy "groups_insert" on public.groups for insert with check (auth.uid() = created_by);
create policy "groups_delete" on public.groups for delete using (auth.uid() = created_by);

-- Group members
create policy "group_members_select" on public.group_members for select
  using (exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid()));
create policy "group_members_insert" on public.group_members for insert
  with check (exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid()) or user_id = auth.uid());
create policy "group_members_delete" on public.group_members for delete
  using (user_id = auth.uid() or exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid()));

-- Expenses: group members can CRUD
create policy "expenses_select" on public.expenses for select
  using (exists (select 1 from public.group_members where group_id = expenses.group_id and user_id = auth.uid()));
create policy "expenses_insert" on public.expenses for insert
  with check (exists (select 1 from public.group_members where group_id = expenses.group_id and user_id = auth.uid()));
create policy "expenses_delete" on public.expenses for delete
  using (paid_by = auth.uid());

-- Expense splits
create policy "splits_select" on public.expense_splits for select
  using (exists (
    select 1 from public.expenses e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = expense_id and gm.user_id = auth.uid()
  ));
create policy "splits_insert" on public.expense_splits for insert
  with check (exists (
    select 1 from public.expenses e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = expense_id and gm.user_id = auth.uid()
  ));
create policy "splits_delete" on public.expense_splits for delete
  using (exists (
    select 1 from public.expenses e
    where e.id = expense_id and e.paid_by = auth.uid()
  ));;
