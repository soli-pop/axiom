import { supabase, setLocalSession, getLocalSession, clearLocalSession } from './supabase';

/* ─── CREATE USER (Signup) ───────────────────────────────────────────────────
 *  The schema has NO public.users table. Auth lives in auth.users (Supabase
 *  Auth) and the `handle_new_user` trigger auto-creates a row in
 *  public.profiles after every auth.signUp. We must NEVER insert directly
 *  into public.profiles from the client — the trigger handles it.
 * ─────────────────────────────────────────────────────────────────────────── */
export const createUser = async (data) => {
  // NOTE: No pre-signup duplicate check here — querying profiles before auth
  // runs as anon role which has no SELECT permission and causes "permission denied".
  // Duplicate emails are rejected by Supabase Auth automatically.
  // Duplicate usernames are caught by the DB unique constraint on profiles.username
  // and surfaced as a clear error message below.

  // Auth signup — trigger will INSERT into public.profiles automatically.
  // Extra fields are passed as raw_user_meta_data so handle_new_user() picks them up.
  const { data: result, error } = await supabase.auth.signUp({
    email:    data.email.toLowerCase(),
    password: data.pass,                                    // FIX: was stored as plain pass_hash column
    options: {
      data: {
        username:     data.username.toLowerCase(),          // FIX: column is 'username' in profiles
        display_name: data.name,                            // FIX: was 'name' — column is 'display_name'
        full_name:    data.name,                            // FIX: was missing — column is 'full_name'
        department:   data.dept,                            // FIX: was 'dept' — column is 'department'
        avatar_url:   data.avatar || null,                  // FIX: was 'avatar' — column is 'avatar_url'
        // student_no is intentionally omitted at signup; admin assigns it later
      },
    },
  });

  if (error) {
    // Surface duplicate username/email as a friendly message
    if (error.message.includes('unique') || error.message.includes('duplicate') || error.message.includes('already registered'))
      throw new Error('Username or email already exists.');
    throw new Error(error.message);
  }

  // Sign out immediately so the user goes through the full login + OTP flow
  await supabase.auth.signOut();

  return result.user;
};

/* ─── SOA ─────────────────────────────────────────────────────────────────── */
export const getSOA = async (studentId) => {
  const { data: fees, error: feesErr } = await supabase
    .from('soa_fees')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at');

  const { data: payments, error: payErr } = await supabase
    .from('soa_payments')
    .select('*')
    .eq('student_id', studentId)
    .order('payment_date');

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (feesErr || payErr) return null; // fall back to static data
  return { fees, payments, student };
};

/* ─── AUTH ───────────────────────────────────────────────────────────────────
 *  Login must use supabase.auth.signInWithPassword() — not a custom users
 *  table. Passwords are managed by Supabase Auth, never stored in profiles.
 *  Because the app allows login by username OR email, we resolve the email
 *  first via the get_email_by_username() RPC (security-definer, anon-safe).
 * ─────────────────────────────────────────────────────────────────────────── */
export const login = async (usernameOrEmail, password) => {
  const identifier = usernameOrEmail.toLowerCase().trim();

  // ── 1. Resolve email from username if needed ────────────────────────────────
  let email = identifier;
  if (!identifier.includes('@')) {
    // FIX: was querying public.users — table doesn't exist.
    //      Use the anon-accessible RPC instead (add this fn to your schema —
    //      see the SQL snippet provided alongside this file).
    const { data: resolved, error: rpcErr } = await supabase
      .rpc('get_email_by_username', { p_username: identifier });

    if (rpcErr || !resolved) throw new Error('Invalid username or password.');
    email = resolved;
  }

  // ── 2. Authenticate via Supabase Auth ──────────────────────────────────────
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password, // FIX: was comparing plain text pass_hash on the client — insecure
  });
  if (authErr || !authData?.user) throw new Error('Invalid username or password.');

  // ── 3. Fetch full profile from public.profiles ─────────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')                                       // FIX: was 'users'
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileErr || !profile) throw new Error('User profile not found.');

  // ── 4. Map profile columns → app's user shape ──────────────────────────────
  const user = {
    id:           profile.id,
    username:     profile.username,
    email:        profile.email,
    display_name: profile.display_name,
    name:         profile.display_name || profile.full_name,  // FIX: was 'name' column
    role:         profile.role,
    dept:         profile.department,                          // FIX: was 'dept' column
    avatar:       profile.avatar_url ||
                  (profile.display_name || profile.username).slice(0, 2).toUpperCase(), // FIX: was 'avatar' column
    idno:         profile.student_no || '',                    // FIX: was 'idno' column
  };

  setLocalSession(user);
  return user;
};

export const logout = async () => {
  await supabase.auth.signOut();
  clearLocalSession();
};

export const currentUser = () => getLocalSession();

/* ─── STUDENTS ────────────────────────────────────────────────────────────── */
export const getStudents = async () => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');

  if (error) throw error;

  return data.map(r => ({
    id:      r.id,
    name:    r.name,
    program: r.program,
    yr:      r.year_level,
    gpa:     r.gpa,
    status:  r.status,
    _sbId:   r.id,
  }));
};

export const createStudent = async (data) => {
  const { data: result, error } = await supabase
    .from('students')
    .insert({
      id:         data.id,
      name:       data.name,
      program:    data.program,
      year_level: Number(data.yr),
      gpa:        Number(data.gpa),
      status:     data.status,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const updateStudent = async (sbId, data) => {
  const { data: result, error } = await supabase
    .from('students')
    .update({
      name:       data.name,
      program:    data.program,
      year_level: Number(data.yr),
      gpa:        Number(data.gpa),
      status:     data.status,
    })
    .eq('id', sbId)
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const deleteStudent = async (sbId) => {
  const { error } = await supabase.from('students').delete().eq('id', sbId);
  if (error) throw error;
};

/* ─── SUBJECTS ────────────────────────────────────────────────────────────── */
export const getSubjects = async () => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('code');

  if (error) throw error;

  return data.map(r => ({
    code:       r.code,
    title:      r.title,
    units:      r.units,
    yr:         r.year_level,
    dept:       r.dept,
    schedule:   r.schedule,
    room:       r.room,
    instructor: r.instructor_name,    // FIX: was r.instructor — column is 'instructor_name'
    desc:       r.description,
    pre:        r.prereq_code || 'None', // FIX: was r.prereq — column is 'prereq_code'
    _sbId:      r.code,
  }));
};

/* ─── ENROLLMENT ──────────────────────────────────────────────────────────── */
export const getEnrollment = async (studentId, semester) => {
  const { data, error } = await supabase
    .from('enrollment')
    .select('id, subject_code, subjects(*)')
    .eq('student_id', studentId)
    .eq('semester', semester);

  if (error) throw error;

  return data.map(r => ({
    enrollmentId: r.id,
    ...r.subjects,
  })).filter(r => r.code);
};

export const enrollSubject = async (studentId, subjectCode, semester, schoolYear = 'AY 2025-2026') => {
  const { error } = await supabase
    .from('enrollment')
    .insert({
      student_id:   studentId,
      subject_code: subjectCode,
      semester,
      school_year:  schoolYear,
    });

  if (error) throw error;
};

export const dropSubject = async (enrollmentId) => {
  const { error } = await supabase.from('enrollment').delete().eq('id', enrollmentId);
  if (error) throw error;
};

/* ─── GRADES ──────────────────────────────────────────────────────────────── */
export const getGrades = async (subjectCode, period) => {
  const { data, error } = await supabase
    .from('grades')
    .select('*, students(name)')
    .eq('subject_code', subjectCode)
    .eq('period', period);

  if (error) throw error;

  return data.map(r => ({
    id:    r.student_id ?? '',
    name:  r.students?.name ?? '',
    quiz:  r.quiz ?? 0,
    exam:  r.exam ?? 0,
    proj:  r.project ?? 0,
    _sbId: r.id,
  }));
};

export const saveGrade = async ({ sbId, studentId, subjectCode, period, quiz, exam, proj }) => {
  if (sbId) {
    const { error } = await supabase
      .from('grades')
      .update({ quiz, exam, project: proj })
      .eq('id', sbId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('grades')
    .insert({
      student_id:   studentId,
      subject_code: subjectCode,
      period,
      quiz,
      exam,
      project: proj,
    });

  if (error) throw error;
};

/* ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────── */
export const getAnnouncements = async () => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(r => ({
    id:    r.id,
    tag:   r.tag,
    cat:   r.category,
    title: r.title,
    body:  r.body,
  }));
};

export const createAnnouncement = async (data) => {
  const { error } = await supabase.from('announcements').insert(data);
  if (error) throw error;
};

export const deleteAnnouncement = async (id) => {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
};

/* ─── EVENTS ──────────────────────────────────────────────────────────────── */
export const getEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at');

  if (error) throw error;

  return data.map(r => ({
    id:    r.id,
    type:  r.type,
    title: r.title,
    date:  r.event_date,
    venue: r.venue,
    desc:  r.description,
  }));
};
