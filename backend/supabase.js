const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy backend/.env.example to backend/.env and fill in your project values.');
}
const supabase = url && serviceKey ? createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
}) : null;
module.exports = supabase;
