import {APP_VERSION} from './release';
import {supabase} from './supabase';
export type BetaEvent='app_crash'|'api_error'|'audio_disconnect'|'room_reconnect'|'gift_failure'|'wallet_failure'|'music_failure'|'login_failure';
const submitted=new Map<string,number>();
/** Only abstract error categories are sent. Never include raw error text, URLs, tokens or PII. */
export function recordBetaEvent(category:BetaEvent,code:string):void{
 const safe=code.toLowerCase().replace(/[^a-z0-9_]/g,'_').slice(0,64);
 if(safe.length<3)return;
 const key=category+':'+safe;const now=Date.now();
 if(now-(submitted.get(key)||0)<60000)return;
 submitted.set(key,now);
 if(submitted.size>80)submitted.clear();
 const platform=typeof navigator!=='undefined'&&/android/i.test(navigator.userAgent)?'android':'web';
 void (async()=>{try{await supabase.rpc('beta_record_event',{
   p_category:category,p_code:safe,p_platform:platform,p_version:APP_VERSION
 });}catch{/* telemetry must never break audio or a room */}})();
}
