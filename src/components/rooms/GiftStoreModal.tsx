import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabase';
import { Gift, User, Room } from '../../types';
import { sampleGifts } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { X, Sparkles, Plus, Check } from 'lucide-react';

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

  const { user, sendGiftInRoom } = useApp();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const scheduleTimeout = useTimeouts(isOpen);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const quantityOptions = [1, 7, 17, 77, 777] as const;
  const [quantity, setQuantity] = useState<(typeof quantityOptions)[number]>(1);
  
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
      sendingRef.current=false;
    }
  }, [isOpen]);

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'roses', label: 'ورود' },
    { id: 'hearts', label: 'قلوب' },
    { id: 'crowns', label: 'تيجان' },
    { id: 'cars', label: 'سيارات' },
    { id: 'animals', label: 'حيوانات' },
    { id: 'games', label: 'ألعاب' },
    { id: 'special', label: 'مميز' },
  ];

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false; setLoading(true); setErrorMsg(null); setSendSuccess(false);
    supabase.from('gift_catalog').select('id,name,price,diamond_source_type').eq('is_active',true).then(({data,error}) => {
      if (cancelled) return;
      if (error) {setGifts([]); setSelectedGift(null); setErrorMsg('تعذر تحميل الهدايا.');}
      else {
        const next: Gift[] = (data || []).map(row => ({...(sampleGifts.find(g => g.id === row.id) || {id:row.id,name:row.name,category:'all' as const,price:Number(row.price),icon:'🎁',animationType:'sparkle' as const}), id: row.id, name: row.name, price: Number(row.price), diamondSourceType: row.diamond_source_type}));
        setGifts(next); setSelectedGift(next[0] || null);
      }
      setLoading(false);
    });
    return () => {cancelled = true;};
  }, [isOpen]);
  const recipientIds = potentialRecipients.map(u => u.id).join(',');
  useEffect(() => {
    if (!potentialRecipients.some(u => u.id === selectedRecipient?.id)) setSelectedRecipient(potentialRecipients[0] || null);
  }, [recipientIds]);
  const filteredGifts =
    selectedCategory === 'all'
      ? gifts
      : gifts.filter((g) => g.category === selectedCategory);

  const handleSend = async () => {
    if (sendingRef.current || sending || loading || sendSuccess) return;
    if (!selectedGift || !selectedRecipient) {
      setErrorMsg('يرجى اختيار المستلم والهدية');
      return;
    }

    const totalPrice = selectedGift.price * quantity;
    if (user.gold < totalPrice) {
      setErrorMsg('رصيدك من Coins غير كافٍ. اضغط لشحن الرصيد');
      return;
    }

    sendingRef.current=true;
    setSending(true);
    const key = `${room?.id}:${selectedGift.id}:${selectedRecipient.id}:${quantity}`;
    if(giftRetry.current?.key!==key)giftRetry.current={key,id:crypto.randomUUID()};
    const ok = await sendGiftInRoom(selectedGift, selectedRecipient, quantity, undefined, giftRetry.current.id);
    if(ok)giftRetry.current=null;
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
          className="absolute inset-0 bg-black/70 backdrop-blur-xs"
        />

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          role="dialog" aria-modal="true" aria-label="متجر الهدايا" className="ui-sheet relative w-full max-w-md bg-[#101222] border-t border-purple-500/30 rounded-t-3xl p-4 shadow-2xl z-10 max-h-[85vh] flex flex-col"
        >
          {/* Header & Grab handle */}
          <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-3" />

          <div className="flex items-center justify-between pb-2 border-b border-purple-500/10">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-400" size={18} />
              <h3 className="font-bold text-slate-100 text-base">متجر الهدايا الفاخرة</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="إغلاق متجر الهدايا" className="ui-icon-button rounded-full text-slate-400 hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

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

          {/* Gifts Grid */}
          <div className="grid grid-cols-4 gap-2.5 py-3 overflow-y-auto max-h-64 no-scrollbar">
            {filteredGifts.map((gift) => {
              const isSelected = selectedGift?.id === gift.id;
              return (
                <div
                  key={gift.id}
                  onClick={() => {
                    setSelectedGift(gift);
                    setErrorMsg(null);
                  }}
                  className={`relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-gradient-to-b from-purple-900/50 to-indigo-950/70 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400 scale-[1.03]'
                      : 'bg-[#15172b] border-purple-500/15 hover:border-purple-500/30'
                  }`}
                >
                  {/* Badge */}
                  {gift.badge && (
                    <span className="absolute -top-1.5 right-1 px-1 rounded-md text-[9px] font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-xs">
                      {gift.badge}
                    </span>
                  )}

                  {/* Icon */}
                  <span className="text-3xl my-1 drop-shadow-sm">{gift.icon}</span>

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
          </div>

          {/* Quantity selector */}
          <div className="pb-3">
            <span className="text-xs text-slate-400 mb-2 block">الكمية:</span>
            <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="كمية الهدية">
              {quantityOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`اختيار كمية ${value}`}
                  aria-pressed={quantity === value}
                  onClick={() => {
                    setQuantity(value);
                    setErrorMsg(null);
                    setSendSuccess(false);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-black border transition-all ${
                    quantity === value
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                      : 'bg-[#181a2e] text-slate-300 border-purple-500/20 hover:border-purple-400/50'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-xl border border-rose-500/30 text-center mb-2">
              {errorMsg}
            </div>
          )}

          {/* Footer: User Balance + Send CTA */}
            {selectedGift && <p className="text-center text-xs text-cyan-300 mb-2">{selectedGift.diamondSourceType === 'LUCKY_GIFT' ? 'ماس هدية الحظ يُفك بنسبة 10%' : 'ماس الهدية الثابتة يُفك بنسبة 30%'}</p>}
          <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between gap-3">
            {/* Balance + Recharge button */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">رصيدك الحالي</span>
                <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1">
                  🪙 {user.gold.toLocaleString('ar-SA')} Coins
                </span>
              </div>
              <button
                type="button"
                onClick={onRechargeClick}
                className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center hover:bg-amber-500/30 active:scale-95 transition-transform"
                title="شحن رصيد"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || loading || sendSuccess || !selectedGift || !selectedRecipient}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                sendSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-105 active:scale-95'
              }`}
            >
              {sendSuccess ? (
                <>
                  <Check size={16} />
                  <span>تم الإرسال بنجاح!</span>
                </>
              ) : (
                <>
                  <span>إرسال الهدية</span>
                  {selectedGift && (
                    <span className="text-xs opacity-90 font-mono">
                      ({(selectedGift.price * quantity).toLocaleString('ar-SA')} 🪙 · ×{quantity})
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
