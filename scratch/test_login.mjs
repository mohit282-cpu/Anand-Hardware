import { createClient } from '@supabase/supabase-js';

const url = 'https://bnbscflfrnwuigouxxfc.supabase.co';
const key = 'sb_publishable_ptzvPufFtGVIA3IaK9BCdA_Hycw6wan';

const supabase = createClient(url, key);

async function testSignIn() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@anandhardware.com',
    password: 'AnandAdmin2026!',
  });

  if (error) {
    console.error('SignIn Error:', error.message);
  } else {
    console.log('SignIn SUCCESS! User:', data.user.email, 'ID:', data.user.id);
  }
}

testSignIn();
