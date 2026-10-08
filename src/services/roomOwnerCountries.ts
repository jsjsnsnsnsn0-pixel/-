import {supabase} from './supabase';

type OwnerRef={owner_id:string;owner_public_id:number|string|null};
type CountryLookup=(publicId:string)=>Promise<string|undefined>;
const ttlMs=10*60*1000;
const cachedCountry=new Map<string,{code:string|undefined;expiresAt:number}>();

/** The profiles table has owner-only RLS. Use the existing authenticated
 * search_public_profiles RPC, which intentionally exposes country_code as
 * public metadata without granting direct reads on other profile rows. */
const lookupPublicCountry:CountryLookup=async publicId=>{
  const {data,error}=await supabase.rpc('search_public_profiles',{p_query:publicId,p_limit:1});
  if(error)throw error;
  const exact=(Array.isArray(data)?data:[]).find(row=>String(row.public_id)===publicId);
  return typeof exact?.country_code==='string'?exact.country_code:undefined;
};

export async function readRoomOwnerCountries(
  owners:readonly OwnerRef[],
  viewerId:string,
  viewerCountryCode:string|undefined,
  lookup:CountryLookup=lookupPublicCountry,
):Promise<Map<string,string>>{
  const result=new Map<string,string>();
  const refs=new Map<string,string[]>();
  for(const owner of owners){
    if(!owner.owner_id)continue;
    if(owner.owner_id===viewerId){
      if(viewerCountryCode)result.set(owner.owner_id,viewerCountryCode);
      continue;
    }
    const publicId=String(owner.owner_public_id||'');
    if(!/^\d{2,18}$/.test(publicId))continue;
    const ids=refs.get(publicId)||[];ids.push(owner.owner_id);refs.set(publicId,ids);
  }
  const now=Date.now();
  const pending:[string,string[]][]=[];
  for(const entry of refs){
    const [publicId,ids]=entry;
    const cached=cachedCountry.get(publicId);
    if(cached&&cached.expiresAt>now){
      if(cached.code)for(const ownerId of ids)result.set(ownerId,cached.code);
    }else pending.push(entry);
  }
  // Limit concurrent public RPCs to protect slow Android devices and server.
  for(let i=0;i<pending.length;i+=4){
    const page=pending.slice(i,i+4);
    await Promise.all(page.map(async([publicId,ids])=>{
      try{
        const candidate=await lookup(publicId);
        const code=typeof candidate==='string'&&/^[A-Z]{2}$/i.test(candidate)?candidate.toUpperCase():undefined;
        cachedCountry.set(publicId,{code,expiresAt:Date.now()+ttlMs});
        if(code)for(const ownerId of ids)result.set(ownerId,code);
      }catch{
        // An unavailable public RPC must never hide a room or fabricate a flag.
      }
    }));
  }
  return result;
}
