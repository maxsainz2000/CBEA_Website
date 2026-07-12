import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(url, anonKey);
  const email = 'jane.doe@csu.edu.ph';
  const password = 'Password123!';

  console.log(`Attempting to sign up ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Sign up failed:', error.message);
  } else {
    console.log('Sign up result:', data);
  }
}

main();
