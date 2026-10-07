import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useCallback, useRef } from 'react';
import { catalog, rpc, backendMessage } from '../../services/backend';
import { supabase } from '../../services/supabase';
import { useServerData } from '../../hooks/useServerData';
import { useApp } from '../../context/AppContext';
import { ChevronRight, ShoppingBag, Sparkles, Car, MessageCircle, Crown, Check, Heart } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  category: 'frames' | 'cars' | 'bubbles' | 'badges' | 'cards';
  price: number;
  currency: 'gold' | 'silver';
  image: string;
  description: string;
  duration: string;
  isOwned?: boolean;
  relationshipTypeId?: string | null;
  previewUrl?: string | null;
  presentation?: Record<string, unknown>;
}

interface RelationshipSummary {
  relation_id: string;
  type_id: string;
  type_label?: string;
  card?: {id?: string; name?: string} | null;
}

export const StoreScreen: React.FC = () => {
  const { user, refreshWallet, reportError, setActiveSubScreen } = useApp();
  const scheduleTimeout = useTimeouts();
  const [activeTab, setActiveTab] = useState<'frames' | 'cars' | 'bubbles' | 'badges' | 'cards'>('frames');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const requests = useRef(new Map<string, string>());
  const load = useCallback(async (): Promise<StoreItem[]> => {
    const [entries, owned] = await Promise.all([catalog(), supabase.from('store_purchases').select('item_id, expires_at').eq('user_id', user.authId)]);
    if (owned.error) throw owned.error;
    return entries.filter(item => ['frames','cars','bubbles','badges','cards'].includes(item.category)).map(item => ({
      ...item,
      category: item.category as StoreItem['category'],
      image: item.icon,
      duration: item.duration_days ? `${item.duration_days} يوم` : 'دائم',
      isOwned: (owned.data || []).some(p => p.item_id === item.id && (!p.expires_at || new Date(p.expires_at).getTime() > Date.now())),
      relationshipTypeId: item.relationship_type_id ?? null,
      previewUrl: item.preview_url ?? null,
      presentation: item.presentation ?? {},
    }));
  }, [user.authId]);
  const loadRelationships = useCallback(
    () => rpc<RelationshipSummary[]>('profile_relationships', {p_public_id: Number(user.id)}),
    [user.id, user.authId],
  );
  const {data: items, loading, error, reload} = useServerData(load, []);
  const relationships = useServerData(loadRelationships, []);
  const filteredItems = items.filter(item => item.category === activeTab);
  const handleBuy = async (item: StoreItem) => {
    if (busy) return;
    setBusy(true); setPurchaseSuccess(null);
    try {
      if (item.isOwned) {
        if (item.category === 'cards') {
          const relationship = relationships.data?.find(relation => relation.type_id === item.relationshipTypeId);
          if (!relationship?.relation_id) throw new Error('active matching relationship required');
          await rpc('equip_relationship_card', {p_relation_id: relationship.relation_id, p_item_id: item.id});
        } else {
          await rpc('equip_store_item', {p_item_id: item.id, p_category: item.category});
        }
      } else {
        const request = requests.current.get(item.id) || crypto.randomUUID();
        requests.current.set(item.id, request);
        const result = await rpc<{id: string}>('purchase_store_item', {p_item_id: item.id, p_request_id: request});
        if (!result?.id) throw new Error('purchase not confirmed');
        requests.current.delete(item.id);
      }
      setPurchaseSuccess(item.isOwned ? (item.category === 'cards' ? 'تم تفعيل بطاقة العلاقة.' : 'تم اعتماد تجهيز المنتج.') : 'تم اعتماد الشراء من الخادم.');
      await Promise.all([reload(), relationships.reload(), refreshWallet()]);
      scheduleTimeout(() => setPurchaseSuccess(null), 3000);
    } catch (e) { reportError(backendMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubScreen(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            <h1 className="text-base font-bold text-slate-900">المتجر الفاخر</h1>
          </div>
        </div>

        {/* User Balance Chips */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-full text-xs font-bold text-amber-700">
            <span>🪙</span>
            <span>{user.gold.toLocaleString('ar-SA')}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full text-xs font-bold text-slate-600">
            <span>🥈</span>
            <span>{(user.silverCoins || 0).toLocaleString('ar-SA')}</span>
          </div>
        </div>
      </header>

      {/* Purchase Notification */}
      {purchaseSuccess && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs animate-fadeIn">
          <Check size={16} className="text-emerald-600" />
          <span>{purchaseSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-5 gap-1 p-3 bg-white border-b border-slate-100 text-xs font-bold">
        {[
          { id: 'frames', label: 'إطارات', icon: Sparkles },
          { id: 'cars', label: 'سيارات الدخول', icon: Car },
          { id: 'bubbles', label: 'فقاعات الشات', icon: MessageCircle },
          { id: 'badges', label: 'شارات الشرف', icon: Crown },
          { id: 'cards', label: 'البطاقات', icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-pink-50 text-pink-600 font-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && <p className="p-4 text-center">جارٍ تحميل المتجر…</p>}
      {error && <button onClick={() => void reload()} className="p-4">{error} — إعادة المحاولة</button>}
      {!loading && !error && !filteredItems.length && <p className="p-4">لا توجد منتجات متاحة في هذا القسم.</p>}
      {/* Store Items Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="h-24 rounded-2xl bg-gradient-to-tr from-slate-50 to-pink-50/40 flex items-center justify-center text-4xl mb-3 border border-pink-100/50 overflow-hidden">
                {item.previewUrl ? <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" /> : item.image}
              </div>
              <h3 className="font-bold text-xs text-slate-900 mb-1">{item.name}</h3>
              <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 mb-2">
                {item.description}
              </p>
              <span className="text-[10px] text-pink-600 font-semibold bg-pink-50 px-2 py-0.5 rounded-full inline-block mb-3">
                صلاحية {item.duration}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 font-bold text-xs">
                <span>{item.currency === 'gold' ? '🪙' : '🥈'}</span>
                <span className={item.currency === 'gold' ? 'text-amber-600' : 'text-slate-600'}>
                  {item.price.toLocaleString('ar-SA')}
                </span>
              </div>
              <button
                disabled={busy || loading || (item.category === 'cards' && Boolean(item.isOwned) && !relationships.data?.some(relation => relation.type_id === item.relationshipTypeId))}
                onClick={() => void handleBuy(item)}
                className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-bold rounded-xl shadow-xs hover:from-pink-600 hover:to-rose-600 cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy
                  ? 'جارٍ التنفيذ…'
                  : item.category === 'cards' && item.isOwned && relationships.data?.some(relation => relation.card?.id === item.id)
                    ? 'مفعلة'
                    : item.category === 'cards' && item.isOwned && !relationships.data?.some(relation => relation.type_id === item.relationshipTypeId)
                      ? 'تحتاج علاقة'
                      : item.category === 'cards' && item.isOwned
                        ? 'تفعيل'
                        : item.isOwned ? 'تجهيز' : 'شراء'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
