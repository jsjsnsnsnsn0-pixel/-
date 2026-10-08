import {useEffect,useRef,useState} from 'react';
import {Sparkles,X,Gamepad2,ShieldCheck} from 'lucide-react';
import {ARCADE_SYMBOLS,ARCADE_WISHES,arcadeMatch,pickArcadeIndex} from '../../../services/arcadePractice';

type Mode='wheel'|'eggs'|'garden'|'envelopes'|'boom'|'symbols';
const games:ReadonlyArray<{id:Mode;name:string;icon:string;note:string;accent:string}>=[
  {id:'wheel',name:'عجلة الألوان',icon:'🎡',note:'دوّر واكتشف رمزك',accent:'from-violet-600/50 to-fuchsia-900/30'},
  {id:'eggs',name:'البيض السحري',icon:'🥚',note:'وين النجمة المخفية؟',accent:'from-amber-500/30 to-orange-950/30'},
  {id:'garden',name:'حديقة توتي',icon:'🌱',note:'زرع وردة خطوة بخطوة',accent:'from-emerald-500/35 to-green-950/30'},
  {id:'envelopes',name:'مغلفات المفاجآت',icon:'💌',note:'رسالة لطيفة كل مرة',accent:'from-rose-500/35 to-pink-950/25'},
  {id:'boom',name:'تحدي المربعات',icon:'💣',note:'ثلاث نجمات بدون قنبلة',accent:'from-sky-500/35 to-blue-950/30'},
  {id:'symbols',name:'تطابق الرموز',icon:'🎰',note:'تحدي ثلاثة رموز',accent:'from-indigo-500/40 to-purple-950/30'},
];
const flowers=['🌰','🌱','🌿','🪴','🌷','🌹','💐'];

export function TotiArcade(){
  const [mode,setMode]=useState<Mode|null>(null);
  const [wheelRotation,setWheelRotation]=useState(0);
  const [wheelChoice,setWheelChoice]=useState<number|null>(null);
  const [spinning,setSpinning]=useState(false);
  const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [eggTarget,setEggTarget]=useState(()=>pickArcadeIndex(3));
  const [eggOpened,setEggOpened]=useState<number|null>(null);
  const [gardenStage,setGardenStage]=useState(0);
  const [openedEnvelope,setOpenedEnvelope]=useState<number|null>(null);
  const [wish,setWish]=useState('');
  const [bombIndex,setBombIndex]=useState(()=>pickArcadeIndex(9));
  const [revealed,setRevealed]=useState<number[]>([]);
  const [hitBomb,setHitBomb]=useState(false);
  const [reels,setReels]=useState<readonly string[]>([]);
  useEffect(()=>()=>{if(timeout.current)clearTimeout(timeout.current)},[]);
  const stopPending=()=>{if(timeout.current)clearTimeout(timeout.current);timeout.current=null;setSpinning(false)};
  const choose=(next:Mode)=>{
    stopPending();setMode(next);setWheelChoice(null);setEggOpened(null);
    setEggTarget(pickArcadeIndex(3));setGardenStage(0);
    setOpenedEnvelope(null);setWish('');setBombIndex(pickArcadeIndex(9));
    setRevealed([]);setHitBomb(false);setReels([]);
  };
  const wheel=()=>{
    if(spinning)return;
    const result=pickArcadeIndex(ARCADE_SYMBOLS.length);
    setSpinning(true);setWheelChoice(null);
    setWheelRotation(previous=>previous+1440+(result+1)*60);
    timeout.current=setTimeout(()=>{setWheelChoice(result);setSpinning(false);timeout.current=null},950);
  };
  const chooseSquare=(index:number)=>{
    if(hitBomb||revealed.includes(index)||revealed.length>=3)return;
    if(index===bombIndex){setHitBomb(true);return}
    setRevealed(previous=>[...previous,index]);
  };
  const spinSymbols=()=>setReels(Array.from({length:3},()=>ARCADE_SYMBOLS[pickArcadeIndex(ARCADE_SYMBOLS.length)]));
  const selected=games.find(g=>g.id===mode);
  return <section dir="rtl" aria-label="ألعاب توتي المصغّرة" className="space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-lg font-black text-white"><Gamepad2 size={20} className="text-emerald-300"/> ألعاب مصغّرة</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">ألعاب ترفيهية أصلية مستوحاة من فكرة أركيد الغرف الاجتماعية.</p></div>
      <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">مجاناً</span>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {games.map(game=><button key={game.id} type="button" aria-pressed={mode===game.id} aria-label={`اختيار لعبة ${game.name}`} onClick={()=>choose(game.id)}
        className={`ui-control min-h-32 rounded-[22px] border bg-gradient-to-br ${game.accent} p-3 text-right transition-transform active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${mode===game.id?'border-emerald-300 ring-2 ring-emerald-400/30':'border-white/15'}`}>
        <span className="block text-4xl" aria-hidden="true">{game.icon}</span><strong className="mt-2 block text-sm font-black text-white">{game.name}</strong>
        <span className="mt-0.5 block text-[11px] leading-4 text-slate-200/75">{game.note}</span>
      </button>)}
    </div>
    {mode&&<div role="region" aria-label={`تجربة ${selected?.name||'الألعاب'}`} className="rounded-[24px] border border-white/15 bg-[#1c1730] p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div><h3 className="font-black text-lg text-white">{selected?.icon} {selected?.name}</h3><p className="text-[11px] text-slate-400">التجربة على هذا الجهاز فقط</p></div>
        <button type="button" onClick={()=>{stopPending();setMode(null)}} aria-label="إغلاق التجربة" className="ui-icon-button border border-white/15 bg-white/8 text-white"><X size={18}/></button>
      </div>
      {mode==='wheel'&&<div className="space-y-4 text-center">
        <div className="mx-auto relative grid size-44 place-items-center">
          <span className="absolute z-10 top-0 text-2xl text-amber-200" aria-hidden="true">▼</span>
          <div className="grid size-40 place-items-center rounded-full border-[7px] border-amber-300 shadow-[0_0_35px_rgba(251,191,36,.12)]"
            style={{background:'conic-gradient(#a855f7 0 60deg,#be185d 60deg 120deg,#2563eb 120deg 180deg,#d97706 180deg 240deg,#059669 240deg 300deg,#7c3aed 300deg 360deg)',transform:`rotate(${wheelRotation}deg)`,transition:'transform 950ms cubic-bezier(.18,.7,.12,1)'}}>
            <span className="text-5xl drop-shadow-xl" aria-hidden="true">✦</span>
          </div>
        </div>
        <button type="button" disabled={spinning} onClick={wheel} className="ui-control w-full rounded-2xl bg-violet-500 px-4 py-3 font-black text-white disabled:opacity-60">{spinning?'العجلة تدور…':'دوّر العجلة'}</button>
        <p role="status" aria-live="polite" className="min-h-6 text-sm font-bold text-amber-200">{wheelChoice!==null?`طلع رمزك ${ARCADE_SYMBOLS[wheelChoice]} — للمتعة فقط`:spinning?'لحظة ونشوف الرمز…':'جرّب حظك مع الألوان!'}</p>
      </div>}
      {mode==='eggs'&&<div className="space-y-3">
        <p className="text-sm text-slate-200">نجمة واحدة مخفية بين 3 بيضات. اختار بيضة وشوف!</p>
        <div className="grid grid-cols-3 gap-2">{[0,1,2].map(i=><button key={i} type="button" disabled={eggOpened!==null} onClick={()=>setEggOpened(i)}
          aria-label={`فتح البيضة ${i+1}`} className="ui-control flex flex-col items-center justify-center gap-1 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 disabled:opacity-80">
          <span className="text-4xl">{eggOpened===null?'🥚':eggTarget===i?'⭐':'🐣'}</span><span className="text-xs text-white">بيضة {i+1}</span></button>)}</div>
        {eggOpened!==null&&<p role="status" className="text-center font-bold text-amber-200">{eggOpened===eggTarget?'لقيت النجمة! ⭐':'النجمة ببيضة ثانية، جرّب مرة ثانية 🐣'}</p>}
        <button type="button" disabled={eggOpened===null} onClick={()=>{setEggTarget(pickArcadeIndex(3));setEggOpened(null)}} className="ui-control w-full rounded-xl border border-white/15 bg-white/10 text-white disabled:opacity-50">جولة جديدة</button>
      </div>}
      {mode==='garden'&&<div className="text-center space-y-3">
        <div className="grid min-h-36 place-items-center rounded-2xl border border-emerald-400/15 bg-gradient-to-b from-emerald-400/10 to-[#143a2a]"><span className="text-7xl" aria-label={`مرحلة النمو ${gardenStage} من 6`}>{flowers[gardenStage]}</span></div>
        <div role="progressbar" aria-label="نمو حديقة توتي" aria-valuemin={0} aria-valuemax={6} aria-valuenow={gardenStage} className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400 transition-all duration-300" style={{width:`${gardenStage/6*100}%`}}/></div>
        <p role="status" className="text-xs text-emerald-200">{gardenStage===6?'وردتك اكتملت 🌹':'كل ضغطة تروي الزرعة وتكبرها'}</p>
        <button type="button" onClick={()=>setGardenStage(previous=>previous>=6?0:previous+1)} className="ui-control w-full rounded-2xl bg-emerald-600 py-3 font-black text-white">{gardenStage===6?'ابدأ زرعة ثانية':'اسقِ الزرعة 💧'}</button>
      </div>}
      {mode==='envelopes'&&<div className="space-y-3">
        <p className="text-sm text-slate-200">افتح ظرف واطلعلك كلام جميل. بدون جوائز أو رصيد.</p>
        <div className="grid grid-cols-3 gap-2">{[0,1,2].map(i=><button key={i} type="button" disabled={openedEnvelope!==null}
          onClick={()=>{setOpenedEnvelope(i);setWish(ARCADE_WISHES[pickArcadeIndex(ARCADE_WISHES.length)])}}
          aria-label={`فتح الظرف ${i+1}`} className="ui-control rounded-2xl bg-rose-500/15 border border-rose-400/20 p-4 text-center disabled:opacity-70"><span className="text-4xl">{openedEnvelope===i?'💝':'💌'}</span></button>)}</div>
        {wish&&<p role="status" className="rounded-2xl bg-rose-400/10 p-4 text-center text-lg font-bold text-rose-100">{wish}</p>}
        <button type="button" disabled={openedEnvelope===null} onClick={()=>{setOpenedEnvelope(null);setWish('')}} className="ui-control w-full rounded-xl border border-white/15 bg-white/10 text-white disabled:opacity-50">رسالة ثانية</button>
      </div>}
      {mode==='boom'&&<div className="space-y-3">
        <p className="text-sm text-slate-200">اكتشف 3 مربعات آمنة قبل القنبلة — بدون رصيد أو رهانات.</p>
        <div className="grid grid-cols-3 gap-2">{Array.from({length:9},(_,i)=>{
          const safe=revealed.includes(i),bomb=hitBomb&&i===bombIndex;
          return <button key={i} type="button" disabled={hitBomb||revealed.length>=3||safe} onClick={()=>chooseSquare(i)}
            aria-label={`كشف المربع ${i+1}`} className="ui-control aspect-square min-h-16 rounded-2xl border border-sky-300/20 bg-sky-500/10 text-3xl text-white disabled:opacity-80">{bomb?'💣':safe?'⭐':'❔'}</button>;
        })}</div>
        <p role="status" aria-live="polite" className="text-center text-sm font-bold text-sky-200">{hitBomb?'بوم! انتهت الجولة، حاول مرة ثانية 💥':revealed.length===3?'رائع! اكتشفت 3 نجمات ⭐':`نجمات آمنة: ${revealed.length} / 3`}</p>
        <button type="button" onClick={()=>{setBombIndex(pickArcadeIndex(9));setRevealed([]);setHitBomb(false)}} className="ui-control w-full rounded-xl border border-white/15 bg-white/10 text-white">إعادة التحدي</button>
      </div>}
      {mode==='symbols'&&<div className="space-y-3 text-center">
        <div className="grid grid-cols-3 gap-2">{[0,1,2].map(i=><div key={i} className="grid min-h-24 place-items-center rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-300/15 to-black/20 text-5xl"><span role="img" aria-label={`الرمز ${i+1}`}>{reels[i]||'❔'}</span></div>)}</div>
        <button type="button" onClick={spinSymbols} className="ui-control w-full rounded-2xl bg-amber-600 py-3 font-black text-white">بدّل الرموز</button>
        <p role="status" aria-live="polite" className="min-h-6 text-sm font-bold text-amber-200">{reels.length===3?(arcadeMatch(reels)?'تطابق الثلاثة! 🎉':'حاول تطابق 3 رموز 🎵'):'لا توجد جوائز مالية أو ماس أو كوينز'}</p>
      </div>}
      <p className="mt-4 flex items-center gap-1.5 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-400"><ShieldCheck size={15} className="shrink-0 text-emerald-300"/>هذه ألعاب مجانية على الجهاز. نتائجها لا تُحفظ بالسيرفر ولا تمنح كوينز أو ماس، وتختلف عن ألعاب TotiFun الرسمية أعلاه.</p>
    </div>}
    <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><Sparkles size={13}/> لعب بدون تحميل مؤثرات ضخمة على الهاتف.</p>
  </section>;
}
