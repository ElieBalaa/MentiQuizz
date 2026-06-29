-- ============================================================
-- Mentimeter Quiz Clone — Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- QUIZZES
-- ============================================================
create table public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.quizzes enable row level security;

create policy "Hosts can manage their quizzes"
  on public.quizzes for all
  using (auth.uid() = host_id);

create policy "Anyone can read quizzes for active sessions"
  on public.quizzes for select
  using (true);

-- ============================================================
-- QUESTIONS
-- ============================================================
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null default '[]',  -- [{ "id": "a", "text": "Option A" }, ...]
  correct_answer text not null,         -- "a", "b", "c", or "d"
  time_limit integer default 20,        -- seconds
  order_index integer not null default 0,
  created_at timestamptz default now()
);

alter table public.questions enable row level security;

create policy "Hosts can manage questions for their quizzes"
  on public.questions for all
  using (
    exists (
      select 1 from public.quizzes
      where quizzes.id = questions.quiz_id
      and quizzes.host_id = auth.uid()
    )
  );

create policy "Anyone can read questions"
  on public.questions for select
  using (true);

-- ============================================================
-- SESSIONS
-- ============================================================
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  room_code text unique not null,
  status text default 'waiting' check (status in ('waiting', 'active', 'question', 'results', 'leaderboard', 'finished')),
  current_question_index integer default -1,
  current_question_id uuid references public.questions(id),
  question_started_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sessions enable row level security;

create policy "Hosts can manage their sessions"
  on public.sessions for all
  using (auth.uid() = host_id);

create policy "Anyone can read sessions"
  on public.sessions for select
  using (true);

-- ============================================================
-- PARTICIPANTS
-- ============================================================
create table public.participants (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  display_name text not null,
  score integer default 0,
  answers_count integer default 0,
  correct_count integer default 0,
  joined_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

alter table public.participants enable row level security;

create policy "Anyone can insert participants"
  on public.participants for insert
  with check (true);

create policy "Anyone can read participants in a session"
  on public.participants for select
  using (true);

create policy "Participants can update their own record"
  on public.participants for update
  using (true);

-- ============================================================
-- ANSWERS
-- ============================================================
create table public.answers (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  participant_id uuid references public.participants(id) on delete cascade not null,
  chosen_option text not null,
  is_correct boolean not null default false,
  time_taken_ms integer not null default 0,
  points_earned integer not null default 0,
  created_at timestamptz default now(),
  unique(session_id, question_id, participant_id)
);

alter table public.answers enable row level security;

create policy "Anyone can insert answers"
  on public.answers for insert
  with check (true);

create policy "Anyone can read answers"
  on public.answers for select
  using (true);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_questions_quiz_id on public.questions(quiz_id);
create index idx_questions_order on public.questions(quiz_id, order_index);
create index idx_sessions_room_code on public.sessions(room_code);
create index idx_sessions_host_id on public.sessions(host_id);
create index idx_participants_session_id on public.participants(session_id);
create index idx_answers_session_question on public.answers(session_id, question_id);

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.answers;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Generate unique 6-digit room code
create or replace function generate_room_code()
returns text as $$
declare
  code text;
  exists_check boolean;
begin
  loop
    code := lpad(floor(random() * 1000000)::text, 6, '0');
    select exists(select 1 from public.sessions where room_code = code) into exists_check;
    exit when not exists_check;
  end loop;
  return code;
end;
$$ language plpgsql;

-- Calculate points based on speed (Kahoot-style)
-- Max 1000 points, decreases linearly with time taken
create or replace function calculate_points(time_limit_seconds integer, time_taken_ms integer)
returns integer as $$
declare
  time_limit_ms integer := time_limit_seconds * 1000;
  ratio float;
begin
  if time_taken_ms >= time_limit_ms then return 0; end if;
  ratio := 1.0 - (time_taken_ms::float / time_limit_ms::float);
  -- Award between 500 and 1000 points based on speed
  return floor(500 + (500 * ratio))::integer;
end;
$$ language plpgsql;
