import { createClient } from '@supabase/supabase-js';

const TEST_USER_ID = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001';

export default async function globalTeardown() {
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

  // Clean up any E2E test entries (CRUD test creates entries with 'E2E Sponsorship' prefix)
  const { error } = await supabaseAdmin
    .from('budget_entries')
    .delete()
    .eq('entered_by', TEST_USER_ID)
    .like('description', 'E2E Sponsorship %');

  if (error) {
    console.warn('Global teardown: failed to clean up test entries:', error.message);
  }
}
