import { createClient } from '@supabase/supabase-js';

const TEST_USER_ID = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local for Playwright tests');
}

export default async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  }

  const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Ensure the test user exists with the deterministic UUID
  const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(TEST_USER_ID);
  if (!existingUser?.user) {
    // Check if a user with this email already exists (different UUID)
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingByEmail = users?.find(u => u.email === TEST_USER_EMAIL);
    if (existingByEmail) {
      // Delete the existing user so we can recreate with the target UUID
      await supabaseAdmin.auth.admin.deleteUser(existingByEmail.id);
    }

    // Create the user with the deterministic UUID
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Jane Doe', role: 'Treasurer' },
    });
    if (createError) throw createError;
  }

  // 2. Ensure a profiles row exists for the test user
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', TEST_USER_ID)
    .single();

  if (!profile) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: TEST_USER_ID,
        full_name: 'Jane Doe',
        role: 'Treasurer',
      });
    if (profileError) throw profileError;
  }
}
