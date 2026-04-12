import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, Bell,
  LogOut, ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  Eye, EyeOff, Check, X, AlertTriangle, Shield,
  GraduationCap, TrendingUp, Clock, Lock, Menu, Search,
  UserCheck, BarChart3, BookMarked, Star,
  ArrowLeft, Mail, UserPlus, RefreshCw,
  Receipt, Calendar, FileText, Settings as SettingsIcon,
  Trophy, Sun, Moon, Camera, CreditCard,
  Megaphone, Award, BookCheck, ChevronLeft, Download
} from "lucide-react";
import {
  login as dbLogin, createUser,
  getStudents, createStudent, updateStudent, deleteStudent,
  getSubjects,
  getGrades, saveGrade,
  getEnrollment, enrollSubject, dropSubject,
  getAnnouncements,
  getEvents,
  getSOA,
} from './db';
import { supabase, getLocalSession, setLocalSession, clearLocalSession } from './supabase';

/* ────────────────── STYLES ────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --base:#1A1D21;--surf:#242830;--surf2:#2C3039;--surf3:#343B45;
  --acc:#2A5B52;--acc-h:#347A6E;--acc-d:#1E4039;
  --mint:#A3D1C6;--mint2:rgba(163,209,198,0.6);--mint3:rgba(163,209,198,0.15);
  --text:#E8EAF0;--muted:#7B8499;--dim:#4A5068;
  --danger:#C0392B;--danger-h:#E74C3C;--warn:#D4A017;--success:#27AE60;
  --neo:-4px -4px 12px rgba(255,255,255,0.033),4px 4px 12px rgba(0,0,0,0.55);
  --neo-sm:-2px -2px 6px rgba(255,255,255,0.028),2px 2px 6px rgba(0,0,0,0.48);
  --neo-in:inset -2px -2px 5px rgba(255,255,255,0.028),inset 2px 2px 5px rgba(0,0,0,0.45);
  --r:14px;--r-sm:9px;--r-xs:6px;
  --ff:'Sora',sans-serif;--ff-brand:'Cormorant Garamond',serif;--ff-mono:'JetBrains Mono',monospace;
  --sidebar:240px;--bnav:62px;--ease:cubic-bezier(0.4,0,0.2,1)
}
[data-theme="light"]{
  --base:#FFFFFF;
  --surf:#E8F5F1;--surf2:#DAEEE8;--surf3:#CCE6DF;
  --text:#0F1923;--muted:#3D5260;--dim:#6B8898;
  --mint:#1A6B5E;--mint2:rgba(26,107,94,0.45);--mint3:rgba(26,107,94,0.1);
  --neo:0 2px 14px rgba(26,107,94,0.11),0 1px 4px rgba(0,0,0,0.07);
  --neo-sm:0 1px 8px rgba(26,107,94,0.10),0 1px 2px rgba(0,0,0,0.05);
  --neo-in:inset 0 1px 4px rgba(0,0,0,0.08),inset 0 0 0 1px rgba(26,107,94,0.09)
}
[data-theme="light"] body{background:#FFFFFF}
[data-theme="light"] .btn-pri{color:#fff}
[data-theme="light"] .tab-btn.active{color:#fff}
[data-theme="light"] .badge{filter:brightness(0.68) saturate(1.35)}
[data-theme="light"] .neo-input{background:#fff;color:var(--text);border-color:rgba(26,107,94,0.18)}
[data-theme="light"] .neo-input:focus{border-color:rgba(26,107,94,0.45)}
[data-theme="light"] .neo-input::placeholder{color:#8BA5B0}
[data-theme="light"] .dt th{border-bottom-color:rgba(26,107,94,0.13);color:var(--muted)}
[data-theme="light"] .dt td{border-bottom-color:rgba(26,107,94,0.07)}
[data-theme="light"] .dt tbody tr:hover td{background:rgba(26,107,94,0.06)}
[data-theme="light"] .si-item.active{color:var(--mint);background:rgba(26,107,94,0.12);border-color:rgba(26,107,94,0.22)}
[data-theme="light"] .toggle-track{background:var(--surf3)}
[data-theme="light"] .btn-ghost{border-color:rgba(26,107,94,0.2);color:var(--muted)}
[data-theme="light"] .btn-ghost:hover{background:var(--surf2);color:var(--text)}
html,body{height:100%;min-height:100dvh}
body{font-family:var(--ff);background:var(--base);color:var(--text);overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.55}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--acc);border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
@keyframes skelPulse{0%,100%{opacity:0.3}50%{opacity:0.6}}
@keyframes toastIn{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 12px rgba(163,209,198,0.1)}50%{box-shadow:0 0 24px rgba(163,209,198,0.3)}}
@keyframes carouselScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fu{animation:fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both}
.fi{animation:fadeIn 0.3s ease both}
.si{animation:scaleIn 0.28s cubic-bezier(0.22,1,0.36,1) both}
.d1{animation-delay:.08s}.d2{animation-delay:.16s}.d3{animation-delay:.24s}.d4{animation-delay:.32s}.d5{animation-delay:.42s}.d6{animation-delay:.52s}
.skel{background:var(--surf2);animation:skelPulse 1.5s ease-in-out infinite;border-radius:6px}
.neo{box-shadow:var(--neo);background:var(--surf);border-radius:var(--r)}
.neo-sm{box-shadow:var(--neo-sm);background:var(--surf);border-radius:var(--r-sm)}
.neo-input{box-shadow:var(--neo-in);background:var(--base);border:1px solid rgba(163,209,198,0.08);border-radius:var(--r-sm);color:var(--text);font-family:var(--ff);font-size:13.5px;padding:11px 14px;outline:none;transition:border-color .2s var(--ease);width:100%}
.neo-input:focus{border-color:rgba(163,209,198,0.35)}
.neo-input::placeholder{color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:none;cursor:pointer;font-family:var(--ff);font-size:13px;font-weight:500;padding:9px 17px;border-radius:var(--r-sm);transition:all .15s var(--ease);outline:none;white-space:nowrap;user-select:none}
.btn-pri{background:var(--acc);color:var(--mint);box-shadow:var(--neo-sm)}
.btn-pri:hover{background:var(--acc-h);transform:translateY(-1px);box-shadow:var(--neo-sm),0 4px 18px rgba(42,91,82,0.35)}
.btn-pri:active{transform:translateY(0);box-shadow:var(--neo-in)}
.btn-pri:disabled{opacity:0.55;cursor:not-allowed;transform:none}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid rgba(163,209,198,0.12)}
.btn-ghost:hover{background:var(--surf2);color:var(--text)}
.btn-dang{background:var(--danger);color:#fff;box-shadow:var(--neo-sm)}
.btn-dang:hover{background:var(--danger-h);transform:translateY(-1px)}
.btn-dang:active{transform:translateY(0);box-shadow:var(--neo-in)}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:var(--r-xs)}
.btn-icon{padding:7px;border-radius:var(--r-xs)}
input.ri{display:none}
input.ri+label{display:flex;align-items:center;gap:10px;cursor:pointer;padding:9px 13px;border-radius:10px;border:1px solid transparent;transition:all .2s var(--ease);font-size:13px;color:var(--muted);user-select:none}
.rdot{width:15px;height:15px;border-radius:50%;border:2px solid var(--muted);box-shadow:var(--neo-in);transition:all .2s var(--ease);flex-shrink:0}
input.ri:checked+label{color:var(--mint);border-color:rgba(163,209,198,0.2);background:rgba(42,91,82,0.12)}
input.ri:checked+label .rdot{border-color:var(--mint);background:var(--acc-h);box-shadow:0 0 8px rgba(163,209,198,0.3)}
.modal-wrap{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.68);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease}
.modal-card{animation:scaleIn .26s cubic-bezier(0.22,1,0.36,1)}
.toast-wrap{position:fixed;top:16px;right:16px;z-index:300;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{padding:10px 15px;border-radius:10px;font-size:12.5px;font-weight:500;animation:toastIn .35s cubic-bezier(0.22,1,0.36,1) both;box-shadow:0 8px 24px rgba(0,0,0,0.45);pointer-events:auto;display:flex;align-items:center;gap:8px;max-width:290px}
.acc-body{max-height:0;overflow:hidden;transition:max-height .38s cubic-bezier(0.4,0,0.2,1)}
.acc-body.open{max-height:500px}
.tab-btn{padding:7px 17px;border-radius:var(--r-sm);font-size:12.5px;font-weight:500;color:var(--muted);background:transparent;border:none;cursor:pointer;transition:all .18s var(--ease);font-family:var(--ff)}
.tab-btn.active{background:var(--acc);color:var(--mint);box-shadow:var(--neo-sm)}
.si-item{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:10px;cursor:pointer;transition:all .2s var(--ease);font-size:12.5px;color:var(--muted);border:1px solid transparent;user-select:none}
.si-item:hover{color:var(--text);background:var(--surf2)}
.si-item.active{color:var(--mint);background:rgba(42,91,82,0.18);border-color:rgba(163,209,198,0.12);box-shadow:var(--neo-sm)}
.dt{width:100%;border-collapse:collapse;font-size:12.5px}
.dt th{text-align:left;padding:9px 12px;color:var(--muted);font-weight:500;border-bottom:1px solid rgba(163,209,198,0.08);font-size:11px;letter-spacing:.07em;text-transform:uppercase}
.dt td{padding:9px 12px;border-bottom:1px solid rgba(163,209,198,0.05);vertical-align:middle}
.dt tbody tr{transition:background .15s}
.dt tbody tr:hover td{background:rgba(163,209,198,0.04)}
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10.5px;font-weight:600;letter-spacing:.04em}
.car-track{display:flex;gap:14px;animation:carouselScroll 22s linear infinite}
.car-track:hover{animation-play-state:paused}
@media(max-width:768px){.desk{display:none!important}.mob-nav{display:flex!important}}
@media(min-width:769px){.mob{display:none!important}.mob-nav{display:none!important}}
@media(max-width:768px) and (orientation:landscape){.mob-nav{height:48px!important}.nav-lbl{display:none!important}}
.glow-card{animation:glow 2.8s ease-in-out infinite}
.toggle-track{width:44px;height:24px;border-radius:12px;cursor:pointer;transition:background .25s var(--ease);position:relative;box-shadow:var(--neo-in);flex-shrink:0}
.toggle-thumb{width:18px;height:18px;border-radius:50%;background:var(--mint);position:absolute;top:3px;transition:left .22s var(--ease);box-shadow:0 2px 6px rgba(0,0,0,0.3)}
`;

/* ────────────────── MOCK DATA ────────────────── */
const BUILTIN_CREDS = {
  admin:   {username:"admin",   pass:"admin123", role:"admin",   name:"Rector A. Reyes", dept:"Administration",      avatar:"AR", email:"familyuse2241@gmail.com"},
  teacher: {username:"teacher", pass:"teach123", role:"teacher", name:"Prof. M. Luna",   dept:"Computer Science",    avatar:"ML", email:"familyuse2241@gmail.com"},
  student: {username:"student", pass:"study123", role:"student", name:"Alexa Vega",      dept:"BS Computer Science", avatar:"AV", email:"familyuse2241@gmail.com"},
};

const ACCOUNT_STORAGE_KEY = "axiom_custom_accounts";

const safeLoadAccounts = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const saveCustomAccount = (account) => {
  if (typeof window === "undefined") return;
  const current = safeLoadAccounts();
  current[account.username.toLowerCase()] = account;
  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(current));
};

const getAllAccounts = () => ({
  ...BUILTIN_CREDS,
  ...safeLoadAccounts(),
});

const findAccount = (input, role) => {
  const q = String(input || "").trim().toLowerCase();
  const all = Object.values(getAllAccounts());
  return (
    all.find((a) => a.username?.toLowerCase() === q) ||
    all.find((a) => a.email?.toLowerCase() === q && (!role || a.role === role)) ||
    null
  );
};

const DEPARTMENTS = ["Computer Science","Information Technology","Mathematics","Physics","Biology","Engineering"];

const ANN = [
  {id:1,  tag:"URGENT",   cat:"general",  title:"Enrollment Period Open",              body:"Sem 2 AY 2025–26 enrollment is now open. Visit the registrar's office."},
  {id:2,  tag:"DEADLINE", cat:"general",  title:"Grade Submission Deadline",           body:"Period 1 final grades due April 10, 5:00 PM sharp. No extensions."},
  {id:3,  tag:"INFO",     cat:"general",  title:"Library System Maintenance",          body:"Digital library will be unavailable April 8, 10 PM – 2 AM."},
  {id:4,  tag:"ACTIVITY", cat:"activity", title:"Intramural Sports Week Registration", body:"Sign up for intramural sports at the Gym Office until April 12. Open to all enrolled students."},
  {id:5,  tag:"ACTIVITY", cat:"activity", title:"Cultural Night Auditions",            body:"Auditions for the Annual Cultural Night on April 20. Report to the CAS Lobby at 3:00 PM."},
  {id:6,  tag:"ACTIVITY", cat:"activity", title:"Research Symposium — Paper Submissions", body:"Submit research abstracts to the Dean's Office by April 15. Full papers due April 25."},
  {id:7,  tag:"BOARD",    cat:"board",    title:"2026 NLE Passers — Nursing Batch",    body:"Congratulations to our 8 graduates who passed the 2026 Nursing Licensure Exam with a 100% passing rate!"},
  {id:8,  tag:"BOARD",    cat:"board",    title:"2025 Philippine Bar Exam Passers",    body:"We proudly announce 3 graduates who passed the 2025 Philippine Bar Examination. Excellence continues!"},
  {id:9,  tag:"BOARD",    cat:"board",    title:"Civil Engineering Board Exam Results",body:"4 BS Civil Engineering graduates passed the 2026 Civil Engineering Board Examination. Congratulations!"},
  {id:10, tag:"EVENT",    cat:"event",    title:"Mid-Year Faculty Symposium",          body:"All faculty must attend the annual symposium on April 15. Venue: AVR, 8:00 AM sharp."},
];

const EVENTS = [
  {id:1, type:"Sports",   title:"Intramural Sports Week",      date:"Apr 14–18, 2026", venue:"Main Gymnasium",    desc:"Annual inter-department sports competition open to all students."},
  {id:2, type:"Academic", title:"Leadership Summit 2026",      date:"Apr 22, 2026",    venue:"Auditorium",        desc:"Leadership development seminar for student council officers and club presidents."},
  {id:3, type:"Cultural", title:"Annual Cultural Night",       date:"Apr 28, 2026",    venue:"Open Amphitheater", desc:"Showcase of arts, performances, and cultural heritage from all departments."},
  {id:4, type:"Academic", title:"Research & Innovation Expo",  date:"May 5, 2026",     venue:"Main Lobby",        desc:"Exhibition of outstanding student research projects and innovations."},
  {id:5, type:"Special",  title:"Graduation Ceremony 2026",    date:"May 20, 2026",    venue:"Civic Center",      desc:"Commencement exercises for graduating students of AY 2025–2026."},
  {id:6, type:"Sports",   title:"Inter-School Basketball Cup", date:"May 8–10, 2026",  venue:"Sports Complex",    desc:"Annual inter-school basketball tournament hosted by the College of Sport Sciences."},
];

const SUBJECTS_FULL = [
  {code:"CS101",  title:"Introduction to Computing",        units:3, yr:1, dept:"Computer Science",       schedule:"MWF 07:30-08:30",  room:"Room 101", instructor:"Prof. R. Cruz",  desc:"Fundamentals of computing, hardware, software, and basic programming concepts.", pre:"None"},
  {code:"MATH101",title:"Calculus I",                       units:3, yr:1, dept:"Mathematics",             schedule:"TTh 08:00-09:30",  room:"Room 105", instructor:"Prof. D. Tan",   desc:"Limits, derivatives, and applications of differentiation.", pre:"None"},
  {code:"ENG101", title:"Technical Communication",          units:3, yr:1, dept:"Computer Science",       schedule:"MWF 09:30-10:30",  room:"Room 102", instructor:"Prof. S. Gomez", desc:"Principles of technical writing, oral communication, and presentation skills.", pre:"None"},
  {code:"CS201",  title:"Object-Oriented Programming",      units:3, yr:2, dept:"Computer Science",       schedule:"MWF 10:30-11:30",  room:"Lab 1",    instructor:"Prof. M. Luna",  desc:"Classes, inheritance, polymorphism, encapsulation using Java and Python.", pre:"CS101"},
  {code:"CS301",  title:"Data Structures & Algorithms",     units:3, yr:2, dept:"Computer Science",       schedule:"MWF 08:00-09:00",  room:"Room 201", instructor:"Prof. M. Luna",  desc:"Arrays, linked lists, trees, graphs, sorting, and algorithm complexity analysis.", pre:"CS201"},
  {code:"CS302",  title:"Database Systems",                 units:3, yr:2, dept:"Computer Science",       schedule:"TTh 10:00-11:30",  room:"Lab 2",    instructor:"Prof. R. Santos",desc:"Relational DB design, SQL, normalization, transactions, and intro NoSQL.", pre:"CS201"},
  {code:"MATH301",title:"Discrete Mathematics",             units:3, yr:2, dept:"Mathematics",             schedule:"TTh 13:00-14:30",  room:"Room 305", instructor:"Prof. D. Tan",   desc:"Logic, sets, combinatorics, graph theory, and formal proof techniques.", pre:"MATH101"},
  {code:"CS303",  title:"Operating Systems",                units:3, yr:3, dept:"Computer Science",       schedule:"MWF 13:00-14:00",  room:"Room 204", instructor:"Prof. C. Lim",   desc:"Process management, memory management, file systems, scheduling, and concurrency.", pre:"CS201"},
  {code:"CS401",  title:"Software Engineering",             units:3, yr:3, dept:"Computer Science",       schedule:"TTh 08:00-09:30",  room:"Room 301", instructor:"Prof. M. Luna",  desc:"SDLC, agile methodologies, software design patterns, testing, and project management.", pre:"CS302"},
  {code:"CS402",  title:"Computer Networks",                units:3, yr:3, dept:"Computer Science",       schedule:"MWF 15:00-16:00",  room:"Lab 3",    instructor:"Prof. R. Cruz",  desc:"Network architectures, protocols, TCP/IP stack, routing, and network security.", pre:"CS303"},
  {code:"IT301",  title:"Systems Analysis & Design",        units:3, yr:2, dept:"Information Technology", schedule:"TTh 15:00-16:30",  room:"Room 202", instructor:"Prof. L. Bautista",desc:"System development life cycle, requirements analysis, and system modeling.", pre:"CS201"},
  {code:"IT401",  title:"Web Development Technologies",     units:3, yr:3, dept:"Information Technology", schedule:"MWF 11:30-12:30",  room:"Lab 1",    instructor:"Prof. L. Bautista",desc:"HTML5, CSS3, JavaScript, React, Node.js, and RESTful API development.", pre:"IT301"},
];

const ENROLLED_DEFAULT = ["CS301","CS302","MATH301","CS303","IT301"];

const GRADE_DATA = {
  Prelim:  [{id:"SN-2401",name:"Alexa Vega",quiz:85,exam:88,proj:90},{id:"SN-2402",name:"Marco Reyes",quiz:78,exam:82,proj:80},{id:"SN-2403",name:"Sophia Tan",quiz:92,exam:95,proj:94},{id:"SN-2404",name:"Ethan Lim",quiz:74,exam:79,proj:76}],
  Midterm: [{id:"SN-2401",name:"Alexa Vega",quiz:87,exam:89,proj:91},{id:"SN-2402",name:"Marco Reyes",quiz:75,exam:80,proj:78},{id:"SN-2403",name:"Sophia Tan",quiz:90,exam:93,proj:92},{id:"SN-2404",name:"Ethan Lim",quiz:72,exam:77,proj:74}],
  Finals:  [{id:"SN-2401",name:"Alexa Vega",quiz:88,exam:90,proj:92},{id:"SN-2402",name:"Marco Reyes",quiz:80,exam:83,proj:82},{id:"SN-2403",name:"Sophia Tan",quiz:93,exam:96,proj:95},{id:"SN-2404",name:"Ethan Lim",quiz:77,exam:81,proj:79}],
};

const INIT_STUDENTS = [
  {id:"SN-2401",name:"Alexa Vega",  program:"BS Computer Science",       yr:2,gpa:1.65,status:"Enrolled"},
  {id:"SN-2402",name:"Marco Reyes", program:"BS Information Technology", yr:3,gpa:1.90,status:"Enrolled"},
  {id:"SN-2403",name:"Sophia Tan",  program:"BS Mathematics",            yr:1,gpa:1.25,status:"Probation"},
  {id:"SN-2404",name:"Ethan Lim",   program:"BS Physics",                yr:4,gpa:2.10,status:"Enrolled"},
  {id:"SN-2405",name:"Chloe Santos",program:"BS Computer Science",       yr:2,gpa:1.50,status:"LOA"},
  {id:"SN-2406",name:"Jay Mendoza", program:"BS Computer Science",       yr:1,gpa:1.30,status:"Enrolled"},
];

const SOA = {
  student:"Alexa Vega", id:"SN-2401", program:"BS Computer Science", yr:"2nd Year", semester:"2nd Semester AY 2025–2026",
  fees:[
    {label:"Tuition Fee (18 units × ₱850)",  amount:15300},
    {label:"Registration Fee",               amount:500},
    {label:"Library Fee",                    amount:200},
    {label:"Laboratory Fee",                 amount:800},
    {label:"Student Services Fee",           amount:300},
    {label:"Athletics Fee",                  amount:150},
    {label:"Medical / Dental Fee",           amount:200},
  ],
  payments:[
    {date:"Jan 15, 2026",ref:"OR-2026-0001",amount:8500, method:"Online Banking"},
    {date:"Feb 01, 2026",ref:"OR-2026-0089",amount:5000, method:"Counter Payment"},
  ],
};

const EXAM_SCHEDULES = {
  Prelim:  [
    {code:"CS301", title:"Data Structures & Algorithms", date:"Mar 10, 2026",time:"08:00–10:00 AM",room:"Room 201",type:"Written"},
    {code:"CS302", title:"Database Systems",             date:"Mar 11, 2026",time:"10:00 AM–12:00 PM",room:"Lab 2",  type:"Practical"},
    {code:"MATH301",title:"Discrete Mathematics",        date:"Mar 12, 2026",time:"01:00–03:00 PM",room:"Room 305",type:"Written"},
    {code:"CS303", title:"Operating Systems",            date:"Mar 13, 2026",time:"08:00–10:00 AM",room:"Room 204",type:"Written"},
    {code:"IT301", title:"Systems Analysis & Design",    date:"Mar 14, 2026",time:"10:00 AM–12:00 PM",room:"Room 202",type:"Written"},
  ],
  Midterm: [
    {code:"CS301", title:"Data Structures & Algorithms", date:"Apr 8, 2026", time:"08:00–10:00 AM",room:"Room 201",type:"Written"},
    {code:"CS302", title:"Database Systems",             date:"Apr 9, 2026", time:"10:00 AM–12:00 PM",room:"Lab 2",  type:"Practical"},
    {code:"MATH301",title:"Discrete Mathematics",        date:"Apr 10, 2026",time:"01:00–03:00 PM",room:"Room 305",type:"Written"},
    {code:"CS303", title:"Operating Systems",            date:"Apr 11, 2026",time:"08:00–10:00 AM",room:"Room 204",type:"Written"},
    {code:"IT301", title:"Systems Analysis & Design",    date:"Apr 12, 2026",time:"10:00 AM–12:00 PM",room:"Room 202",type:"Written"},
  ],
  Finals:  [
    {code:"CS301", title:"Data Structures & Algorithms", date:"May 20, 2026",time:"08:00–10:00 AM",room:"Room 201",type:"Written"},
    {code:"CS302", title:"Database Systems",             date:"May 21, 2026",time:"10:00 AM–12:00 PM",room:"Lab 2",  type:"Practical"},
    {code:"MATH301",title:"Discrete Mathematics",        date:"May 22, 2026",time:"01:00–03:00 PM",room:"Room 305",type:"Written"},
    {code:"CS303", title:"Operating Systems",            date:"May 23, 2026",time:"08:00–10:00 AM",room:"Room 204",type:"Written"},
    {code:"IT301", title:"Systems Analysis & Design",    date:"May 24, 2026",time:"10:00 AM–12:00 PM",room:"Room 202",type:"Written"},
  ],
};

/* ────────────────── UTILITIES ────────────────── */
const useToasts = () => {
  const [toasts,setToasts]=useState([]);
  const show=useCallback((msg,type="success")=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3400);
  },[]);
  return {toasts,show};
};

const maskEmail = email => {
  if(!email?.includes("@")) return email;
  const [l,d]=email.split("@");
  return l.slice(0,2)+"•".repeat(Math.max(2,l.length-2))+"@"+d;
};

const Spin = ({size=14,color="var(--mint)"}) => (
  <span style={{width:size,height:size,border:`2px solid ${color}33`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block",flexShrink:0}}/>
);

const Skel = ({w="100%",h=14,mb=0}) => <div className="skel" style={{width:w,height:h,marginBottom:mb}}/>;

const Badge = ({label}) => {
  const bg={Enrolled:"rgba(39,174,96,0.18)",Probation:"rgba(212,160,23,0.18)",LOA:"rgba(192,57,43,0.18)",URGENT:"rgba(192,57,43,0.18)",EVENT:"rgba(42,91,82,0.25)",DEADLINE:"rgba(212,160,23,0.18)",INFO:"rgba(74,130,200,0.18)",ACTIVITY:"rgba(155,89,182,0.18)",BOARD:"rgba(243,156,18,0.18)",Sports:"rgba(41,128,185,0.18)",Academic:"rgba(42,91,82,0.22)",Cultural:"rgba(155,89,182,0.18)",Special:"rgba(231,76,60,0.18)",Written:"rgba(42,91,82,0.18)",Practical:"rgba(74,130,200,0.18)"}[label]||"rgba(120,120,140,0.18)";
  const cl={Enrolled:"#27AE60",Probation:"#D4A017",LOA:"#E74C3C",URGENT:"#E74C3C",EVENT:"#A3D1C6",DEADLINE:"#D4A017",INFO:"#7BAEE8",ACTIVITY:"#9B59B6",BOARD:"#F39C12",Sports:"#3498DB",Academic:"#A3D1C6",Cultural:"#9B59B6",Special:"#E74C3C",Written:"#A3D1C6",Practical:"#7BAEE8"}[label]||"var(--muted)";
  return <span className="badge" style={{background:bg,color:cl}}>{label}</span>;
};

const ConfirmModal = ({title,msg,onConfirm,onCancel,danger=false,confirmLabel="Confirm",cancelLabel="Cancel"}) => (
  <div className="modal-wrap" onClick={onCancel}>
    <div className="modal-card neo" style={{width:"100%",maxWidth:420,padding:28}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:20}}>
        <div style={{width:40,height:40,borderRadius:10,background:danger?"rgba(192,57,43,0.15)":"rgba(42,91,82,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {danger?<AlertTriangle size={20} color="#E74C3C"/>:<Shield size={20} color="var(--mint)"/>}
        </div>
        <div>
          <div style={{fontFamily:"var(--ff)",fontSize:16,fontWeight:700,marginBottom:5}}>{title}</div>
          <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>{msg}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>{cancelLabel}</button>
        <button className={`btn btn-sm ${danger?"btn-dang":"btn-pri"}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

const ToastLayer = ({toasts}) => {
  const cfg={success:["#1B4332","#A3D1C6"],error:["#4A1010","#E74C3C"],warn:["#3D2B00","#D4A017"]};
  return (
    <div className="toast-wrap">
      {toasts.map(t=>{
        const [bg,cl]=cfg[t.type]||cfg.success;
        const I={success:Check,error:X,warn:AlertTriangle}[t.type]||Check;
        return <div key={t.id} className="toast" style={{background:bg,color:cl,border:`1px solid ${cl}22`}}><I size={14}/><span>{t.msg}</span></div>;
      })}
    </div>
  );
};

/* ────────────────── API ────────────────── */
const apiSendOtp = async email => {
  const res=await fetch("/api/send-otp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
  const data=await res.json();
  if(!res.ok) throw new Error(data.error||"Failed to send code");
  return data.token;
};
const apiVerifyOtp = async (token,code) => {
  const res=await fetch("/api/verify-otp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,code})});
  const data=await res.json();
  if(!res.ok) throw new Error(data.error||"Verification failed");
  return true;
};

/* ────────────────── HERO ────────────────── */
const Hero = ({onStart}) => {
  const doubled=[...ANN,...ANN];
  const tagC={URGENT:"#E74C3C",EVENT:"var(--mint)",DEADLINE:"#D4A017",INFO:"#7BAEE8",ACTIVITY:"#9B59B6",BOARD:"#F39C12"};
  return (
    <div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 50% at 30% 20%, rgba(42,91,82,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(42,91,82,0.1) 0%, transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23A3D1C6' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",pointerEvents:"none"}}/>
      <header className="fu" style={{padding:"24px 32px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:36,height:36,background:"var(--acc)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"var(--neo-sm)"}}>
          <GraduationCap size={20} color="var(--mint)"/>
        </div>
        <div>
          <div style={{fontFamily:"var(--ff-brand)",fontSize:17,fontWeight:700,letterSpacing:"0.02em"}}>Axiom</div>
          <div style={{fontSize:10,color:"var(--muted)",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:-2}}>Institutional Portal</div>
        </div>
      </header>
      <main style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",textAlign:"center"}}>
        <h1 className="fu d1" style={{fontFamily:"var(--ff-brand)",fontSize:"clamp(2.4rem,7vw,4.2rem)",fontWeight:700,lineHeight:1.12,marginBottom:16,maxWidth:600}}>
          The Nexus of<br/><em style={{color:"var(--mint)",fontStyle:"italic"}}>Academic Excellence</em>
        </h1>
        <p className="fu d2" style={{fontSize:"clamp(13px,2vw,15px)",color:"var(--muted)",maxWidth:480,marginBottom:40,lineHeight:1.75}}>
          Streamlined enrollment, transparent grading, and real-time academic intelligence — all in one secured institutional hub.
        </p>
        <button className="btn btn-pri fu d3" style={{padding:"13px 34px",fontSize:14,borderRadius:12}} onClick={onStart}>
          Get Started <ChevronRight size={16}/>
        </button>
        <div className="fu d4" style={{display:"flex",gap:16,marginTop:48,flexWrap:"wrap",justifyContent:"center"}}>
          {[["1,240+","Students"],["48","Faculty"],["6","Departments"],["99.8%","Uptime"]].map(([n,l])=>(
            <div key={l} className="neo-sm" style={{padding:"12px 20px",textAlign:"center",minWidth:90}}>
              <div style={{fontFamily:"var(--ff-brand)",fontSize:20,fontWeight:700,color:"var(--mint)"}}>{n}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:2,letterSpacing:"0.05em"}}>{l}</div>
            </div>
          ))}
        </div>
      </main>
      <div style={{overflow:"hidden",paddingBottom:32}}>
        <div style={{fontSize:11,color:"var(--muted)",letterSpacing:"0.08em",textTransform:"uppercase",textAlign:"center",marginBottom:12}}>Latest Announcements</div>
        <div style={{display:"flex",overflow:"hidden"}}>
          <div className="car-track">
            {doubled.map((a,i)=>(
              <div key={i} className="neo-sm" style={{minWidth:260,padding:"12px 16px",flexShrink:0,borderLeft:`3px solid ${tagC[a.tag]||"var(--mint)"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><Badge label={a.tag}/><span style={{fontSize:12,color:"var(--text)",fontWeight:500}}>{a.title}</span></div>
                <p style={{fontSize:11.5,color:"var(--muted)",lineHeight:1.5}}>{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── SIGNUP MODAL ────────────────── */
const SignupModal = ({onClose,onSuccess,onCreated}) => {
  const [form,setForm]=useState({name:"",username:"",email:"",role:"student",idno:"",dept:"Computer Science",pass:"",confirm:""});
  const [show,setShow]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const submit=async()=>{
    setErr("");
    if(!form.name||!form.username||!form.email||!form.idno||!form.pass){setErr("Please fill in all fields.");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)){setErr("Enter a valid email address.");return;}
    if(form.pass.length<6){setErr("Password must be at least 6 characters.");return;}
    if(form.pass!==form.confirm){setErr("Passwords do not match.");return;}
    setLoading(true);
    try{
      const avatar=(form.name.trim().split(/\s+/).map(p=>p[0]).slice(0,2).join("")||form.username.slice(0,2)).toUpperCase();
      const created=await createUser({
        username:form.username.trim(),
        name:form.name.trim(),
        email:form.email.trim().toLowerCase(),
        role:form.role,
        idno:form.idno.trim(),
        dept:form.dept,
        pass:form.pass,
        avatar,
      });
      setLoading(false);setDone(true);
      setTimeout(()=>{onCreated?.(created);onSuccess();onClose();},1400);
    }catch(e){setErr(e.message||"Could not create account.");setLoading(false);}
  };
  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal-card neo" style={{width:"100%",maxWidth:430,padding:28,maxHeight:"90dvh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <div style={{fontFamily:"var(--ff)",fontSize:18,fontWeight:700}}>Create Account</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>Axiom Institutional Portal</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15}/></button>
        </div>
        {done?(
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(39,174,96,0.15)",border:"2px solid rgba(39,174,96,0.4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Check size={24} color="#27AE60"/></div>
            <div style={{fontFamily:"var(--ff)",fontSize:16,fontWeight:700,color:"#27AE60",marginBottom:6}}>Account Created!</div>
            <div style={{fontSize:12.5,color:"var(--muted)"}}>Redirecting to sign in…</div>
          </div>
        ):<>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:8,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500}}>Access Level</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {["admin","teacher","student"].map(r=>(
                <div key={r}><input id={`su-${r}`} className="ri" type="radio" name="su-role" value={r} checked={form.role===r} onChange={()=>setForm(p=>({...p,role:r}))}/>
                <label htmlFor={`su-${r}`} style={{justifyContent:"center",padding:"8px 6px",fontSize:12}}><span className="rdot"/>{r.charAt(0).toUpperCase()+r.slice(1)}</label></div>
              ))}
            </div>
          </div>
          {[{label:"Full Name",k:"name",type:"text",ph:"e.g. Maria Santos"},{label:"Username",k:"username",type:"text",ph:"e.g. maria123"},{label:"Email Address",k:"email",type:"email",ph:"example@email.com"},{label:"ID Number",k:"idno",type:"text",ph:"e.g. SN-2025-001"}].map(({label,k,type,ph})=>(
            <div key={k} style={{marginBottom:14}}>
              <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>{label}</div>
              <input className="neo-input" type={type} placeholder={ph} value={form[k]} onChange={set(k)}/>
            </div>
          ))}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>Department</div>
            <select className="neo-input" value={form.dept} onChange={set("dept")} style={{appearance:"none"}}>
              {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>Password</div>
            <div style={{position:"relative"}}>
              <input className="neo-input" type={show?"text":"password"} placeholder="Min. 6 characters" value={form.pass} onChange={set("pass")} style={{paddingRight:42}}/>
              <button onClick={()=>setShow(!show)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}}>{show?<EyeOff size={14}/>:<Eye size={14}/>}</button>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>Confirm Password</div>
            <input className="neo-input" type="password" placeholder="Re-enter password" value={form.confirm} onChange={set("confirm")} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          {err&&<div style={{background:"rgba(192,57,43,0.12)",border:"1px solid rgba(231,76,60,0.25)",borderRadius:8,padding:"9px 12px",fontSize:12.5,color:"#E74C3C",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><AlertTriangle size={13}/>{err}</div>}
          <button className="btn btn-pri" style={{width:"100%",padding:"12px",fontSize:13.5,borderRadius:10}} onClick={submit} disabled={loading}>
            {loading?<><Spin/> Creating…</>:<><UserPlus size={14}/> Create Account</>}
          </button>
          <div style={{marginTop:14,textAlign:"center",fontSize:12.5,color:"var(--muted)"}}>Already have an account? <span onClick={onClose} style={{color:"var(--mint)",cursor:"pointer",fontWeight:500}}>Sign in instead</span></div>
        </>}
      </div>
    </div>
  );
};

/* ────────────────── LOGIN ────────────────── */
const Login = ({onLogin,onBack}) => {
  const [uname,setUname]=useState("");
  const [pass,setPass]=useState("");
  const [role,setRole]=useState("student");
  const [show,setShow]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [showSignup,setShowSignup]=useState(false);
  const [signupDone,setSignupDone]=useState(false);

  const submit=async()=>{
    setErr("");
    setLoading(true);
    try{
      const user = await dbLogin(uname, pass);
      if(user.role!==role){setErr(`This account is not registered as a ${role}.`);setLoading(false);return;}
      const token=await apiSendOtp(user.email);
      onLogin({
        name:     user.display_name||user.name||uname,
        email:    user.email,
        role:     user.role,
        dept:     user.dept||"",
        avatar:   user.avatar||(user.display_name||uname).slice(0,2).toUpperCase(),
        username: user.username||uname,
        idno:     user.idno||"",
      },token);
    }catch(e){setErr(e.message||"Invalid username or password.");setLoading(false);}
  };

  return (
    <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"var(--base)",position:"relative"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 50% 50% at 50% 50%, rgba(42,91,82,0.14) 0%, transparent 70%)",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:400,position:"relative",zIndex:1}}>
        <div className="fu" style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:52,height:52,background:"var(--surf)",boxShadow:"var(--neo)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Lock size={24} color="var(--mint)"/></div>
          <div style={{fontFamily:"var(--ff)",fontSize:20,fontWeight:700}}>Secure Sign-In</div>
          <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>Axiom Institutional Portal</div>
        </div>
        <div className="neo fu d2" style={{padding:28}}>
          <div style={{marginBottom:22}}>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:8,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500}}>Access Level</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {["admin","teacher","student"].map(r=>(
                <div key={r}><input id={`r-${r}`} className="ri" type="radio" name="role" value={r} checked={role===r} onChange={()=>setRole(r)}/>
                <label htmlFor={`r-${r}`} style={{justifyContent:"center",padding:"8px 6px",fontSize:12}}><span className="rdot"/>{r.charAt(0).toUpperCase()+r.slice(1)}</label></div>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>Username or email</div>
            <input className="neo-input" placeholder={`e.g. ${role}`} value={uname} onChange={e=>setUname(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoCapitalize="none" autoCorrect="off"/>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>Password</div>
            <div style={{position:"relative"}}>
              <input className="neo-input" type={show?"text":"password"} placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{paddingRight:42}}/>
              <button onClick={()=>setShow(!show)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
          </div>
          {err&&<div style={{background:"rgba(192,57,43,0.12)",border:"1px solid rgba(231,76,60,0.25)",borderRadius:8,padding:"9px 12px",fontSize:12.5,color:"#E74C3C",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><AlertTriangle size={13}/>{err}</div>}
          <button className="btn btn-pri" style={{width:"100%",padding:"12px",fontSize:14,borderRadius:10}} onClick={submit} disabled={loading}>
            {loading?<><Spin/> Sending code…</>:<><Lock size={14}/> Sign In</>}
          </button>
          {loading&&<div style={{marginTop:11,fontSize:12,color:"var(--muted)",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Mail size={12}/>Sending OTP to your registered email…</div>}
          <div style={{marginTop:18,textAlign:"center",fontSize:13,color:"var(--muted)"}}>Don't have an account?{" "}<span onClick={()=>setShowSignup(true)} style={{color:"var(--mint)",cursor:"pointer",fontWeight:500,textDecoration:"underline",textUnderlineOffset:3}}>Sign up instead</span></div>
          <div style={{marginTop:14,padding:"10px 12px",background:"rgba(163,209,198,0.05)",borderRadius:8,fontSize:11.5,color:"var(--muted)"}}>
            <strong style={{color:"var(--mint)"}}>Demo: </strong>username = role · password = role+<code style={{fontFamily:"var(--ff-mono)",fontSize:11}}>123</code>
          </div>
        </div>
      </div>
      {showSignup&&<SignupModal onClose={()=>setShowSignup(false)} onSuccess={()=>setSignupDone(true)}/>}
      {signupDone&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(27,67,50,0.97)",border:"1px solid rgba(163,209,198,0.3)",borderRadius:12,padding:"11px 20px",fontSize:13,color:"var(--mint)",fontWeight:500,display:"flex",alignItems:"center",gap:8,zIndex:300,boxShadow:"0 8px 24px rgba(0,0,0,0.45)",animation:"toastIn .35s ease",whiteSpace:"nowrap"}}><Check size={14}/>Account created! You can now sign in.</div>}
    </div>
  );
};

/* ────────────────── 2FA ────────────────── */
const TwoFA = ({user,otpToken,onVerify,onBack}) => {
  const [code,setCode]=useState(["","","","","",""]);
  const [err,setErr]=useState("");
  const [verified,setVerified]=useState(false);
  const [loading,setLoading]=useState(false);
  const [resending,setResending]=useState(false);
  const [resent,setResent]=useState(false);
  const [token,setToken]=useState(otpToken);
  const refs=useRef([]);

  useEffect(()=>{
    window.history.pushState({page:"2fa"},"");
    const h=()=>onBack();
    window.addEventListener("popstate",h);
    return ()=>window.removeEventListener("popstate",h);
  },[]);
  useEffect(()=>{setTimeout(()=>refs.current[0]?.focus(),300);},[]);

  const onKey=(i,v)=>{
    if(!/^\d?$/.test(v)) return;
    const n=[...code];n[i]=v;setCode(n);
    if(v&&i<5) refs.current[i+1]?.focus();
  };
  const paste=e=>{const t=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);if(t.length===6){setCode(t.split(""));refs.current[5]?.focus();}e.preventDefault();};

  const verify=async()=>{
    const full=code.join("");
    if(full.length<6){setErr("Please enter all 6 digits.");setTimeout(()=>setErr(""),2600);return;}
    setLoading(true);setErr("");
    try{await apiVerifyOtp(token,full);setVerified(true);setTimeout(onVerify,1000);}
    catch(e){setErr(e.message||"Incorrect code.");setCode(["","","","","",""]);setTimeout(()=>refs.current[0]?.focus(),50);}
    finally{setLoading(false);}
  };

  const resend=async()=>{
    setResending(true);setErr("");setCode(["","","","","",""]);
    try{const t=await apiSendOtp(user.email);setToken(t);setResent(true);setTimeout(()=>setResent(false),3500);setTimeout(()=>refs.current[0]?.focus(),100);}
    catch(e){setErr("Failed to resend. Try again.");}
    finally{setResending(false);}
  };

  const display=maskEmail(user.email);

  return (
    <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"var(--base)",position:"relative"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 50% 55% at 50% 40%, rgba(42,91,82,0.12) 0%, transparent 70%)",pointerEvents:"none"}}/>
      <button onClick={onBack} style={{position:"fixed",top:16,left:16,zIndex:10,display:"flex",alignItems:"center",gap:7,background:"var(--surf)",boxShadow:"var(--neo-sm)",border:"1px solid rgba(163,209,198,0.1)",borderRadius:10,padding:"9px 14px",cursor:"pointer",color:"var(--muted)",fontSize:13,fontFamily:"var(--ff)",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="var(--text)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}><ArrowLeft size={15}/> Back</button>
      <div style={{width:"100%",maxWidth:380,textAlign:"center",position:"relative",zIndex:1}}>
        <div className="fu" style={{marginBottom:26}}>
          <div className="glow-card" style={{width:56,height:56,background:"var(--surf)",boxShadow:"var(--neo)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Mail size={26} color="var(--mint)"/></div>
          <div style={{fontFamily:"var(--ff)",fontSize:20,fontWeight:700}}>Check Your Email</div>
          <div style={{fontSize:13,color:"var(--muted)",marginTop:6,lineHeight:1.7}}>We sent a 6-digit code to<br/><span style={{color:"var(--mint)",fontWeight:500,fontFamily:"var(--ff-mono)",fontSize:13}}>{display}</span></div>
        </div>
        <div className="neo fu d2" style={{padding:"26px 24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(42,91,82,0.12)",border:"1px solid rgba(163,209,198,0.15)",borderRadius:10,padding:"10px 14px",marginBottom:22,textAlign:"left"}}>
            <Mail size={15} color="var(--mint)"/>
            <div><div style={{fontSize:11,color:"var(--muted)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:2}}>Sent to</div><div style={{fontSize:13,color:"var(--text)",fontFamily:"var(--ff-mono)"}}>{display}</div></div>
          </div>
          <div style={{fontSize:11,color:"var(--muted)",marginBottom:13,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500}}>Enter Verification Code</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}} onPaste={paste}>
            {code.map((v,i)=>(
              <input key={i} ref={el=>refs.current[i]=el} inputMode="numeric" pattern="[0-9]*" type="text" autoComplete="one-time-code"
                style={{width:44,height:52,background:"var(--base)",boxShadow:err?"inset 0 0 0 1.5px rgba(231,76,60,0.55),var(--neo-in)":verified?"inset 0 0 0 1.5px rgba(39,174,96,0.5),var(--neo-in)":"var(--neo-in)",border:`1.5px solid ${verified?"rgba(39,174,96,0.5)":err?"rgba(231,76,60,0.4)":v?"rgba(163,209,198,0.35)":"rgba(163,209,198,0.1)"}`,borderRadius:10,textAlign:"center",fontSize:20,fontFamily:"var(--ff-mono)",fontWeight:600,color:verified?"#27AE60":err?"#E74C3C":"var(--text)",outline:"none",transition:"all .18s",caretColor:"var(--mint)"}}
                maxLength={1} value={v} onChange={e=>onKey(i,e.target.value)} onKeyDown={e=>{if(e.key==="Backspace"&&!v&&i>0)refs.current[i-1]?.focus();if(e.key==="Enter")verify();}}
              />
            ))}
          </div>
          {err&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,color:"#E74C3C",fontSize:12.5,marginBottom:14}}><AlertTriangle size={13}/>{err}</div>}
          {resent&&!err&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,color:"#27AE60",fontSize:12.5,marginBottom:14}}><Check size={13}/>New code sent to {display}</div>}
          {verified?<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9,color:"#27AE60",fontSize:14,fontWeight:500,padding:"13px 0"}}><Check size={18}/> Verified! Redirecting…</div>:
            <button className="btn btn-pri" style={{width:"100%",padding:"13px",fontSize:14,borderRadius:11}} onClick={verify} disabled={loading||resending}>
              {loading?<><Spin/> Verifying…</>:<><Shield size={15}/> Verify & Continue</>}
            </button>}
          <div style={{marginTop:18,fontSize:12.5,color:"var(--muted)"}}>Didn't receive it?{" "}<span onClick={!resending?resend:undefined} style={{color:resending?"var(--dim)":"var(--mint)",cursor:resending?"default":"pointer",fontWeight:500,display:"inline-flex",alignItems:"center",gap:5,textDecoration:resending?"none":"underline",textUnderlineOffset:3}}>{resending?<><Spin size={11}/> Sending…</>:<><RefreshCw size={11}/> Resend code</>}</span></div>
          <div style={{marginTop:14,fontSize:11.5,color:"var(--dim)",borderTop:"1px solid rgba(255,255,255,0.04)",paddingTop:12}}>Code expires in 10 minutes. Check spam if not received.</div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── ADMIN OVERVIEW ────────────────── */
const AdminOverview = ({user}) => {
  const [students,setStudents]=useState([]);
  const [alerts,setAlerts]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([getStudents(),getAnnouncements()])
      .then(([s,a])=>{setStudents(s);setAlerts(a.filter(a=>a.tag==="URGENT"||a.tag==="DEADLINE"));})
      .catch(()=>{setStudents(INIT_STUDENTS);setAlerts(ANN.filter(a=>a.tag==="URGENT"||a.tag==="DEADLINE"));})
      .finally(()=>setLoading(false));
  },[]);

  const enrolled=students.filter(s=>s.status==="Enrolled");
  const tiles=[
    {label:"Total Students",  value:loading?"…":students.length.toLocaleString(), sub:"+24 this sem",  icon:<Users size={20}/>,       c:"var(--mint)"},
    {label:"Active Faculty",  value:"48",   sub:"3 on leave",    icon:<UserCheck size={20}/>,    c:"#7BAEE8"},
    {label:"Departments",     value:"6",    sub:"12 programs",   icon:<BookMarked size={20}/>,   c:"#D4A017"},
    {label:"School GPA Avg",  value:loading?"…":(students.reduce((a,s)=>a+Number(s.gpa||0),0)/Math.max(students.length,1)).toFixed(2), sub:"Target ≤ 1.80", icon:<BarChart3 size={20}/>, c:"#27AE60"},
    {label:"Enrolled This Sem",value:loading?"…":enrolled.length.toLocaleString(),sub:"Active students",   icon:<BookCheck size={20}/>,    c:"#9B59B6"},
    {label:"Pending SOA",     value:"84",   sub:"Payment due",   icon:<Receipt size={20}/>,       c:"#E74C3C"},
    {label:"Upcoming Events", value:"6",    sub:"Next 30 days",  icon:<Calendar size={20}/>,      c:"#F39C12"},
    {label:"Board Passers",   value:"15",   sub:"This AY",       icon:<Trophy size={20}/>,        c:"#F39C12"},
  ];
  return (
    <div>
      <div className="neo fu" style={{padding:"16px 20px",marginBottom:16,borderLeft:"3px solid var(--acc)",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:38,height:38,background:"var(--acc)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--ff-brand)",fontWeight:700,fontSize:15,color:"var(--mint)",flexShrink:0}}>{user?.avatar||"AR"}</div>
        <div>
          <div style={{fontFamily:"var(--ff)",fontSize:16,fontWeight:600}}>Good day, {user?.name||"Admin"}.</div>
          <div style={{fontSize:12,color:"var(--muted)"}}>Full administrative access — manage all records, grading, and enrollment.</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:16}}>
        {tiles.map((s,i)=>loading&&i<4?(
          <div key={i} className="neo" style={{padding:"16px 18px"}}><Skel h={13} mb={8}/><Skel w="60%" h={22} mb={6}/><Skel w="80%" h={11}/></div>
        ):(
          <div key={i} className={`neo fu d${(i%6)+1}`} style={{padding:"16px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div style={{fontSize:10.5,color:"var(--muted)",fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>{s.label}</div>
              <div style={{color:s.c,opacity:0.7}}>{s.icon}</div>
            </div>
            <div style={{fontFamily:"var(--ff-brand)",fontSize:24,fontWeight:700,color:s.c,marginBottom:3}}>{s.value}</div>
            <div style={{fontSize:11.5,color:"var(--muted)"}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        <div className="neo fu d3" style={{padding:"18px 20px"}}>
          <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:14,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><Users size={14}/>Recent Enrollees</div>
          {loading?<><Skel h={12} mb={8}/><Skel h={12} mb={8}/><Skel h={12}/></>:
            students.slice(0,4).map(s=>(
              <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                <div><div style={{fontSize:12.5,fontWeight:500}}>{s.name}</div><div style={{fontSize:11,color:"var(--muted)"}}>{s.program}</div></div>
                <Badge label={s.status}/>
              </div>
            ))
          }
        </div>
        <div className="neo fu d4" style={{padding:"18px 20px"}}>
          <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:14,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><Bell size={14}/>Active Alerts</div>
          {loading?<><Skel h={12} mb={8}/><Skel h={12} mb={8}/><Skel h={12}/></>:
            alerts.map(a=>(
              <div key={a.id} style={{display:"flex",gap:8,marginBottom:10,alignItems:"flex-start"}}>
                <Badge label={a.tag}/><span style={{fontSize:12,color:"var(--muted)",lineHeight:1.4}}>{a.title}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

/* ────────────────── TEACHER OVERVIEW ────────────────── */
const TeacherOverview = ({user}) => {
  const [mySubjects,setMySubjects]=useState([]);
  const [rosterGrades,setRosterGrades]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    getSubjects()
      .then(all=>{
        const mine=all.filter(s=>s.instructor===user?.name||s.instructor==="Prof. M. Luna");
        setMySubjects(mine);
        // Load grades for first subject
        const first=mine[0]?.code||"CS301";
        return getGrades(first,"Prelim");
      })
      .then(setRosterGrades)
      .catch(()=>{
        setMySubjects(SUBJECTS_FULL.filter(s=>s.instructor==="Prof. M. Luna"));
        setRosterGrades(GRADE_DATA.Prelim);
      })
      .finally(()=>setLoading(false));
  },[user]);

  return (
    <div>
      <div className="neo fu" style={{padding:"16px 20px",marginBottom:16,borderLeft:"3px solid var(--acc)"}}>
        <div style={{fontFamily:"var(--ff)",fontSize:16,fontWeight:600}}>Good day, {user?.name||"Prof."}.</div>
        <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>Manage your subjects, track students, and encode grades from your dashboard.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginBottom:16}}>
        {loading?[0,1,2].map(i=><div key={i} className="neo" style={{padding:18,minHeight:130}}><Skel h={12} mb={10}/><Skel h={12} mb={8}/><Skel w="70%" h={12}/></div>):
          mySubjects.map((s,i)=>(
            <div key={s.code} className={`neo fu d${i+1}`} style={{padding:"18px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <code style={{fontFamily:"var(--ff-mono)",fontSize:12,color:"var(--mint)",fontWeight:500}}>{s.code}</code>
                <span style={{fontSize:11.5,color:"var(--muted)"}}>{s.units} units</span>
              </div>
              <div style={{fontSize:13.5,fontWeight:500,marginBottom:6}}>{s.title}</div>
              <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:4}}>{s.schedule}</div>
              <div style={{display:"flex",gap:10,marginTop:10}}>
                <div style={{fontSize:12,color:"var(--muted)"}}>Students: <span style={{color:"var(--mint)",fontWeight:500}}>{rosterGrades.length||4}</span></div>
              </div>
            </div>
          ))
        }
      </div>
      <div className="neo fu d4" style={{padding:"18px 20px"}}>
        <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:14,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><Users size={14}/>Student Roster — {mySubjects[0]?.code||"CS301"}</div>
        {loading?<><Skel h={12} mb={8}/><Skel h={12} mb={8}/><Skel h={12}/></>:
          <div style={{overflowX:"auto",borderRadius:8}}>
            <table className="dt" style={{minWidth:480}}>
              <thead><tr><th>ID</th><th>Student</th><th>Quiz</th><th>Exam</th><th>Grade</th><th>Status</th></tr></thead>
              <tbody>
                {rosterGrades.map(r=>{
                  const g=Math.round(r.quiz*0.2+r.exam*0.5+r.proj*0.3);
                  return (
                    <tr key={r.id}>
                      <td><code style={{fontFamily:"var(--ff-mono)",fontSize:11.5,color:"var(--mint)"}}>{r.id}</code></td>
                      <td style={{fontWeight:500}}>{r.name}</td>
                      <td style={{fontFamily:"var(--ff-mono)",fontSize:12}}>{r.quiz}</td>
                      <td style={{fontFamily:"var(--ff-mono)",fontSize:12}}>{r.exam}</td>
                      <td><span style={{fontFamily:"var(--ff-mono)",fontSize:13,fontWeight:500,color:g>=90?"#27AE60":g>=80?"var(--mint)":"#D4A017"}}>{g}</span></td>
                      <td><Badge label={g>=75?"Enrolled":"Probation"}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
};

/* ────────────────── STUDENT OVERVIEW ────────────────── */
const StudentOverview = ({user}) => {
  const [enrolled,setEnrolled]=useState([]);
  const [balance,setBalance]=useState(null);
  const [alerts,setAlerts]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      getEnrollment(user?.idno||"","2nd Semester"),
      getSOA(user?.idno||""),
      getAnnouncements(),
    ])
      .then(([enr,soa,ann])=>{
        setEnrolled(enr.length?enr:SUBJECTS_FULL.filter(s=>ENROLLED_DEFAULT.includes(s.code)));
        if(soa?.fees){
          const t=soa.fees.reduce((a,f)=>a+f.amount,0);
          const p=(soa.payments||[]).reduce((a,pay)=>a+pay.amount,0);
          setBalance(t-p);
        }else{setBalance(3950);}
        setAlerts(ann.slice(0,4));
      })
      .catch(()=>{
        setEnrolled(SUBJECTS_FULL.filter(s=>ENROLLED_DEFAULT.includes(s.code)));
        setBalance(3950);
        setAlerts(ANN.slice(0,4));
      })
      .finally(()=>setLoading(false));
  },[user]);

  const totalUnits=enrolled.reduce((a,s)=>a+(s.units||0),0);

  return (
    <div>
      <div className="neo fu" style={{padding:"16px 20px",marginBottom:16,borderLeft:"3px solid var(--acc)"}}>
        <div style={{fontFamily:"var(--ff)",fontSize:16,fontWeight:600}}>Good day, {user?.name?.split(" ")[0]||"Student"}.</div>
        <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>View your enrollment, grades, upcoming exams, and account balance.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:12,marginBottom:16}}>
        {loading?[0,1,2,3].map(i=><div key={i} className="neo" style={{padding:18}}><Skel h={13} mb={8}/><Skel w="60%" h={22} mb={6}/></div>):
          [
            {label:"Enrolled Units",value:totalUnits, sub:`${enrolled.length} subjects`,c:"var(--mint)",icon:<BookCheck size={18}/>},
            {label:"Account Balance",value:balance!==null?`₱${balance.toLocaleString()}`:"₱—",sub:"Due this month",c:balance>0?"#E74C3C":"#27AE60",icon:<Receipt size={18}/>},
            {label:"Exams This Week",value:"2",        sub:"Next: Apr 8",    c:"#D4A017",  icon:<FileText size={18}/>},
            {label:"Alerts",         value:alerts.length, sub:"Active notices",c:"#7BAEE8",icon:<Bell size={18}/>},
          ].map((t,i)=>(
            <div key={i} className={`neo fu d${i+1}`} style={{padding:"16px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{fontSize:10.5,color:"var(--muted)",fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase",lineHeight:1.4}}>{t.label}</div>
                <div style={{color:t.c,opacity:0.75}}>{t.icon}</div>
              </div>
              <div style={{fontFamily:"var(--ff-brand)",fontSize:24,fontWeight:700,color:t.c,marginBottom:3}}>{t.value}</div>
              <div style={{fontSize:11.5,color:"var(--muted)"}}>{t.sub}</div>
            </div>
          ))
        }
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        <div className="neo fu d3" style={{padding:"18px 20px"}}>
          <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:14,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><BookOpen size={14}/>My Subjects</div>
          {loading?<><Skel h={12} mb={8}/><Skel h={12} mb={8}/><Skel h={12}/></>:
            enrolled.slice(0,4).map(s=>(
              <div key={s.code} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                <div><code style={{fontFamily:"var(--ff-mono)",fontSize:11,color:"var(--mint)"}}>{s.code}</code><div style={{fontSize:12,color:"var(--muted)",marginTop:1}}>{s.title}</div></div>
                <span style={{fontFamily:"var(--ff-mono)",fontSize:11,color:"var(--dim)"}}>{s.units}u</span>
              </div>
            ))
          }
        </div>
        <div className="neo fu d4" style={{padding:"18px 20px"}}>
          <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:14,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><FileText size={14}/>Upcoming Exams</div>
          {loading?<><Skel h={12} mb={8}/><Skel h={12}/></>:
            EXAM_SCHEDULES.Midterm.slice(0,3).map(e=>(
              <div key={e.code} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><code style={{fontFamily:"var(--ff-mono)",fontSize:11,color:"var(--mint)"}}>{e.code}</code><div style={{fontSize:12,color:"var(--muted)",marginTop:1}}>{e.title}</div></div>
                  <Badge label={e.type}/>
                </div>
                <div style={{fontSize:11,color:"var(--dim)",marginTop:3}}>{e.date} · {e.time}</div>
              </div>
            ))
          }
        </div>
        <div className="neo fu d5" style={{padding:"18px 20px"}}>
          <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:14,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><Bell size={14}/>Alerts</div>
          {loading?<><Skel h={12} mb={8}/><Skel h={12}/></>:
            alerts.map(a=>(
              <div key={a.id} style={{display:"flex",gap:8,marginBottom:9,alignItems:"flex-start"}}>
                <Badge label={a.tag}/><span style={{fontSize:12,color:"var(--muted)",lineHeight:1.4}}>{a.title}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

/* ────────────────── STUDENTS VIEW ────────────────── */
const StudentsView = ({showModal,toast,readOnly=false}) => {
  const [students,setStudents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [form,setForm]=useState(null);
  const [draft,setDraft]=useState({});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    getStudents()
      .then(setStudents)
      .catch(e=>toast(e.message||"Failed to load students.","error"))
      .finally(()=>setLoading(false));
  },[]);

  const filtered=students.filter(s=>
    s.name.toLowerCase().includes(search.toLowerCase())||
    String(s.id).toLowerCase().includes(search.toLowerCase())
  );

  const F=({label,k,type="text",opts})=>(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:6,fontWeight:500}}>{label}</div>
      {opts?<select className="neo-input" value={draft[k]||""} onChange={e=>setDraft(p=>({...p,[k]:e.target.value}))} style={{appearance:"none"}}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input className="neo-input" type={type} value={draft[k]||""} onChange={e=>setDraft(p=>({...p,[k]:e.target.value}))}/>}
    </div>
  );

  const handleSave=async()=>{
    if(!draft.name||!draft.program){toast("Fill in all required fields.","warn");return;}
    setSaving(true);
    try{
      if(form.mode==="add"){
        const created=await createStudent({...draft,yr:Number(draft.yr),gpa:Number(draft.gpa)});
        setStudents(p=>[...p,{...draft,yr:Number(draft.yr),gpa:Number(draft.gpa),_sbId:created.id}]);
        toast("Student record added.");
      }else{
        await updateStudent(form.orig._sbId||form.orig.id,{...draft,yr:Number(draft.yr),gpa:Number(draft.gpa)});
        setStudents(p=>p.map(s=>s.id===form.orig.id?{...draft,yr:Number(draft.yr),gpa:Number(draft.gpa),_sbId:s._sbId}:s));
        toast("Record updated.");
      }
      setForm(null);
    }catch(e){toast(e.message||"Save failed.","error");}
    finally{setSaving(false);}
  };

  const handleDelete=(s)=>showModal({
    title:"Delete Record",msg:`Remove ${s.name}?`,danger:true,confirmLabel:"Delete",
    onConfirm:async()=>{
      try{
        await deleteStudent(s._sbId||s.id);
        setStudents(p=>p.filter(x=>x.id!==s.id));
        toast(`${s.name} removed.`,"error");
      }catch(e){toast(e.message||"Delete failed.","error");}
    }
  });

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180}}>
          <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--muted)"}}/>
          <input className="neo-input" placeholder="Search by name or ID…" value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:34}}/>
        </div>
        {!readOnly&&<button className="btn btn-pri btn-sm" onClick={()=>{setDraft({id:`SN-${2400+students.length+1}`,name:"",program:"",yr:1,gpa:"",status:"Enrolled"});setForm({mode:"add"});}}><Plus size={13}/>Add Student</button>}
      </div>
      <div className="neo" style={{overflowX:"auto"}}>
        <table className="dt" style={{minWidth:520}}>
          <thead><tr><th>ID</th><th>Name</th><th>Program</th><th>Yr</th><th>GPA</th><th>Status</th>{!readOnly&&<th style={{textAlign:"right"}}>Actions</th>}</tr></thead>
          <tbody>
            {loading&&[0,1,2,3].map(i=><tr key={i}><td colSpan={readOnly?6:7} style={{padding:"10px 12px"}}><Skel h={13}/></td></tr>)}
            {!loading&&filtered.length===0&&<tr><td colSpan={readOnly?6:7} style={{textAlign:"center",color:"var(--muted)",padding:24,fontSize:13}}>No students found.</td></tr>}
            {!loading&&filtered.map(s=>(
              <tr key={s.id}>
                <td><code style={{fontFamily:"var(--ff-mono)",fontSize:11.5,color:"var(--mint)"}}>{s.id}</code></td>
                <td style={{fontWeight:500}}>{s.name}</td>
                <td style={{color:"var(--muted)",fontSize:12}}>{s.program}</td>
                <td style={{fontFamily:"var(--ff-mono)",fontSize:12}}>{s.yr}</td>
                <td><span style={{fontFamily:"var(--ff-mono)",fontSize:12.5,color:s.gpa<1.75?"#27AE60":s.gpa<2.5?"var(--mint)":"#D4A017"}}>{Number(s.gpa).toFixed(2)}</span></td>
                <td><Badge label={s.status}/></td>
                {!readOnly&&<td>
                  <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>{setDraft({...s});setForm({mode:"edit",orig:s});}}><Pencil size={12}/></button>
                    <button className="btn btn-icon btn-sm" style={{background:"rgba(192,57,43,0.12)",color:"#E74C3C"}} onClick={()=>handleDelete(s)}><Trash2 size={12}/></button>
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {form&&<div className="modal-wrap" onClick={()=>setForm(null)}><div className="modal-card neo" style={{width:"100%",maxWidth:420,padding:26}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontFamily:"var(--ff)",fontSize:17,fontWeight:700}}>{form.mode==="add"?"New Student":"Edit Record"}</div><button className="btn btn-ghost btn-icon" onClick={()=>setForm(null)}><X size={15}/></button></div>
        <F label="Student ID" k="id"/><F label="Full Name *" k="name"/>
        <F label="Program *" k="program" opts={["BS Computer Science","BS Information Technology","BS Mathematics","BS Physics","BS Biology"]}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><F label="Year Level" k="yr" type="number"/><F label="GPA" k="gpa" type="number"/></div>
        <F label="Status" k="status" opts={["Enrolled","Probation","LOA","Graduated","Dropped"]}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setForm(null)}>Cancel</button>
          <button className="btn btn-pri btn-sm" onClick={handleSave} disabled={saving}>{saving?<><Spin size={12}/>Saving…</>:<><Check size={12}/> Save</>}</button>
        </div>
      </div></div>}
    </div>
  );
};

/* ────────────────── GRADES VIEW ────────────────── */
const GradesView = ({showModal,toast,user}) => {
  const [period,setPeriod]=useState("Prelim");
  const [subject,setSubject]=useState("CS301");
  const [grades,setGrades]=useState([]);
  const [subjects,setSubjects]=useState([]);
  const [loadingGrades,setLoadingGrades]=useState(true);

  // Load teacher's subjects from Supabase
  useEffect(()=>{
    getSubjects()
      .then(all=>setSubjects(all.filter(s=>s.instructor==="Prof. M. Luna"||s.instructor===user?.name)))
      .catch(()=>setSubjects(SUBJECTS_FULL.filter(s=>s.instructor==="Prof. M. Luna")));
  },[]);

  // Reload grades when subject or period changes
  useEffect(()=>{
    setLoadingGrades(true);
    getGrades(subject,period)
      .then(setGrades)
      .catch(()=>setGrades(GRADE_DATA[period]||[]))
      .finally(()=>setLoadingGrades(false));
  },[subject,period]);

  const compute=(q,e,p)=>Math.round(q*0.2+e*0.5+p*0.3);

  // Auto-save on blur for each grade cell
  const handleBlurSave=async(row,field,val)=>{
    const updated={...row,[field]:Number(val)};
    setGrades(g=>g.map(r=>r.id===row.id?updated:r));
    try{
      await saveGrade({
        sbId:row._sbId||null,
        studentId:row.id,
        subjectCode:subject,
        period,
        quiz:updated.quiz,
        exam:updated.exam,
        proj:updated.proj,
      });
    }catch(e){toast("Auto-save failed: "+e.message,"error");}
  };

  // CSV export
  const exportCSV=()=>{
    const header=["Student ID","Name","Quiz (20%)","Exam (50%)","Project (30%)","Final Grade","Letter"];
    const rows=grades.map(r=>{
      const f=compute(r.quiz,r.exam,r.proj);
      const letter=f>=90?"A":f>=85?"B+":f>=80?"B":f>=75?"C+":"INC";
      return[r.id,r.name,r.quiz,r.exam,r.proj,f,letter];
    });
    const csv=[header,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`grades_${subject}_${period}.csv`;a.click();
    URL.revokeObjectURL(url);
    toast(`Exported grades_${subject}_${period}.csv`);
  };

  const subjectList=subjects.length?subjects:SUBJECTS_FULL.filter(s=>s.instructor==="Prof. M. Luna");

  return (
    <div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {subjectList.map(s=>(
          <button key={s.code} className={`tab-btn ${subject===s.code?"active":""}`} onClick={()=>setSubject(s.code)}>{s.code}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,background:"var(--surf2)",borderRadius:10,padding:4,width:"fit-content"}}>
        {["Prelim","Midterm","Finals"].map(p=><button key={p} className={`tab-btn ${period===p?"active":""}`} onClick={()=>setPeriod(p)}>{p}</button>)}
      </div>
      <div className="neo" style={{overflowX:"auto",marginBottom:14}}>
        <table className="dt" style={{minWidth:560}}>
          <thead><tr><th>Student ID</th><th>Name</th><th>Quiz (20%)</th><th>Exam (50%)</th><th>Project (30%)</th><th>Final</th></tr></thead>
          <tbody>
            {loadingGrades&&[0,1,2,3].map(i=><tr key={i}><td colSpan={6} style={{padding:"10px 12px"}}><Skel h={13}/></td></tr>)}
            {!loadingGrades&&grades.length===0&&<tr><td colSpan={6} style={{textAlign:"center",color:"var(--muted)",padding:20,fontSize:13}}>No grade records for this subject/period.</td></tr>}
            {!loadingGrades&&grades.map(r=>{
              const final=compute(r.quiz,r.exam,r.proj);
              const color=final>=90?"#27AE60":final>=80?"var(--mint)":final>=75?"#D4A017":"#E74C3C";
              return (
                <tr key={r.id}>
                  <td><code style={{fontFamily:"var(--ff-mono)",fontSize:11.5,color:"var(--mint)"}}>{r.id}</code></td>
                  <td style={{fontWeight:500}}>{r.name}</td>
                  {["quiz","exam","proj"].map(f=>(
                    <td key={f}><input
                      style={{width:56,background:"var(--base)",boxShadow:"var(--neo-in)",border:"1px solid rgba(163,209,198,0.08)",borderRadius:6,color:"var(--text)",fontFamily:"var(--ff-mono)",fontSize:12,padding:"4px 7px",outline:"none",textAlign:"center",transition:"border-color .15s"}}
                      type="number" min={0} max={100}
                      defaultValue={r[f]}
                      onFocus={e=>e.target.style.borderColor="rgba(163,209,198,0.35)"}
                      onBlur={e=>{e.target.style.borderColor="rgba(163,209,198,0.08)";handleBlurSave(r,f,e.target.value);}}
                    /></td>
                  ))}
                  <td><span style={{fontFamily:"var(--ff-mono)",fontSize:14,fontWeight:500,color}}>{final}</span><span style={{fontSize:11,color:"var(--muted)",marginLeft:5}}>{final>=90?"A":final>=85?"B+":final>=80?"B":final>=75?"C+":"INC"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,flexWrap:"wrap"}}>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}><Download size={12}/>Export CSV</button>
        <button className="btn btn-pri btn-sm" onClick={()=>showModal({title:"Finalize Grades",msg:`Submit ${period} grades for ${subject}? This cannot be undone.`,confirmLabel:"Finalize",onConfirm:()=>toast(`${period} grades for ${subject} finalized.`)})}><Check size={12}/>Finalize {period}</button>
      </div>
    </div>
  );
};

/* ────────────────── ENROLLMENT VIEW ────────────────── */
const EnrollmentView = ({toast, role, user}) => {
  const [allSubjects,setAllSubjects]=useState([]);
  const [enrolledItems,setEnrolledItems]=useState([]); // [{enrollmentId, code, ...}]
  const [dept,setDept]=useState("");
  const [semester,setSemester]=useState("2nd Semester");
  const [open,setOpen]=useState(null);
  const [filterYr,setFilterYr]=useState(0);
  const [loadingEnroll,setLoadingEnroll]=useState(true);

  // Load all subjects
  useEffect(()=>{
    getSubjects()
      .then(setAllSubjects)
      .catch(()=>setAllSubjects(SUBJECTS_FULL));
  },[]);

  // Load current enrollment for this student
  useEffect(()=>{
    if(!user?.idno) { setLoadingEnroll(false); return; }
    getEnrollment(user.idno, semester)
      .then(setEnrolledItems)
      .catch(()=>setEnrolledItems([]))
      .finally(()=>setLoadingEnroll(false));
  },[user,semester]);

  const enrolledCodes=enrolledItems.map(e=>e.code);
  const enrolledSubjects=enrolledItems.sort((a,b)=>(a.yr||0)-(b.yr||0)||a.code.localeCompare(b.code));
  const totalUnits=enrolledSubjects.reduce((a,s)=>a+(s.units||0),0);

  const available=(allSubjects.length?allSubjects:SUBJECTS_FULL)
    .filter(s=>!enrolledCodes.includes(s.code)&&(dept===""||s.dept===dept)&&(filterYr===0||s.yr===filterYr))
    .sort((a,b)=>a.yr-b.yr||a.code.localeCompare(b.code));

  const add=async(code)=>{
    if(enrolledCodes.includes(code)){toast(`${code} already enrolled.`,"warn");return;}
    try{
      await enrollSubject(user?.idno||"", code, semester);
      const subj=(allSubjects.find(s=>s.code===code)||{});
      setEnrolledItems(p=>[...p,{...subj,enrollmentId:Date.now()}]);
      toast(`${code} added to enrollment.`);
    }catch(e){toast(e.message||"Enroll failed.","error");}
  };

  const drop=async(item)=>{
    try{
      if(item.enrollmentId) await dropSubject(item.enrollmentId);
      setEnrolledItems(p=>p.filter(x=>x.code!==item.code));
      toast(`${item.code} dropped.`,"warn");
    }catch(e){toast(e.message||"Drop failed.","error");}
  };

  return (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:500,color:"var(--muted)",letterSpacing:"0.05em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><BookCheck size={14}/>Enrolled Subjects</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>Total: <span style={{color:"var(--mint)",fontWeight:600}}>{totalUnits} units</span></div>
        </div>
        {loadingEnroll?<div className="neo" style={{padding:20}}><Skel h={13} mb={8}/><Skel h={13}/></div>:
        enrolledSubjects.length===0?
          <div className="neo" style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>No subjects enrolled yet. Add subjects below.</div>:
          <div className="neo" style={{overflowX:"auto"}}>
            <table className="dt" style={{minWidth:600}}>
              <thead><tr><th>Code</th><th>Subject Title</th><th>Dept</th><th>Yr</th><th>Units</th><th>Schedule</th><th>Instructor</th>{role!=="admin"&&<th></th>}</tr></thead>
              <tbody>
                {enrolledSubjects.map(s=>(
                  <tr key={s.code}>
                    <td><code style={{fontFamily:"var(--ff-mono)",fontSize:11.5,color:"var(--mint)"}}>{s.code}</code></td>
                    <td style={{fontWeight:500,fontSize:13}}>{s.title}</td>
                    <td style={{color:"var(--muted)",fontSize:12}}>{s.dept}</td>
                    <td style={{fontFamily:"var(--ff-mono)",fontSize:12,textAlign:"center"}}>{s.yr}</td>
                    <td style={{fontFamily:"var(--ff-mono)",fontSize:12,textAlign:"center"}}>{s.units}</td>
                    <td style={{fontSize:12,color:"var(--muted)"}}>{s.schedule}</td>
                    <td style={{fontSize:12,color:"var(--muted)"}}>{s.instructor}</td>
                    {role!=="admin"&&<td><button className="btn btn-icon btn-sm" style={{background:"rgba(192,57,43,0.1)",color:"#E74C3C"}} onClick={()=>drop(s)} title="Drop"><X size={11}/></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:500,color:"var(--muted)",letterSpacing:"0.05em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8,marginRight:4}}><ClipboardList size={14}/>Add Subjects</div>
        <select className="neo-input" value={dept} onChange={e=>setDept(e.target.value)} style={{appearance:"none",width:"auto",padding:"7px 12px",fontSize:12}}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{display:"flex",gap:6}}>
          {[0,1,2,3,4].map(y=>(
            <button key={y} className={`tab-btn ${filterYr===y?"active":""}`} style={{padding:"6px 11px",fontSize:11.5}} onClick={()=>setFilterYr(y)}>
              {y===0?"All":`Yr ${y}`}
            </button>
          ))}
        </div>
        <select className="neo-input" value={semester} onChange={e=>setSemester(e.target.value)} style={{appearance:"none",width:"auto",padding:"7px 12px",fontSize:12}}>
          {["1st Semester","2nd Semester","Summer"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {available.length===0&&<div className="neo" style={{padding:20,textAlign:"center",color:"var(--muted)",fontSize:13}}>No available subjects match your filters.</div>}
        {available.map(s=>(
          <div key={s.code} className="neo-sm">
            <div onClick={()=>setOpen(open===s.code?null:s.code)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",cursor:"pointer",userSelect:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                <code style={{fontFamily:"var(--ff-mono)",fontSize:12,color:"var(--mint)",flexShrink:0,minWidth:58}}>{s.code}</code>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{s.dept} · Year {s.yr} · {s.units} units</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <button className="btn btn-pri btn-sm" style={{padding:"4px 10px",fontSize:11.5}} onClick={e=>{e.stopPropagation();add(s.code);}}><Plus size={11}/>Enroll</button>
                <ChevronDown size={15} color="var(--muted)" style={{transform:open===s.code?"rotate(180deg)":"",transition:"transform .3s"}}/>
              </div>
            </div>
            <div className={`acc-body ${open===s.code?"open":""}`}>
              <div style={{padding:"0 16px 14px",borderTop:"1px solid rgba(163,209,198,0.08)"}}>
                <div style={{paddingTop:12,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,fontSize:12.5,color:"var(--muted)",marginBottom:10}}>
                  <div><strong style={{color:"var(--text)"}}>Schedule:</strong> {s.schedule}</div>
                  <div><strong style={{color:"var(--text)"}}>Room:</strong> {s.room}</div>
                  <div><strong style={{color:"var(--text)"}}>Instructor:</strong> {s.instructor}</div>
                  <div><strong style={{color:"var(--text)"}}>Pre-requisite:</strong> {s.pre}</div>
                </div>
                <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>{s.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ────────────────── SOA VIEW ────────────────── */
const SOAView = ({role, user}) => {
  const [soaData,setSoaData]=useState(null);
  const [loading,setLoading]=useState(true);

  // Try Supabase first, fall back to static mock
  useEffect(()=>{
    const staticSOA={...SOA};
    if(!user?.idno){setSoaData(staticSOA);setLoading(false);return;}
    getSOA(user.idno)
      .then(data=>{
        if(data&&data.fees?.length){
          setSoaData({
            student: data.student?.name||staticSOA.student,
            id:      data.student?.id||staticSOA.id,
            program: data.student?.program||staticSOA.program,
            yr:      data.student?.year_level||staticSOA.yr,
            semester: staticSOA.semester,
            fees:    data.fees.map(f=>({label:f.label,amount:f.amount})),
            payments:data.payments.map(p=>({date:p.payment_date,ref:p.reference_no,amount:p.amount,method:p.method})),
          });
        }else{setSoaData(staticSOA);}
      })
      .catch(()=>setSoaData(staticSOA))
      .finally(()=>setLoading(false));
  },[user]);

  const soa=soaData||SOA;
  const total=soa.fees.reduce((a,f)=>a+f.amount,0);
  const paid=soa.payments.reduce((a,p)=>a+p.amount,0);
  const balance=total-paid;

  const downloadSOA=()=>{
    const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Statement of Account — ${soa.id}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;max-width:680px;margin:40px auto;color:#1a1a2e;font-size:14px;line-height:1.6}
  h1{font-size:22px;font-weight:700;margin-bottom:4px;color:#1A6B5E}
  .meta{color:#555;font-size:13px;margin-bottom:28px}
  .section{margin-bottom:24px}
  .section h2{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#888;margin-bottom:10px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{padding:8px 10px;border-bottom:1px solid #e8f5f1;text-align:left}
  th{background:#e8f5f1;font-weight:600;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
  .amount{text-align:right;font-family:monospace;font-weight:600}
  .total-row td{border-top:2px solid #1A6B5E;font-weight:700;padding-top:10px}
  .balance{font-size:22px;font-weight:700;color:${balance>0?"#E74C3C":"#27AE60"}}
  .stamp{margin-top:32px;padding:16px;border:1px dashed #aaa;border-radius:6px;font-size:12px;color:#888;text-align:center}
  @media print{body{margin:20px}}
</style>
</head>
<body>
  <h1>Statement of Account</h1>
  <div class="meta">${soa.student} · ${soa.id} · ${soa.program} · ${soa.yr}<br/>${soa.semester}<br/>Generated: ${new Date().toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}</div>
  <div class="section">
    <h2>Assessment of Fees</h2>
    <table>
      <thead><tr><th>Description</th><th class="amount">Amount</th></tr></thead>
      <tbody>
        ${soa.fees.map(f=>`<tr><td>${f.label}</td><td class="amount">₱${f.amount.toLocaleString()}</td></tr>`).join('')}
        <tr class="total-row"><td>Total Assessment</td><td class="amount">₱${total.toLocaleString()}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="section">
    <h2>Payment History</h2>
    <table>
      <thead><tr><th>Date</th><th>Reference</th><th>Method</th><th class="amount">Amount</th></tr></thead>
      <tbody>
        ${soa.payments.map(p=>`<tr><td>${p.date}</td><td style="font-family:monospace;font-size:12px">${p.ref}</td><td>${p.method}</td><td class="amount" style="color:#27AE60">₱${p.amount.toLocaleString()}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="3">Total Paid</td><td class="amount" style="color:#27AE60">₱${paid.toLocaleString()}</td></tr>
        <tr><td colspan="3"><strong>Remaining Balance</strong></td><td class="amount balance">₱${balance.toLocaleString()}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="stamp">This is a system-generated document. For official purposes, please request a certified SOA from the Registrar's Office.</div>
</body>
</html>`;
    const blob=new Blob([html],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`SOA_${soa.id}_${soa.semester.replace(/[\s–—]/g,"_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if(loading) return <div style={{padding:40,textAlign:"center"}}><Spin size={24}/></div>;

  return (
    <div>
      <div className="neo fu" style={{padding:"20px 24px",marginBottom:16,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <div style={{fontFamily:"var(--ff)",fontSize:18,fontWeight:700}}>Statement of Account</div>
          <div style={{fontSize:12.5,color:"var(--muted)",marginTop:4}}>{soa.student} · {soa.id} · {soa.program} · {soa.yr}</div>
          <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{soa.semester}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"var(--muted)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Balance Due</div>
          <div style={{fontFamily:"var(--ff-brand)",fontSize:28,fontWeight:700,color:balance>0?"#E74C3C":"#27AE60"}}>₱{balance.toLocaleString()}</div>
          {balance>0&&<div style={{fontSize:11.5,color:"var(--muted)",marginTop:2}}>Please settle at the Cashier's Office</div>}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        <div className="neo fu d2" style={{padding:"18px 20px"}}>
          <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:14,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><Receipt size={14}/>Assessment of Fees</div>
          <table className="dt" style={{fontSize:13}}>
            <tbody>
              {soa.fees.map((f,i)=>(
                <tr key={i}><td style={{borderBottom:"1px solid rgba(163,209,198,0.05)"}}>{f.label}</td><td style={{textAlign:"right",fontFamily:"var(--ff-mono)",fontWeight:500,color:"var(--text)"}}>₱{f.amount.toLocaleString()}</td></tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{fontWeight:600,paddingTop:12,borderTop:"1px solid rgba(163,209,198,0.15)"}}>Total Assessment</td>
                <td style={{textAlign:"right",fontFamily:"var(--ff-mono)",fontWeight:700,color:"var(--mint)",fontSize:14,paddingTop:12,borderTop:"1px solid rgba(163,209,198,0.15)"}}>₱{total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="neo fu d3" style={{padding:"18px 20px"}}>
          <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:14,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><CreditCard size={14}/>Payment History</div>
          {soa.payments.map((p,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"12px 0",borderBottom:"1px solid rgba(163,209,198,0.06)"}}>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{p.date}</div>
                <div style={{fontSize:11.5,color:"var(--muted)",marginTop:2}}>{p.method}</div>
                <code style={{fontFamily:"var(--ff-mono)",fontSize:11,color:"var(--dim)"}}>{p.ref}</code>
              </div>
              <div style={{fontFamily:"var(--ff-mono)",fontSize:14,fontWeight:600,color:"#27AE60"}}>₱{p.amount.toLocaleString()}</div>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:14,padding:"12px 0",borderTop:"1px solid rgba(163,209,198,0.12)"}}>
            <span style={{fontWeight:600}}>Total Paid</span>
            <span style={{fontFamily:"var(--ff-mono)",fontWeight:700,color:"#27AE60"}}>₱{paid.toLocaleString()}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}>
            <span style={{fontWeight:600}}>Remaining Balance</span>
            <span style={{fontFamily:"var(--ff-mono)",fontWeight:700,color:balance>0?"#E74C3C":"#27AE60"}}>₱{balance.toLocaleString()}</span>
          </div>
          <button className="btn btn-pri btn-sm" style={{width:"100%",marginTop:14}} onClick={downloadSOA}><Download size={12}/>Download SOA</button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── ANNOUNCEMENTS VIEW ────────────────── */
const AnnouncementsView = () => {
  const [cat,setCat]=useState("all");
  const [ann,setAnn]=useState(ANN);
  const cats=["all","general","activity","board","event"];
  const tagC={URGENT:"#E74C3C",EVENT:"var(--mint)",DEADLINE:"#D4A017",INFO:"#7BAEE8",ACTIVITY:"#9B59B6",BOARD:"#F39C12"};
  const catIcon={general:<Bell size={14}/>,activity:<Megaphone size={14}/>,board:<Trophy size={14}/>,event:<Calendar size={14}/>};

  useEffect(()=>{
    getAnnouncements().then(setAnn).catch(()=>setAnn(ANN));
  },[]);

  const filtered=cat==="all"?ann:ann.filter(a=>a.cat===cat);

  return (
    <div>
      {/* Category filter tabs */}
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        {cats.map(c=>(
          <button key={c} className={`tab-btn ${cat===c?"active":""}`} style={{display:"flex",alignItems:"center",gap:6}} onClick={()=>setCat(c)}>
            {c!=="all"&&catIcon[c]}{c==="all"?"All":c==="board"?"Board Passers":c.charAt(0).toUpperCase()+c.slice(1)}
          </button>
        ))}
      </div>

      {/* Board passers special card */}
      {(cat==="all"||cat==="board")&&(
        <div className="neo fu" style={{padding:"18px 20px",marginBottom:14,borderLeft:"3px solid #F39C12",background:"rgba(243,156,18,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <Trophy size={18} color="#F39C12"/>
            <span style={{fontFamily:"var(--ff)",fontSize:15,fontWeight:700,color:"#F39C12"}}>Board Passers — AY 2025–2026</span>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {[{exam:"Nursing (NLE)",count:8,rate:"100%"},{exam:"Philippine Bar",count:3,rate:"75%"},{exam:"Civil Engineering Board",count:4,rate:"80%"}].map(b=>(
              <div key={b.exam} className="neo-sm" style={{padding:"12px 16px",minWidth:140,textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--ff-brand)",color:"#F39C12"}}>{b.count}</div>
                <div style={{fontSize:11.5,color:"var(--muted)",marginTop:2}}>{b.exam}</div>
                <div style={{fontSize:12,color:"#27AE60",fontWeight:500,marginTop:4}}>{b.rate} pass rate</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((a,i)=>(
          <div key={a.id} className={`neo-sm fu d${(i%4)+1}`} style={{padding:"16px 18px",borderLeft:`3px solid ${tagC[a.tag]||"var(--mint)"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
              <Badge label={a.tag}/>
              <span style={{fontFamily:"var(--ff)",fontSize:14,fontWeight:600}}>{a.title}</span>
            </div>
            <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.65}}>{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ────────────────── EVENTS VIEW ────────────────── */
const EventsView = () => {
  const [filter,setFilter]=useState("All");
  const [events,setEvents]=useState(EVENTS);
  const types=["All","Academic","Sports","Cultural","Special"];
  const typeColor={Academic:"var(--mint)",Sports:"#3498DB",Cultural:"#9B59B6",Special:"#E74C3C"};

  useEffect(()=>{
    getEvents().then(setEvents).catch(()=>setEvents(EVENTS));
  },[]);

  const filtered=filter==="All"?events:events.filter(e=>e.type===filter);
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        {types.map(t=><button key={t} className={`tab-btn ${filter===t?"active":""}`} onClick={()=>setFilter(t)}>{t}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
        {filtered.map((ev,i)=>(
          <div key={ev.id} className={`neo fu d${(i%4)+1}`} style={{padding:"20px 20px",borderTop:`3px solid ${typeColor[ev.type]||"var(--mint)"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <Badge label={ev.type}/>
              <div style={{fontFamily:"var(--ff-mono)",fontSize:11,color:"var(--dim)"}}>{ev.date}</div>
            </div>
            <div style={{fontFamily:"var(--ff)",fontSize:15,fontWeight:700,marginBottom:6,lineHeight:1.3}}>{ev.title}</div>
            <div style={{fontSize:12.5,color:"var(--muted)",marginBottom:10,lineHeight:1.6}}>{ev.desc}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--muted)"}}>
              <Calendar size={12}/>{ev.venue}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ────────────────── EXAM SCHEDULES VIEW ────────────────── */
const ExamSchedulesView = () => {
  const [period,setPeriod]=useState("Midterm");
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:18,background:"var(--surf2)",borderRadius:10,padding:4,width:"fit-content"}}>
        {["Prelim","Midterm","Finals"].map(p=><button key={p} className={`tab-btn ${period===p?"active":""}`} onClick={()=>setPeriod(p)}>{p}</button>)}
      </div>
      <div className="neo" style={{overflow:"auto"}}>
        <table className="dt">
          <thead><tr><th>Subject Code</th><th>Subject Title</th><th>Date</th><th>Time</th><th>Room</th><th>Type</th></tr></thead>
          <tbody>
            {EXAM_SCHEDULES[period].map((e,i)=>(
              <tr key={i} className={`fu d${(i%4)+1}`}>
                <td><code style={{fontFamily:"var(--ff-mono)",fontSize:11.5,color:"var(--mint)"}}>{e.code}</code></td>
                <td style={{fontWeight:500}}>{e.title}</td>
                <td style={{fontSize:12.5,color:"var(--muted)"}}>{e.date}</td>
                <td style={{fontFamily:"var(--ff-mono)",fontSize:12,color:"var(--muted)"}}>{e.time}</td>
                <td style={{fontSize:12.5}}>{e.room}</td>
                <td><Badge label={e.type}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:14,padding:"12px 16px",background:"rgba(42,91,82,0.08)",border:"1px solid rgba(163,209,198,0.1)",borderRadius:10,fontSize:12.5,color:"var(--muted)",display:"flex",alignItems:"center",gap:8}}>
        <AlertTriangle size={13} color="var(--mint)"/>
        Exam schedules are subject to change. Check announcements regularly for updates.
      </div>
    </div>
  );
};

/* ────────────────── SETTINGS VIEW ────────────────── */
const SettingsView = ({user, setUser, theme, setTheme, toast}) => {
  const fileRef=useRef();
  const [name,setName]=useState(user.name);
  const [email,setEmail]=useState(user.email);

  const handlePhoto=e=>{
    const file=e.target.files[0];
    if(!file) return;
    if(file.size>5*1024*1024){toast("Image must be under 5MB.","warn");return;}
    const reader=new FileReader();
    reader.onload=ev=>setUser(u=>({...u,photoUrl:ev.target.result}));
    reader.readAsDataURL(file);
    toast("Profile photo updated!");
  };

  const saveProfile=()=>{
    if(!name.trim()){toast("Name cannot be empty.","warn");return;}
    setUser(u=>({...u,name:name.trim(),email:email.trim()}));
    toast("Profile updated successfully.");
  };

  return (
    <div style={{maxWidth:620}}>
      {/* Profile section */}
      <div className="neo fu" style={{padding:"22px 24px",marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:16,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>
          <UserCheck size={14}/>Profile
        </div>

        {/* Avatar upload */}
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:22}}>
          <div style={{position:"relative",flexShrink:0}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"var(--acc)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--ff-brand)",fontWeight:700,fontSize:26,color:"var(--mint)",border:"3px solid rgba(163,209,198,0.25)",boxShadow:"var(--neo)",overflow:"hidden"}}>
              {user.photoUrl?<img src={user.photoUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:user.avatar}
            </div>
            <button onClick={()=>fileRef.current?.click()} style={{position:"absolute",bottom:-2,right:-2,width:26,height:26,borderRadius:"50%",background:"var(--acc-h)",border:"2px solid var(--surf)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"var(--neo-sm)"}}>
              <Camera size={12} color="var(--mint)"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
          </div>
          <div>
            <div style={{fontFamily:"var(--ff)",fontSize:16,fontWeight:600}}>{user.name}</div>
            <div style={{fontSize:12.5,color:"var(--muted)",marginTop:2,textTransform:"capitalize"}}>{user.role} · {user.dept}</div>
            <button onClick={()=>fileRef.current?.click()} className="btn btn-ghost btn-sm" style={{marginTop:8,gap:6,fontSize:12}}><Camera size={11}/>Change Photo</button>
          </div>
        </div>

        {/* Profile fields */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14,marginBottom:18}}>
          <div>
            <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>Display Name</div>
            <input className="neo-input" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>Email Address</div>
            <input className="neo-input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>Role</div>
            <input className="neo-input" value={user.role.charAt(0).toUpperCase()+user.role.slice(1)} readOnly style={{opacity:0.6,cursor:"not-allowed"}}/>
          </div>
          <div>
            <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:7,fontWeight:500}}>Department</div>
            <input className="neo-input" value={user.dept} readOnly style={{opacity:0.6,cursor:"not-allowed"}}/>
          </div>
        </div>

        <button className="btn btn-pri btn-sm" onClick={saveProfile}><Check size={12}/>Save Profile</button>
      </div>

      {/* Appearance */}
      <div className="neo fu d2" style={{padding:"22px 24px",marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:16,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>
          {theme==="dark"?<Moon size={14}/>:<Sun size={14}/>}Appearance
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"var(--surf2)",borderRadius:12,boxShadow:"var(--neo-in)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:theme==="dark"?"rgba(42,91,82,0.2)":"rgba(255,200,80,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {theme==="dark"?<Moon size={18} color="var(--mint)"/>:<Sun size={18} color="#F39C12"/>}
            </div>
            <div>
              <div style={{fontSize:13.5,fontWeight:500}}>{theme==="dark"?"Dark Mode":"Light Mode"}</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:1}}>{theme==="dark"?"Easy on the eyes in low light":"Clean and bright interface"}</div>
            </div>
          </div>
          <div className="toggle-track" style={{background:theme==="light"?"var(--acc)":"var(--surf3)"}} onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>
            <div className="toggle-thumb" style={{left:theme==="light"?"23px":"3px"}}/>
          </div>
        </div>

        <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{id:"dark",label:"Dark",icon:<Moon size={16}/>},{id:"light",label:"Light",icon:<Sun size={16}/>}].map(t=>(
            <div key={t.id} onClick={()=>setTheme(t.id)} style={{padding:"12px 16px",borderRadius:10,border:`1.5px solid ${theme===t.id?"rgba(163,209,198,0.4)":"rgba(163,209,198,0.08)"}`,background:theme===t.id?"rgba(42,91,82,0.12)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .2s",color:theme===t.id?"var(--mint)":"var(--muted)"}}>
              {t.icon}<span style={{fontSize:13,fontWeight:theme===t.id?600:400}}>{t.label} Mode</span>
              {theme===t.id&&<Check size={13} style={{marginLeft:"auto"}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* Security placeholder */}
      <div className="neo fu d3" style={{padding:"22px 24px"}}>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:16,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><Shield size={14}/>Security</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"var(--surf2)",borderRadius:10}}>
          <div>
            <div style={{fontSize:13.5,fontWeight:500}}>Change Password</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>Last changed 30 days ago</div>
          </div>
          <button className="btn btn-ghost btn-sm"><ChevronRight size={13}/>Change</button>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"var(--surf2)",borderRadius:10,marginTop:8}}>
          <div>
            <div style={{fontSize:13.5,fontWeight:500}}>Two-Factor Authentication</div>
            <div style={{fontSize:12,color:"#27AE60",marginTop:2,display:"flex",alignItems:"center",gap:5}}><Check size={11}/>Active via email OTP</div>
          </div>
          <button className="btn btn-ghost btn-sm"><ChevronRight size={13}/>Manage</button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── ROLE-BASED NAV CONFIG ────────────────── */

/* ────────────────── PENDING ACCOUNTS VIEW ────────────────── */
const PendingAccountsView = ({ toast, role }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(null); // {profileId, name, email}
  const [sn, setSn]             = useState("");
  const [program, setProgram]   = useState("BS Computer Science");
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .eq("confirmed", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAccounts(data || []);
    } catch(e) {
      toast("Failed to load pending accounts: " + e.message, "error");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAssign = async () => {
    if (!sn.trim()) { toast("Please enter a Student Number.", "error"); return; }
    setSaving(true);
    try {
      // Update profile with SN
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ student_no: sn.trim().toUpperCase() })
        .eq("id", form.profileId);
      if (profErr) throw profErr;

      // Create student record
      const { error: stuErr } = await supabase
        .from("students")
        .insert({
          id: sn.trim().toUpperCase(),
          name: form.name,
          program: program,
          year_level: 1,
          gpa: 0.00,
          status: "Enrolled"
        });
      if (stuErr && !stuErr.message.includes("duplicate") && !stuErr.message.includes("unique")) throw stuErr;

      toast("Student Number assigned! Student can now confirm their account.", "success");
      setForm(null);
      setSn("");
      load();
    } catch(e) {
      toast("Error: " + e.message, "error");
    }
    setSaving(false);
  };

  const programs = [
    "BS Computer Science", "BS Information Technology", "BS Mathematics",
    "BS Physics", "BS Civil Engineering", "BS Nursing", "BS Accountancy",
  ];

  return (
    <div className="fu">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:17,fontWeight:700}}>Pending Accounts</div>
          <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>New student signups awaiting Student Number assignment</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13}/>Refresh</button>
      </div>

      {loading ? (
        <div style={{display:"flex",gap:12,flexDirection:"column"}}>
          {[1,2,3].map(i=><div key={i} className="skel" style={{height:64,borderRadius:10}}/>)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="neo" style={{padding:40,textAlign:"center",color:"var(--muted)"}}>
          <UserCheck size={32} style={{margin:"0 auto 12px",opacity:.4}}/>
          <div style={{fontSize:14}}>No pending accounts</div>
          <div style={{fontSize:12,marginTop:6}}>All students have been processed.</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {accounts.map(a => (
            <div key={a.id} className="neo-sm" style={{padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:"var(--acc)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"var(--mint)",flexShrink:0}}>
                  {(a.display_name||a.username).slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{fontWeight:600,fontSize:13.5}}>{a.display_name || a.username}</div>
                  <div style={{fontSize:11.5,color:"var(--muted)"}}>{a.email} · Signed up {new Date(a.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span className="badge" style={{background:"rgba(212,160,23,0.15)",color:"var(--warn)"}}>Pending</span>
                {role === "admin" && (
                  <button className="btn btn-pri btn-sm" onClick={()=>{ setForm({profileId:a.id, name:a.display_name||a.full_name||a.username, email:a.email}); setSn(""); }}>
                    <UserPlus size={13}/>Assign SN
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign SN Modal */}
      {form && (
        <div className="modal-wrap" onClick={e=>e.target===e.currentTarget&&setForm(null)}>
          <div className="neo modal-card" style={{width:"100%",maxWidth:420,padding:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700}}>Assign Student Number</div>
              <button className="btn btn-ghost btn-icon" onClick={()=>setForm(null)}><X size={15}/></button>
            </div>
            <div style={{fontSize:12.5,color:"var(--muted)",marginBottom:18,padding:"10px 14px",background:"var(--surf2)",borderRadius:8}}>
              <strong style={{color:"var(--text)"}}>{form.name}</strong><br/>{form.email}
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11.5,color:"var(--muted)",fontWeight:500,letterSpacing:".05em",textTransform:"uppercase"}}>Student Number</label>
              <input className="neo-input" style={{marginTop:6,textTransform:"uppercase"}} placeholder="e.g. SN-2026-0042"
                value={sn} onChange={e=>setSn(e.target.value)}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:11.5,color:"var(--muted)",fontWeight:500,letterSpacing:".05em",textTransform:"uppercase"}}>Program</label>
              <select className="neo-input" style={{marginTop:6}} value={program} onChange={e=>setProgram(e.target.value)}>
                {programs.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setForm(null)}>Cancel</button>
              <button className="btn btn-pri" style={{flex:2}} onClick={handleAssign} disabled={saving}>
                {saving ? <RefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/> : <><Check size={13}/>Assign & Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NAV_CONFIG = {
  admin: [
    {id:"overview",  label:"Overview",         icon:<LayoutDashboard size={16}/>},
    {id:"pending",   label:"Pending Accounts", icon:<UserCheck size={16}/>},
    {id:"students",  label:"Students",          icon:<Users size={16}/>},
    {id:"grades",    label:"Grade Encoding",    icon:<BookOpen size={16}/>},
    {id:"enroll",    label:"Enrollment",        icon:<ClipboardList size={16}/>},
    {id:"soa",       label:"Statement of Acct", icon:<Receipt size={16}/>},
    {id:"announce",  label:"Announcements",     icon:<Bell size={16}/>},
    {id:"events",    label:"School Events",     icon:<Calendar size={16}/>},
    {id:"exams",     label:"Exam Schedules",    icon:<FileText size={16}/>},
    {id:"settings",  label:"Settings",          icon:<SettingsIcon size={16}/>},
  ],
  teacher: [
    {id:"overview",  label:"Overview",          icon:<LayoutDashboard size={16}/>},
    {id:"pending",   label:"Pending Accounts",  icon:<UserCheck size={16}/>},
    {id:"students",  label:"My Students",       icon:<Users size={16}/>},
    {id:"grades",    label:"Grade Encoding",    icon:<BookOpen size={16}/>},
    {id:"exams",     label:"Exam Schedules",    icon:<FileText size={16}/>},
    {id:"announce",  label:"Announcements",     icon:<Bell size={16}/>},
    {id:"events",    label:"School Events",     icon:<Calendar size={16}/>},
    {id:"settings",  label:"Settings",          icon:<SettingsIcon size={16}/>},
  ],
  student: [
    {id:"overview",  label:"Overview",          icon:<LayoutDashboard size={16}/>},
    {id:"enroll",    label:"My Enrollment",     icon:<ClipboardList size={16}/>},
    {id:"soa",       label:"Statement of Acct", icon:<Receipt size={16}/>},
    {id:"exams",     label:"Exam Schedules",    icon:<FileText size={16}/>},
    {id:"announce",  label:"Announcements",     icon:<Bell size={16}/>},
    {id:"events",    label:"School Events",     icon:<Calendar size={16}/>},
    {id:"settings",  label:"Settings",          icon:<SettingsIcon size={16}/>},
  ],
};

/* ────────────────── DASHBOARD SHELL ────────────────── */
const Dashboard = ({user, setUser, theme, setTheme, onLogout, showModal, toast}) => {
  const NAV=NAV_CONFIG[user.role]||NAV_CONFIG.student;
  const [active,setActive]=useState("overview");
  const [mobileMenu,setMobileMenu]=useState(false);

  const navigate=id=>{setActive(id);setMobileMenu(false);};
  const breadcrumb=["Dashboard",NAV.find(n=>n.id===active)?.label].filter(Boolean);

  const Content=()=>{
    const p={showModal,toast,user};
    if(active==="overview"){
      if(user.role==="admin")   return <AdminOverview user={user}/>;
      if(user.role==="teacher") return <TeacherOverview user={user}/>;
      return <StudentOverview user={user}/>;
    }
    if(active==="pending")  return <PendingAccountsView toast={toast} role={user.role}/>;
    if(active==="students") return <StudentsView {...p} readOnly={user.role==="teacher"}/>;
    if(active==="grades")   return <GradesView {...p}/>;
    if(active==="enroll")   return <EnrollmentView toast={toast} role={user.role} user={user}/>;
    if(active==="soa")      return <SOAView role={user.role} user={user}/>;
    if(active==="announce") return <AnnouncementsView/>;
    if(active==="events")   return <EventsView/>;
    if(active==="exams")    return <ExamSchedulesView/>;
    if(active==="settings") return <SettingsView user={user} setUser={setUser} theme={theme} setTheme={setTheme} toast={toast}/>;
  };

  const Avatar=({size=34})=>(
    <div style={{width:size,height:size,borderRadius:"50%",background:"var(--acc)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--ff-brand)",fontWeight:700,fontSize:size*0.38,color:"var(--mint)",border:"2px solid rgba(163,209,198,0.25)",flexShrink:0,boxShadow:"var(--neo-sm)",overflow:"hidden"}}>
      {user.photoUrl?<img src={user.photoUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:user.avatar}
    </div>
  );

  const SidebarContent=()=>(
    <>
      <div style={{padding:"20px 16px 16px",borderBottom:"1px solid rgba(163,209,198,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{width:32,height:32,background:"var(--acc)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"var(--neo-sm)"}}><GraduationCap size={17} color="var(--mint)"/></div>
          <div>
            <div style={{fontFamily:"var(--ff-brand)",fontSize:15,fontWeight:700}}>Axiom</div>
            <div style={{fontSize:10,color:"var(--muted)",letterSpacing:"0.08em",textTransform:"uppercase"}}>Portal v3.0</div>
          </div>
        </div>
        <div onClick={()=>navigate("settings")} style={{background:"var(--surf2)",borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,boxShadow:"var(--neo-in)",cursor:"pointer",transition:"opacity .15s"}} title="Go to Settings">
          <Avatar/>
          <div style={{overflow:"hidden",flex:1}}>
            <div style={{fontSize:12.5,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
            <div style={{fontSize:11,color:"var(--muted)",textTransform:"capitalize"}}>{user.role}</div>
          </div>
          <SettingsIcon size={13} color="var(--muted)"/>
        </div>
      </div>
      <nav style={{padding:"10px",flex:1,overflowY:"auto"}}>
        {NAV.map(n=>(
          <div key={n.id} className={`si-item ${active===n.id?"active":""}`} onClick={()=>navigate(n.id)}>
            {n.icon}<span>{n.label}</span>
          </div>
        ))}
      </nav>
      <div style={{padding:"10px",borderTop:"1px solid rgba(163,209,198,0.07)"}}>
        <div onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} className="si-item" title="Toggle theme">
          {theme==="dark"?<Sun size={15}/>:<Moon size={15}/>}
          <span>{theme==="dark"?"Light Mode":"Dark Mode"}</span>
        </div>
        <div className="si-item" style={{color:"var(--danger)"}} onClick={onLogout}><LogOut size={15}/><span>Sign Out</span></div>
      </div>
    </>
  );

  // Mobile bottom nav - show first 5 nav items for the role
  const mobileNav=NAV.slice(0,5);

  return (
    <div style={{display:"flex",minHeight:"100dvh"}}>
      <aside className="desk" style={{width:"var(--sidebar)",background:"var(--surf)",boxShadow:"var(--neo)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100dvh",zIndex:50,flexShrink:0}}>
        <SidebarContent/>
      </aside>

      {mobileMenu&&(
        <div className="mob" style={{position:"fixed",inset:0,zIndex:100}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)"}} onClick={()=>setMobileMenu(false)}/>
          <aside style={{position:"absolute",left:0,top:0,bottom:0,width:248,background:"var(--surf)",boxShadow:"var(--neo)",display:"flex",flexDirection:"column",animation:"scaleIn .25s ease"}}>
            <SidebarContent/>
          </aside>
        </div>
      )}

      <main style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,paddingBottom:"var(--bnav)"}}>
        <div style={{position:"sticky",top:0,background:"var(--base)",borderBottom:"1px solid rgba(163,209,198,0.07)",zIndex:40,padding:"11px 18px",display:"flex",alignItems:"center",gap:12,backdropFilter:"blur(8px)"}}>
          <button className="btn btn-ghost btn-icon mob" onClick={()=>setMobileMenu(true)}><Menu size={16}/></button>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12.5,color:"var(--muted)",flex:1}}>
            {breadcrumb.map((b,i)=>(
              <span key={b} style={{display:"flex",alignItems:"center",gap:6}}>
                {i>0&&<ChevronRight size={12}/>}
                <span style={{color:i===breadcrumb.length-1?"var(--text)":"var(--muted)",cursor:i<breadcrumb.length-1?"pointer":"default"}} onClick={i===0?()=>navigate("overview"):undefined}>{b}</span>
              </span>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} className="btn btn-ghost btn-icon" title="Toggle theme" style={{display:"flex",alignItems:"center"}}>
              {theme==="dark"?<Sun size={14}/>:<Moon size={14}/>}
            </button>
            <div style={{fontSize:11.5,color:"var(--muted)",fontFamily:"var(--ff-mono)",display:"flex",alignItems:"center",gap:5}}>
              <Clock size={12}/>{new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
            </div>
          </div>
        </div>
        <div style={{flex:1,padding:18,maxWidth:1280}}><Content/></div>
      </main>

      <nav className="mob-nav" style={{position:"fixed",bottom:0,left:0,right:0,height:"var(--bnav)",background:"var(--surf)",borderTop:"1px solid rgba(163,209,198,0.07)",zIndex:50,alignItems:"stretch",justifyContent:"space-around",backdropFilter:"blur(12px)",display:"none"}}>
        {mobileNav.map(n=>(
          <button key={n.id} onClick={()=>navigate(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,flex:1,background:"none",border:"none",cursor:"pointer",color:active===n.id?"var(--mint)":"var(--muted)",transition:"color .2s",padding:0,fontFamily:"var(--ff)"}}>
            {n.icon}<span className="nav-lbl" style={{fontSize:9.5,fontWeight:500,letterSpacing:"0.04em"}}>{n.label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};


/* ────────────────── CONFIRM SN SCREEN ────────────────── */
const ConfirmSN = ({ user: userProp, onConfirmed }) => {
  const [sn, setSn] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Always read fresh from localStorage to avoid undefined prop race condition
  const user = getLocalSession() || userProp;

  const handleConfirm = async () => {
    if (!sn.trim()) { setErr("Please enter your Student Number."); return; }
    if (!user?.id) { setErr("Session error. Please sign out and log in again."); return; }
    setLoading(true);
    setErr("");
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("student_no")
        .eq("id", user.id)
        .single();
      if (error || !profile) throw new Error("Profile not found.");
      if (!profile.student_no) throw new Error("No Student Number assigned yet. Please contact your admin.");
      if (profile.student_no.toUpperCase() !== sn.trim().toUpperCase())
        throw new Error("Incorrect Student Number. Please check with your admin.");
      // Mark as confirmed
      await supabase.from("profiles").update({ confirmed: true }).eq("id", user.id);
      const updated = { ...user, idno: profile.student_no, confirmed: true };
      setLocalSession(updated);
      onConfirmed(updated);
    } catch(e) {
      setErr(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--base)",padding:20}}>
      <div className="neo si" style={{width:"100%",maxWidth:420,padding:36}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:52,height:52,borderRadius:14,background:"var(--acc)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            <Shield size={24} color="var(--mint)"/>
          </div>
          <div style={{fontFamily:"var(--ff-brand)",fontSize:22,fontWeight:700,color:"var(--text)"}}>Confirm Your Account</div>
          <div style={{fontSize:12.5,color:"var(--muted)",marginTop:6}}>Enter the Student Number provided by your administrator to activate your account.</div>
          {/* Show who is logged in */}
          <div style={{marginTop:14,padding:"10px 14px",background:"var(--surf2)",borderRadius:9,display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
            <div style={{width:30,height:30,borderRadius:8,background:"var(--acc)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"var(--mint)",flexShrink:0}}>
              {(user?.name||user?.username||user?.email||"?").slice(0,2).toUpperCase()}
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:12.5,fontWeight:600,color:"var(--text)"}}>{user?.name||user?.username||"Unknown"}</div>
              <div style={{fontSize:11,color:"var(--muted)"}}>{user?.email}</div>
            </div>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:11.5,color:"var(--muted)",fontWeight:500,letterSpacing:".05em",textTransform:"uppercase"}}>Student Number</label>
          <input
            className="neo-input"
            style={{marginTop:6,textTransform:"uppercase",letterSpacing:".08em"}}
            placeholder="e.g. SN-2026-0042"
            value={sn}
            onChange={e=>setSn(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleConfirm()}
          />
        </div>
        {err && <div style={{background:"rgba(192,57,43,0.12)",border:"1px solid rgba(192,57,43,0.3)",borderRadius:8,padding:"9px 13px",fontSize:12.5,color:"var(--danger)",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><AlertTriangle size={14}/>{err}</div>}
        <button className="btn btn-pri" style={{width:"100%",justifyContent:"center",padding:"11px 0"}} onClick={handleConfirm} disabled={loading}>
          {loading ? <RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/> : <><Check size={14}/>Confirm & Enter</>}
        </button>
        <div style={{textAlign:"center",marginTop:14,fontSize:12,color:"var(--muted)"}}>
          Need help? Contact your school administrator.
        </div>
        <div style={{textAlign:"center",marginTop:10}}>
          <button style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"var(--muted)",textDecoration:"underline",fontFamily:"var(--ff)"}}
            onClick={async()=>{ await supabase.auth.signOut(); clearLocalSession(); window.location.reload(); }}>
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── APP ROOT ────────────────── */
export default function App() {
  const [screen,setScreen]     = useState("hero");
  const [user,setUser]         = useState(null);
  const [otpToken,setOtpToken] = useState("");
  const [theme,setTheme]       = useState("dark");
  const {toasts,show:toast}    = useToasts();
  const [modal,setModal]       = useState(null);

  // Restore session on reload
  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const saved = getLocalSession();
        if (saved) {
          setUser(saved);
          if (saved.role === 'student' && !saved.confirmed) {
            setScreen("confirm_sn");
          } else {
            setScreen("dashboard");
          }
        } else {
          const { data: profile } = await supabase
            .from("profiles").select("*").eq("id", session.user.id).single();
          if (profile) {
            const u = {
              id:        profile.id,
              username:  profile.username,
              email:     profile.email,
              name:      profile.display_name || profile.full_name,
              role:      profile.role,
              dept:      profile.department,
              avatar:    profile.avatar_url || (profile.display_name || profile.username).slice(0,2).toUpperCase(),
              idno:      profile.student_no || "",
              confirmed: profile.confirmed || false,
            };
            setLocalSession(u);
            setUser(u);
            if (u.role === 'student' && !u.confirmed) {
              setScreen("confirm_sn");
            } else {
              setScreen("dashboard");
            }
          }
        }
      }
    };
    restoreSession();
  }, []);

  // Apply theme to <html> so body background + all CSS vars propagate correctly
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const showModal  = cfg => setModal(cfg);
  const closeModal = ()  => setModal(null);

  const handleLogin = (u,token) => { setUser(u); setOtpToken(token); setScreen("2fa"); };
  const handleVerify = () => {
    if (user?.role === 'student' && !user?.confirmed) {
      setScreen("confirm_sn");
    } else {
      setScreen("dashboard");
    }
  };
  const handleLogout = () => showModal({
    title:"Sign Out", msg:"End your session? All unsaved changes will be lost.",
    danger:true, confirmLabel:"Sign Out",
    onConfirm: async () => {
      closeModal();
      await supabase.auth.signOut();
      clearLocalSession();
      setUser(null);
      setOtpToken("");
      setTheme("dark");
      setScreen("hero");
    }
  });

  return (
    <div data-theme={theme}>
      <style>{STYLES}</style>
      {screen==="hero"      && <Hero onStart={()=>setScreen("login")}/>}
      {screen==="login"     && <Login onLogin={handleLogin} onBack={()=>setScreen("hero")}/>}
      {screen==="2fa"       && <TwoFA user={user} otpToken={otpToken} onVerify={handleVerify} onBack={()=>setScreen("login")}/>}
      {screen==="confirm_sn" && <ConfirmSN user={user} onConfirmed={(u)=>{ setUser(u); setScreen("dashboard"); }}/>}
      {screen==="dashboard" && <Dashboard user={user} setUser={setUser} theme={theme} setTheme={setTheme} onLogout={handleLogout} showModal={showModal} toast={toast}/>}
      {modal && <ConfirmModal {...modal} onCancel={closeModal}/>}
      <ToastLayer toasts={toasts}/>
    </div>
  );
}
