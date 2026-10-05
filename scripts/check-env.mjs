const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !/^https:\/\//.test(url) || !key) throw new Error('Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY repository variables.');
if (key.startsWith('sb_secret_')) throw new Error('A server secret cannot be used in the frontend.');
if (key.split('.').length === 3) {
  const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  if (payload.role !== 'anon') throw new Error('Only publishable/anon keys may be used in the frontend.');
}
console.log('Frontend configuration is present.');
