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

  // Polyfill getUserByEmail since it is not natively present in this version of the SDK
  const adminWithGetEmail = supabaseAdmin.auth.admin as typeof supabaseAdmin.auth.admin & {
    getUserByEmail: (email: string) => Promise<any>;
  };

  adminWithGetEmail.getUserByEmail = async (email: string) => {
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 100,
      });
      if (error) return { data: { user: null }, error };
      if (!data || !data.users || data.users.length === 0) break;
      const user = data.users.find((u) => u.email === email);
      if (user) {
        return { data: { user }, error: null };
      }
      if (data.users.length < 100) break;
      page++;
    }
    return { data: { user: null }, error: null };
  };

  // 1. Ensure the test user exists with the deterministic UUID
  const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(TEST_USER_ID);

  if (getUserError) {
    if (getUserError.message?.includes('User not found') || getUserError.status === 404) {
      // Check if a user with this email already exists (different UUID)
      const { data: userData, error: getEmailError } = await adminWithGetEmail.getUserByEmail(TEST_USER_EMAIL!);
      if (getEmailError && !getEmailError.message?.toLowerCase().includes('not found') && getEmailError.status !== 404) {
        throw new Error(`Failed to check existing user by email: ${getEmailError.message}`);
      }

      if (userData?.user) {
        // Delete the existing user so we can recreate with the target UUID
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        if (deleteUserError) throw new Error(`Failed to delete existing user: ${deleteUserError.message}`);
      }

      // Create the user with the deterministic UUID
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Jane Doe', role: 'Treasurer' },
      });
      if (createError) throw new Error(`Failed to create test user: ${createError.message}`);
    } else {
      throw new Error(`Failed to check test user: ${getUserError.message}`);
    }
  } else if (!existingUser?.user) {
    throw new Error('Failed to retrieve test user: Response data is empty');
  } else {
    // User exists — delete residual entries
    const { error: deleteError } = await supabaseAdmin
      .from('budget_entries')
      .delete()
      .eq('entered_by', TEST_USER_ID)
      .like('description', 'E2E Sponsorship %');
    if (deleteError) {
      console.warn(`Failed to clean up test entries: ${deleteError.message}`);
    }
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
