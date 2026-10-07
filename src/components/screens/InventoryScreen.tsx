import React from 'react';
import {ChevronRight, Package, Gift, Check, ShoppingBag} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {supabase} from '../../services/supabase';
import {rpc, backendMessage} from '../../services/backend';
import {useServerData} from '../../hooks/useServerData';
import {InlineLoading, ErrorState, EmptyState} from '../common/UIState';

type InventoryTab='items'|'gifts';
interface OwnedItem {
  id:string;name:string;category:string;icon:string;description?:string;
  expiresAt:string|null;isReward:boolean;previewUrl?:string|null;
}
interface SavedGift {id:string;name:string;icon:string;remaining:number}

export const InventoryScreen:React.FC=()=>{
  const {user,setActiveSubScreen,reportError}=useApp();
  const [tab,setTab]=React.useState<InventoryTab>('items');
  const [busy,setBusy]=React.useState<string|null>(null);
  const [notice,setNotice]=React.useState('');

  const load=React.useCallback(async()=>{
    const [purchases,catalog,state]=await Promise.all([
      supabase.from('store_purchases').select('item_id,expires_at').eq('user_id',user.authId),
      supabase.from('store_catalog').select('id,name,category,icon,description,is_reward,preview_url').eq('is_active',true),
      supabase.rpc('gift_box_state'),
    ]);
    if(purchases.error)throw purchases.error;
    if(catalog.error)throw catalog.error;
    const now=Date.now();
    const valid=(purchases.data||[]).filter(row=>!row.expires_at||new Date(row.expires_at).getTime()>now);
    const bestExpiry=new Map<string,string|null>();
    for(const row of valid){
      const previous=bestExpiry.get(row.item_id);
      if(previous===null)continue;
      if(!row.expires_at){bestExpiry.set(row.item_id,null);continue;}
      if(previous===undefined||new Date(row.expires_at).getTime()>new Date(previous).getTime())bestExpiry.set(row.item_id,row.expires_at);
    }
    const catalogById=new Map((catalog.data||[]).map(row=>[String(row.id),row]));
    const items:OwnedItem[]=[...bestExpiry.entries()].flatMap(([id,expiresAt])=>{
      const row=catalogById.get(id);if(!row)return[];
      return [{id,name:String(row.name||'عنصر'),category:String(row.category||''),icon:String(row.icon||'🎁'),description:row.description||'',expiresAt,isReward:Boolean(row.is_reward),previewUrl:row.preview_url||null}];
    });
    const value=state.error?null:state.data as any;
    const giftsById=new Map<string,any>((Array.isArray(value?.gifts)?value.gifts:[]).map((gift:any)=>[String(gift.id),gift]));
    const giftCounts=new Map<string,number>();
    for(const lot of Array.isArray(value?.inventory)?value.inventory:[]){
      const remaining=Math.max(0,Number(lot.remaining)||0);if(!remaining)continue;
      const id=String(lot.gift_id);giftCounts.set(id,(giftCounts.get(id)||0)+remaining);
    }
    const gifts:SavedGift[]=[...giftCounts.entries()].map(([id,remaining])=>{const row=giftsById.get(id);return{id,name:String(row?.name||'هدية محفوظة'),icon:String(row?.icon||'🎁'),remaining};});
    return {items,gifts};
  },[user.authId]);
  const state=useServerData(load,{items:[],gifts:[]});

  const equip=async(item:OwnedItem)=>{
    if(busy)return;
    if(item.category==='cards'){setActiveSubScreen('store');return;}
    if(!['frames','cars','bubbles','badges','entrances'].includes(item.category))return;
    setBusy(item.id);setNotice('');
    try{await rpc('equip_store_item',{p_item_id:item.id,p_category:item.category});setNotice('تم تفعيل العنصر من الحقيبة.');}
    catch(error){reportError(backendMessage(error));}
    finally{setBusy(null);}
  };

  return <div dir="rtl" className="min-h-screen bg-[#f8fafc] text-slate-800 pb-24">
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center gap-3">
      <button type="button" aria-label="الرجوع" onClick={()=>setActiveSubScreen(null)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"><ChevronRight size={20}/></button>
      <span className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Package size={18}/></span>
      <div><h1 className="font-black">الحقيبة</h1><p className="text-[10px] text-slate-500">المكافآت والمقتنيات التي تملكها فعلياً</p></div>
    </header>

    <div className="grid grid-cols-2 gap-2 p-4 bg-white border-b border-slate-100">
      <button type="button" onClick={()=>setTab('items')} className={`rounded-xl py-2.5 text-xs font-black ${tab==='items'?'bg-purple-600 text-white':'bg-slate-100 text-slate-600'}`}><ShoppingBag size={15} className="inline ms-1"/>المقتنيات</button>
      <button type="button" onClick={()=>setTab('gifts')} className={`rounded-xl py-2.5 text-xs font-black ${tab==='gifts'?'bg-purple-600 text-white':'bg-slate-100 text-slate-600'}`}><Gift size={15} className="inline ms-1"/>هدايا محفوظة</button>
    </div>

    {notice&&<div role="status" className="mx-4 mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2"><Check size={15}/>{notice}</div>}
    {state.loading&&<InlineLoading>جارٍ تحميل الحقيبة…</InlineLoading>}
    {state.error&&<div className="p-4"><ErrorState message={state.error} onRetry={()=>void state.reload()}/></div>}

    {!state.loading&&!state.error&&tab==='items'&&<div className="p-4 grid grid-cols-2 gap-3">
      {state.data.items.map(item=><article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs">
        <div className="h-24 rounded-xl bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center text-4xl overflow-hidden">{item.previewUrl?<img src={item.previewUrl} alt={item.name} loading="lazy" className="w-full h-full object-cover"/>:item.icon}</div>
        <h2 className="text-xs font-black mt-2">{item.name}</h2>
        <p className="text-[10px] text-slate-500 mt-1">{item.isReward?'مكافأة':'مشتريات المتجر'} · {item.expiresAt?`حتى ${new Date(item.expiresAt).toLocaleDateString('ar-SA')}`:'دائم'}</p>
        {item.category==='cards'?<button type="button" onClick={()=>setActiveSubScreen('store')} className="mt-3 w-full rounded-xl bg-pink-500 text-white py-2 text-[11px] font-bold">إدارة البطاقة</button>:['frames','cars','bubbles','badges','entrances'].includes(item.category)&&<button type="button" disabled={busy===item.id} onClick={()=>void equip(item)} className="mt-3 w-full rounded-xl bg-purple-600 text-white py-2 text-[11px] font-bold disabled:opacity-50">{busy===item.id?'جارٍ التفعيل…':'تفعيل'}</button>}
      </article>)}
      {!state.data.items.length&&<div className="col-span-2"><EmptyState title="لا توجد مقتنيات في الحقيبة حالياً." /></div>}
    </div>}

    {!state.loading&&!state.error&&tab==='gifts'&&<div className="p-4 grid grid-cols-2 gap-3">
      {state.data.gifts.map(gift=><article key={gift.id} className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-xs"><div className="text-5xl">{gift.icon}</div><h2 className="text-xs font-black mt-2">{gift.name}</h2><span className="inline-block mt-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-black">×{gift.remaining}</span><p className="text-[10px] text-slate-400 mt-2">يمكن إرسالها من صندوق الهدايا داخل الغرفة بدون خصم Coins.</p></article>)}
      {!state.data.gifts.length&&<div className="col-span-2"><EmptyState title="لا توجد هدايا محفوظة حالياً." /></div>}
    </div>}
  </div>;
};
