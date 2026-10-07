import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useCallback, useRef } from 'react';
import { catalog, rpc, backendMessage } from '../../services/backend';
import { supabase } from '../../services/supabase';
import { useServerData } from '../../hooks/useServerData';
import { useApp } from '../../context/AppContext';
import { ChevronRight, ShoppingBag, Sparkles, Car, MessageCircle, Crown, Check, DoorOpen, IdCard, PackageOpen, WalletCards, Search, Play, X, Grid2X2 } from 'lucide-react';

type StoreCategory = 'all' | 'frames' | 'cars' | 'bubbles' | 'entrances' | 'cards' | 'badges' | 'vip';
type ProductCategory = Exclude<StoreCategory,'all'>;
interface StoreItem {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  currency: 'gold' | 'silver';
  image: string;
  previewUrl?: string | null;
  relationshipTypeId?: string | null;
  description: string;
  duration: string;
  isOwned?: boolean;
}

const tabs: Array<{id:StoreCategory;label:string;icon:React.ComponentType<{size?:number}>;always?:boolean}> = [
  { id: 'all', label: 'الكل', icon: Grid2X2, always:true },
  { id: 'frames', label: 'الإطارات', icon: Sparkles },
  { id: 'cars', label: 'المركبات', icon: Car },
  { id: 'bubbles', label: 'الفقاعات', icon: MessageCircle },
  { id: 'entrances', label: 'مؤثر الدخول', icon: DoorOpen },
  { id: 'cards', label: 'بطاقات CP', icon: IdCard },
  { id: 'badges', label: 'الشارات', icon: Crown },
  { id: 'vip', label: 'VIP', icon: Crown },
];

export const StoreScreen: React.FC = () => {
  const { user, refreshWallet, reportError, setActiveSubScreen } = useApp();
  const scheduleTimeout = useTimeouts();
  const [activeTab, setActiveTab] = useState<StoreCategory>('all');
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<StoreItem|null>(null);
  const [preview,setPreview]=useState<StoreItem|null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requests = useRef(new Map<string, string>());

  const load = useCallback(async (): Promise<StoreItem[]> => {
    const [entries, owned] = await Promise.all([
      catalog(),
      supabase.from('store_purchases').select('item_id, expires_at').eq('user_id', user.authId),
    ]);
    if (owned.error) throw owned.error;
    return entries.filter(item => tabs.some(tab => tab.id === item.category)).map(item => ({
      id:item.id,
      name:item.name,
      category:item.category as ProductCategory,
      price:item.price,
      currency:item.currency,
      image:item.icon,
      previewUrl:item.preview_url,
      relationshipTypeId:item.relationship_type_id,
      description:item.description || '',
      duration:item.duration_days ? `${item.duration_days} يوم` : 'دائم',
      isOwned:(owned.data || []).some(p => p.item_id === item.id && (!p.expires_at || new Date(p.expires_at).getTime() > Date.now())),
    }));
  }, [user.authId]);

  const {data: items, loading, error, reload} = useServerData(load, []);
  const visibleTabs=tabs.filter(tab=>tab.always||tab.id==='cards'||items.some(item=>item.category===tab.id));
  const normalizedQuery=query.trim().toLocaleLowerCase('ar');
  const filteredItems=items.filter(item=>(activeTab==='all'||item.category===activeTab)&&(!normalizedQuery||item.name.toLocaleLowerCase('ar').includes(normalizedQuery)||item.description.toLocaleLowerCase('ar').includes(normalizedQuery)));

  const handleBuy = async (item: StoreItem) => {
    if (busy) return;
    if (item.isOwned && item.category === 'cards') {
      setActiveSubScreen('inventory');
      return;
    }
    setBusy(true); setPurchaseSuccess(null);
    try {
      if (item.isOwned) await rpc('equip_store_item', {p_item_id: item.id, p_category: item.category});
      else {
        const request = requests.current.get(item.id) || crypto.randomUUID();
        requests.current.set(item.id, request);
        const result = await rpc<{id: string}>('purchase_store_item', {p_item_id: item.id, p_request_id: request});
        if (!result?.id) throw new Error('purchase not confirmed');
        requests.current.delete(item.id);
      }
      setPurchaseSuccess(item.isOwned ? 'تم اعتماد تجهيز المنتج.' : 'تم اعتماد الشراء من الخادم.');
      await Promise.all([reload(), refreshWallet()]);
      scheduleTimeout(() => setPurchaseSuccess(null), 3000);
    } catch (e) { reportError(backendMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#081510] text-slate-100 pb-28" dir="rtl">
      <header className="sticky top-0 z-30 bg-[#081510]/95 backdrop-blur-md border-b border-emerald-300/10 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSubScreen(null)} aria-label="الرجوع" className="ui-icon-button rounded-full bg-white/5 text-slate-100">
            <ChevronRight size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-400/10 text-emerald-300 flex items-center justify-center"><ShoppingBag size={18}/></div>
            <div><h1 className="text-base font-black">متجر TotiChat</h1><p className="text-[10px] text-emerald-300/70">مقتنيات تجميلية مرتبطة بحسابك</p></div>
          </div>
        </div>
        <button type="button" onClick={()=>setActiveSubScreen('inventory')} className="ui-control px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold flex items-center gap-1" aria-label="فتح الحقيبة">
          <PackageOpen size={16}/>الحقيبة
        </button>
      </header>

      <div className="px-4 pt-3 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-amber-400/10 text-amber-200 border border-amber-300/15 px-3 py-1.5">🪙 {user.gold.toLocaleString('ar-SA')}</span>
        <span className="rounded-full bg-white/5 text-slate-200 border border-white/10 px-3 py-1.5">🥈 {(user.silverCoins || 0).toLocaleString('ar-SA')}</span>
      </div>

      {purchaseSuccess && <div role="status" className="m-4 p-3 bg-emerald-400/10 border border-emerald-300/20 text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2"><Check size={16}/><span>{purchaseSuccess}</span></div>}

      <nav aria-label="أقسام المتجر" className="mt-3 px-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {tabs.map(tab => {
            const Icon=tab.icon; const active=activeTab===tab.id;
            return <button key={tab.id} type="button" aria-pressed={active} onClick={()=>setActiveTab(tab.id)}
              className={`min-h-11 px-3 rounded-xl flex items-center gap-1.5 border text-xs font-bold ${active?'bg-emerald-400/15 border-emerald-300/35 text-emerald-200':'bg-white/5 border-white/10 text-slate-400'}`}>
              <Icon size={15}/><span>{tab.label}</span>
            </button>;
          })}
        </div>
      </nav>

      {activeTab==='cards'&&<div className="mx-4 mt-2 rounded-2xl border border-pink-300/15 bg-pink-500/8 p-3 text-xs text-pink-100">
        بطاقات CP مقتنيات تجميلية للعلاقة وليست علاقة جديدة. بعد الشراء فعّل البطاقة من الحقيبة على CP متوافق.
      </div>}

      {loading && <p role="status" className="p-6 text-center text-slate-400">جارٍ تحميل المتجر…</p>}
      {error && <div className="p-4"><button onClick={() => void reload()} className="w-full rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-rose-200">{error} — إعادة المحاولة</button></div>}
      {!loading && !error && !filteredItems.length && <p className="m-4 rounded-2xl bg-white/5 border border-white/10 p-5 text-center text-slate-400">لا توجد عناصر حالياً في هذا القسم.</p>}

      <div className="p-4 grid grid-cols-2 gap-3">
        {filteredItems.map(item => (
          <article key={item.id} className="rounded-3xl p-3 border border-white/10 bg-white/[0.045] flex flex-col justify-between min-h-56">
            <div>
              <div className="h-28 rounded-2xl bg-black/20 flex items-center justify-center text-4xl mb-3 border border-emerald-300/10 overflow-hidden">
                {item.previewUrl ? <img src={item.previewUrl} alt={item.name} loading="lazy" className="w-full h-full object-cover"/> : <span aria-hidden="true">{item.image}</span>}
              </div>
              <h3 className="font-bold text-sm text-white mb-1 break-words">{item.name}</h3>
              <p className="text-[11px] text-slate-400 leading-5 line-clamp-2">{item.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] text-emerald-200 bg-emerald-400/10 px-2 py-1 rounded-full">صلاحية {item.duration}</span>
                {item.category==='cards'&&item.relationshipTypeId&&<span className="text-[10px] text-pink-200 bg-pink-400/10 px-2 py-1 rounded-full">CP: {item.relationshipTypeId}</span>}
                {item.isOwned&&<span className="text-[10px] text-cyan-200 bg-cyan-400/10 px-2 py-1 rounded-full">مملوك</span>}
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-white/8 flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-amber-200">{item.currency === 'gold' ? '🪙' : '🥈'} {item.price.toLocaleString('ar-SA')}</span>
              <button disabled={busy || loading} onClick={() => void handleBuy(item)}
                className="min-h-10 px-3 bg-emerald-500 text-emerald-950 text-[11px] font-black rounded-xl disabled:opacity-50">
                {busy ? 'جارٍ التنفيذ…' : item.isOwned ? (item.category==='cards'?'الحقيبة':'تجهيز') : 'شراء'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
