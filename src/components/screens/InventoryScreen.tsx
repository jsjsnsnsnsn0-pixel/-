import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ChevronRight, PackageOpen, Gift, CheckCircle2, Play, X} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {catalog, rpc, backendMessage, CatalogItem} from '../../services/backend';
import {supabase} from '../../services/supabase';
import {useServerData} from '../../hooks/useServerData';
import {EmptyState, ErrorState, InlineLoading} from '../common/UIState';

type ItemCategory='frames'|'cars'|'bubbles'|'entrances'|'cards'|'badges';
type InventoryTab=ItemCategory|'gifts';
interface OwnedItem extends CatalogItem {
  category:ItemCategory;
  expiresAt:string|null;
  equipped:boolean;
  status:'owned'|'active'|'expired'|'permanent';
}
interface CpRelation {id:string;type_id:string;partner?:{display_name?:string;public_id?:number}}
interface SavedGift {id:string;name:string;icon:string;count:number;expiresAt:string|null}
interface InventoryData {items:OwnedItem[];relations:CpRelation[];savedGifts:SavedGift[]}

const tabs:Array<{id:InventoryTab;label:string}>=[
  {id:'frames',label:'الإطارات'},
  {id:'cars',label:'المركبات'},
  {id:'bubbles',label:'الفقاعات'},
  {id:'entrances',label:'مؤثر الدخول'},
  {id:'cards',label:'بطاقات CP'},
  {id:'badges',label:'الشارات'},
  {id:'gifts',label:'هدايا محفوظة'},
];

export const InventoryScreen:React.FC=()=>{
  const {user,setActiveSubScreen,refreshProfile,reportError}=useApp();
  const [tab,setTab]=useState<InventoryTab>('frames');
  const [busy,setBusy]=useState<string|null>(null);
  const [notice,setNotice]=useState('');
  const [preview,setPreview]=useState<OwnedItem|null>(null);

  const load=useCallback(async():Promise<InventoryData>=>{
    const [entries,purchases,equipment,cpState,giftState]=await Promise.all([
      catalog(),
      supabase.from('store_purchases').select('item_id,expires_at,created_at').eq('user_id',user.authId).order('created_at',{ascending:false}),
      supabase.from('user_equipment').select('category,item_id').eq('user_id',user.authId),
      rpc<{relations?:CpRelation[]}>('cp_state'),
      rpc<{gifts?:Array<{id:string;name:string;icon?:string}>;inventory?:Array<{id:string;gift_id:string;remaining:number;expires_at?:string|null}>}>('gift_box_state'),
    ]);
    if(purchases.error)throw purchases.error;
    if(equipment.error)throw equipment.error;
    const now=Date.now();
    const latestPurchases=new Map<string,{expires_at:string|null}>();
    for(const row of purchases.data||[]){
      if(!latestPurchases.has(row.item_id))latestPurchases.set(row.item_id,{expires_at:row.expires_at});
    }
    const equipped=new Map((equipment.data||[]).map(row=>[String(row.category),String(row.item_id)]));
    const relations=(cpState?.relations||[]).filter(row=>row&&row.id&&row.type_id);
    const relationViews=await Promise.all([...new Set(relations.map(row=>row.type_id))].map(type=>rpc<any>('profile_cp_by_type',{p_public_id:Number(user.id),p_type_id:type}).catch(()=>null)));
    const activeCards=new Set(relationViews.map(row=>row?.card?.id).filter(Boolean));
    const items=entries.filter(entry=>latestPurchases.has(entry.id)&&['frames','cars','bubbles','entrances','cards','badges'].includes(entry.category)).map(entry=>{
      const expiresAt=latestPurchases.get(entry.id)?.expires_at||null;
      const expired=Boolean(expiresAt&&new Date(expiresAt).getTime()<=now);
      const active=!expired&&(entry.category==='cards'?activeCards.has(entry.id):equipped.get(entry.category)===entry.id);
      return {
        ...entry,
        category:entry.category as ItemCategory,
        expiresAt,
        equipped:active,
        status:expired?'expired':active?'active':expiresAt?'owned':'permanent',
      } as OwnedItem;
    });
    const giftCatalog=new Map((giftState?.gifts||[]).map(gift=>[String(gift.id),gift]));
    const grouped=new Map<string,SavedGift>();
    for(const lot of giftState?.inventory||[]){
      if(Number(lot.remaining)<=0)continue;
      const gift=giftCatalog.get(String(lot.gift_id));
      const current=grouped.get(String(lot.gift_id));
      const count=(current?.count||0)+Number(lot.remaining||0);
      grouped.set(String(lot.gift_id),{id:String(lot.gift_id),name:gift?.name||'هدية محفوظة',icon:gift?.icon||'🎁',count,expiresAt:lot.expires_at||current?.expiresAt||null});
    }
    return {items,relations,savedGifts:[...grouped.values()]};
  },[user.authId,user.id]);

  const state=useServerData(load,{items:[],relations:[],savedGifts:[]} as InventoryData);
  const availableTabs=useMemo(()=>tabs.filter(entry=>entry.id==='gifts'?state.data.savedGifts.length>0:state.data.items.some(item=>item.category===entry.id)),[state.data]);
  useEffect(()=>{
    if(!availableTabs.length)return;
    if(!availableTabs.some(entry=>entry.id===tab))setTab(availableTabs[0].id);
  },[availableTabs,tab]);
  const visible=useMemo(()=>state.data.items.filter(item=>item.category===tab),[state.data.items,tab]);

  const equip=async(item:OwnedItem)=>{
    if(busy||item.status==='expired')return;
    setBusy(item.id);setNotice('');
    try{
      if(item.category==='cards'){
        const relation=state.data.relations.find(row=>row.type_id===item.relationship_type_id);
        if(!relation){reportError('تحتاج علاقة CP فعالة من النوع المطابق قبل تفعيل هذه البطاقة.');return;}
        await rpc('equip_relationship_card',{p_relation_id:relation.id,p_item_id:item.equipped?null:item.id});
      }else{
        await rpc('equip_store_item',{p_item_id:item.equipped?null:item.id,p_category:item.category});
      }
      setNotice(item.equipped?'تم إلغاء التجهيز.':'تم تفعيل العنصر.');
      await Promise.all([state.reload(),refreshProfile()]);
    }catch(error){reportError(backendMessage(error));}
    finally{setBusy(null);}
  };

  return <div dir="rtl" className="min-h-screen bg-[#06150f] text-slate-100 pb-28">
    <header className="sticky top-0 z-30 bg-[#06150f]/95 backdrop-blur-xl border-b border-emerald-300/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2"><button type="button" aria-label="الرجوع" onClick={()=>setActiveSubScreen(null)} className="ui-icon-button rounded-full bg-white/5"><ChevronRight size={22}/></button><div><h1 className="font-black text-lg">الحقيبة</h1><p className="text-[10px] text-emerald-300/70">مقتنيات حسابك الفعلية</p></div></div>
      <PackageOpen className="text-emerald-300"/>
    </header>

    {availableTabs.length>0&&<nav aria-label="أقسام الحقيبة" className="px-3 pt-3 overflow-x-auto"><div className="flex gap-2 min-w-max pb-2">{availableTabs.map(entry=><button type="button" key={entry.id} aria-pressed={tab===entry.id} onClick={()=>setTab(entry.id)} className={`min-h-11 px-3 rounded-xl text-xs font-bold border ${tab===entry.id?'bg-emerald-400/15 text-emerald-200 border-emerald-300/30':'bg-white/5 text-slate-400 border-white/10'}`}>{entry.label}</button>)}</div></nav>}

    {notice&&<p role="status" className="mx-4 mt-2 rounded-xl bg-emerald-400/10 border border-emerald-300/20 p-3 text-xs text-emerald-200 flex items-center gap-2"><CheckCircle2 size={15}/>{notice}</p>}
    {state.loading&&<div className="p-4"><InlineLoading>جارٍ تحميل الحقيبة…</InlineLoading></div>}
    {state.error&&<div className="p-4"><ErrorState message={state.error} onRetry={()=>void state.reload()}/></div>}

    {!state.loading&&!state.error&&tab==='gifts'&&<section className="p-4 grid grid-cols-2 gap-3">
      {!state.data.savedGifts.length&&<div className="col-span-2"><EmptyState title="لا توجد هدايا محفوظة" description="المكافآت والهدايا المحفوظة القابلة للإرسال ستظهر هنا."/></div>}
      {state.data.savedGifts.map(gift=><article key={gift.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center"><div className="text-5xl mb-3" aria-hidden="true">{gift.icon}</div><h2 className="font-bold text-sm">{gift.name}</h2><p className="text-emerald-300 mt-2 font-black">×{gift.count}</p>{gift.expiresAt&&<p className="text-[10px] text-slate-500 mt-2">ينتهي {new Date(gift.expiresAt).toLocaleDateString('ar-IQ')}</p>}<p className="text-[10px] text-slate-400 mt-3"><Gift size={12} className="inline"/> تُرسل من صندوق الهدايا داخل الغرفة</p></article>)}
    </section>}

    {!state.loading&&!state.error&&!availableTabs.length&&<div className="p-4"><EmptyState title="الحقيبة فارغة" description="العناصر التي تشتريها أو تحصل عليها كمكافأة ستظهر هنا."/></div>}

    {!state.loading&&!state.error&&availableTabs.length>0&&tab!=='gifts'&&<section className="p-4 grid grid-cols-2 gap-3">
      {!visible.length&&<div className="col-span-2"><EmptyState title="لا توجد مقتنيات في هذا القسم" description="العناصر التي تشتريها من المتجر تظهر هنا حتى انتهاء صلاحيتها."/></div>}
      {visible.map(item=><article key={item.id} className={`rounded-3xl border p-3 flex flex-col justify-between min-h-64 ${item.status==='active'?'border-emerald-300/40 bg-emerald-400/10':item.status==='expired'?'border-rose-300/15 bg-rose-950/10 opacity-75':'border-white/10 bg-white/5'}`}>
        <div>
          <div className="relative h-28 rounded-2xl bg-black/20 border border-white/8 overflow-hidden flex items-center justify-center text-4xl">{item.preview_url?<img src={item.preview_url} loading="lazy" alt={item.name} className="w-full h-full object-cover"/>:<span>{item.icon}</span>}<button type="button" aria-label={`معاينة ${item.name}`} onClick={()=>setPreview(item)} className="absolute bottom-2 left-2 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center"><Play size={14} fill="currentColor"/></button></div>
          <div className="mt-2 flex items-center justify-between gap-2"><h2 className="font-bold text-sm break-words">{item.name}</h2><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${item.status==='active'?'bg-emerald-400/15 text-emerald-200':item.status==='expired'?'bg-rose-400/15 text-rose-200':item.status==='permanent'?'bg-cyan-400/15 text-cyan-200':'bg-amber-400/15 text-amber-200'}`}>{item.status==='active'?'مستخدم حالياً':item.status==='expired'?'منتهي':item.status==='permanent'?'دائم':'مملوك'}</span></div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.description}</p>
          {item.expiresAt&&<p className={`text-[10px] mt-2 ${item.status==='expired'?'text-rose-300':'text-amber-200'}`}>{item.status==='expired'?'انتهى':'ينتهي'} {new Date(item.expiresAt).toLocaleDateString('ar-IQ')}</p>}
        </div>
        <button type="button" disabled={Boolean(busy)||item.status==='expired'} onClick={()=>void equip(item)} className="mt-3 min-h-10 rounded-xl bg-emerald-500 text-emerald-950 font-black text-xs disabled:opacity-40">{busy===item.id?'جارٍ التنفيذ…':item.status==='expired'?'منتهي':item.equipped?'إلغاء التفعيل':'استخدام'}</button>
      </article>)}
    </section>}

    {preview&&<div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end justify-center" onClick={()=>setPreview(null)}><section role="dialog" aria-modal="true" aria-label={`معاينة ${preview.name}`} onClick={event=>event.stopPropagation()} className="w-full max-w-md rounded-t-[30px] border border-white/10 bg-[#0b1712] p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-center"><button type="button" aria-label="إغلاق المعاينة" onClick={()=>setPreview(null)} className="absolute mt-0 left-5 w-9 h-9 rounded-full bg-white/8 flex items-center justify-center"><X size={17}/></button><div className="mx-auto w-52 h-52 rounded-[30px] bg-black/25 border border-white/8 overflow-hidden flex items-center justify-center text-7xl">{preview.preview_url?<img src={preview.preview_url} alt={preview.name} className="w-full h-full object-cover"/>:<span>{preview.icon}</span>}</div><h2 className="mt-4 text-lg font-black">{preview.name}</h2><p className="mt-2 text-xs leading-6 text-slate-400">{preview.description||'معاينة العنصر قبل تفعيله.'}</p><p className="mt-3 text-[10px] text-emerald-300">المعاينة لا تغيّر العنصر المستخدم حالياً.</p></section></div>}
  </div>;
};
