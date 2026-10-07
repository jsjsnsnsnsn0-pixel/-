import {User} from '../types';
import {countryFlag, defaultAvatar} from './profile';

export interface PublicRelationshipPresentation {
  icon?: string; accent?: string; background?: string; frame?: string; effect?: string | null;
}
export interface RoomRelationship {
  id: string;
  typeId: string;
  typeLabel: string;
  isPrimary: boolean;
  partner: RoomPublicProfile;
  days?: number;
  experience?: number;
  levelThresholds: number[];
  presentation?: PublicRelationshipPresentation;
  card?: {id:string;name:string;presentation?:PublicRelationshipPresentation} | null;
}

// A presentation allowlist: never forward auth UUID, email, phone, wallet or metadata.
export interface RoomPublicProfile {
  id: string; name: string; avatar: string; level?: number; vipLevel: number;
  charmLevel?: number; wealthLevel?: number; countryCode?: string; countryFlag?: string;
  gender?: 'male' | 'female';
  agency?: {id: string; name: string; membersCount?: number};
  relationships?: RoomRelationship[];
  // Compatibility alias for the current primary CP UI.
  couple?: {partner: RoomPublicProfile; days?: number; relationId?:string; typeId?:string};
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
    charmLevel: nonNegative(row.charm_level), wealthLevel: nonNegative(row.wealth_level),
    countryCode, countryFlag: countryCode ? countryFlag(countryCode) : undefined,
    gender: row.gender === 'male' || row.gender === 'female' ? row.gender : undefined,
  };
}
const presentation = (value: unknown): PublicRelationshipPresentation | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const row=value as Record<string,unknown>, result:PublicRelationshipPresentation={};
  if(typeof row.icon==='string')result.icon=row.icon;
  if(typeof row.accent==='string')result.accent=row.accent;
  if(typeof row.background==='string')result.background=row.background;
  if(typeof row.frame==='string')result.frame=row.frame;
  if(typeof row.effect==='string'||row.effect===null)result.effect=row.effect as string|null;
  return Object.keys(result).length ? result : undefined;
};
const relationship = (row: unknown): RoomRelationship | null => {
  if(!row||typeof row!=='object')return null;
  const value=row as Record<string,unknown>;
  const partner=value.partner&&typeof value.partner==='object'?publicProfileCard(value.partner as Record<string,unknown>):null;
  const id=typeof value.relation_id==='string'?value.relation_id:'';
  const typeId=typeof value.type_id==='string'?value.type_id:'';
  if(!id||!typeId||!partner?.id)return null;
  const thresholds=Array.isArray(value.level_thresholds)
    ? value.level_thresholds.map(Number).filter(n=>Number.isSafeInteger(n)&&n>=0).sort((a,b)=>a-b)
    : [];
  const cardValue=value.card&&typeof value.card==='object'?value.card as Record<string,unknown>:null;
  const card=cardValue&&typeof cardValue.id==='string'&&typeof cardValue.name==='string'
    ? {id:cardValue.id,name:cardValue.name,presentation:presentation(cardValue.presentation)}
    : null;
  return {
    id,typeId,
    typeLabel:typeof value.type_label==='string'&&value.type_label?value.type_label:typeId,
    isPrimary:value.is_primary===true,
    partner,
    days:nonNegative(value.days),
    experience:nonNegative(value.experience),
    levelThresholds:thresholds,
    presentation:presentation(value.presentation),
    card,
  };
};

export async function loadRoomSeatProfile(targetId: string): Promise<RoomPublicProfile> {
  const {rpc} = await import('./backend');
  const id = publicId(targetId);
  if (!id) throw new Error('public ID unavailable');
  const row = await rpc<Record<string, unknown>>('social_profile', {p_public_id: Number(id), p_visit: false});
  if (!row || publicId(row.public_id) !== id) throw new Error('profile identity mismatch');
  return publicProfileCard(row);
}
export async function loadRoomPublicProfile(targetId: string, _viewerId: string): Promise<RoomPublicProfile> {
  const {rpc} = await import('./backend');
  const profile = await loadRoomSeatProfile(targetId);
  const id = profile.id;
  const [relationsResult,agencyResult]=await Promise.allSettled([
    rpc<unknown[]>('profile_relationships',{p_public_id:Number(id)}),
    rpc<Record<string,unknown>|null>('profile_agency',{p_public_id:Number(id)}),
  ]);
  if(relationsResult.status==='fulfilled'&&Array.isArray(relationsResult.value)){
    const relations=relationsResult.value.map(relationship).filter((item):item is RoomRelationship=>Boolean(item));
    if(relations.length){
      profile.relationships=relations;
      const primary=relations.find(item=>item.isPrimary)||relations[0];
      profile.couple={partner:primary.partner,days:primary.days,relationId:primary.id,typeId:primary.typeId};
    }
  }
  if(agencyResult.status==='fulfilled'&&agencyResult.value){
    const agency=agencyResult.value;
    const idValue=String(agency.id??'');
    const name=typeof agency.name==='string'?agency.name:'';
    if(idValue&&name)profile.agency={id:idValue,name,membersCount:nonNegative(agency.members_count)};
  }
  return profile;
}
