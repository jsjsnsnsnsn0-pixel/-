import {User} from '../types';
import {countryFlag, defaultAvatar} from './profile';

// A presentation allowlist: never forward auth UUID, email, phone, wallet or metadata.
export interface RoomPublicProfile {
  id: string; name: string; avatar: string; level?: number; vipLevel: number;
  charmLevel?: number; wealthLevel?: number; countryCode?: string; countryFlag?: string;
  gender?: 'male' | 'female';
  agency?: {id: string; name: string};
  couple?: {partner: RoomPublicProfile; days?: number};
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
  const [couples, agency, cp] = await Promise.allSettled([
    rpc<{relations: Relation[]}>('couple_state'), rpc<AgencyState>('agency_state'),
    rpc<{partner:Record<string,unknown>;days:number}|null>('profile_cp',{p_public_id:Number(id)}),
  ]);
  if (agency.status === 'fulfilled' && agency.value?.agency &&
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
  if(cp.status==='fulfilled'&&cp.value?.partner){const partner=publicProfileCard(cp.value.partner);if(partner.id)profile.couple={partner,days:cp.value.days};}
  return profile;
}
