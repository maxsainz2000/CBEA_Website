// scratch/verify-signup-disabled.js
// Run: node scratch/verify-signup-disabled.js
// Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ FAIL — Missing Supabase environment variables in .env.local');
  process.exitCode = 1;
  return;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verify() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test-attacker@example.com',
      password: 'Test1234!',
    });

    if (error) {
      console.log('✅ PASS — signups disabled:', error.message);
      process.exitCode = 0;
    } else {
      console.error('❌ FAIL — signup succeeded for:', data.user?.email);
      console.error('   Go to Dashboard → Authentication → Providers → Email → disable signups.');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('❌ FAIL — Unexpected error during verification:', err.message || err);
    process.exitCode = 1;
  }
}

verify();
