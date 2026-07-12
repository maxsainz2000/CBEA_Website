const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const anonKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

console.log('URL:', url);
console.log('Key Length:', anonKey.length);

const supabase = createClient(url, anonKey);

async function test() {
  console.log('Fetching budget_entries...');
  const { data, error } = await supabase.from('budget_entries').select('*');
  if (error) {
    console.error('Error fetching entries:', error);
  } else {
    console.log('Success! Count:', data.length);
    if (data.length > 0) {
      console.log('Sample entry:', data[0]);
    }
  }

  console.log('Testing auth getSession...');
  const { data: authData, error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.error('Auth Error:', authError);
  } else {
    console.log('Auth Success! Session exists:', !!authData.session);
  }
}

test();
