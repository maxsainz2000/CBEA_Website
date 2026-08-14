const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function check() {
  console.log('--- Auth Users ---');
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error listing users:', usersError);
  } else {
    console.log(`Found ${usersData.users.length} users:`);
    usersData.users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}`);
    });
  }

  console.log('\n--- Profiles Table ---');
  const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*');
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  } else {
    console.log(`Found ${profilesData.length} profiles:`);
    profilesData.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.full_name}, Role: ${p.role}`);
    });
  }
}

check();
