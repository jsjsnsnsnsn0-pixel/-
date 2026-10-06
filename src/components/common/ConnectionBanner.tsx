import React, {useEffect, useState} from 'react';
import {WifiOff} from 'lucide-react';
export function ConnectionBanner() {
  const [offline,setOffline]=useState(()=>typeof navigator!=='undefined'&&!navigator.onLine);
  useEffect(()=>{const update=()=>setOffline(!navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update)}},[]);
  if(!offline)return null;
  return <div role="alert" dir="rtl" className="fixed top-0 inset-x-0 z-[250] max-w-md mx-auto bg-rose-950 text-white p-3 flex items-center justify-center gap-2 text-sm shadow-lg"><WifiOff size={18}/><span>خطأ اتصال بالإنترنت. تحقق من الشبكة.</span></div>;
}
