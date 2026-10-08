import {supabase} from './supabase';
import {rpc} from './backend';

export interface RegistrationState {application: {id:string; status:'pending'|'approved'|'rejected'; agency_name:string; submitted_at:string}|null; can_apply:boolean}
export interface AgencyApplicationInput {agencyName:string; country:string; agentNumber:string; fullName:string}
export type DocumentKind='logo'|'identity'|'portrait';
export const documentKinds:DocumentKind[]=['logo','identity','portrait'];
const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
export function validateAgencyImage(file:File):string|null {
  if(!extensions[file.type])return 'اختر صورة بصيغة JPG أو PNG أو WebP.';
  if(file.size===0||file.size>5*1024*1024)return 'حجم الصورة يجب ألا يتجاوز 5 MB.';
  return null;
}
export function validateAgencyFields(input:AgencyApplicationInput):string|null {
  if(input.agencyName.trim().length<3||input.agencyName.trim().length>80)return 'أدخل اسم وكالة بين 3 و80 حرفاً.';
  if(!/^[A-Z]{2}$/.test(input.country))return 'اختر البلد.';
  if(!input.agentNumber.trim()||input.agentNumber.trim().length>40)return 'أدخل رقم الوكيل.';
  if(input.fullName.trim().split(/\s+/).length<3||input.fullName.trim().length>150)return 'أدخل اسمك الحقيقي الثلاثي.';
  return null;
}
// A failed/uncertain upload is checked before retrying the same immutable path.
export async function uploadAgencyDocument(authId:string,requestId:string,kind:DocumentKind,file:File,path:string):Promise<string> {
  const invalid=validateAgencyImage(file);if(invalid)throw new Error(invalid);
  if(!path.startsWith(`${authId}/${requestId}/${kind}-`))throw new Error('invalid agency application');
  const bucket=supabase.storage.from('agency-review');
  const {error}=await bucket.upload(path,file,{contentType:file.type,upsert:false});
  if(error){
    const folder=path.slice(0,path.lastIndexOf('/')),name=path.slice(path.lastIndexOf('/')+1);
    const existing=await bucket.list(folder,{search:name,limit:2});
    if(existing.error||!existing.data?.some(item=>item.name===name))throw error;
  }
  return path;
}
export function agencyDocumentPath(authId:string,requestId:string,kind:DocumentKind,file:File):string {
  return `${authId}/${requestId}/${kind}-${crypto.randomUUID()}.${extensions[file.type]}`;
}
export function submitAgencyRegistration(requestId:string,input:AgencyApplicationInput,paths:Record<DocumentKind,string>) {
  return rpc<{id:string;status:string}>('submit_agency_registration',{
    p_request_id:requestId,p_agency_name:input.agencyName.trim(),p_country_code:input.country,
    p_agent_number:input.agentNumber.trim(),p_full_name:input.fullName.trim(),
    p_logo_path:paths.logo,p_identity_path:paths.identity,p_portrait_path:paths.portrait,
  });
}
// ISO regions, localized and alphabetically sorted; this is a country picker,
// not agency records or a simulated catalog.
const regions='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const display=new Intl.DisplayNames(['ar'],{type:'region'});
export const agencyCountries=regions.map(code=>({code,name:display.of(code)||code})).sort((a,b)=>a.name.localeCompare(b.name,'ar'));
