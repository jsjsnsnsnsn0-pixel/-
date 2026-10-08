import React, {useCallback,useEffect,useRef,useState} from 'react';
import {catalog,rpc,backendMessage,CatalogItem} from '../../services/backend';
import {supabase} from '../../services/supabase';
import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import {useServerData} from '../../hooks/useServerData';
import {useApp} from '../../context/AppContext';
import {loadRoomPublicProfile,ProfileRelationship,RoomPublicProfile} from '../../services/roomPublicProfile';
import {RelationshipCard} from '../common/RelationshipCard';
import {ChevronRight,ShoppingBag,Play,X,Check} from 'lucide-react';
import './store.css';
const tabs=[['frames','غطاء الرأس'],['cars','المركبة'],['bubbles','الفقاعة'],['entrances','مؤثر الدخول'],['cards','البطاقات'],['badges','الشارات']] as const;
interface Item extends CatalogItem{owned:boolean;active:boolean;relation?:ProfileRelationship}
interface StoreData{items:Item[];profile?:RoomPublicProfile}
const empty:StoreData={items:[]};
export const StoreScreen:React.FC=()=>{
 const {user,refreshWallet,reportError,setActiveSubScreen}=useApp();
 const [tab,setTab]=useState<string>('frames'),[selected,setSelected]=useState<string|null>(null),[preview,setPreview]=useState<string|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const requests=useRef(new Map<string,string>());
 const layerRef=useDismissableLayer(Boolean(preview),()=>setPreview(null));
 const load=useCallback(async():Promise<StoreData>=>{
  const [entries,purchases,equipment,profile]=await Promise.all([catalog(),supabase.from('store_purchases').select('item_id,expires_at').eq('user_id',user.authId),supabase.from('user_equipment').select('category,item_id').eq('user_id',user.authId),loadRoomPublicProfile(user.id,user.id)]);
  if(purchases.error)throw purchases.error;if(equipment.error)throw equipment.error;
  return {profile:profile||undefined,items:entries.filter(i=>tabs.some(t=>t[0]===i.category)).map(i=>{
   const relation=profile?.relationships?.find(r=>r.typeId===i.relationship_type_id);
   const owned=(purchases.data||[]).some(p=>p.item_id===i.id&&(!p.expires_at||Date.parse(p.expires_at)>Date.now()));
   return {...i,relation,owned,active:i.category==='cards'?relation?.cardId===i.id:owned&&(equipment.data||[]).some(e=>e.category===i.category&&e.item_id===i.id)};
  })};
 },[user.authId,user.id]);
 const {data,loading,error,reload}=useServerData(load,empty);
 useEffect(()=>{const focus=()=>void reload();window.addEventListener('focus',focus);const timer=setInterval(()=>{if(document.visibilityState==='visible')void reload()},30000);return()=>{window.removeEventListener('focus',focus);clearInterval(timer)}},[reload]);
 const items=data.items.filter(i=>i.category===tab),item=items.find(i=>i.id===selected),view=data.items.find(i=>i.id===preview);
 const changeTab=(id:string)=>{setTab(id);setSelected(null);setNotice('')};
 const run=async(target:Item)=>{
  if(busy)return;setBusy(true);setNotice('');
  try{
   if(target.owned){
    if(target.category==='cards'){
     if(!target.relation)throw new Error('active matching relationship required');
     await rpc('equip_relationship_card',{p_relation_id:target.relation.id,p_item_id:target.active?null:target.id});
    }else await rpc('equip_store_item',{p_item_id:target.active?null:target.id,p_category:target.category});
   }else{
    const request=requests.current.get(target.id)||crypto.randomUUID();requests.current.set(target.id,request);
    const result=await rpc<{id:string}>('purchase_store_item',{p_item_id:target.id,p_request_id:request});
    if(!result?.id)throw new Error('purchase not confirmed');requests.current.delete(target.id);
   }
   setNotice(target.owned?(target.active?'تم إلغاء التجهيز.':'تم تفعيل المنتج.'):'تم الشراء. يمكنك تفعيل المنتج من مقتنياتك.');
   await Promise.all([reload(),refreshWallet()]);
  }catch(e){reportError(backendMessage(e))}finally{setBusy(false)}
 };
 const duration=(i:Item)=>i.duration_days?`${i.duration_days} يوم`:'دائم';
 const visual=(i:Item)=>i.preview_url?<img src={i.preview_url} alt={i.name}/>:<span aria-hidden="true">{i.icon}</span>;
 const action=(i:Item)=>!i.owned?'شراء':i.active?'إلغاء التجهيز':'تفعيل';
 return <div className="toti-store" dir="rtl">
  <header><button aria-label="رجوع" onClick={()=>setActiveSubScreen(null)}><ChevronRight/></button><h1><ShoppingBag size={20}/> المتجر</h1><button onClick={()=>setActiveSubScreen('inventory')}>الحقيبة</button></header>
  <nav aria-label="أقسام المتجر">{tabs.map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>changeTab(id)}>{label}</button>)}</nav>
  <main>
   <p className="store-intro">{tab==='cards'?'بطاقات تجميلية للعلاقات الفعالة؛ شراء البطاقة لا ينشئ علاقة CP.':'اختر منتجاً لمعاينته أو تجهيزه من مقتنياتك.'}</p>
   {notice&&<p className="store-notice" role="status"><Check size={16}/>{notice}</p>}
   {loading&&<p role="status">جارٍ تحميل المتجر…</p>}
   {error&&<button onClick={()=>void reload()}>{error} · إعادة المحاولة</button>}
   {!loading&&!error&&!items.length&&<div className="store-empty"><ShoppingBag/><p>{tab==='cards'?'لا توجد بطاقات علاقات متاحة في الكتالوج حالياً.':'لا توجد منتجات متاحة في هذا القسم.'}</p></div>}
   {!loading&&!error&&<div className={`store-grid ${tab==='cards'?'store-cards':''}`}>{items.map(i=><article key={i.id} className={selected===i.id?'selected':''}>
    <button className="store-visual" aria-label={`معاينة ${i.name}`} onClick={()=>{setSelected(i.id);setPreview(i.id)}}>{visual(i)}<span className="store-play"><Play size={16}/></span></button>
    <button className="store-select" onClick={()=>setSelected(i.id)}><h2>{i.name}</h2><span>{i.price.toLocaleString('ar-IQ')} {i.currency==='gold'?'🪙':'🥈'} · {duration(i)}</span><small>{i.active?'قيد الاستخدام':i.owned?'مملوك':'غير مملوك'}</small></button>
   </article>)}</div>}
  </main>
  <footer><div><small>رصيدك الحالي</small><strong>{user.gold.toLocaleString('ar-IQ')} 🪙 <span>· {(user.silverCoins??0).toLocaleString('ar-IQ')} 🥈</span></strong></div><button disabled={!item||busy||loading||Boolean(error)||Boolean(item.owned&&item.category==='cards'&&!item.relation)} onClick={()=>item&&void run(item)}>{busy?'جارٍ التنفيذ…':item?action(item):'اختر منتجاً'}</button>{item?.owned&&item.category==='cards'&&!item.relation&&<p>تحتاج علاقة فعالة من نوع هذه البطاقة لتفعيلها.</p>}</footer>
  {view&&<div ref={layerRef} className="store-backdrop" onClick={()=>setPreview(null)}><section role="dialog" aria-modal="true" aria-label={`معاينة ${view.name}`} className="store-preview" onClick={e=>e.stopPropagation()}><button autoFocus aria-label="إغلاق المعاينة" onClick={()=>setPreview(null)}><X/></button><h2>{view.name}</h2><div className="store-preview-art">{visual(view)}</div>{view.category==='cards'&&view.relation&&data.profile&&<RelationshipCard subject={data.profile} relation={{...view.relation,presentation:{...view.relation.presentation,...view.presentation}}}/>}<p>{view.description}</p>{view.category==='cards'&&!view.relation&&<p>معاينة التصميم فقط. يظهر بين طرفَي العلاقة عند تفعيله على علاقة مطابقة.</p>}<p>{view.price.toLocaleString('ar-IQ')} {view.currency==='gold'?'🪙':'🥈'} · {duration(view)}</p><button disabled={busy||loading||Boolean(error)||Boolean(view.owned&&view.category==='cards'&&!view.relation)} onClick={()=>void run(view)}>{action(view)}</button></section></div>}
 </div>;
};
