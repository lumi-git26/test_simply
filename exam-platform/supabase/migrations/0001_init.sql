-- =========================================================
-- EXAM PLATFORM — Supabase schema
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- teachers  (mirrors auth.users, created via Google OAuth)
-- ---------------------------------------------------------
create table teachers (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- exams
-- ---------------------------------------------------------
create table exams (
  id                uuid primary key default gen_random_uuid(),
  teacher_id        uuid not null references teachers(id) on delete cascade,
  title             text not null,
  description       text,
  time_limit_minutes int,                 -- null = no time limit
  share_slug        text not null unique, -- short code used in the public link
  status            text not null default 'draft'
                      check (status in ('draft','published','archived')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_exams_teacher on exams(teacher_id);
create index idx_exams_slug on exams(share_slug);

-- ---------------------------------------------------------
-- exam_settings  (1:1 with exams — set from the "Share" popup)
-- ---------------------------------------------------------
create table exam_settings (
  exam_id             uuid primary key references exams(id) on delete cascade,
  show_result_instantly boolean not null default true,
  due_at              timestamptz,             -- null = no deadline
  max_attempts        int,                     -- null = unlimited
  allow_anonymous     boolean not null default true,
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------
-- passages  (Reading — Part 2)
-- ---------------------------------------------------------
create table passages (
  id            uuid primary key default gen_random_uuid(),
  exam_id       uuid not null references exams(id) on delete cascade,
  title         text,
  body          text not null,
  order_index   int not null default 0
);

create index idx_passages_exam on passages(exam_id);

-- ---------------------------------------------------------
-- questions
-- ---------------------------------------------------------
create table questions (
  id              uuid primary key default gen_random_uuid(),
  exam_id         uuid not null references exams(id) on delete cascade,
  passage_id      uuid references passages(id) on delete set null, -- set only for Part 2
  part            int not null default 1 check (part in (1,2)),
  order_index     int not null default 0,
  question_type   text not null
                    check (question_type in
                      ('multiple_choice','fill_blank','writing_rewrite','writing_rearrange')),
  question_text   text not null,
  options         jsonb,          -- e.g. {"A":"who","B":"whom","C":"whose","D":"which"} ; null for non-MC
  correct_answer  text not null,  -- letter for MC; "a; b" style list for fill_blank/writing
  points          numeric not null default 1,
  explanation     text
);

create index idx_questions_exam on questions(exam_id);
create index idx_questions_passage on questions(passage_id);

-- ---------------------------------------------------------
-- subscribers  (per-teacher email list for "notify me on new exams")
-- ---------------------------------------------------------
create table subscribers (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references teachers(id) on delete cascade,
  email         text not null,
  subscribed_at timestamptz not null default now(),
  unsubscribe_token uuid not null default gen_random_uuid(),
  unique (teacher_id, email)
);

create index idx_subscribers_teacher on subscribers(teacher_id);

-- ---------------------------------------------------------
-- notifications_log  (optional but useful for debugging mail-merge sends)
-- ---------------------------------------------------------
create table notifications_log (
  id            uuid primary key default gen_random_uuid(),
  exam_id       uuid not null references exams(id) on delete cascade,
  sent_at       timestamptz not null default now(),
  recipient_count int not null default 0,
  status        text not null default 'sent' check (status in ('sent','failed'))
);

-- ---------------------------------------------------------
-- submissions  (one attempt by one student)
-- ---------------------------------------------------------
create table submissions (
  id              uuid primary key default gen_random_uuid(),
  exam_id         uuid not null references exams(id) on delete cascade,
  student_email   text,               -- null when fully anonymous
  student_name    text,
  attempt_number  int not null default 1,
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  auto_submitted  boolean not null default false,   -- true if the timer forced submission
  status          text not null default 'in_progress'
                    check (status in ('in_progress','submitted','graded')),
  total_score     numeric,
  max_score       numeric,
  reviewed_by_teacher boolean not null default false -- used when show_result_instantly = false
);

create index idx_submissions_exam on submissions(exam_id);
create index idx_submissions_email on submissions(student_email);

-- ---------------------------------------------------------
-- answers  (one row per question per submission)
-- ---------------------------------------------------------
create table answers (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references submissions(id) on delete cascade,
  question_id     uuid not null references questions(id) on delete cascade,
  student_answer  text,
  is_correct      boolean,           -- null until graded (writing needs Gemini call)
  ai_feedback     text,              -- short note from Gemini for writing questions
  points_awarded  numeric,
  unique (submission_id, question_id)
);

create index idx_answers_submission on answers(submission_id);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table teachers enable row level security;
alter table exams enable row level security;
alter table exam_settings enable row level security;
alter table passages enable row level security;
alter table questions enable row level security;
alter table subscribers enable row level security;
alter table notifications_log enable row level security;
alter table submissions enable row level security;
alter table answers enable row level security;

-- teachers: a teacher can only see/edit their own row
create policy teachers_self on teachers
  for all using (auth.uid() = id);

-- exams: teacher manages their own exams; anyone can read a PUBLISHED exam
-- (needed so students, who are not authenticated, can load it by share_slug)
create policy exams_owner_all on exams
  for all using (auth.uid() = teacher_id);

create policy exams_public_read on exams
  for select using (status = 'published');

-- exam_settings / passages / questions: readable together with a published exam,
-- writable only by the owning teacher
create policy exam_settings_owner on exam_settings
  for all using (
    exists (select 1 from exams e where e.id = exam_id and e.teacher_id = auth.uid())
  );
create policy exam_settings_public_read on exam_settings
  for select using (
    exists (select 1 from exams e where e.id = exam_id and e.status = 'published')
  );

create policy passages_owner on passages
  for all using (
    exists (select 1 from exams e where e.id = exam_id and e.teacher_id = auth.uid())
  );
create policy passages_public_read on passages
  for select using (
    exists (select 1 from exams e where e.id = exam_id and e.status = 'published')
  );

create policy questions_owner on questions
  for all using (
    exists (select 1 from exams e where e.id = exam_id and e.teacher_id = auth.uid())
  );
create policy questions_public_read on questions
  for select using (
    exists (select 1 from exams e where e.id = exam_id and e.status = 'published')
  );

-- subscribers / notifications_log: teacher-only
create policy subscribers_owner on subscribers
  for all using (auth.uid() = teacher_id);

create policy notifications_log_owner on notifications_log
  for select using (
    exists (select 1 from exams e where e.id = exam_id and e.teacher_id = auth.uid())
  );

-- submissions / answers: students write via a service-role API route (no direct
-- client access), teacher can read submissions/answers for their own exams
create policy submissions_teacher_read on submissions
  for select using (
    exists (select 1 from exams e where e.id = exam_id and e.teacher_id = auth.uid())
  );

create policy answers_teacher_read on answers
  for select using (
    exists (
      select 1 from submissions s
      join exams e on e.id = s.exam_id
      where s.id = submission_id and e.teacher_id = auth.uid()
    )
  );

-- NOTE: inserts for submissions/answers (student side) go through a Next.js API
-- route using the Supabase service-role key, bypassing RLS on purpose — this
-- keeps anonymous/email-only students from needing a Supabase auth session.
