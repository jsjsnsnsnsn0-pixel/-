import {rpc,CatalogItem} from './backend';
import {supabase} from './supabase';
import {Gift} from '../types';
import {loadRoomPublicProfile,ProfileRelationship,RoomPublicProfile} from './roomPublicProfile';
export interface BoxItem{key:string;kind:'gift'|'inventory_item';id:string;name:string;icon:string;image?:string;description:string;category:string;price:number;currency:'gold'|'silver';quantity:number;expiresAt?:string;durationDays?:number;active:boolean;expired?:boolean;relationshipTypeId?:string;relation?:ProfileRelationship;gift?:Gift;card?:CatalogItem;rarity?:string}
export interface GiftBoxData{categories:{id:string;label:string}[];items:BoxItem[];profile?:RoomPublicProfile;serverNow?:string;banner?:{title:string;subtitle?:string;image?:string}}
export const emptyGiftBox:GiftBoxData={categories:[],items:[]};
const image=(v:unknown)=>typeof v==='string'&&/^(https:\/\/|\/(?!\/))/.test(v)?v:undefined;
interface BoxState{server_now:string;categories:{id:string;label:string}[];gifts:Record<string,unknown>[];inventory:{gift_id:string;remaining:number;expires_at:string|null;unit_price:number}[];banner?:{title:string;subtitle?:string;image_url?:string}}
export async function loadGiftBox(userId:string,_authId?:string):Promise<GiftBoxData>{
 const [state,profile]=await Promise.all([rpc<BoxState>('gift_box_state'),loadRoomPublicProfile(userId,userId)]);
 if(!state||!Array.isArray(state.gifts)||!Array.isArray(state.inventory)||!Array.isArray(state.categories)||!Number.isFinite(Date.parse(state.server_now)))throw new Error('gift box unavailable');
 const items:BoxItem[]=state.gifts.flatMap(g=>{
  const price=Number(g.price);if(typeof g.id!=='string'||typeof g.name!=='string'||!Number.isSafeInteger(price)||price<=0)return [];
  const lots=state.inventory.filter(l=>l.gift_id===g.id&&l.remaining>0&&(!l.expires_at||Date.parse(l.expires_at)>Date.parse(state.server_now)));
  const gift:Gift={id:g.id,name:g.name,price,category:String(g.category_id||'gift'),icon:typeof g.icon==='string'?g.icon:'🎁',animationType:['pulse','rocket','lion','car','crown','sparkle'].includes(String(g.animation_type))?g.animation_type as Gift['animationType']:'sparkle',diamondSourceType:g.diamond_source_type==='LUCKY_GIFT'?'LUCKY_GIFT':'FIXED_GIFT',relationshipTypeId:typeof g.relationship_type_id==='string'?g.relationship_type_id:undefined,previewUrl:image(g.preview_url),description:typeof g.description==='string'?g.description:''};
  return [{key:`gift:${gift.id}`,kind:'gift',id:gift.id,name:gift.name,icon:gift.icon,image:gift.previewUrl||undefined,description:gift.description||'',category:gift.category,price,currency:'gold',quantity:lots.reduce((n,l)=>n+Number(l.remaining),0),expiresAt:lots.find(l=>l.expires_at)?.expires_at||undefined,active:false,relationshipTypeId:gift.relationshipTypeId||undefined,relation:profile.relationships?.find(r=>r.typeId===gift.relationshipTypeId),gift,rarity:typeof g.rarity==='string'?g.rarity:undefined}];
 });
 return {serverNow:state.server_now,categories:state.categories.filter(c=>typeof c.id==='string'&&typeof c.label==='string'),items,profile,banner:state.banner&&typeof state.banner.title==='string'?{title:state.banner.title,subtitle:state.banner.subtitle,image:image(state.banner.image_url)}:undefined};
}
export const inventoryCategories=[{id:'frames',label:'الإطارات'},{id:'cars',label:'المركبات'},{id:'bubbles',label:'الفقاعات'},{id:'entrances',label:'مؤثر الدخول'},{id:'cards',label:'بطاقات CP'},{id:'badges',label:'الشارات'},{id:'gift',label:'هدايا مخزونة'}];
export async function loadInventory(userId:string,authId:string):Promise<GiftBoxData>{
 const [box,entries,purchases,equipment]=await Promise.all([loadGiftBox(userId),supabase.from('store_catalog').select('*'),supabase.from('store_purchases').select('item_id,expires_at').eq('user_id',authId),supabase.from('user_equipment').select('category,item_id').eq('user_id',authId)]);
 for(const result of [entries,purchases,equipment])if(result.error)throw result.error;
 // Store purchases are the existing ownership ledger, including reward items.
 // Received gift history is never treated as a spendable entitlement.
 const items=box.items.filter(i=>i.quantity>0).map(i=>({...i,category:'gift'}));
 for(const card of (entries.data||[]) as CatalogItem[]){
  const lots=(purchases.data||[]).filter(p=>p.item_id===card.id);if(!lots.length||card.category==='vip')continue;
  const valid=lots.filter(p=>!p.expires_at||Date.parse(p.expires_at)>Date.parse(box.serverNow!));
  const relation=box.profile?.relationships?.find(r=>r.typeId===card.relationship_type_id);
  items.push({key:`item:${card.id}`,kind:'inventory_item',id:card.id,name:card.name,icon:card.icon,image:image(card.preview_url),description:card.description,category:card.category,price:Number(card.price),currency:card.currency,quantity:valid.length?1:0,expiresAt:(valid[0]||lots[0]).expires_at||undefined,durationDays:card.duration_days||undefined,expired:!valid.length,active:Boolean(valid.length&&(card.category==='cards'?relation?.cardId===card.id:(equipment.data||[]).some(e=>e.category===card.category&&e.item_id===card.id))),relationshipTypeId:card.relationship_type_id||undefined,relation,card});
 }
 return {...box,items,categories:[...inventoryCategories,...[...new Set(items.map(i=>i.category))].filter(id=>!inventoryCategories.some(c=>c.id===id)).map(id=>({id,label:id}))],banner:undefined};
}
export function canSendBoxGift(item:BoxItem,recipientId?:string):boolean{return item.kind==='gift'&&Boolean(recipientId)&&(!item.relationshipTypeId||item.relation?.partner.id===recipientId)}
