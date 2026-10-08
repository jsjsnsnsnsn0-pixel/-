import React from 'react';
import {useDismissableLayer} from '../../../hooks/useDismissableLayer';
export function SeatActions({index,locked,canLock,busy,onTake,onLock,onClose}:{index:number|null;locked:boolean;canLock:boolean;busy:boolean;onTake:()=>void;onLock:()=>void;onClose:()=>void}) {
  const layerRef=useDismissableLayer(index!==null,onClose);
  if(index===null)return null;
  return <div ref={layerRef} className="fixed inset-0 z-[100] bg-black/30 flex items-end justify-center" onClick={onClose}>
    <section dir="rtl" role="dialog" aria-modal="true" aria-label={`خيارات المقعد ${index+1}`} className="ui-sheet max-w-md w-full room-profile-sheet text-white rounded-t-3xl p-5 pb-safe text-center space-y-3" onClick={event=>event.stopPropagation()}>
      <h2 className="text-lg py-2">المايك {index+1}</h2>
      <button type="button" disabled={busy||locked} onClick={onTake} className="w-full py-4 rounded-2xl bg-white/5 disabled:opacity-40">{locked?'المايك مقفل':'خذ المايكروفون'}</button>
      {canLock&&<button type="button" disabled={busy} onClick={onLock} className="w-full py-4 rounded-2xl bg-white/5 disabled:opacity-40">{locked?'فتح المايكروفون':'قفل المايكروفون'}</button>}
      <button type="button" onClick={onClose} className="w-full py-4 rounded-2xl bg-[#282039]">إلغاء</button>
    </section>
  </div>;
}
