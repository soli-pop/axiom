import { supabase, setLocalSession, getLocalSession, clearLocalSession } from './supabase';

/* ─── AUTH ──────────────────────────────────────────────────── */

export const login = async (usernameOrEmail, password) => {
  const identifier = usernameOrEmail.toLowerCase();
  
  // Queries your custom users table accepting either username or email
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.eq.${identifier},email.eq.${identifier}`)
    .single();

  if (error || !user) throw new Error("Invalid credentials");
  
  // Note: For production, this should be a bcrypt check on the server (api/send-otp.js)
  // But for frontend mock parity:
  if (user.pass_hash !== password) throw new Error("Invalid credentials");

  setLocalSession(user);
  return user;
};

export const logout = () => {
  clearLocalSession();
};

export const currentUser = () => getLocalSession();

/* ─── STUDENTS ──────────────────────────────────────────────── */

export const getStudents = async () => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');
    
  if (error) throw error;
  
  return data.map(r => ({
    id:      r.id, // e.g. SN-2401
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
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', sbId);
    
  if (error) throw error;
};

/* ─── SUBJECTS ──────────────────────────────────────────────── */

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
    instructor: r.instructor,
    desc:       r.description,
    pre:        r.prereq || 'None',
    _sbId:      r.code,
  }));
};

/* ─── ENROLLMENT ────────────────────────────────────────────── */

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
  const { error } = await supabase
    .from('enrollment')
    .delete()
    .eq('id', enrollmentId);
    
  if (error) throw error;
};

/* ─── GRADES ────────────────────────────────────────────────── */

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

/* ─── ANNOUNCEMENTS ─────────────────────────────────────────── */

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

/* ─── EVENTS ────────────────────────────────────────────────── */

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
      
