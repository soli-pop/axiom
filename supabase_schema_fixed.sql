-- ============================================================
--  AXIOM INSTITUTIONAL PORTAL — CLEAN SUPABASE SCHEMA
--  Fixed: app_role() moved before protect_profile_updates()
--         get_email_by_username() added for anon login lookup
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
--  1) HELPER FUNCTIONS (must come first — referenced by triggers below)
-- ============================================================

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select p.role
    from public.profiles p
    where p.id = auth.uid()
    limit 1
$$;

create or replace function public.app_student_no()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select p.student_no
    from public.profiles p
    where p.id = auth.uid()
    limit 1
$$;

create or replace function public.teaches_subject(p_subject_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.subjects s
        where s.code = p_subject_code
          and s.instructor_id = auth.uid()
    )
$$;

-- Anon-safe RPC: resolves email from username before login (needed because
-- RLS blocks unauthenticated reads on profiles)
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
    select email
    from public.profiles
    where username = lower(p_username)
    limit 1;
$$;

-- ============================================================
--  2) CORE USER PROFILE
-- ============================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,
    email text unique not null,
    display_name text not null,
    full_name text not null,
    role text not null check (role in ('admin', 'teacher', 'student')),
    department text not null default 'Computer Science',
    student_no text unique,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (
        id,
        username,
        email,
        display_name,
        full_name,
        role,
        department,
        student_no,
        avatar_url
    )
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.email,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        'student',
        coalesce(new.raw_user_meta_data->>'department', 'Computer Science'),
        null,
        coalesce(new.raw_user_meta_data->>'avatar_url', null)
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.protect_profile_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if public.app_role() <> 'admin' then
        if new.id <> old.id
           or new.username <> old.username
           or new.email <> old.email
           or new.role <> old.role
           or new.student_no is distinct from old.student_no
           or new.department <> old.department
           or new.full_name <> old.full_name then
            raise exception 'restricted profile fields cannot be modified';
        end if;
    end if;

    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_profiles_protect_update on public.profiles;

create trigger trg_profiles_protect_update
before update on public.profiles
for each row
execute function public.protect_profile_updates();

-- ============================================================
--  3) STUDENTS
-- ============================================================

create table if not exists public.students (
    id text primary key,
    user_id uuid unique references public.profiles(id) on delete set null,
    name text not null,
    program text not null,
    year_level integer not null default 1 check (year_level between 1 and 6),
    gpa numeric(4,2) check (gpa >= 0 and gpa <= 5),
    status text not null default 'Enrolled'
        check (status in ('Enrolled', 'Probation', 'LOA', 'Graduated', 'Dropped')),
    created_at timestamptz not null default now()
);

-- ============================================================
--  4) SUBJECTS
-- ============================================================

create table if not exists public.subjects (
    code text primary key,
    title text not null,
    units integer not null default 3 check (units between 1 and 6),
    year_level integer not null default 1 check (year_level between 1 and 6),
    dept text not null,
    schedule text,
    room text,
    instructor_id uuid references public.profiles(id) on delete set null,
    instructor_name text,
    description text,
    prereq_code text references public.subjects(code) on delete set null
);

-- ============================================================
--  5) ENROLLMENT
-- ============================================================

create table if not exists public.enrollment (
    id uuid primary key default gen_random_uuid(),
    student_id text not null references public.students(id) on delete cascade,
    subject_code text not null references public.subjects(code) on delete cascade,
    semester text not null check (semester in ('1st Semester', '2nd Semester', 'Summer')),
    school_year text not null,
    enrolled_at timestamptz not null default now(),
    unique (student_id, subject_code, semester, school_year)
);

create index if not exists idx_enrollment_student_id on public.enrollment(student_id);
create index if not exists idx_enrollment_subject_code on public.enrollment(subject_code);

-- ============================================================
--  6) GRADES
-- ============================================================

create table if not exists public.grades (
    id uuid primary key default gen_random_uuid(),
    student_id text not null references public.students(id) on delete cascade,
    subject_code text not null references public.subjects(code) on delete cascade,
    period text not null check (period in ('Prelim', 'Midterm', 'Finals')),
    quiz numeric(5,2) not null default 0 check (quiz >= 0 and quiz <= 100),
    exam numeric(5,2) not null default 0 check (exam >= 0 and exam <= 100),
    project numeric(5,2) not null default 0 check (project >= 0 and project <= 100),
    updated_at timestamptz not null default now(),
    unique (student_id, subject_code, period)
);

create index if not exists idx_grades_student_id on public.grades(student_id);
create index if not exists idx_grades_subject_code on public.grades(subject_code);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_grades_set_updated_at on public.grades;

create trigger trg_grades_set_updated_at
before update on public.grades
for each row
execute function public.set_updated_at();

-- ============================================================
--  7) ANNOUNCEMENTS
-- ============================================================

create table if not exists public.announcements (
    id bigint generated always as identity primary key,
    tag text not null,
    category text not null check (category in ('general', 'activity', 'board', 'event')),
    title text not null,
    body text not null,
    created_at timestamptz not null default now()
);

-- ============================================================
--  8) EVENTS
-- ============================================================

create table if not exists public.events (
    id bigint generated always as identity primary key,
    type text not null check (type in ('Sports', 'Academic', 'Cultural', 'Special')),
    title text not null,
    event_date date not null,
    venue text,
    description text,
    created_at timestamptz not null default now()
);

-- ============================================================
--  9) SOA FEES
-- ============================================================

create table if not exists public.soa_fees (
    id uuid primary key default gen_random_uuid(),
    student_id text not null references public.students(id) on delete cascade,
    label text not null,
    amount numeric(10,2) not null check (amount >= 0),
    created_at timestamptz not null default now()
);

create index if not exists idx_soa_fees_student_id on public.soa_fees(student_id);

-- ============================================================
--  10) SOA PAYMENTS
-- ============================================================

create table if not exists public.soa_payments (
    id uuid primary key default gen_random_uuid(),
    student_id text not null references public.students(id) on delete cascade,
    payment_date date not null,
    reference_no text unique,
    amount numeric(10,2) not null check (amount >= 0),
    method text,
    created_at timestamptz not null default now()
);

create index if not exists idx_soa_payments_student_id on public.soa_payments(student_id);

-- ============================================================
--  11) RLS ENABLEMENT
-- ============================================================

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.enrollment enable row level security;
alter table public.grades enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.soa_fees enable row level security;
alter table public.soa_payments enable row level security;

-- ============================================================
--  12) GRANTS
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on public.announcements to anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.subjects to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.enrollment to authenticated;
grant select, insert, update, delete on public.grades to authenticated;
grant select, insert, update, delete on public.soa_fees to authenticated;
grant select, insert, update, delete on public.soa_payments to authenticated;

grant usage, select on all sequences in schema public to authenticated;

grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- ============================================================
--  13) POLICIES
-- ============================================================

-- announcements
drop policy if exists "public can read announcements" on public.announcements;
create policy "public can read announcements"
on public.announcements for select to public using (true);

-- events
drop policy if exists "public can read events" on public.events;
create policy "public can read events"
on public.events for select to public using (true);

-- subjects
drop policy if exists "public can read subjects" on public.subjects;
create policy "public can read subjects"
on public.subjects for select to public using (true);

-- profiles
drop policy if exists "admin can manage profiles" on public.profiles;
create policy "admin can manage profiles"
on public.profiles for all to authenticated
using (public.app_role() = 'admin')
with check (public.app_role() = 'admin');

drop policy if exists "user can read own profile" on public.profiles;
create policy "user can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

drop policy if exists "user can update own profile" on public.profiles;
create policy "user can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- students
drop policy if exists "admin can manage students" on public.students;
create policy "admin can manage students"
on public.students for all to authenticated
using (public.app_role() = 'admin')
with check (public.app_role() = 'admin');

drop policy if exists "student can read own student row" on public.students;
create policy "student can read own student row"
on public.students for select to authenticated
using (
    public.app_role() = 'student'
    and id = public.app_student_no()
);

drop policy if exists "teacher can read students in taught subjects" on public.students;
create policy "teacher can read students in taught subjects"
on public.students for select to authenticated
using (
    public.app_role() = 'teacher'
    and exists (
        select 1
        from public.enrollment e
        join public.subjects s on s.code = e.subject_code
        where e.student_id = id
          and s.instructor_id = auth.uid()
    )
);

-- enrollment
drop policy if exists "admin can manage enrollment" on public.enrollment;
create policy "admin can manage enrollment"
on public.enrollment for all to authenticated
using (public.app_role() = 'admin')
with check (public.app_role() = 'admin');

drop policy if exists "student can read own enrollment" on public.enrollment;
create policy "student can read own enrollment"
on public.enrollment for select to authenticated
using (
    public.app_role() = 'student'
    and student_id = public.app_student_no()
);

drop policy if exists "teacher can read enrollment for taught subjects" on public.enrollment;
create policy "teacher can read enrollment for taught subjects"
on public.enrollment for select to authenticated
using (
    public.app_role() = 'teacher'
    and exists (
        select 1
        from public.subjects s
        where s.code = subject_code
          and s.instructor_id = auth.uid()
    )
);

-- grades
drop policy if exists "admin can manage grades" on public.grades;
create policy "admin can manage grades"
on public.grades for all to authenticated
using (public.app_role() = 'admin')
with check (public.app_role() = 'admin');

drop policy if exists "student can read own grades" on public.grades;
create policy "student can read own grades"
on public.grades for select to authenticated
using (
    public.app_role() = 'student'
    and student_id = public.app_student_no()
);

drop policy if exists "teacher can manage grades for taught subjects" on public.grades;
create policy "teacher can manage grades for taught subjects"
on public.grades for all to authenticated
using (
    public.app_role() = 'teacher'
    and public.teaches_subject(subject_code)
)
with check (
    public.app_role() = 'teacher'
    and public.teaches_subject(subject_code)
);

-- soa_fees
drop policy if exists "admin can manage soa_fees" on public.soa_fees;
create policy "admin can manage soa_fees"
on public.soa_fees for all to authenticated
using (public.app_role() = 'admin')
with check (public.app_role() = 'admin');

drop policy if exists "student can read own soa_fees" on public.soa_fees;
create policy "student can read own soa_fees"
on public.soa_fees for select to authenticated
using (
    public.app_role() = 'student'
    and student_id = public.app_student_no()
);

-- soa_payments
drop policy if exists "admin can manage soa_payments" on public.soa_payments;
create policy "admin can manage soa_payments"
on public.soa_payments for all to authenticated
using (public.app_role() = 'admin')
with check (public.app_role() = 'admin');

drop policy if exists "student can read own soa_payments" on public.soa_payments;
create policy "student can read own soa_payments"
on public.soa_payments for select to authenticated
using (
    public.app_role() = 'student'
    and student_id = public.app_student_no()
);

-- ============================================================
--  14) SAMPLE DATA
-- ============================================================

insert into public.students (id, name, program, year_level, gpa, status) values
('SN-2401', 'Alexa Vega',    'BS Computer Science',       2, 1.65, 'Enrolled'),
('SN-2402', 'Marco Reyes',   'BS Information Technology', 3, 1.90, 'Enrolled'),
('SN-2403', 'Sophia Tan',    'BS Mathematics',            1, 1.25, 'Probation'),
('SN-2404', 'Ethan Lim',     'BS Physics',                4, 2.10, 'Enrolled'),
('SN-2405', 'Chloe Santos',  'BS Computer Science',       2, 1.50, 'LOA'),
('SN-2406', 'Jay Mendoza',   'BS Computer Science',       1, 1.30, 'Enrolled')
on conflict (id) do nothing;

insert into public.subjects
(code, title, units, year_level, dept, schedule, room, instructor_name, description, prereq_code)
values
('CS101',   'Introduction to Computing',       3, 1, 'Computer Science',       'MWF 07:30-08:30',  'Room 101', 'Prof. R. Cruz',     'Fundamentals of computing, hardware, software, and basic programming concepts.',                null),
('MATH101', 'Calculus I',                      3, 1, 'Mathematics',            'TTh 08:00-09:30',  'Room 105', 'Prof. D. Tan',      'Limits, derivatives, and applications of differentiation.',                                   null),
('ENG101',  'Technical Communication',         3, 1, 'Computer Science',       'MWF 09:30-10:30',  'Room 102', 'Prof. S. Gomez',    'Principles of technical writing, oral communication, and presentation skills.',               null),
('CS201',   'Object-Oriented Programming',     3, 2, 'Computer Science',       'MWF 10:30-11:30',  'Lab 1',    'Prof. M. Luna',     'Classes, inheritance, polymorphism, encapsulation using Java and Python.',                    'CS101'),
('CS301',   'Data Structures & Algorithms',    3, 2, 'Computer Science',       'MWF 08:00-09:00',  'Room 201', 'Prof. M. Luna',     'Arrays, linked lists, trees, graphs, sorting, and algorithm complexity analysis.',            'CS201'),
('CS302',   'Database Systems',                3, 2, 'Computer Science',       'TTh 10:00-11:30',  'Lab 2',    'Prof. R. Santos',   'Relational DB design, SQL, normalization, transactions, and intro NoSQL.',                    'CS201'),
('MATH301', 'Discrete Mathematics',            3, 2, 'Mathematics',            'TTh 13:00-14:30',  'Room 305', 'Prof. D. Tan',      'Logic, sets, combinatorics, graph theory, and formal proof techniques.',                      'MATH101'),
('CS303',   'Operating Systems',               3, 3, 'Computer Science',       'MWF 13:00-14:00',  'Room 204', 'Prof. C. Lim',     'Process management, memory management, file systems, scheduling, and concurrency.',           'CS201'),
('CS401',   'Software Engineering',            3, 3, 'Computer Science',       'TTh 08:00-09:30',  'Room 301', 'Prof. M. Luna',     'SDLC, agile methodologies, software design patterns, testing, and project management.',       'CS302'),
('CS402',   'Computer Networks',               3, 3, 'Computer Science',       'MWF 15:00-16:00',  'Lab 3',    'Prof. R. Cruz',     'Network architectures, protocols, TCP/IP stack, routing, and network security.',              'CS303'),
('IT301',   'Systems Analysis & Design',       3, 2, 'Information Technology', 'TTh 15:00-16:30',  'Room 202', 'Prof. L. Bautista', 'System development life cycle, requirements analysis, and system modeling.',                  'CS201'),
('IT401',   'Web Development Technologies',    3, 3, 'Information Technology', 'MWF 11:30-12:30',  'Lab 1',    'Prof. L. Bautista', 'HTML5, CSS3, JavaScript, React, Node.js, and RESTful API development.',                      'IT301')
on conflict (code) do nothing;

insert into public.enrollment (student_id, subject_code, semester, school_year) values
('SN-2401', 'CS301',   '2nd Semester', 'AY 2025-2026'),
('SN-2401', 'CS302',   '2nd Semester', 'AY 2025-2026'),
('SN-2401', 'MATH301', '2nd Semester', 'AY 2025-2026'),
('SN-2401', 'CS303',   '2nd Semester', 'AY 2025-2026'),
('SN-2401', 'IT301',   '2nd Semester', 'AY 2025-2026')
on conflict (student_id, subject_code, semester, school_year) do nothing;

insert into public.grades (student_id, subject_code, period, quiz, exam, project) values
('SN-2401', 'CS301', 'Prelim',  85, 88, 90),
('SN-2402', 'CS301', 'Prelim',  78, 82, 80),
('SN-2403', 'CS301', 'Prelim',  92, 95, 94),
('SN-2404', 'CS301', 'Prelim',  74, 79, 76),
('SN-2401', 'CS301', 'Midterm', 87, 89, 91),
('SN-2402', 'CS301', 'Midterm', 75, 80, 78),
('SN-2403', 'CS301', 'Midterm', 90, 93, 92),
('SN-2404', 'CS301', 'Midterm', 72, 77, 74)
on conflict (student_id, subject_code, period) do nothing;

insert into public.announcements (tag, category, title, body) values
('URGENT',   'general',  'Enrollment Period Open',              'Sem 2 AY 2025–26 enrollment is now open. Visit the registrar''s office.'),
('DEADLINE', 'general',  'Grade Submission Deadline',           'Period 1 final grades due April 10, 5:00 PM sharp. No extensions.'),
('INFO',     'general',  'Library System Maintenance',          'Digital library will be unavailable April 8, 10 PM – 2 AM.'),
('ACTIVITY', 'activity', 'Intramural Sports Week Registration', 'Sign up for intramural sports at the Gym Office until April 12. Open to all enrolled students.'),
('ACTIVITY', 'activity', 'Cultural Night Auditions',            'Auditions for the Annual Cultural Night on April 20. Report to the CAS Lobby at 3:00 PM.'),
('ACTIVITY', 'activity', 'Research Symposium — Paper Submissions', 'Submit research abstracts to the Dean''s Office by April 15. Full papers due April 25.'),
('BOARD',    'board',    '2026 NLE Passers — Nursing Batch',    'Congratulations to our 8 graduates who passed the 2026 Nursing Licensure Exam with a 100% passing rate!'),
('BOARD',    'board',    '2025 Philippine Bar Exam Passers',    'We proudly announce 3 graduates who passed the 2025 Philippine Bar Examination. Excellence continues!'),
('BOARD',    'board',    'Civil Engineering Board Exam Results','4 BS Civil Engineering graduates passed the 2026 Civil Engineering Board Examination. Congratulations!'),
('EVENT',    'event',    'Mid-Year Faculty Symposium',          'All faculty must attend the annual symposium on April 15. Venue: AVR, 8:00 AM sharp.');

insert into public.events (type, title, event_date, venue, description) values
('Sports',   'Intramural Sports Week',       '2026-04-14', 'Main Gymnasium',    'Annual inter-department sports competition open to all students.'),
('Academic', 'Leadership Summit 2026',       '2026-04-22', 'Auditorium',        'Leadership development seminar for student council officers and club presidents.'),
('Cultural', 'Annual Cultural Night',        '2026-04-28', 'Open Amphitheater', 'Showcase of arts, performances, and cultural heritage from all departments.'),
('Academic', 'Research & Innovation Expo',   '2026-05-05', 'Main Lobby',        'Exhibition of outstanding student research projects and innovations.'),
('Special',  'Graduation Ceremony 2026',     '2026-05-20', 'Civic Center',      'Commencement exercises for graduating students of AY 2025–2026.'),
('Sports',   'Inter-School Basketball Cup',  '2026-05-08', 'Sports Complex',    'Annual inter-school basketball tournament hosted by the College of Sport Sciences.');

insert into public.soa_fees (student_id, label, amount) values
('SN-2401', 'Tuition Fee (18 units × ₱850)', 15300),
('SN-2401', 'Registration Fee',                  500),
('SN-2401', 'Library Fee',                        200),
('SN-2401', 'Laboratory Fee',                     800),
('SN-2401', 'Student Services Fee',               300),
('SN-2401', 'Athletics Fee',                      150),
('SN-2401', 'Medical / Dental Fee',               200);

insert into public.soa_payments (student_id, payment_date, reference_no, amount, method) values
('SN-2401', '2026-01-15', 'OR-2026-0001', 8500, 'Online Banking'),
('SN-2401', '2026-02-01', 'OR-2026-0089', 5000, 'Counter Payment');
