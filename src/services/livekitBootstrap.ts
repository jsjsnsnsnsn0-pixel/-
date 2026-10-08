// The pinned SDK loads only when entering a room, without a third-party CDN.
let pending:Promise<any>|null=null;
export function loadLiveKit(){
 const existing=(globalThis as any).LivekitClient;
 if(existing?.Room&&existing?.RoomEvent)return Promise.resolve(existing);
 pending ||= import('livekit-client').then(({Room,RoomEvent})=>{
  const sdk={Room,RoomEvent};(globalThis as any).LivekitClient=sdk;return sdk;
 }).catch(error=>{pending=null;throw error});
 return pending;
}
