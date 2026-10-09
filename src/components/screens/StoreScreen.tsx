import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useCallback, useRef } from 'react';
import { catalog, rpc, backendMessage } from '../../services/backend';
import { supabase } from '../../services/supabase';
import { useServerData } from '../../hooks/useServerData';
import { useApp } from '../../context/AppContext';
import { ChevronRight, ShoppingBag, Sparkles, Car, MessageCircle, Crown, Check } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  category: 'frames' | 'cars' | 'bubbles' | 'badges';
  price: number;
  currency: 'gold' | 'silver';
  image: string;
  description: string;
  duration: string;
  isOwned?: boolean;
}

export const StoreScreen: React.FC = () => {
  const { user, refreshWallet, reportError, setActiveSubScreen } = useApp();
  const scheduleTimeout = useTimeouts();
  const [activeTab, setActiveTab] = useState<'all' | 'frames' | 'cars' | 'bubbles' | 'badges'>('all');
  const [search, setSearch] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const requests = useRef(new Map<string, string>());
  const load = useCallback(async (): Promise<StoreItem[]> => {
    const [entries, owned] = await Promise.all([catalog(), supabase.from('store_purchases').select('item_id, expires_at').eq('user_id', user.authId)]);
    if (owned.error) throw owned.error;
    return entries.filter(item => ['frames','cars','bubbles','badges'].includes(item.category)).map(item => ({
      ...item, category: item.category as StoreItem['category'], image: item.icon,
      duration: item.duration_days ? `${item.duration_days} يوم` : 'دائم',
      isOwned: (owned.data || []).some(p => p.item_id === item.id && (!p.expires_at || new Date(p.expires_at).getTime() > Date.now())),
    }));
  }, [user.authId]);
  const {data: items, loading, error, reload} = useServerData(load, []);
  const filteredItems = items.filter(item => (activeTab === 'all' || item.category === activeTab) && (item.name.toLowerCase().includes(search.trim().toLowerCase()) || item.description.toLowerCase().includes(search.trim().toLowerCase())));
  const handleBuy = async (item: StoreItem) => {
    if (busy) return;
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
    <main dir="rtl" className="min-h-screen text-[#ffedc9] pb-28"
      style={{background:'radial-gradient(ellipse at 55% 0%,#145741 0%,#04382e 28%,#00261e 64%,#00160f 100%)'}}>
      <header className="relative px-4 pt-6 pb-4 text-center border-b border-[#ba9459]">
        <button type="button" aria-label="رجوع" onClick={()=>setActiveSubScreen(null)}
          className="absolute right-3 top-4 w-10 h-10 grid place-items-center border border-[#e9c679] bg-[#042e26] text-[#ffe0a1] rounded-full"><ChevronRight size={23}/></button>
        <h1 className="font-black text-[22px] text-[#ffdfa1] flex gap-2 items-center justify-center"><ShoppingBag size={24}/> متجر TotiChat</h1>
        <p className="text-xs text-[#a6e4cd] mt-1">الإطارات · المركبات · الشارات · فقاعات الدردشة</p>
      </header>
      <div className="mx-3 mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={()=>setActiveSubScreen('recharge')} className="px-3 py-3 rounded-2xl border border-[#eac175] bg-gradient-to-br from-[#154c3c] to-[#022b24] text-right">
          <span className="block text-[10px] text-[#a9e5c7]">🪙 رصيد الذهب</span>
          <span className="text-[15px] font-black text-[#ffe2a6] tabular-nums">{user.gold.toLocaleString('ar-SA')}</span>
        </button>
        <button type="button" onClick={()=>setActiveSubScreen('silver_coins')} className="px-3 py-3 rounded-2xl border border-[#eac175] bg-gradient-to-br from-[#154c3c] to-[#022b24] text-right">
          <span className="block text-[10px] text-[#a9e5c7]">🥈 العملات الفضية</span>
          <span className="text-[15px] font-black text-[#ffe2a6] tabular-nums">{(user.silverCoins||0).toLocaleString('ar-SA')}</span>
        </button>
      </div>
      <div className="mx-3 mt-3 relative">
        <label htmlFor="store-product-search" className="sr-only">البحث في المتجر</label>
        <input id="store-product-search" type="search" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="ابحث عن إطار أو منتج"
          className="block w-full text-sm px-4 py-3 rounded-2xl bg-[#083d32] border border-[#af915d] text-[#fff1c8] outline-none placeholder:text-[#a1c1b1] focus:border-[#ffdf8c]"/>
      </div>
      {purchaseSuccess&&<div role="status" className="mx-3 my-3 p-3 border border-[#5bd6a5] bg-[#104e3c] text-[#d9ffe8] text-xs font-bold rounded-xl flex items-center gap-2"><Check size={17}/>{purchaseSuccess}</div>}
      <div role="tablist" aria-label="تصنيفات المتجر" className="mx-3 mt-3 mb-3 flex gap-1 overflow-x-auto pb-1">
        {([
          {id:'all',label:'الكل',icon:ShoppingBag},{id:'frames',label:'الإطارات',icon:Sparkles},
          {id:'cars',label:'المركبات',icon:Car},{id:'bubbles',label:'الفقاعات',icon:MessageCircle},
          {id:'badges',label:'الشارات',icon:Crown},
        ] as const).map(tab=>{
          const Icon=tab.icon;
          const selected=activeTab===tab.id;
          return <button role="tab" aria-selected={selected} key={tab.id} type="button"
            onClick={()=>setActiveTab(tab.id)}
            className={'shrink-0 min-w-[65px] px-2 py-2 rounded-xl border flex flex-col gap-1 items-center text-[11px] font-extrabold '+(selected?'border-[#ffdf9f] bg-gradient-to-br from-[#ffe5a8] to-[#dfac51] text-[#32220f]':'border-[#6d977e] bg-[#073a30] text-[#dfefd9]')}>
            <Icon size={18}/>{tab.label}
          </button>;
        })}
      </div>
      {loading&&<p role="status" className="mx-3 p-4 text-center border border-[#7db495] rounded-xl">جارٍ تحميل منتجات المتجر…</p>}
      {error&&<div role="alert" className="mx-3 p-4 text-center border border-[#e6a073] rounded-xl">
        <p className="text-sm mb-2">{error}</p><button onClick={()=>void reload()} className="p-2 text-xs rounded-xl bg-[#16493c] border border-[#cdb176]">إعادة المحاولة</button>
      </div>}
      {!loading&&!error&&!filteredItems.length&&<p className="mx-3 p-5 text-center text-sm text-[#c2e2d1]">ماكو منتجات متاحة بهذا التصنيف حالياً.</p>}
      <section aria-label="منتجات المتجر" className="px-3 grid grid-cols-2 gap-3">
        {filteredItems.map(item=><article key={item.id}
          className="min-w-0 flex flex-col overflow-hidden rounded-[19px] border border-[#d4ae68] bg-gradient-to-br from-[#0d4939] via-[#052d26] to-[#011e1a] shadow-[inset_0_0_13px_#4daa8348,0_5px_16px_#0008]">
          <div className="relative min-h-[117px] bg-gradient-to-br from-[#0c4437] to-[#06221e] flex items-center justify-center p-3 border-b border-[#947344a3]">
            {(/^(\/assets\/|https?:\/\/)/.test(item.image))?
              <img src={item.image} alt={item.name} className="h-[95px] w-full object-contain"/>:
              <span className="text-5xl drop-shadow-[0_2px_10px_#ecd1839e]">{item.image||'🎁'}</span>}
            {item.isOwned&&<span className="absolute top-2 right-2 bg-[#166c4b] text-[#b4ffdc] text-[9px] font-bold border border-[#77c994] rounded-full px-2 py-1">مملوك</span>}
          </div>
          <div className="p-3 flex-1 flex flex-col justify-between gap-2">
            <div>
              <h3 className="text-[#ffe0a4] font-black text-xs mb-1 line-clamp-2">{item.name}</h3>
              <p className="text-[#b7d2c3] text-[10px] leading-5 line-clamp-2">{item.description}</p>
              <span className="inline-block mt-2 text-[10px] text-[#e8c989] border border-[#917d54] bg-[#0a3b31] rounded-full px-2 py-1">المدة: {item.duration}</span>
            </div>
            <div className="border-t border-[#947b506b] pt-2 flex flex-wrap gap-1 items-center justify-between">
              <span className="text-[#ffdf9c] text-xs font-black tabular-nums">{item.currency==='gold'?'🪙':'🥈'} {item.price.toLocaleString('ar-SA')}</span>
              <button type="button" disabled={busy||loading} onClick={()=>void handleBuy(item)}
                className="rounded-xl bg-gradient-to-r from-[#ffecac] to-[#db9d42] border border-[#fff0b0] text-[#2e240e] px-3 py-2 text-[11px] font-black disabled:opacity-50 active:scale-[.98]">
                {busy?'جارٍ التنفيذ…':item.isOwned?'تجهيز':'شراء'}
              </button>
            </div>
          </div>
        </article>)}
      </section>
      <p className="text-center text-[#8dc1a8] text-[10px] mt-5 px-6">الأسعار والرصيد والمقتنيات من النظام الحقيقي، وتأكيد الشراء يعتمد على استجابة الخادم.</p>
    </main>
  );
};
