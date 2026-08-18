import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bnbscflfrnwuigouxxfc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ptzvPufFtGVIA3IaK9BCdA_Hycw6wan';

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
