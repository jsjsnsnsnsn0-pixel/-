import React from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {Sparkles} from 'lucide-react';
import {ActiveGiftAnimation} from '../../types';

interface GiftOverlayAnimationProps {
  overlayData: ActiveGiftAnimation | null;
}

const DISPLAY_MS=2800;

const GiftVisual=({item}:{item:ActiveGiftAnimation})=>{
  const {gift,quantity=1}=item;
  const hasPreview=typeof gift.previewUrl==='string'&&gift.previewUrl.trim().length>0;
  return <motion.div
    key={`gift-${item.id}`}
    initial={{opacity:0,scale:.25,y:90,rotate:-8}}
    animate={{opacity:1,scale:[.55,1.22,1],y:[55,-16,0],rotate:[-8,4,0]}}
    exit={{opacity:0,scale:.7,y:-90}}
    transition={{duration:.72,ease:'easeOut'}}
    className="fixed inset-x-0 top-[34%] z-[145] pointer-events-none flex justify-center px-4"
    aria-hidden="true"
  >
    <div className="relative flex flex-col items-center">
      <motion.div
        initial={{opacity:0,scale:.4}}
        animate={{opacity:[0,.8,.42],scale:[.5,1.25,1.6]}}
        transition={{duration:1.1,ease:'easeOut'}}
        className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,.38)_0%,rgba(168,85,247,.22)_42%,transparent_72%)] blur-2xl"
      />
      {[0,1,2,3,4,5].map(index=><motion.span
        key={index}
        initial={{opacity:0,scale:.3,x:0,y:0}}
        animate={{opacity:[0,1,0],scale:[.3,1,.6],x:(index%2?1:-1)*(28+index*9),y:-18-index*12}}
        transition={{delay:.16+index*.045,duration:.95,ease:'easeOut'}}
        className="absolute top-1/2 left-1/2 text-amber-200 drop-shadow-[0_0_10px_rgba(253,224,71,.7)]"
      ><Sparkles size={index%2?18:14}/></motion.span>)}
      <motion.div
        animate={{y:[0,-8,0]}}
        transition={{duration:1.35,repeat:1,ease:'easeInOut'}}
        className="relative min-w-[108px] min-h-[108px] flex items-center justify-center drop-shadow-[0_18px_30px_rgba(0,0,0,.36)]"
      >
        {hasPreview?<img src={gift.previewUrl!} alt="" className="max-w-[150px] max-h-[150px] object-contain select-none"/>:<span className="text-[92px] leading-none select-none">{gift.icon}</span>}
      </motion.div>
      {quantity>1&&<motion.span initial={{opacity:0,scale:.65}} animate={{opacity:1,scale:1}} className="relative mt-1 rounded-full border border-white/12 bg-black/45 backdrop-blur-md px-3 py-1 text-sm font-black text-white shadow-lg">×{quantity}</motion.span>}
    </div>
  </motion.div>;
};

const GiftAnnouncement=({item}:{item:ActiveGiftAnimation})=>{
  const hasPreview=typeof item.gift.previewUrl==='string'&&item.gift.previewUrl.trim().length>0;
  return <motion.div
    key={`announcement-${item.id}`}
    initial={{x:'112%',opacity:0}}
    animate={{x:['112%','6%','-112%'],opacity:[0,1,1,0]}}
    exit={{opacity:0}}
    transition={{duration:2.55,times:[0,.15,.88,1],ease:'linear'}}
    dir="rtl"
    role="status"
    aria-live="polite"
    className="fixed top-[max(72px,calc(env(safe-area-inset-top)+58px))] inset-x-0 z-[146] pointer-events-none overflow-hidden"
  >
    <div className="w-[92%] max-w-md mx-auto">
      <div className="relative overflow-hidden rounded-full border border-fuchsia-300/20 bg-[linear-gradient(100deg,rgba(18,12,39,.9),rgba(76,29,149,.88),rgba(24,15,48,.92))] backdrop-blur-xl shadow-[0_10px_34px_rgba(0,0,0,.28)] px-2.5 py-2 flex items-center gap-2 text-white">
        <motion.span aria-hidden="true" initial={{x:'140%'}} animate={{x:'-180%'}} transition={{duration:1.45,ease:'linear'}} className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/16 to-transparent skew-x-[-16deg]"/>
        <img src={item.sender.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/20"/>
        <span className="min-w-0 flex-1 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
          <b className="text-white">{item.sender.name}</b>
          <span className="text-slate-300"> أرسل </span>
          <b className="text-pink-300">{item.gift.name}</b>
          <span className="text-slate-300"> إلى </span>
          <b className="text-cyan-200">{item.recipient.name}</b>
          {item.quantity&&item.quantity>1?<span className="mr-1 text-amber-200 font-black">×{item.quantity}</span>:null}
        </span>
        <span className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          {hasPreview?<img src={item.gift.previewUrl!} alt="" className="w-full h-full object-contain"/>:<span className="text-xl">{item.gift.icon}</span>}
        </span>
      </div>
    </div>
  </motion.div>;
};

export const GiftOverlayAnimation:React.FC<GiftOverlayAnimationProps>=({overlayData})=>{
  const [queue,setQueue]=React.useState<ActiveGiftAnimation[]>([]);
  const [current,setCurrent]=React.useState<ActiveGiftAnimation|null>(null);
  const seen=React.useRef(new Set<string>());

  React.useEffect(()=>{
    if(!overlayData||seen.current.has(overlayData.id))return;
    seen.current.add(overlayData.id);
    setQueue(previous=>[...previous,overlayData].slice(-12));
  },[overlayData?.id]);

  React.useEffect(()=>{
    if(current||queue.length===0)return;
    const [next,...rest]=queue;
    setQueue(rest);
    setCurrent(next);
  },[current,queue]);

  React.useEffect(()=>{
    if(!current)return;
    const timer=window.setTimeout(()=>setCurrent(null),DISPLAY_MS);
    return()=>window.clearTimeout(timer);
  },[current?.id]);

  if(!current)return null;
  return <AnimatePresence mode="wait">
    <React.Fragment key={current.id}>
      <GiftAnnouncement item={current}/>
      <GiftVisual item={current}/>
    </React.Fragment>
  </AnimatePresence>;
};
