export function validateFrontendConfig(env) {
  const {VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key, VITE_AUTH_REDIRECT_URL: redirect} = env;
  for (const [name,value] of Object.entries({VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:key,VITE_AUTH_REDIRECT_URL:redirect})) {
    if (!value?.trim()) throw new Error(`Missing required build configuration: ${name}`);
  }
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('VITE_SUPABASE_URL must be a valid HTTPS URL.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('VITE_SUPABASE_URL must be HTTPS without credentials.');
  let callback;
  try { callback = new URL(redirect); } catch { throw new Error('VITE_AUTH_REDIRECT_URL must be a valid callback URL.'); }
  if (!['https:', 'com.totichat.app:'].includes(callback.protocol) || callback.username || callback.password) throw new Error('VITE_AUTH_REDIRECT_URL must use HTTPS or the application callback scheme.');
  if (callback.protocol === 'com.totichat.app:' && (callback.hostname !== 'auth' || callback.pathname !== '/callback')) throw new Error('Native OAuth callback must match the Android intent filter.');
  if (/^(sb_publishable_)[A-Za-z0-9_-]{20,}$/.test(key)) return;
  // Legacy anon JWTs remain supported; reject service_role and placeholders.
  try {
    const parts = key.split('.');
    if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error();
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.role !== 'anon' || payload.iss !== 'supabase' || (payload.ref && parsed.hostname.endsWith('.supabase.co') && parsed.hostname.split('.')[0] !== payload.ref)) throw new Error();
    if (payload.exp && payload.exp * 1000 <= Date.now()) throw new Error();
  } catch { throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must be a real publishable/anon key; test placeholders and server keys are forbidden.'); }
}
