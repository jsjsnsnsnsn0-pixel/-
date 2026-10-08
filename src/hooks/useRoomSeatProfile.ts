import {useEffect, useState} from 'react';
import {User} from '../types';
import {loadRoomSeatProfile, publicId, RoomPublicProfile} from '../services/roomPublicProfile';

type CacheEntry={profile:RoomPublicProfile;loadedAt:number};
const seatProfileCache=new Map<string,CacheEntry>();
const seatProfileInflight=new Map<string,Promise<RoomPublicProfile>>();
const CACHE_MS=60_000;

async function cachedSeatProfile(id:string,force=false){
  const cached=seatProfileCache.get(id);
  if(!force&&cached&&Date.now()-cached.loadedAt<CACHE_MS)return cached.profile;
  const pending=seatProfileInflight.get(id);
  if(pending)return pending;
  const request=loadRoomSeatProfile(id).then(profile=>{
    seatProfileCache.set(id,{profile,loadedAt:Date.now()});
    return profile;
  }).finally(()=>seatProfileInflight.delete(id));
  seatProfileInflight.set(id,request);
  return request;
}

// Room snapshots carry raw profile VIP, which may have expired. The public RPC
// remains authoritative. Avoid the old per-seat 15s polling loop: it multiplied
// network/state work by the number of occupied seats and could make room input
// feel sluggish. Profiles are cached briefly and refreshed on foreground/focus.
export function useRoomSeatProfile(snapshot: User | null | undefined): User | null | undefined {
  const id = publicId(snapshot?.id);
  const [loaded, setLoaded] = useState<{id: string; authId?: string; profile: RoomPublicProfile} | null>(null);
  useEffect(() => {
    if (!id) {setLoaded(null);return;}
    let cancelled = false;
    const apply=async(force=false)=>{
      try{
        const profile=await cachedSeatProfile(id,force);
        if(!cancelled)setLoaded({id,authId:snapshot?.authId,profile});
      }catch{
        if(!cancelled)setLoaded(null);
      }
    };
    void apply(false);
    const onGift=(event:Event)=>{const detail=(event as CustomEvent).detail;if(!detail?.recipientId||String(detail.recipientId)===id)void apply(true)};
    window.addEventListener('toti:gift-confirmed',onGift);
    const onFocus=()=>void apply(true);
    const onVisibility=()=>{if(document.visibilityState==='visible')void apply(true);};
    window.addEventListener('focus',onFocus);
    document.addEventListener('visibilitychange',onVisibility);
    return()=>{cancelled=true;window.removeEventListener('toti:gift-confirmed',onGift);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisibility);};
  }, [id, snapshot?.authId]);
  if (!snapshot) return snapshot;
  const profile = loaded?.id === id && loaded.authId === snapshot.authId ? loaded.profile : null;
  return profile ? {...snapshot, name: profile.name, avatar: profile.avatar,
    level: profile.level ?? 0, hasPublicLevel: profile.level !== undefined, vipLevel: profile.vipLevel,equipment:profile.equipment,roomReceivedGold:profile.receivedGold}
    : {...snapshot, vipLevel: 0};
}
