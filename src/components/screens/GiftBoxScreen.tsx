import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Room,User} from '../../types';
import {useApp} from '../../context/AppContext';
import {useServerData} from '../../hooks/useServerData';
import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import {BoxItem,canSendBoxGift,emptyGiftBox,loadGiftBox,loadInventory} from '../../services/giftBox';
import {beginGiftRequest,finishGiftRequest,hasGiftRequest} from '../../services/giftRequests';
import {backendMessage,rpc} from '../../services/backend';
import {RelationshipCard} from '../common/RelationshipCard';
import {UserAvatar} from '../common/UserAvatar';
import {ArrowRight,Package,X,Info} from 'lucide-react';
import './gift-box.css';
export function GiftBoxContent({room,initialRecipient,onClose,onRecharge,compact=false,inventory=false}:{room?:Room|null;initialRecipient?:User|null;onClose:()=>void;onRecharge:()=>void;compact?:boolean;inventory?:boolean}){
 const {user,refreshWallet,sendGiftInRoom,reportError,setActiveSubScreen}=useApp();
 const load=useCallback(()=>inventory?loadInventory(user.id,user.authId||''):loadGiftBox(user.id),[user.id,user.authId,inventory]);
 const {data,loading,error,reload}=useServerData(load,emptyGiftBox);
 const [category,setCategory]=useState('all'),[detail,setDetail]=useState<string|null>(null),[recipient,setRecipient]=useState<string|null>(initialRecipient?.id||null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [selected,setSelected]=useState<string|null>(null),[quantity,setQuantity]=useState(1);
 const running=useRef(false),detailRef=useDismissableLayer(Boolean(detail),()=>setDetail(null));
 const recipients=[...new Map([...(room?.members?.length?room.members:(room?.seats||[]).flatMap(s=>s.user?[s.user]:[])),...(room?[user]:[])].map(p=>[p.id,p])).values()];
 const ids=recipients.map(p=>p.id).join(',');
 useEffect(()=>{if(!recipients.some(r=>r.id===recipient))setRecipient(recipients[0]?.id||null)},[ids]);
 useEffect(()=>{const refresh=()=>{if(!running.current)void reload()};window.addEventListener('focus',refresh);const timer=setInterval(()=>{if(document.visibilityState==='visible')refresh()},30000);return()=>{window.removeEventListener('focus',refresh);clearInterval(timer)}},[reload]);
 const items=data.items.filter(i=>category==='all'||i.category===category),view=data.items.find(i=>i.key===detail),target=recipients.find(r=>r.id===recipient),chosen=data.items.find(i=>i.key===selected&&i.kind==='gift');
 const execute=async(i:BoxItem)=>{
  const count=inventory?1:quantity;
  if(running.current||loading||error)return;
  if(i.kind==='gift'&&(!room||!target)){setNotice('اختر غرفة ومستلماً لإرسال الهدية.');return}
  if(i.kind==='gift'&&!canSendBoxGift(i,target?.id)){setNotice('هذه الهدية تحتاج شريك العلاقة المطابق.');return}
  // Inventory gift lots are consumed without a second debit. The normal catalog
  // pays at send time, without any purchase or ownership step.
  if(i.kind==='gift'&&!inventory&&!hasGiftRequest(`${user.authId||user.id}:${room!.id}:${target!.id}:${i.id}:paid:${count}`)&&user.gold<i.price*count){setNotice('رصيدك غير كافٍ لإرسال هذه الهدية');return}
  running.current=true;setBusy(true);setNotice('');
  let key:string|undefined,id:string|null=null,confirmed=false;
  try{
   if(i.kind==='gift'){
    key=`${user.authId||user.id}:${room!.id}:${target!.id}:${i.id}:${inventory?'stock':'paid'}:${count}`;id=beginGiftRequest(key);if(!id)return;
    confirmed=await sendGiftInRoom(i.gift!,target!,undefined,id,inventory,count);
    if(!confirmed){setNotice('تعذر تأكيد الإرسال. أعد المحاولة؛ لن يتكرر الخصم لنفس الطلب.');return}
    setNotice('تم إرسال الهدية.');
   }else{
    if(!inventory||!i.quantity||i.expired)throw new Error('valid ownership required');
    if(i.category==='cards'){
     if(!i.relation)throw new Error('active matching relationship required');
     await rpc('equip_relationship_card',{p_relation_id:i.relation.id,p_item_id:i.active?null:i.id});
    }else await rpc('equip_store_item',{p_item_id:i.active?null:i.id,p_category:i.category});
    setNotice(i.active?'تم إلغاء التفعيل.':'تم تفعيل العنصر.');
   }
   setDetail(null);await Promise.all([reload(),refreshWallet()]);
  }catch(e){reportError(backendMessage(e))}finally{if(key&&id)finishGiftRequest(key,confirmed);running.current=false;setBusy(false)}
 };
 const art=(i:BoxItem)=><div className="gift-art"><span aria-hidden="true">{i.icon}</span>{i.image&&<img src={i.image} alt="" onError={e=>{e.currentTarget.hidden=true}}/>}</div>;
 const unavailable=(i:BoxItem)=>Boolean(i.relationshipTypeId&&!i.relation);
 const action=(i:BoxItem)=>i.kind==='gift'?'إرسال من الحقيبة':i.active?'إلغاء التفعيل':'تفعيل';
 const disabled=(i:BoxItem)=>busy||loading||Boolean(error)||(inventory&&i.kind==='gift'&&(!Number.isSafeInteger(i.quantity)||i.quantity<1))||(i.kind==='inventory_item'&&(i.expired||!i.quantity||unavailable(i)));
 return <div className={`gift-box ${compact?'gift-box-compact':''}`} dir="rtl">
  <header><button aria-label="إغلاق صندوق الهدايا" onClick={onClose}><ArrowRight/></button><div className="gift-box-title"><h1>{inventory?'الحقيبة':'صندوق الهدايا'}</h1>{!compact&&<p>{inventory?'مقتنياتك ومكافآتك الفعلية':'اختر المستلم والهدية والكمية ثم اضغط إرسال'}</p>}</div>{!compact&&!inventory&&<button onClick={()=>setActiveSubScreen('inventory')}>الحقيبة</button>}</header>
  {!compact&&!inventory&&data.banner&&<div className="gift-box-banner">{data.banner.image&&<img src={data.banner.image} alt=""/>}<div><h2>{data.banner.title}</h2>{data.banner.subtitle&&<p>{data.banner.subtitle}</p>}</div></div>}
  {room&&<div className="gift-recipients"><small>المستلم{target?` · ${target.name}`:''}</small><div>{recipients.map(r=><button key={r.id} disabled={busy} aria-pressed={recipient===r.id} onClick={()=>{setRecipient(r.id);setNotice('')}}><UserAvatar user={r} size="xs"/><span>{r.name}</span></button>)}</div></div>}
  <nav aria-label="تصنيفات صندوق الهدايا">{[{id:'all',label:'الكل'},...data.categories].map(c=><button key={c.id} aria-pressed={category===c.id} onClick={()=>{setCategory(c.id);setNotice('')}}>{c.label}</button>)}</nav>
  <main>
   {notice&&<p role="status" className="gift-notice">{notice}</p>}
   {loading&&!data.items.length?<div className="gift-grid" aria-label="جارٍ تحميل صندوق الهدايا">{Array.from({length:6},(_,i)=><div className="gift-skeleton" key={i}/>)}</div>:error?<div role="alert" className="gift-empty"><p>{error}</p><button onClick={()=>void reload()}>إعادة المحاولة</button></div>:!items.length?<div className="gift-empty"><Package/><h2>{inventory?'لا توجد مقتنيات في هذا التصنيف':'لا توجد عناصر حالياً'}</h2><p>{inventory?'مشتريات المتجر والمكافآت الممنوحة تظهر هنا.':'ستظهر الهدايا عند إضافتها إلى الكتالوج.'}</p></div>:<div className="gift-grid">{items.map(i=><article className={`gift-tile ${selected===i.key?'selected':''}`} key={i.key}><button className="gift-select" disabled={disabled(i)} aria-label={i.kind==='gift'?`تحديد ${i.name}`:`تفاصيل ${i.name}`} aria-pressed={i.kind==='gift'?selected===i.key:undefined} onClick={()=>i.kind==='gift'?(setSelected(i.key),setNotice('')):setDetail(i.key)}>{art(i)}<div className="gift-caption"><h2>{i.name}</h2>{inventory?<small>{i.expired?'منتهي الصلاحية':i.active?'قيد الاستخدام':`مملوك · ${i.quantity}`}</small>:<strong>{i.price.toLocaleString('ar-IQ')} 🪙</strong>}{unavailable(i)&&<small>تحتاج علاقة مطابقة</small>}{i.expiresAt&&inventory&&<small>حتى {new Date(i.expiresAt).toLocaleDateString('ar-IQ')}</small>}</div></button><button className="gift-info" aria-label={`معلومات ${i.name}`} onClick={()=>setDetail(i.key)}><Info size={14}/></button></article>)}</div>}
  </main>
  <footer>{room&&chosen&&<div className="gift-send-controls">
   {!inventory&&<div className="gift-quantities" role="group" aria-label="كمية الهدية">{[1,7,17,77,777].map(n=><button key={n} disabled={busy} aria-pressed={quantity===n} onClick={()=>{setQuantity(n);setNotice('')}}>{n}</button>)}</div>}
   {!inventory&&user.gold<chosen.price*quantity&&<p role="status">الرصيد غير كافٍ — شحن Coins</p>}
   <div className="gift-send-summary">
    <span>{chosen.name} × {inventory?1:quantity}
     <strong>{inventory?`المخزون: ${chosen.quantity} · بدون خصم Coins جديد`:`الإجمالي: ${(chosen.price*quantity).toLocaleString('ar-IQ')} 🪙`}</strong>
    </span>
    <button className="gift-send-button" disabled={busy||loading||Boolean(error)||!target||!canSendBoxGift(chosen,target?.id)||(inventory?chosen.quantity<1:user.gold<chosen.price*quantity&&!hasGiftRequest(`${user.authId||user.id}:${room!.id}:${target.id}:${chosen.id}:paid:${quantity}`))} onClick={()=>void execute(chosen)}>{busy?'جارٍ الإرسال…':inventory?'إرسال من الحقيبة':'إرسال'}</button>
   </div>
  </div>}{busy&&<span role="status">{inventory?'جارٍ التنفيذ…':'جارٍ الإرسال…'}</span>}<div><small>رصيدك الحالي</small><strong>{user.gold.toLocaleString('ar-IQ')} 🪙</strong></div>{inventory?<button className="gift-recharge" onClick={()=>setActiveSubScreen('store')}>المتجر</button>:<button className="gift-recharge" onClick={onRecharge}>شحن الرصيد</button>}{!room&&!inventory&&<p>افتح غرفة لاختيار المستلم وإرسال الهدايا.</p>}</footer>
  {view&&<div ref={detailRef} className={`gift-detail-backdrop ${compact?'compact-preview':''}`} onClick={()=>setDetail(null)}><section role="dialog" aria-modal="true" aria-label={`تفاصيل ${view.name}`} onClick={e=>e.stopPropagation()}><button aria-label="إغلاق تفاصيل الهدية" onClick={()=>setDetail(null)}><X/></button>{art(view)}<h2>{view.name}</h2><p>{view.kind==='inventory_item'?'مقتنى مملوك':'هدية قابلة للإرسال'}</p>{view.description&&<p>{view.description}</p>}{view.kind==='gift'&&!inventory&&<strong>{view.price.toLocaleString('ar-IQ')} 🪙</strong>}{inventory&&<p>{view.expired?'منتهي الصلاحية':view.active?'قيد الاستخدام':`مملوك · ${view.quantity}`}</p>}{view.expiresAt&&inventory&&<p>الصلاحية: {new Date(view.expiresAt).toLocaleDateString('ar-IQ')}</p>}{unavailable(view)&&<p>تحتاج علاقة CP فعالة من النوع المطابق.</p>}{view.card&&view.relation&&data.profile&&<RelationshipCard subject={data.profile} relation={{...view.relation,presentation:{...view.relation.presentation,...view.card.presentation}}}/>}{view.gift&&<p>{view.gift.diamondSourceType==='LUCKY_GIFT'?'ماس هدية الحظ الأساسي يُفك بنسبة 30%':'ماس الهدية الثابتة يُفك بنسبة 30%'}</p>}{inventory&&<div className="gift-actions"><button disabled={disabled(view)||(view.kind==='gift'&&(!room||!canSendBoxGift(view,target?.id)))} onClick={()=>void execute(view)}>{action(view)}</button></div>}</section></div>}
 </div>;
}
export function GiftBoxScreen(){const {setActiveSubScreen}=useApp();return <GiftBoxContent onClose={()=>setActiveSubScreen(null)} onRecharge={()=>setActiveSubScreen('recharge')}/>}
export function InventoryScreen(){const {activeRoom,setActiveSubScreen}=useApp();return <GiftBoxContent inventory room={activeRoom} onClose={()=>setActiveSubScreen(null)} onRecharge={()=>setActiveSubScreen('recharge')}/>}
