import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabase';
import { Gift, User, Room } from '../../types';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { X, Sparkles, Plus, Check, ChevronDown, Play } from 'lucide-react';

interface GiftStoreModalProps {
  isOpen: boolean;
  initialRecipient?:User|null;
  onClose: () => void;
  room?: Room | null;
  onRechargeClick: () => void;
}

export const GiftStoreModal: React.FC<GiftStoreModalProps> = ({
  isOpen,
  initialRecipient,
  onClose,
  room,
  onRechargeClick,
}) => {
  const layerRef=useDismissableLayer(isOpen,onClose);

  const { user, sendGiftInRoom, sendSavedGiftInRoom } = useApp();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const scheduleTimeout = useTimeouts(isOpen);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const quantityOptions = [1, 7, 77, 777] as const;
  const [quantity, setQuantity] = useState<(typeof quantityOptions)[number]>(1);
  const [quantityOpen,setQuantityOpen]=useState(false);
  const [previewGift,setPreviewGift]=useState<Gift|null>(null);
  const [serverCategories, setServerCategories] = useState<Array<{id:string;label:string}>>([]);
  const [inventoryCounts, setInventoryCounts] = useState<Record<string,number>>({});
  const [banner, setBanner] = useState<{title:string;subtitle?:string;image_url?:string|null}|null>(null);
  const [sendSource, setSendSource] = useState<'coins'|'saved'>('coins');
  const [luckyPoints,setLuckyPoints]=useState(0);
  const [luckyHistory,setLuckyHistory]=useState<Array<{id:string;gift_name:string;quantity:number;result_label:string;multiplier:number;lucky_points:number;created_at:string}>>([]);
  const [luckyHistoryOpen,setLuckyHistoryOpen]=useState(false);
  
  // Available recipients: room participants or host
  const potentialRecipients: User[] = [...new Map([...(room?.members?.length?room.members:(room?.seats||[]).flatMap(seat=>seat.user?[seat.user]:[])),user].map(member=>[member.id,member])).values()];

  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(
    potentialRecipients.length > 0 ? potentialRecipients[0] : null
  );

  useEffect(()=>{if(isOpen&&initialRecipient&&Boolean(initialRecipient.id))setSelectedRecipient(initialRecipient)},[isOpen,initialRecipient?.id]);
  const giftRetry = useRef<{key:string;id:string}|null>(null);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      giftRetry.current=null;
      setSendSuccess(false);
      setErrorMsg(null);
      setQuantity(1);
      setSendSource('coins');
      setQuantityOpen(false);
      setPreviewGift(null);
      setLuckyHistoryOpen(false);
      sendingRef.current=false;
    }
  }, [isOpen]);

  const fallbackCategories = [
    { id: 'all', label: 'الكل' },
    { id: 'luck', label: 'حظ' },
    { id: 'custom', label: 'مخصص' },
    { id: 'cp', label: 'CP' },
    { id: 'nation', label: 'الأمة' },
    { id: 'gift', label: 'هدية' },
  ];
  const categories = serverCategories.length
    ? [{id:'all',label:'الكل'}, ...serverCategories.map(cat=>cat.id==='luck'?{...cat,label:'هدايا الحظ'}:cat)]
    : fallbackCategories.map(cat=>cat.id==='luck'?{...cat,label:'هدايا الحظ'}:cat);

  useEffect(()=>{
    if(!isOpen||!user.authId)return;
    let cancelled=false;
    void (async()=>{
      const [balance,history]=await Promise.all([
        supabase.from('lucky_point_balances').select('points').eq('user_id',user.authId).limit(1),
        supabase.from('lucky_results').select('id,gift_name,quantity,result_label,multiplier,lucky_points,created_at').or(`sender_id.eq.${user.authId},recipient_id.eq.${user.authId}`).order('created_at',{ascending:false}).limit(20),
      ]);
      if(cancelled)return;
      if(!balance.error)setLuckyPoints(Number(balance.data?.[0]?.points||0));
      if(!history.error)setLuckyHistory((history.data||[]).map((row:any)=>({
        id:String(row.id),gift_name:String(row.gift_name||'هدية الحظ'),quantity:Number(row.quantity||1),
        result_label:String(row.result_label||'Lucky Bonus'),multiplier:Number(row.multiplier||1),
        lucky_points:Number(row.lucky_points||0),created_at:String(row.created_at||''),
      })));
    })();
    return()=>{cancelled=true};
  },[isOpen,user.authId]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true); setErrorMsg(null); setSendSuccess(false);

    const toGift = (row:any): Gift => {
      const animation = (['pulse','rocket','lion','car','crown','sparkle'].includes(String(row.animation_type))
        ? String(row.animation_type)
        : 'sparkle') as Gift['animationType'];
      return {
        id:String(row.id),
        name:String(row.name || 'هدية'),
        category:'all',
        price:Number(row.price || 0),
        icon:String(row.icon || '🎁'),
        animationType:animation,
        diamondSourceType:row.diamond_source_type,
        categoryId:row.category_id || undefined,
        description:row.description || '',
        previewUrl:row.preview_url || null,
        relationshipTypeId:row.relationship_type_id || null,
        rarity:row.rarity || null,
      };
    };

    void (async () => {
      try {
        const state = await supabase.rpc('gift_box_state');
        if (cancelled) return;
        const value = state.data as any;
        if (!state.error && value && Array.isArray(value.gifts)) {
          const next:Gift[] = value.gifts.map(toGift);
          setGifts(next);
          setSelectedGift(null);
          setServerCategories(Array.isArray(value.categories) ? value.categories.map((row:any)=>({id:String(row.id),label:String(row.label)})) : []);
          const counts:Record<string,number> = {};
          for (const lot of Array.isArray(value.inventory) ? value.inventory : []) {
            if (Number(lot.remaining) > 0) counts[String(lot.gift_id)] = (counts[String(lot.gift_id)] || 0) + Number(lot.remaining);
          }
          setInventoryCounts(counts);
          setBanner(value.banner && value.banner.title ? value.banner : null);
          return;
        }

        const fallback = await supabase.from('gift_catalog')
          .select('id,name,price,diamond_source_type,category_id,icon,description,preview_url,animation_type,relationship_type_id,rarity')
          .eq('is_active',true);
        if (cancelled) return;
        if (fallback.error) throw fallback.error;
        const next:Gift[] = (fallback.data || []).map(toGift);
        setGifts(next);
        setSelectedGift(null);
        setServerCategories([]);
        setInventoryCounts({});
        setBanner(null);
      } catch {
        if (!cancelled) {
          setGifts([]);
          setSelectedGift(null);
          setServerCategories([]);
          setInventoryCounts({});
          setBanner(null);
          setErrorMsg('تعذر تحميل الهدايا.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {cancelled = true;};
  }, [isOpen]);
  const recipientIds = potentialRecipients.map(u => u.id).join(',');
  useEffect(() => {
    if (!potentialRecipients.some(u => u.id === selectedRecipient?.id)) setSelectedRecipient(potentialRecipients[0] || null);
  }, [recipientIds]);
  const filteredGifts =
    selectedCategory === 'all'
      ? gifts
      : selectedCategory === 'luck'
        ? gifts.filter(g=>g.diamondSourceType==='LUCKY_GIFT')
        : gifts.filter((g) => g.categoryId === selectedCategory || g.category === selectedCategory);

  const effectiveQuantity=sendSource==='saved'?1:quantity;
  const totalPrice=selectedGift?selectedGift.price*effectiveQuantity:0;
  const insufficientCoins=sendSource==='coins'&&Boolean(selectedGift)&&user.gold<totalPrice;
  const unavailableSaved=sendSource==='saved'&&selectedGift!==null&&(inventoryCounts[selectedGift.id]||0)<1;
  const sendDisabled=sending||loading||sendSuccess||!selectedGift||!selectedRecipient||insufficientCoins||unavailableSaved;

  const handleSend = async () => {
    if (sendingRef.current || sending || loading || sendSuccess) return;
    if (!selectedGift || !selectedRecipient) {
      setErrorMsg('يرجى اختيار المستلم والهدية');
      return;
    }

    if (sendSource === 'saved' && (inventoryCounts[selectedGift.id] || 0) < 1) {
      setErrorMsg('هذه الهدية غير موجودة في صندوقك.');
      return;
    }
    if (sendSource === 'coins' && user.gold < totalPrice) {
      setErrorMsg('رصيدك من Coins غير كافٍ. اضغط لشحن الرصيد');
      return;
    }

    sendingRef.current=true;
    setSending(true);
    const key = `${room?.id}:${selectedGift.id}:${selectedRecipient.id}:${sendSource}:${effectiveQuantity}`;
    if(giftRetry.current?.key!==key)giftRetry.current={key,id:crypto.randomUUID()};
    const ok = sendSource === 'saved'
      ? await sendSavedGiftInRoom(selectedGift, selectedRecipient, undefined, giftRetry.current.id)
      : await sendGiftInRoom(selectedGift, selectedRecipient, effectiveQuantity, undefined, giftRetry.current.id);
    if(ok) {
      const completedRequestId=giftRetry.current.id;
      giftRetry.current=null;
      if (sendSource === 'saved') setInventoryCounts(previous => ({...previous,[selectedGift.id]:Math.max(0,(previous[selectedGift.id]||0)-1)}));
      if(selectedGift.diamondSourceType==='LUCKY_GIFT'){
        const result=await supabase.rpc('lucky_result_by_request',{p_request_id:completedRequestId});
        if(!result.error&&result.data){
          const lucky=result.data as any;
          const points=Math.max(0,Number(lucky.lucky_points)||0);
          setLuckyPoints(previous=>previous+points);
          setLuckyHistory(previous=>previous.some(row=>row.id===String(lucky.id))?previous:[{
            id:String(lucky.id),gift_name:String(lucky.gift_name||selectedGift.name),quantity:Number(lucky.quantity||effectiveQuantity),
            result_label:String(lucky.result_label||'Lucky Bonus'),multiplier:Number(lucky.multiplier||1),
            lucky_points:points,created_at:String(lucky.created_at||new Date().toISOString()),
          },...previous].slice(0,20));
          if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('totichat:lucky-result',{detail:lucky}));
        }
      }
    }
    sendingRef.current=false;
    setSending(false);
    if (ok) {
      setSendSuccess(true);
      setErrorMsg(null);
      scheduleTimeout(() => {
        setSendSuccess(false);
        onClose();
      }, 900);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div ref={layerRef} className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
        />

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          role="dialog" aria-modal="true" aria-label="صندوق الهدايا" className="ui-sheet relative w-full max-w-md bg-[#101222]/96 border-t border-purple-500/30 rounded-t-3xl p-4 shadow-2xl z-10 max-h-[70vh] flex flex-col backdrop-blur-xl"
        >
          {/* Header & Grab handle */}
          <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-3" />

          <div className="flex items-center justify-between pb-2 border-b border-purple-500/10">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-400" size={18} />
              <h3 className="font-bold text-slate-100 text-base">صندوق الهدايا</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="إغلاق صندوق الهدايا" className="ui-icon-button rounded-full text-slate-400 hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          {banner && (
            <div className="my-2 rounded-2xl border border-purple-400/20 bg-purple-950/30 overflow-hidden" aria-label="إعلان صندوق الهدايا">
              {banner.image_url && <img src={banner.image_url} alt="" className="w-full h-20 object-cover" />}
              <div className="px-3 py-2">
                <p className="text-sm font-bold text-slate-100">{banner.title}</p>
                {banner.subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{banner.subtitle}</p>}
              </div>
            </div>
          )}

          {/* Recipient Picker */}
          <div className="py-2.5">
            <span className="text-xs text-slate-400 mb-1.5 block">اختر المستلم:</span>
            {potentialRecipients.length > 0 ? (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {potentialRecipients.map((rec) => {
                  const isSelected = selectedRecipient?.id === rec.id;
                  return (
                    <button
                      key={rec.id}
                      onClick={() => {
                        setSelectedRecipient(rec);
                        setErrorMsg(null);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-900/60 border-purple-400 text-white shadow-sm shadow-purple-500/30 ring-1 ring-purple-400'
                          : 'bg-[#181a2e] border-purple-500/20 text-slate-300 hover:border-purple-500/40'
                      }`}
                    >
                      <UserAvatar user={rec} size="xs" />
                      <span className="text-xs font-medium max-w-[80px] truncate">{rec.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-purple-300/80 bg-purple-950/40 p-2 rounded-xl border border-purple-500/20">
                لا يوجد مستلم متاح في الغرفة حالياً.
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 border-y border-purple-500/10">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {selectedCategory==='luck'&&<div className="mt-2 rounded-2xl border border-amber-300/15 bg-gradient-to-r from-amber-950/25 to-fuchsia-950/20 px-3 py-2 flex items-center justify-between gap-3">
            <div><span className="block text-[9px] text-slate-500">Lucky Points</span><strong className="text-sm text-cyan-300">{luckyPoints.toLocaleString('ar-IQ')}</strong></div>
            <button type="button" onClick={()=>setLuckyHistoryOpen(true)} className="rounded-xl border border-white/10 bg-white/[.05] px-3 py-2 text-[10px] font-black text-amber-100">سجل الحظ</button>
          </div>}

          {/* Gifts Grid */}
          <div className="grid grid-cols-4 gap-2.5 py-3 overflow-y-auto max-h-64 no-scrollbar">
            {filteredGifts.map((gift) => {
              const isSelected = selectedGift?.id === gift.id;
              return (
                <div
                  key={gift.id}
                  onClick={() => {
                    setSelectedGift(gift);
                    setSendSource('coins');
                    setQuantity(1);
                    setQuantityOpen(false);
                    setErrorMsg(null);
                  }}
                  className={`relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? gift.diamondSourceType==='LUCKY_GIFT'
                        ? 'bg-gradient-to-b from-amber-900/45 via-fuchsia-950/55 to-indigo-950/70 border-amber-300 shadow-md shadow-amber-500/25 ring-1 ring-amber-300 scale-[1.03]'
                        : 'bg-gradient-to-b from-purple-900/50 to-indigo-950/70 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400 scale-[1.03]'
                      : gift.diamondSourceType==='LUCKY_GIFT'
                        ? 'bg-gradient-to-b from-amber-950/30 to-[#15172b] border-amber-400/25 hover:border-amber-300/50'
                        : 'bg-[#15172b] border-purple-500/15 hover:border-purple-500/30'
                  }`}
                >
                  {(inventoryCounts[gift.id] || 0) > 0 && (
                    <span className="absolute -top-1.5 left-1 px-1 rounded-md text-[9px] font-bold bg-cyan-500 text-slate-950 shadow-xs">
                      محفوظ {inventoryCounts[gift.id]}
                    </span>
                  )}
                  {gift.diamondSourceType==='LUCKY_GIFT'&&<span className="absolute -top-1.5 right-1 px-1.5 rounded-md text-[9px] font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-fuchsia-300 text-slate-950 shadow-md">Lucky</span>}
                  {/* Badge */}
                  {gift.badge && gift.diamondSourceType!=='LUCKY_GIFT' && (
                    <span className="absolute -top-1.5 right-1 px-1 rounded-md text-[9px] font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-xs">
                      {gift.badge}
                    </span>
                  )}

                  {/* Visual preview */}
                  <div className="relative">
                    {gift.previewUrl
                      ? <img src={gift.previewUrl} alt="" loading="lazy" className="w-14 h-14 my-1 rounded-2xl object-cover border border-white/10" />
                      : <span className="w-14 h-14 my-1 flex items-center justify-center text-3xl drop-shadow-sm">{gift.icon}</span>}
                    <button type="button" aria-label={`معاينة ${gift.name}`} onClick={event=>{event.stopPropagation();setPreviewGift(gift);}} className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full border border-white/10 bg-black/65 text-white flex items-center justify-center"><Play size={12} fill="currentColor"/></button>
                  </div>

                  {/* Name */}
                  <span className="text-[11px] font-medium text-slate-200 truncate w-full text-center">
                    {gift.name}
                  </span>

                  {/* Price */}
                  <div className="flex items-center gap-0.5 mt-1 text-[11px] text-amber-400 font-bold font-mono">
                    <span>🪙</span>
                    <span>{gift.price.toLocaleString('ar-SA')}</span>
                  </div>
                </div>
              );
            })}
            {!filteredGifts.length && !loading && <div className="col-span-4 py-8 text-center text-xs text-slate-400">لا توجد عناصر حالياً في هذا القسم.</div>}
          </div>

          {selectedGift && (inventoryCounts[selectedGift.id] || 0) > 0 && (
            <div className="grid grid-cols-2 gap-2 pb-3" role="group" aria-label="مصدر الهدية">
              <button
                type="button"
                aria-pressed={sendSource === 'coins'}
                onClick={() => setSendSource('coins')}
                className={`rounded-xl py-2 text-xs font-bold border ${sendSource==='coins'?'bg-amber-400 text-slate-950 border-amber-300':'bg-[#181a2e] text-slate-300 border-purple-500/20'}`}
              >
                من الرصيد
              </button>
              <button
                type="button"
                aria-pressed={sendSource === 'saved'}
                onClick={() => {setSendSource('saved');setQuantity(1);}}
                className={`rounded-xl py-2 text-xs font-bold border ${sendSource==='saved'?'bg-cyan-400 text-slate-950 border-cyan-300':'bg-[#181a2e] text-slate-300 border-purple-500/20'}`}
              >
                من الصندوق ({inventoryCounts[selectedGift.id]})
              </button>
            </div>
          )}


          {/* Error notice */}
          {errorMsg && (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-xl border border-rose-500/30 text-center mb-2">
              {errorMsg}
            </div>
          )}

          {/* Footer: Wallet + exact total + quantity + send */}
          <div className="pt-2 border-t border-purple-500/20">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[10px] text-slate-400">رصيدك الحالي</span>
                <span className="text-xs font-bold text-amber-400 font-mono">🪙 {user.gold.toLocaleString('ar-SA')} Coins</span>
              </div>
              <button type="button" onClick={onRechargeClick} className="min-h-9 px-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-[11px] font-black flex items-center gap-1" title="شحن رصيد"><Plus size={13}/>شحن</button>
            </div>

            {selectedGift&&<div className={`mb-2 rounded-xl border px-3 py-2 flex items-center justify-between text-xs ${insufficientCoins?'border-rose-400/30 bg-rose-950/30 text-rose-200':'border-white/8 bg-white/[.035] text-slate-300'}`}>
              <span>الإجمالي</span><strong dir="ltr" className="font-mono">{sendSource==='saved'?'من المخزون':`${totalPrice.toLocaleString('ar-IQ')} 🪙`} · ×{effectiveQuantity}</strong>
            </div>}

            <div className="flex items-stretch gap-2">
              <div className="relative shrink-0">
                <button type="button" aria-label={`اختيار كمية الهدية، الحالية ${effectiveQuantity}`} aria-haspopup="menu" aria-expanded={quantityOpen} disabled={sendSource==='saved'} onClick={()=>setQuantityOpen(v=>!v)} className="h-full min-w-[72px] rounded-xl border border-white/10 bg-white/[.06] px-2 text-xs font-black disabled:opacity-45 flex items-center justify-center gap-1">
                  <span dir="ltr">×{effectiveQuantity}</span><ChevronDown size={14}/>
                </button>
                {quantityOpen&&sendSource==='coins'&&<div role="menu" aria-label="اختيار كمية الهدية" className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-[86px] rounded-2xl border border-white/10 bg-[#17192d]/98 p-1.5 shadow-2xl backdrop-blur-xl">
                  {quantityOptions.map(value=><button key={value} type="button" role="menuitem" aria-label={`اختيار كمية ${value}`} onClick={()=>{setQuantity(value);setQuantityOpen(false);setErrorMsg(null);setSendSuccess(false);}} className={`w-full min-h-10 rounded-xl text-xs font-black ${quantity===value?'bg-amber-400 text-slate-950':'text-slate-200 hover:bg-white/8'}`}>×{value}</button>)}
                </div>}
              </div>
              <button type="button" aria-label="إرسال الهدية" onClick={handleSend} disabled={sendDisabled} className={`flex-1 min-h-[48px] px-4 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed ${sendSuccess?'bg-emerald-600 text-white':'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-105 active:scale-[.99]'}`}>
                {sendSuccess?<><Check size={16}/><span>تم الإرسال</span></>:<span>إرسال</span>}
              </button>
            </div>
            {insufficientCoins&&<button type="button" onClick={onRechargeClick} className="w-full mt-2 text-[11px] font-bold text-rose-300">الرصيد غير كافٍ — شحن Coins</button>}
          </div>

          {luckyHistoryOpen&&<div className="absolute inset-0 z-40 bg-[#0c0e1c]/96 backdrop-blur-xl rounded-t-3xl p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <button type="button" aria-label="إغلاق سجل الحظ" onClick={()=>setLuckyHistoryOpen(false)} className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center"><X size={18}/></button>
              <div className="text-right"><h4 className="font-black">سجل هدايا الحظ</h4><p className="text-[10px] text-cyan-300">{luckyPoints.toLocaleString('ar-IQ')} Lucky Points</p></div>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto space-y-2 no-scrollbar">
              {!luckyHistory.length&&<div className="py-10 text-center text-xs text-slate-500">لا توجد نتائج حظ مسجلة لهذا الحساب.</div>}
              {luckyHistory.map(row=><article key={row.id} className="rounded-2xl border border-white/8 bg-white/[.04] p-3">
                <div className="flex items-center justify-between gap-2"><strong className="text-xs">{row.gift_name}{row.quantity>1?` ×${row.quantity}`:''}</strong><span dir="ltr" className="text-sm font-black text-amber-300">×{row.multiplier}</span></div>
                <div className="mt-1 flex items-center justify-between text-[10px]"><span className="text-slate-400">{row.result_label}</span><span className="text-cyan-300">+{row.lucky_points} Points</span></div>
                {row.created_at&&<time className="mt-1 block text-[9px] text-slate-600">{new Date(row.created_at).toLocaleString('ar-IQ')}</time>}
              </article>)}
            </div>
            <p className="pt-2 text-center text-[9px] text-slate-600">السجل غير مالي ولا يمثل أرباحاً نقدية.</p>
          </div>}

          {previewGift&&<div className="absolute inset-0 z-40 bg-[#0c0e1c]/92 backdrop-blur-xl rounded-t-3xl p-5 flex flex-col items-center justify-center text-center">
            <button type="button" aria-label="إغلاق المعاينة" onClick={()=>setPreviewGift(null)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/8 flex items-center justify-center"><X size={18}/></button>
            {previewGift.previewUrl?<img src={previewGift.previewUrl} alt={previewGift.name} className="w-44 h-44 rounded-[28px] object-cover border border-white/10 shadow-2xl"/>:<div className="w-44 h-44 rounded-[28px] bg-white/[.05] flex items-center justify-center text-7xl border border-white/10 animate-pulse">{previewGift.icon}</div>}
            <h4 className="mt-5 text-lg font-black">{previewGift.name}</h4>
            {previewGift.description&&<p className="mt-2 max-w-xs text-xs leading-6 text-slate-400">{previewGift.description}</p>}
            <p className="mt-3 text-sm font-black text-amber-300">🪙 {previewGift.price.toLocaleString('ar-IQ')}</p>
            {previewGift.diamondSourceType==='LUCKY_GIFT'&&<span className="mt-2 rounded-full border border-amber-300/15 bg-amber-500/10 px-3 py-1 text-[10px] font-black text-amber-200">Lucky Gift · نتيجة Server-side</span>}
            <p className="mt-2 text-[10px] text-slate-500">المعاينة لا ترسل الهدية ولا تخصم أي رصيد.</p>
          </div>}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
