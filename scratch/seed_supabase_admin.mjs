import { createClient } from '@supabase/supabase-js';

const url = 'https://bnbscflfrnwuigouxxfc.supabase.co';
const key = 'sb_publishable_ptzvPufFtGVIA3IaK9BCdA_Hycw6wan';

const supabase = createClient(url, key);

async function signupAdmin() {
  console.log('Registering Admin user in Supabase Auth...');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@anandhardware.com',
    password: 'AnandAdmin2026!',
    options: {
      data: {
        displayName: 'Anand Hardware Admin',
        role: 'admin',
      },
    },
  });

  if (error) {
    console.error('SignUp Error:', error.message);
  } else {
    console.log('SignUp Success:', data.user?.email, 'User ID:', data.user?.id);
  }
}

signupAdmin();
