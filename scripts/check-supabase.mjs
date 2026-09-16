import { createClient } from '@supabase/supabase-js';
try { process.loadEnvFile('.env.local'); } catch { /* Hosted environments supply variables directly. */ }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key?.startsWith('sb_publishable_')) throw new Error('Configura la URL y la clave publicable en .env.local.');
const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Supabase Auth devolvió HTTP ${response.status}.`);
const settings = await response.json();
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { error } = await client.from('transactions').select('id').limit(1);
const anonymousBlocked = error?.code === '42501';
console.log(JSON.stringify({ project: new URL(url).hostname, authReachable: true,
  googleEnabled: settings.external?.google === true, signupEnabled: settings.disable_signup === false,
  anonymousTransactionsBlocked: anonymousBlocked }, null, 2));
if (!anonymousBlocked) process.exitCode = 1;
