import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useCallback, useRef } from 'react';
import { catalog, rpc, backendMessage } from '../../services/backend';
import { supabase } from '../../services/supabase';
import { useServerData } from '../../hooks/useServerData';
import { useApp } from '../../context/AppContext';
import { ChevronRight, ShoppingBag, Sparkles, Car, MessageCircle, Crown, Check, DoorOpen, IdCard, PackageOpen, WalletCards, Search, Play, X, Grid2X2 } from 'lucide-react';

type StoreCategory = 'all' | 'gift' | 'nation' | 'luck' | 'custom' | 'frames' | 'cars' | 'bubbles' | 'entrances' | 'cards' | 'badges' | 'vip';
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
  isGiftStock?: boolean;
  savedCount?: number;
}

const equipableCategories=new Set<ProductCategory>(['frames','cars','bubbles','entrances','badges']);

const tabs: Array<{id:StoreCategory;label:string;icon:React.ComponentType<{size?:number}>;always?:boolean}> = [
  { id: 'all', label: 'الكل', icon: Grid2X2, always:true },
  { id: 'gift', label: 'هدايا', icon: ShoppingBag },
  { id: 'nation', label: 'الأعلام والأمة', icon: Crown },
  { id: 'luck', label: 'حظ', icon: Sparkles },
  { id: 'custom', label: 'مخصص', icon: Sparkles },
  { id: 'frames', label: 'الإطارات', icon: Sparkles },
  { id: 'cars', label: 'المركبات', icon: Car },
  { id: 'bubbles', label: 'الفقاعات', icon: MessageCircle },
  { id: 'entrances', label: 'مؤثر الدخول', icon: DoorOpen },
  { id: 'cards', label: 'CP', icon: IdCard, always:true },
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
    // Gift stock uses the existing server-backed gift inventory and a different purchase RPC.
    // Store cosmetics remain real store_catalog products, never fabricated display entries.
    type GiftBoxProducts = {gifts?:Array<{id:string;name:string;price:number;icon?:string;description?:string;preview_url?:string|null;category_id?:string;duration_days?:number|null}>;inventory?:Array<{gift_id:string;remaining:number}>};
    let box:GiftBoxProducts|null=null;
    try { box=await rpc<GiftBoxProducts>('gift_box_state'); }
    catch { /* Keep already available cosmetic categories if the optional gift catalog fails. */ }
    const counts = new Map<string,number>();
    for (const lot of box?.inventory || []) counts.set(String(lot.gift_id),(counts.get(String(lot.gift_id))||0)+Number(lot.remaining||0));
    const giftItems:StoreItem[] = (box?.gifts || []).filter(item=>Number(item.price)>0).map(item=>({
      id:String(item.id),
      name:String(item.name),
      category:(['nation','luck','custom'].includes(String(item.category_id)) ? item.category_id : 'gift') as ProductCategory,
      price:Number(item.price),
      currency:'gold',
      image:String(item.icon||'🎁'),
      previewUrl:item.preview_url||null,
      description:String(item.description||'هدية قابلة للحفظ والإرسال من الغرفة'),
      duration:item.duration_days ? `${item.duration_days} يوم` : 'دائم',
      isGiftStock:true,
      savedCount:counts.get(String(item.id))||0,
    }));
    const cosmetics = entries.filter(item => tabs.some(tab => tab.id === item.category)).map(item => ({
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
    return [...giftItems,...cosmetics];
  }, [user.authId]);

  const {data: items, loading, error, reload} = useServerData(load, []);
  const visibleTabs=tabs.filter(tab=>tab.always||tab.id==='cards'||items.some(item=>item.category===tab.id));
  const normalizedQuery=query.trim().toLocaleLowerCase('ar');
  const filteredItems=items.filter(item=>(activeTab==='all'||item.category===activeTab)&&(!normalizedQuery||item.name.toLocaleLowerCase('ar').includes(normalizedQuery)||item.description.toLocaleLowerCase('ar').includes(normalizedQuery)));

  const handleBuy = async (item: StoreItem) => {
    if (busy) return;
    if(item.isOwned&&!item.isGiftStock){
      if(item.category==='cards'){setSelected(null);setActiveSubScreen('inventory');return;}
      if(!equipableCategories.has(item.category))return;
    }
    setBusy(true); setPurchaseSuccess(null);
    try {
      if(item.isOwned&&!item.isGiftStock) await rpc('equip_store_item',{p_item_id:item.id,p_category:item.category});
      else {
        const key=(item.isGiftStock?'gift:':'store:')+item.id;
        const request = requests.current.get(key) || crypto.randomUUID();
        requests.current.set(key, request);
        if(item.isGiftStock){
          const confirmed=await rpc<string>('buy_gift_stock',{p_gift_id:item.id,p_request_id:request});
          if(String(confirmed)!==request)throw new Error('gift stock purchase not confirmed');
        }else{
          const result=await rpc<{id:string}>('purchase_store_item',{p_item_id:item.id,p_request_id:request});
          if(!result?.id)throw new Error('purchase not confirmed');
        }
        requests.current.delete(key);
      }
      setPurchaseSuccess(item.isOwned&&!item.isGiftStock?'تم اعتماد تجهيز المنتج.':item.isGiftStock?'تم شراء الهدية وحفظها في الحقيبة.':'تم اعتماد الشراء من الخادم.');
      setSelected(null);
      await Promise.all([reload(),refreshWallet()]);
      scheduleTimeout(() => setPurchaseSuccess(null), 3000);
    } catch (e) { reportError(backendMessage(e)); }
    finally { setBusy(false); }
  };

  const actionLabel=(item:StoreItem)=>{
    if(item.isGiftStock)return 'شراء وحفظ في الحقيبة';
    if(!item.isOwned)return 'شراء';
    if(item.category==='cards')return 'فتح الحقيبة';
    if(equipableCategories.has(item.category))return 'استخدام';
    return 'مملوك';
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
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={()=>setActiveSubScreen('wallet')} className="ui-icon-button rounded-xl bg-white/5 border border-white/10 text-amber-200" aria-label="فتح المحفظة"><WalletCards size={17}/></button>
          <button type="button" onClick={()=>setActiveSubScreen('inventory')} className="ui-icon-button rounded-xl bg-white/5 border border-white/10 text-emerald-200" aria-label="فتح الحقيبة"><PackageOpen size={17}/></button>
        </div>
        <label className="mt-3 h-11 rounded-2xl border border-white/10 bg-black/15 flex items-center gap-2 px-3 focus-within:border-emerald-300/30">
          <Search size={15} className="text-slate-500"/>
          <input aria-label="البحث في المتجر" value={query} onChange={event=>setQuery(event.target.value)} placeholder="ابحث عن عنصر..." className="min-w-0 flex-1 bg-transparent outline-none text-sm placeholder:text-slate-600"/>
          {query&&<button type="button" aria-label="مسح البحث" onClick={()=>setQuery('')} className="text-slate-500"><X size={15}/></button>}
        </label>
      </header>

      <div className="px-4 pt-3 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-amber-400/10 text-amber-200 border border-amber-300/15 px-3 py-1.5">🪙 {user.gold.toLocaleString('ar-SA')}</span>
        <span className="rounded-full bg-white/5 text-slate-200 border border-white/10 px-3 py-1.5">🥈 {(user.silverCoins || 0).toLocaleString('ar-SA')}</span>
      </div>

      {purchaseSuccess && <div role="status" className="m-4 p-3 bg-emerald-400/10 border border-emerald-300/20 text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2"><Check size={16}/><span>{purchaseSuccess}</span></div>}

      <nav aria-label="أقسام المتجر" className="mt-3 px-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {visibleTabs.map(tab => {
            const Icon=tab.icon; const active=activeTab===tab.id;
            return <button key={tab.id} type="button" aria-pressed={active} onClick={()=>setActiveTab(tab.id)}
              className={`min-h-11 px-3 rounded-2xl flex items-center gap-1.5 border text-xs font-bold ${active?'bg-gradient-to-r from-violet-500/25 to-fuchsia-500/15 border-violet-300/35 text-white shadow-lg':'bg-white/[0.045] border-white/8 text-slate-400'}`}>
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
      {!loading && !error && !filteredItems.length && <div className="m-4 rounded-2xl bg-white/5 border border-white/10 p-5 text-center text-slate-400"><ShoppingBag size={24} className="mx-auto text-slate-600"/><p className="mt-2 text-sm font-bold">{query?'لا توجد نتائج مطابقة':'لا توجد منتجات متاحة حالياً في هذا القسم'}</p>{activeTab==='cards'&&<p className="mt-1 text-[10px] text-pink-200/60">أي منتج CP فعلي يضاف للكتالوج سيظهر هنا تلقائياً.</p>}</div>}

      <div className="p-4 grid grid-cols-2 gap-3">
        {filteredItems.map(item=>(
          <article key={item.id} className="rounded-[26px] overflow-hidden border border-violet-300/15 bg-gradient-to-b from-violet-500/[.09] to-white/[.025] shadow-[0_14px_32px_rgba(0,0,0,.18)] backdrop-blur-xl">
            <button type="button" aria-label={`عرض ${item.name}`} onClick={()=>setSelected(item)} className="w-full text-right">
              <div className="relative aspect-square bg-black/20 flex items-center justify-center text-5xl overflow-hidden">
                {item.previewUrl?<img src={item.previewUrl} alt={item.name} loading="lazy" className="w-full h-full object-cover"/>:<span aria-hidden="true">{item.image}</span>}
                {item.isOwned&&!item.isGiftStock&&<span className="absolute top-2 right-2 rounded-full bg-cyan-950/80 border border-cyan-300/20 px-2 py-1 text-[9px] font-black text-cyan-200">مملوك</span>}
                {item.isGiftStock&&Boolean(item.savedCount)&&<span className="absolute top-2 right-2 rounded-full bg-cyan-950/80 border border-cyan-300/20 px-2 py-1 text-[9px] font-black text-cyan-200">بالحقيبة ×{item.savedCount}</span>}
                <span className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-black/55 border border-white/10 flex items-center justify-center"><Play size={12} fill="currentColor"/></span>
              </div>
              <div className="p-3">
                <h3 className="font-black text-sm truncate">{item.name}</h3>
                <div className="mt-2 flex items-center justify-between gap-1 text-[10px]"><span className="text-amber-200 font-black" dir="ltr">{item.currency==='gold'?'🪙':'🥈'} {item.price.toLocaleString('ar-IQ')}</span><span className="text-slate-500">{item.duration}</span></div>
              </div>
            </button>
          </article>
        ))}
      </div>

      {selected&&<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center" onClick={()=>{if(!busy)setSelected(null)}}>
        <section role="dialog" aria-modal="true" aria-label={`تفاصيل ${selected.name}`} onClick={event=>event.stopPropagation()} className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-[32px] border border-white/10 bg-[#0b1712] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl">
          <button type="button" onClick={()=>{if(!busy)setSelected(null)}} aria-label="إغلاق" className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"><X size={18}/></button>
          <button type="button" onClick={()=>setPreview(selected)} aria-label={`معاينة ${selected.name}`} className="relative w-full aspect-[4/3] rounded-[26px] bg-black/25 border border-white/8 overflow-hidden flex items-center justify-center text-7xl">
            {selected.previewUrl?<img src={selected.previewUrl} alt={selected.name} className="w-full h-full object-contain"/>:<span>{selected.image}</span>}
            <span className="absolute inset-0 flex items-center justify-center"><span className="w-14 h-14 rounded-full bg-black/55 border border-white/15 flex items-center justify-center"><Play size={22} fill="currentColor"/></span></span>
          </button>
          <div className="mt-4 flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-lg font-black">{selected.name}</h2><p className="mt-1 text-xs leading-6 text-slate-400">{selected.description||'عنصر تجميلي من متجر TotiChat.'}</p></div>{selected.isOwned&&!selected.isGiftStock&&<span className="shrink-0 rounded-full bg-cyan-400/10 text-cyan-200 border border-cyan-300/15 px-2.5 py-1 text-[10px] font-black">مملوك</span>}
          {selected.isGiftStock&&<span className="shrink-0 rounded-full bg-cyan-400/10 text-cyan-200 border border-cyan-300/15 px-2.5 py-1 text-[10px] font-black">بالحقيبة ×{selected.savedCount||0}</span>}</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/[.045] border border-white/8 p-3"><span className="block text-[9px] text-slate-500">السعر</span><strong className="block mt-1 text-sm text-amber-200" dir="ltr">{selected.currency==='gold'?'🪙':'🥈'} {selected.price.toLocaleString('ar-IQ')}</strong></div>
            <div className="rounded-2xl bg-white/[.045] border border-white/8 p-3"><span className="block text-[9px] text-slate-500">المدة</span><strong className="block mt-1 text-sm">{selected.duration}</strong></div>
          </div>
          {selected.category==='cards'&&selected.relationshipTypeId&&<p className="mt-3 rounded-xl bg-pink-500/10 border border-pink-300/10 px-3 py-2 text-[10px] text-pink-200">نوع العلاقة المطلوب: {selected.relationshipTypeId}</p>}
          {selected.isGiftStock&&<p className="mt-3 rounded-xl bg-cyan-500/10 border border-cyan-300/10 px-3 py-2 text-[11px] text-cyan-200">ستدخل هدية واحدة إلى حقيبتك لتُرسلها من صندوق الهدايا داخل الغرفة. المعاينة لا تشتري الهدية ولا ترسلها.</p>}
          {selected.category==='vip'&&<p className="mt-3 rounded-xl bg-amber-500/10 border border-amber-300/10 px-3 py-2 text-[10px] text-amber-200">امتياز VIP يُفعّل فقط وفق بيانات المنتج وقواعد الخادم.</p>}
          <button type="button" disabled={busy||loading||(selected.isOwned&&!selected.isGiftStock&&!equipableCategories.has(selected.category)&&selected.category!=='cards')} onClick={()=>void handleBuy(selected)} className="mt-5 w-full min-h-[50px] rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-300 text-[#042019] text-sm font-black disabled:opacity-45">{busy?'جارٍ التنفيذ…':actionLabel(selected)}</button>
          {(!selected.isOwned||selected.isGiftStock)&&<p className="mt-2 text-center text-[10px] text-slate-500">الخصم وإضافة الملكية ينفذهما Backend في عملية واحدة موثقة.</p>}
        </section>
      </div>}

      {preview&&<div className="fixed inset-0 z-[60] bg-[#060b09]/94 backdrop-blur-xl flex items-center justify-center p-5" onClick={()=>setPreview(null)}>
        <div role="dialog" aria-modal="true" aria-label={`معاينة ${preview.name}`} onClick={event=>event.stopPropagation()} className="relative w-full max-w-sm text-center">
          <button type="button" aria-label="إغلاق المعاينة" onClick={()=>setPreview(null)} className="absolute -top-12 left-0 w-10 h-10 rounded-full bg-white/8 flex items-center justify-center"><X size={18}/></button>
          <div className="aspect-square rounded-[34px] bg-[radial-gradient(circle,rgba(52,211,153,.15),transparent_62%)] border border-white/8 flex items-center justify-center overflow-hidden text-8xl">{preview.previewUrl?<img src={preview.previewUrl} alt={preview.name} className="w-full h-full object-contain"/>:<span className="animate-pulse">{preview.image}</span>}</div>
          <h2 className="mt-5 text-lg font-black">{preview.name}</h2><p className="mt-2 text-[11px] text-slate-500">Preview فقط — لا شراء ولا تفعيل من هذه الشاشة.</p>
        </div>
      </div>}
    </div>
  );
};
