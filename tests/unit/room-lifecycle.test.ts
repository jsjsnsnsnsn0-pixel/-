import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';

// Exercise the real provider, settings dialog, screen and audio cleanup against
// an isolated server contract. This is DOM integration, not a WebRTC transport test.
test('room settings round trip, failed save, membership removal and close', async () => {
  const dom = new JSDOM('<div id="root"></div>',{url:'https://test.invalid'});
  Object.defineProperty(dom.window.navigator,'webdriver',{value:true});
  const globals=['window','document','navigator','localStorage','HTMLElement','Element','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','RTCPeerConnection','IS_REACT_ACT_ENVIRONMENT'];
  const saved = new Map(globals.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const key of ['window','document','navigator','localStorage','HTMLElement','Element']) Object.defineProperty(globalThis,key,{configurable:true,value:(dom.window as any)[key]});
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,getComputedStyle:dom.window.getComputedStyle.bind(dom.window),requestAnimationFrame:(cb:Function)=>setTimeout(()=>cb(Date.now()),16),cancelAnimationFrame:clearTimeout,RTCPeerConnection:class {}});
  const actor='actor';const roomId='room';let stopped=0;let captures=0;
  Object.defineProperty(dom.window.navigator,'mediaDevices',{value:{getUserMedia:async()=>{
    captures++;const track={kind:'audio',enabled:false,stop:()=>{stopped++;},applyConstraints:async()=>{}};
    return {getTracks:()=>[track],getAudioTracks:()=>[track]};
  }}});
  let row:any={id:roomId,owner_id:actor,name:'Saved room',description:'Old description',welcome_message:'Saved welcome',is_active:true,max_seats:4,chat_enabled:false,gift_effects_enabled:false,vehicle_effects_enabled:false,entrance_effects_enabled:false};
  let members:any[]=[{room_id:roomId,user_id:actor,seat_number:1,role:'owner',is_muted:true}];
  let failSave=false;let failReopen=false;const requests:any[]=[];let context:any;
  const profile={id:actor,public_id:920003,display_name:'Owner',country_code:'IQ',gold:100};
  const query=(table:string)=>{
    let method='select',body:any;
    const q:any={};
    for(const name of ['select','eq','order','limit','or','is','gte'])q[name]=()=>q;
    for(const name of ['insert','update','delete'])q[name]=(value:any)=>{method=name;body=value;return q;};
    const result=()=>({data:table==='profiles'?profile:(table==='rooms'||table==='rooms_client')?[row]:table==='room_members'?members:[],error:null});
    q.single=()=>Promise.resolve(result());q.then=(resolve:any,reject:any)=>{if(method!=='select')requests.push({table,method,body});return Promise.resolve(result()).then(resolve,reject);};return q;
  };
  const client={from:query,auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getSession:async()=>({data:{session:{user:{id:actor}}},error:null})},rpc:async(name:string,body:any)=>{
    requests.push({name,body});
    if(name==='social_profile')return {data:profile,error:null};
    if(name==='update_room_settings'){
      if(failSave)return {data:null,error:{message:'failure'}};
      row={...row,name:body.p_name,welcome_message:body.p_welcome_message,chat_enabled:body.p_chat_enabled,gift_effects_enabled:body.p_gift_effects_enabled,vehicle_effects_enabled:body.p_vehicle_effects_enabled,entrance_effects_enabled:body.p_entrance_effects_enabled};
    }
    if(name==='reopen_room'){if(failReopen)return {data:null,error:{message:'reopen denied'}};row={...row,is_active:true};}
    if(name==='close_room')row={...row,is_active:false};
    return {data:null,error:null};
  },channel:()=>{const ch:any={on:()=>ch,subscribe:()=>ch};return ch;},removeChannel:async()=>{}};
  (globalThis as any).__roomTestClient=client;
  const temp=await mkdtemp(join(process.cwd(),'.room-test-'));
  let root:ReturnType<typeof createRoot>|undefined;
  try{
    await build({stdin:{contents:`import React from 'react';import {AppProvider,useApp} from './src/context/AppContext';import {RoomAudioProvider} from './src/context/RoomAudioContext';import {VoiceRoomScreen} from './src/components/screens/VoiceRoomScreen';import {RoomsListScreen} from './src/components/screens/RoomsListScreen';export function Harness({capture}){const context=useApp();capture(context);return React.createElement(context.activeRoom?VoiceRoomScreen:RoomsListScreen);}export {AppProvider,RoomAudioProvider};`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,loader:{'.png':'dataurl'},platform:'node',format:'esm',packages:'external',outfile:join(temp,'bundle.mjs'),plugins:[{name:'test-server',setup(b){
      b.onResolve({filter:/\/services\/supabase$|^\.\/supabase$/},()=>({path:'supabase',namespace:'test'}));
      b.onResolve({filter:/\/services\/nativeAuth$/},()=>({path:'native',namespace:'test'}));
      b.onResolve({filter:/^motion\/react$/},()=>({path:'motion',namespace:'test'}));
      b.onLoad({filter:/.*/,namespace:'test'},args=>({loader:'js',resolveDir:process.cwd(),contents:args.path==='supabase'?'export const supabase=globalThis.__roomTestClient;':args.path==='native'?'export const listenForNativeAuth=async()=>()=>{};export const signInWithGoogle=async()=>{};':`import React from 'react';export const AnimatePresence=({children})=>children;export const motion=new Proxy({}, {get:(_,tag)=>({children,initial,animate,exit,transition,whileHover,whileTap,layout,...props})=>React.createElement(tag,props,children)});`}));
    }}]});
    const {Harness,AppProvider,RoomAudioProvider}=await import(pathToFileURL(join(temp,'bundle.mjs')).href);
    root=createRoot(dom.window.document.getElementById('root')!);
    await act(async()=>{root!.render(React.createElement(AppProvider,null,React.createElement(RoomAudioProvider,null,React.createElement(Harness,{capture:(value:any)=>{context=value;}}))));});
    assert.equal(context.user.authId,actor);
    await act(async()=>{await context.joinRoom(context.rooms[0]);});
    assert.equal(context.activeRoom.description,'Saved welcome');assert.equal(context.activeRoom.chatEnabled,false);
    assert.equal(context.activeRoom.isActive,true);
    assert.equal(dom.window.document.querySelector('input[aria-label="رسالة الغرفة"]')?.hasAttribute('disabled'),true);
    const gift={id:'test-gift',name:'Test gift',category:'roses',price:10,icon:'🌹',animationType:'pulse'};
    await act(async()=>{await context.sendGiftInRoom(gift,context.user);});
    assert.ok(context.activeGiftOverlay);
    assert.equal(dom.window.document.body.textContent?.includes('هدية فاخرة'),false);
    const button=(name:string)=>[...dom.window.document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name||b.textContent?.trim()===name)!;
    const click=async(name:string)=>{const el=button(name);assert.ok(el,`button ${name} exists`);await act(async()=>el.click());};
    await click('أدوات الغرفة');await click('إدارة الغرفة');await click('الإعدادات');
    const flags=[...dom.window.document.querySelectorAll('[aria-label="إدارة الغرفة"][role=dialog] button[aria-pressed]')];assert.equal(flags.length,4);for(const flag of flags)assert.equal(flag.getAttribute('aria-pressed'),'false');
    await click('حفظ الإعدادات');
    assert.deepEqual(requests.find(r=>r.name==='update_room_settings').body,{p_room_id:roomId,p_name:'Saved room',p_welcome_message:'Saved welcome',p_image_url:null,p_chat_enabled:false,p_gift_effects_enabled:false,p_vehicle_effects_enabled:false,p_entrance_effects_enabled:false});
    // Enable chat and verify successful readback reaches the real screen.
    await click('الدردشة العامةمتوقف');await click('حفظ الإعدادات');
    assert.equal(context.activeRoom.chatEnabled,true);
    assert.equal(dom.window.document.querySelector('input[aria-label="رسالة الغرفة"]')?.hasAttribute('disabled'),false);
    failSave=true;
    await click('الدردشة العامةمفعّل');await click('حفظ الإعدادات');
    assert.equal(context.activeRoom.chatEnabled,true);assert.equal(context.error,'تعذر حفظ إعدادات الغرفة.');
    await act(async()=>context.dismissError());
    // A later server announcement appears on refresh, without changing UUID.
    row={...row,welcome_message:'New welcome',name:'New room'};
    await act(async()=>{await context.refreshRooms();});
    assert.equal(context.activeRoom.id,roomId);assert.equal(context.activeRoom.description,'New welcome');
    assert.ok(dom.window.document.body.textContent?.includes('New welcome'));
    row={...row,gift_effects_enabled:true};await act(async()=>{await context.refreshRooms();});
    assert.equal(dom.window.document.body.textContent?.includes('هدية فاخرة'),false);
    assert.ok(dom.window.document.body.textContent?.includes('🌹'));
    await click('تشغيل المايكروفون');assert.equal(captures,1);
    await click('خيارات الغرفة');
    assert.ok(dom.window.document.querySelector('[role=dialog][aria-label="خيارات الغرفة"]'));
    await act(async()=>dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
    assert.equal(dom.window.document.querySelector('[role=dialog][aria-label="خيارات الغرفة"]'),null);
    await click('خيارات الغرفة');await click('تصغير الغرفة');
    assert.equal(context.activeSubScreen,'home');assert.equal(context.activeRoom.id,roomId);assert.equal(stopped,0);
    assert.equal(requests.filter(r=>r.name==='leave_room').length,0);
    await act(async()=>context.setActiveSubScreen(null));
    members=[];await act(async()=>{await context.refreshRooms();});
    assert.equal(context.activeRoom,null);assert.equal(stopped,1);assert.equal(context.rooms.length,1);
    assert.equal(dom.window.document.querySelector('input[aria-label="رسالة الغرفة"]'),null);
    members=[{room_id:roomId,user_id:actor,seat_number:1,role:'owner',is_muted:true}];failSave=false;
    await act(async()=>{await context.refreshRooms();await context.joinRoom(context.rooms[0]);});
    await click('أدوات الغرفة');await click('إدارة الغرفة');await click('الإعدادات');
    dom.window.confirm=()=>true;await click('إغلاق الروم');
    assert.equal(context.activeRoom,null);assert.equal(context.rooms.length,0);
    assert.equal(requests.filter(r=>r.name==='close_room').length,1);
    assert.equal(context.ownedClosedRooms.length,1);
    assert.equal(context.activeTab,'rooms');
    assert.ok(dom.window.document.querySelector('section[aria-label="غرفي المغلقة"]'));
    const joinsBefore=requests.filter(r=>r.name==='join_room').length;
    await act(async()=>{await context.joinRoom(context.ownedClosedRooms[0]);});
    assert.equal(requests.filter(r=>r.name==='join_room').length,joinsBefore);
    failReopen=true;await click('إعادة فتح New room');
    assert.equal(context.ownedClosedRooms.length,1);assert.equal(context.rooms.length,0);
    failReopen=false;await click('إعادة فتح New room');
    assert.equal(context.ownedClosedRooms.length,0);assert.equal(context.rooms.length,1);assert.equal(context.activeRoom,null);
    assert.equal(dom.window.document.querySelector('section[aria-label="غرفي المغلقة"]'),null);
    await act(async()=>{await context.joinRoom(context.rooms[0]);});
    // A listener can inspect members without invoking moderator-only RPCs.
    row={...row,owner_id:'other-owner'};members=[{room_id:roomId,user_id:actor,seat_number:null,role:'member',is_muted:true}];
    await act(async()=>{await context.refreshRooms();});
    assert.equal(context.activeRoom.canModerate,false);
    assert.equal(button('إدارة الغرفة'),undefined);
    await click('الموجودون في الغرفة');
    const info=dom.window.document.querySelector('[role="dialog"][aria-label="معلومات الغرفة والموجودون"]');
    assert.ok(info);assert.ok(info.textContent?.includes('الموجودون (1)'));
    assert.ok(info.querySelector('button[aria-label="عرض ملف Owner"]'));
    assert.equal(requests.filter(r=>r.name==='get_room_management_members').length,0);
    await click('إغلاق معلومات الغرفة');await click('معلومات الغرفة');
    assert.ok(dom.window.document.querySelector('[role="dialog"][aria-label="معلومات الغرفة والموجودون"]'));
    assert.equal(context.activeRoom.id,roomId);
    await click('عرض ملف Owner');
    assert.ok(dom.window.document.querySelector('[role="dialog"][aria-label="بطاقة مستخدم الغرفة"]'));
    assert.equal(context.activeRoom.id,roomId);
    row={...row,is_active:false};await act(async()=>{await context.refreshRooms();});
    assert.equal(context.ownedClosedRooms.length,0); // Closed rooms belonging to others never enter the owner list.

  }finally{
    if(root)await act(async()=>root!.unmount());
    await rm(temp,{recursive:true,force:true});dom.window.close();delete (globalThis as any).__roomTestClient;
    for(const key of globals){const descriptor=saved.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete (globalThis as any)[key];}
  }
});
