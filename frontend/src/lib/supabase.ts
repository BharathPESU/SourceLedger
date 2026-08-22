import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};

// Read Vite environment variables
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!metaEnv.VITE_SUPABASE_URL || !metaEnv.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing. Please add them to your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
