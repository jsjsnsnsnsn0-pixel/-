export const ANNOUNCEMENT_MAX_AGE=20000;
export interface GiftAnnouncement {id:string;room_id:string;gift_id:string;gift_name:string;sender_name:string;recipient_name:string;created_at:string}
export function parseGiftAnnouncement(row:Record<string,unknown>,now=Date.now()):GiftAnnouncement|null{
 const keys=['id','room_id','gift_id','gift_name','sender_name','recipient_name','created_at'] as const;
 if(keys.some(key=>typeof row[key]!=='string'||!(row[key] as string).trim()))return null;
 const age=now-Date.parse(row.created_at as string);
 if(!Number.isFinite(age)||age< -5000||age>ANNOUNCEMENT_MAX_AGE)return null;
 return Object.fromEntries(keys.map(key=>[key,row[key]])) as unknown as GiftAnnouncement;
}
// Old events expire while waiting; the queue never grows during busy rooms.
export function enqueueAnnouncement(queue:GiftAnnouncement[],item:GiftAnnouncement,now=Date.now()){
 const fresh=queue.filter(row=>now-Date.parse(row.created_at)<=ANNOUNCEMENT_MAX_AGE);
 if(fresh.some(row=>row.id===item.id))return fresh;
 return [...fresh,item].slice(-3);
}
