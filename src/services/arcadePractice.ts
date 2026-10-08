/** Self-contained cosmetic mini-games. No Supabase, payment, wallet, or reward writes. */
export function pickArcadeIndex(length:number,draw?:()=>number):number{
  if(!Number.isSafeInteger(length)||length<1||length>100)throw new RangeError('invalid game choice count');
  const random=draw?draw():globalThis.crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
  if(!Number.isFinite(random)||random<0||random>=1)throw new RangeError('invalid random input');
  return Math.floor(random*length);
}
export const ARCADE_SYMBOLS=['🌷','⭐','🎵','🦋','☀️','🎈'] as const;
export const ARCADE_WISHES=['يوم جميل بانتظارك ✨','نورت توتي شات 💚','ابتسامتك مكسب اليوم 🌸','أوقات حلوة ويا الأصدقاء 🎶','بداية موفقة! ⭐'] as const;
export const arcadeMatch=(symbols:readonly string[]):boolean=>symbols.length===3&&symbols.every(s=>s===symbols[0]);
