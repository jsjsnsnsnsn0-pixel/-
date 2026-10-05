import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';
const consumedCodes = new Set<string>();
export const nativeAuthRedirect = 'com.totichat.app://auth/callback';
export async function signInWithGoogle() {
  const native = Capacitor.isNativePlatform();
  const {data, error} = await supabase.auth.signInWithOAuth({provider: 'google', options: {
    redirectTo: native ? nativeAuthRedirect : import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin,
    skipBrowserRedirect: native,
  }});
  if (error) throw error;
  if (native && data.url) {
    const {Browser} = await import('@capacitor/browser'); await Browser.open({url: data.url});
  }
}
export async function listenForNativeAuth(onError: () => void): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => {};
  const {App} = await import('@capacitor/app');
  const {Browser} = await import('@capacitor/browser');
  const accept = async (value: string) => {
    const url = new URL(value);
    if (url.protocol !== 'com.totichat.app:' || url.hostname !== 'auth' || url.pathname !== '/callback') return;
    const code = url.searchParams.get('code');
    if (url.searchParams.has('error') || !code) { onError(); return; }
    if (consumedCodes.has(code)) return;
    consumedCodes.add(code);
    const {error} = await supabase.auth.exchangeCodeForSession(code);
    await Browser.close().catch(() => {});
    if (error) onError();
  };
  const listener = await App.addListener('appUrlOpen', ({url}) => { void accept(url).catch(onError); });
  const launch = await App.getLaunchUrl();
  if (launch?.url) void accept(launch.url).catch(onError);
  return () => { void listener.remove(); };
}
