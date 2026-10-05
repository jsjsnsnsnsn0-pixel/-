import {useEffect, useState} from 'react';
import {User} from '../types';
import {loadRoomSeatProfile, publicId, RoomPublicProfile} from '../services/roomPublicProfile';

// Room snapshots carry raw profile VIP, which may have expired. Only the public
// RPC supplies the effective entitlement. Unknown entitlement must remain hidden.
export function useRoomSeatProfile(snapshot: User | null | undefined): User | null | undefined {
  const id = publicId(snapshot?.id);
  const [loaded, setLoaded] = useState<{id: string; authId?: string; profile: RoomPublicProfile} | null>(null);
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const profile = await loadRoomSeatProfile(id);
        if (!cancelled) setLoaded({id, authId: snapshot?.authId, profile});
      } catch {
        if (!cancelled) setLoaded(null);
      } finally {pending = false;}
    };
    void refresh();
    const timer = window.setInterval(() => {void refresh();}, 15000);
    return () => {cancelled = true; window.clearInterval(timer);};
  }, [id, snapshot?.authId]);
  if (!snapshot) return snapshot;
  const profile = loaded?.id === id && loaded.authId === snapshot.authId ? loaded.profile : null;
  return profile ? {...snapshot, name: profile.name, avatar: profile.avatar,
    level: profile.level ?? 0, hasPublicLevel: profile.level !== undefined, vipLevel: profile.vipLevel}
    : {...snapshot, vipLevel: 0};
}
