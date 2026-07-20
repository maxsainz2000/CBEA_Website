// scratch/verify-signup-disabled.js
// Run: node scratch/verify-signup-disabled.js
// Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verify() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test-attacker@example.com',
    password: 'Test1234!',
  });

  if (error) {
    console.log('✅ PASS — signups disabled:', error.message);
  } else {
    console.log('❌ FAIL — signup succeeded for:', data.user?.email);
    console.log('   Go to Dashboard → Authentication → Providers → Email → disable signups.');
  }
}

verify();
