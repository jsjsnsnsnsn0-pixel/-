// Keep the OAuth callback on the actual admin host, even when served under
// a nested Supabase Edge Function path. Never share the app's callback URL.
export function adminOAuthRedirect(browserLocation) {
 const origin=browserLocation?.origin;
 const pathname=browserLocation?.pathname || '/';
 if(typeof origin!=='string'||typeof pathname!=='string')
  throw new TypeError('Missing admin URL for OAuth redirect');
 const callback=new URL(pathname,origin);
 if(!['http:','https:'].includes(callback.protocol)||callback.origin!==origin)
  throw new TypeError('Invalid admin OAuth redirect URL');
 return callback.href;
}
