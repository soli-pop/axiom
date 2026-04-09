import { createClient } from '@supabase/supabase-js';

// Pull credentials from your Vercel deployment / local .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to keep track of the active custom user session locally
export const getLocalSession = () => JSON.parse(localStorage.getItem('sn_session') || 'null');
export const setLocalSession = (user) => localStorage.setItem('sn_session', JSON.stringify(user));
export const clearLocalSession = () => localStorage.removeItem('sn_session');
