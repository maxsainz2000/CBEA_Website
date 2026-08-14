const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function addUser({ email, fullName, role, password }) {
  console.log(`Processing user: ${email}...`);

  // 1. Check if user already exists in auth.users
  let existingUser = null;
  let page = 1;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      console.error('Error listing users:', error);
      return;
    }
    if (!data || !data.users || data.users.length === 0) break;
    const match = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      existingUser = match;
      break;
    }
    if (data.users.length < 100) break;
    page++;
  }

  let userId;
  if (existingUser) {
    console.log(`User ${email} already exists with ID: ${existingUser.id}`);
    userId = existingUser.id;
    // Update user metadata and password if requested
    const updatePayload = {
      user_metadata: { full_name: fullName, role }
    };
    if (password) updatePayload.password = password;

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
    if (updateError) {
      console.error('Failed to update existing user auth record:', updateError);
    } else {
      console.log('Updated user auth metadata successfully.');
    }
  } else {
    // Create new auth user
    const finalPassword = password || `TempPass${Math.floor(100000 + Math.random() * 900000)}!`;
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role }
    });

    if (createError) {
      console.error('Failed to create auth user:', createError);
      return;
    }

    userId = createData.user.id;
    console.log(`Created auth user successfully. ID: ${userId}, Temporary Password: ${finalPassword}`);
  }

  // 2. Upsert profile in public.profiles
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fullName,
      role: role
    })
    .select();

  if (profileError) {
    console.error('Failed to upsert profile:', profileError);
  } else {
    console.log('Successfully upserted profile in public.profiles:');
    console.log(profileData);
  }
}

// Read parameters from command line args or default
const email = process.argv[2] || 'talosigjohnlester@gmail.com';
const fullName = process.argv[3] || 'John Lester Talosig';
const role = process.argv[4] || 'Treasurer';
const password = process.argv[5] || 'Password123!';

addUser({ email, fullName, role, password });
