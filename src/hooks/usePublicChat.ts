import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { profileToUser } from '../services/profile';

// Existing official account; this is a routing identifier, never an authorization claim.
export const officialSupportPublicId = '451305';

export function usePublicChat(scope?: unknown) {
  const { user, setSelectedChatUser, setActiveSubScreen, reportError } = useApp();
  const [opening, setOpening] = useState(false);
  const busy = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    busy.current = false;
    setOpening(false);
    return () => { generation.current++; };
  }, [scope, user.id]);

  const openChat = async (publicId: unknown = officialSupportPublicId) => {
    const id = String(publicId ?? '');
    if (busy.current) return false;
    if (!/^\d{1,18}$/.test(id) || id === user.id) {
      reportError(id === user.id ? 'هذا حسابك الحالي. لا يمكنك مراسلة نفسك.' : 'بيانات التواصل الداخلي غير متاحة.');
      return false;
    }
    const current = generation.current;
    busy.current = true;
    setOpening(true);
    try {
      const { data, error } = await supabase.rpc('search_public_profiles', { p_query: id, p_limit: 20 });
      if (current !== generation.current) return false;
      if (error) throw error;
      const profile = (data || []).find((row: { public_id: unknown }) => String(row.public_id) === id);
      if (!profile) throw new Error('profile unavailable');
      setSelectedChatUser(profileToUser(profile));
      setActiveSubScreen('chat_detail');
      return true;
    } catch {
      if (current === generation.current) reportError('تعذر فتح حساب الدعم. تحقق من الاتصال وحاول مجدداً.');
      return false;
    } finally {
      if (current === generation.current) { busy.current = false; setOpening(false); }
    }
  };
  return { opening, openChat };
}
