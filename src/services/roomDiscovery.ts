import type {Room} from '../types';

/** Country chips are backed by actual room-owner profile country codes.
 * Unknown / hidden country data is NEVER assigned a guessed flag. */
export const HOME_COUNTRIES = [
  {id:'trending',label:'شائع',flag:'🔥'},
  {id:'IQ',label:'العراق',flag:'🇮🇶'},
  {id:'SA',label:'المملكة العربية السعودية',flag:'🇸🇦'},
  {id:'SY',label:'سوريا',flag:'🇸🇾'},
  {id:'AE',label:'الإمارات',flag:'🇦🇪'},
  {id:'KW',label:'الكويت',flag:'🇰🇼'},
  {id:'EG',label:'مصر',flag:'🇪🇬'},
  {id:'MA',label:'المغرب',flag:'🇲🇦'},
] as const;
export type HomeCountryFilter = (typeof HOME_COUNTRIES)[number]['id'];

export const flagFromCountryCode=(input:unknown):string|undefined=>{
  if(typeof input!=='string')return undefined;
  const code=input.trim().toUpperCase();
  if(!/^[A-Z]{2}$/.test(code))return undefined;
  return String.fromCodePoint(...Array.from(code).map(letter=>127397+letter.charCodeAt(0)));
};

export const discoverHomeRooms=(rooms:Room[],filter:HomeCountryFilter):Room[]=>{
  const country=HOME_COUNTRIES.find(item=>item.id===filter);
  if(!country)return [];
  const matching=filter==='trending'?rooms:rooms.filter(room=>room.countryFlag===country.flag);
  // Popularity is grounded in member counts; stable ties use server creation date.
  return [...matching].sort((a,b)=>b.usersCount-a.usersCount
    ||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
};
