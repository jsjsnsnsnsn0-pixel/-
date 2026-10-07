import {User} from '../types';
import {countryFlag, defaultAvatar} from './profile';

// A presentation allowlist: never forward auth UUID, email, phone, wallet or metadata.
export interface RoomPublicProfile {
  id: string; name: string; avatar: string; level?: number; vipLevel: number;
  charmLevel?: number; wealthLevel?: number; countryCode?: string; countryFlag?: string;
  gender?: 'male' | 'female';
  agency?: {id: string; name: string};
  couple?: RoomRelationship;
  relationships?: RoomRelationship[];
}
export interface RoomRelationship {
  relationId?: string;
  typeId?: string;
  typeLabel?: string;
  isPrimary?: boolean;
  partner: RoomPublicProfile;
  days?: number;
  experience?: number;
  level?: number;
  nextLevelExperience?: number;
  presentation?: Record<string, unknown>;
  card?: {id?: string; name?: string; presentation?: Record<string, unknown>} | null;
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
    // These independent ranks are not in today's public contract. Hide them
    // unless actually provided; neither account level nor a local formula is a rank.
    charmLevel: nonNegative(row.charm_level), wealthLevel: nonNegative(row.wealth_level),
    countryCode, countryFlag: countryCode ? countryFlag(countryCode) : undefined,
    gender: row.gender === 'male' || row.gender === 'female' ? row.gender : undefined,
  };
}
interface Relation {accepted_at: string | null; ended_at: string | null; partner: Record<string, unknown>}
interface AgencyState {agency: {id: unknown; name: string} | null; members: Record<string, unknown>[]}
interface RelationshipRow {
  relation_id?: string; type_id?: string; type_label?: string; is_primary?: boolean;
  partner?: Record<string, unknown>; days?: number; experience?: number | null;
  level_thresholds?: unknown; presentation?: Record<string, unknown>;
  card?: {id?: string;name?: string;presentation?:Record<string,unknown>} | null;
}
const relationshipFromRow=(row:RelationshipRow):RoomRelationship|null=>{
  if(!row?.partner)return null;
  const partner=publicProfileCard(row.partner);
  if(!partner.id)return null;
  const experience=nonNegative(row.experience);
  const thresholds=Array.isArray(row.level_thresholds)?row.level_thresholds.map(Number).filter(value=>Number.isFinite(value)&&value>=0).sort((a,b)=>a-b):[];
  const level=experience===undefined?undefined:1+thresholds.filter(value=>experience>=value).length;
  const nextLevelExperience=experience===undefined?undefined:thresholds.find(value=>value>experience);
  return {relationId:typeof row.relation_id==='string'?row.relation_id:undefined,typeId:typeof row.type_id==='string'?row.type_id:undefined,typeLabel:typeof row.type_label==='string'?row.type_label:undefined,isPrimary:Boolean(row.is_primary),partner,days:nonNegative(row.days),experience,level,nextLevelExperience,presentation:row.presentation&&typeof row.presentation==='object'?row.presentation:undefined,card:row.card||null};
};
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
  // Both RPCs scope membership/relationships to auth.uid(). Failure hides the
  // optional section; it must not replace the target or break the room.
  const [couples, agency, cp, typedRelationships, targetAgency] = await Promise.allSettled([
    rpc<{relations: Relation[]}>('couple_state'), rpc<AgencyState>('agency_state'),
    rpc<{partner:Record<string,unknown>;days:number}|null>('profile_cp',{p_public_id:Number(id)}),
    rpc<RelationshipRow[]>('profile_relationships',{p_public_id:Number(id)}),
    rpc<{id:unknown;name:string}|null>('profile_agency',{p_public_id:Number(id)}),
  ]);
  if(targetAgency.status==='fulfilled'&&targetAgency.value?.name){
    profile.agency={id:String(targetAgency.value.id),name:targetAgency.value.name};
  } else if (agency.status === 'fulfilled' && agency.value?.agency &&
      (id === viewerId || (Array.isArray(agency.value.members) ? agency.value.members : []).some(member => publicId(member.public_id) === id))) {
    profile.agency = {id: String(agency.value.agency.id), name: agency.value.agency.name};
  }
  if (couples.status === 'fulfilled') {
    const relations = Array.isArray(couples.value?.relations) ? couples.value.relations : [];
    const relation = relations.find(r => r?.partner && r.accepted_at && !r.ended_at &&
      (id === viewerId || publicId(r.partner.public_id) === id));
    if (relation) {
      let partner: RoomPublicProfile | undefined;
      if (id === viewerId) partner = publicProfileCard(relation.partner);
      else {
        try {
          const viewer = await rpc<Record<string, unknown>>('social_profile', {p_public_id: Number(viewerId), p_visit: false});
          if (viewer && publicId(viewer.public_id) === viewerId) partner = publicProfileCard(viewer);
        } catch { /* No safe public partner profile: hide CP. */ }
      }
      if (partner?.id) {
        const elapsed = Date.now() - new Date(relation.accepted_at!).getTime();
        profile.couple = {partner, days: Number.isFinite(elapsed) && elapsed >= 0 ? Math.floor(elapsed / 86400000) : undefined};
      }
    }
  }
  if(typedRelationships.status==='fulfilled'&&Array.isArray(typedRelationships.value)){
    const relationships=typedRelationships.value.map(relationshipFromRow).filter((item):item is RoomRelationship=>Boolean(item));
    if(relationships.length){
      profile.relationships=relationships;
      profile.couple=relationships.find(item=>item.isPrimary)||relationships.find(item=>item.typeId==='love')||relationships[0];
    }
  }
  if(!profile.couple&&cp.status==='fulfilled'&&cp.value?.partner){const partner=publicProfileCard(cp.value.partner);if(partner.id)profile.couple={partner,days:cp.value.days,typeId:'love',typeLabel:'رفيق الروح',isPrimary:true};}
  return profile;
}
