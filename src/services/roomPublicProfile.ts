import {User} from '../types';
import {countryFlag, defaultAvatar} from './profile';

// A presentation allowlist: never forward auth UUID, email, phone, wallet or metadata.
export interface RoomPublicProfile {
  id: string; name: string; avatar: string; level?: number; vipLevel: number;
  charmLevel?: number; wealthLevel?: number; countryCode?: string; countryFlag?: string;
  gender?: 'male' | 'female';
  receivedGold?:number;
  agency?: {id: string; name: string; membersCount?:number};
  relationships?: ProfileRelationship[];
  equipment?: User['equipment'];
  couple?: ProfileRelationship;
}
export interface ProfileRelationship {
  cardId?:string; id:string; typeId:string; label:string; primary:boolean; startedAt:string; serverNow?:string;
  partner:RoomPublicProfile; days?:number; experience?:number; thresholds:number[];
  presentation:{icon?:string;accent?:string;background?:string;frame?:string;effect?:string};
}
const nonNegative = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
export const publicId = (value: unknown): string => {
  const id = String(value ?? '');
  return /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) ? id : '';
};
export function seatPublicProfile(user: User): RoomPublicProfile {
  return {id: publicId(user.id), name: user.name || 'مستخدم', avatar: user.avatar || defaultAvatar,
    level: user.hasPublicLevel === false ? undefined : nonNegative(user.level), vipLevel: 0};
}
export function publicProfileCard(row: Record<string, unknown>): RoomPublicProfile {
  const countryCode = typeof row.country_code === 'string' && /^[A-Z]{2}$/.test(row.country_code) ? row.country_code : undefined;
  return {
    id: publicId(row.public_id), name: typeof row.display_name === 'string' && row.display_name ? row.display_name : 'مستخدم',
    avatar: typeof row.avatar_url === 'string' && row.avatar_url ? row.avatar_url : defaultAvatar,
    level: nonNegative(row.level), vipLevel: nonNegative(row.vip_level) ?? 0,
    receivedGold:nonNegative(row.received_gold),
    // These independent ranks are not in today's public contract. Hide them
    // unless actually provided; neither account level nor a local formula is a rank.
    charmLevel: nonNegative(row.charm_level), wealthLevel: nonNegative(row.wealth_level),
    countryCode, countryFlag: countryCode ? countryFlag(countryCode) : undefined,
    equipment: row.equipment && typeof row.equipment==='object' ? row.equipment as User['equipment'] : undefined,
    gender: row.gender === 'male' || row.gender === 'female' ? row.gender : undefined,
  };
}
export async function loadRoomSeatProfile(targetId: string): Promise<RoomPublicProfile> {
  const {rpc} = await import('./backend');
  const id = publicId(targetId);
  if (!id) throw new Error('public ID unavailable');
  const row = await rpc<Record<string, unknown>>('social_profile', {p_public_id: Number(id), p_visit: false});
  if (!row || publicId(row.public_id) !== id) throw new Error('profile identity mismatch');
  return publicProfileCard(row);
}
export async function loadRoomPublicProfile(targetId: string, viewerId: string): Promise<RoomPublicProfile> {
  const {rpc} = await import('./backend');
  const profile = await loadRoomSeatProfile(targetId);
  const id = profile.id;
  if (!publicId(viewerId)) return profile;
  // CP has one authoritative target-scoped read. Null or failure clears CP;
  // viewer relationships must never act as a fallback for another account.
  const [agency, relations] = await Promise.allSettled([
    rpc<Record<string,unknown>|null>('profile_agency',{p_public_id:Number(id)}),
    rpc<Record<string,unknown>[]>('profile_relationships',{p_public_id:Number(id)}),
  ]);
  if(agency.status==='fulfilled'&&agency.value&&publicId(agency.value.id)&&typeof agency.value.name==='string')profile.agency={id:publicId(agency.value.id),name:agency.value.name,membersCount:nonNegative(agency.value.members_count)};
  if(relations.status==='fulfilled'&&Array.isArray(relations.value)){
    const validated=relations.value.map(row=>validatedProfileCP(row,id,typeof row.type_id==='string'?row.type_id:'')).filter((r):r is ProfileRelationship=>Boolean(r));
    // Fail closed for ambiguous payloads, even if a proxy/cache supplied duplicates.
    profile.relationships=validated.filter(r=>validated.filter(other=>other.typeId===r.typeId).length===1);
    const primary=profile.relationships.filter(r=>r.primary);
    if(primary.length===1)profile.couple=primary[0];
  }
  return profile;
}

// Reject mismatched, incomplete, ended or self-linked payloads even on a successful response.
export function validatedProfileCP(value:Record<string,unknown>|null,targetId:string,typeId='love'):RoomPublicProfile['couple']{
 if(!value||publicId(value.subject_public_id)!==targetId||value.type_id!==typeId||value.ended_at!==null||typeof value.relation_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.relation_id)||typeof value.accepted_at!=='string'||!Number.isFinite(Date.parse(value.accepted_at)))return undefined;
 if(!value.partner||typeof value.partner!=='object'||Array.isArray(value.partner))return undefined;
 const partner=publicProfileCard(value.partner as Record<string,unknown>);
 if(!partner.id||partner.id===targetId)return undefined;
 const days=typeof value.days==='number'&&Number.isInteger(value.days)&&value.days>=0?value.days:undefined;
 const theme=value.presentation&&typeof value.presentation==='object'&&!Array.isArray(value.presentation)?value.presentation as Record<string,unknown>:{};
 const safeColor=(v:unknown)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:undefined;
 const thresholds=Array.isArray(value.level_thresholds)&&value.level_thresholds.every((n,i,a)=>Number.isSafeInteger(n)&&n>=0&&(i===0||n>a[i-1]))?value.level_thresholds as number[]:[];
 return {cardId:value.card && typeof value.card==='object' && typeof (value.card as Record<string,unknown>).id==='string' ? (value.card as {id:string}).id : undefined,id:value.relation_id,typeId,label:typeof value.type_label==='string'?value.type_label:typeId==='love'?'رفيق الروح':typeId,primary:typeof value.is_primary==='boolean'?value.is_primary:typeId==='love',startedAt:value.accepted_at,serverNow:typeof value.server_now==='string'&&Number.isFinite(Date.parse(value.server_now))?value.server_now:undefined,partner,days,experience:typeof value.experience==='number'&&Number.isSafeInteger(value.experience)&&value.experience>=0?value.experience:undefined,thresholds,presentation:{icon:typeof theme.icon==='string'?theme.icon.slice(0,8):undefined,accent:safeColor(theme.accent),background:safeColor(theme.background),frame:typeof theme.frame==='string'?theme.frame:undefined,effect:typeof theme.effect==='string'?theme.effect:undefined}};
}
