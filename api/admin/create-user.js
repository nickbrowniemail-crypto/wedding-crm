import { createClient } from '@supabase/supabase-js';

const VALID_ROLES = ['admin', 'project_manager', 'relationship_manager', 'production_coordinator', 'editor'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: missing Supabase env vars' });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  } catch (err) {
    return res.status(500).json({ error: 'Failed to initialise Supabase client' });
  }

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 1. Extract and validate caller JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.slice(7);

  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !caller) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // 2. Verify caller is admin in profiles table
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single();

  if (callerProfile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // 3. Validate request body
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { email, password, full_name, role = 'staff' } = body ?? {};

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, and full_name are required' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // 4. Create the Supabase Auth user (email auto-confirmed, no invite email)
  const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createError) {
    return res.status(400).json({ error: createError.message });
  }

  // 5. Upsert profile with correct role + email (handles trigger timing race)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: user.id, full_name, email, role }, { onConflict: 'id' });

  if (profileError) {
    console.error('Profile upsert error:', profileError.message);
  }

  return res.status(200).json({ success: true, userId: user.id, email: user.email });
}
