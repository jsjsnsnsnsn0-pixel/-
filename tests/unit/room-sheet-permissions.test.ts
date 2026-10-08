import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {emptyUser} from '../../src/services/profile';
test('one room sheet follows server permissions for ordinary, moderator, owner, self and CP states',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://test.invalid'});
 const keys=['window','document','navigator','HTMLElement','Element','getComputedStyle','IS_REACT_ACT_ENVIRONMENT','requestAnimationFrame','cancelAnimationFrame'];
 const saved=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const k of ['window','document','navigator','HTMLElement','Element'])Object.defineProperty(globalThis,k,{configurable:true,value:(dom.window as any)[k]});
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,requestAnimationFrame:(cb:Function)=>setTimeout(()=>cb(Date.now()),0),cancelAnimationFrame:clearTimeout,getComputedStyle:dom.window.getComputedStyle.bind(dom.window)});
 const me={...emptyUser,id:'451305',authId:'viewer',name:'Viewer'};
 let actions:string[]=[],manage=false,self=false,fail=false,cp=false;
 let target={...emptyUser,id:'451306',name:'Target'};
 const context={user:me,activeRoom:{id:'room',canModerate:false},refreshRooms:async()=>{},reportError:()=>{},setSelectedChatUser:()=>{},setActiveSubScreen:()=>{}};
 (globalThis as any).__sheetContext=context;
 (globalThis as any).__sheetClient={rpc:async(name:string,p:any)=>({data:name==='room_user_permissions'?{room_id:p.p_room_id,subject_public_id:p.p_public_id,self,manage_moderators:manage,moderation:actions,social:{follow:!self,message:!self,gift:true,mention:!self,is_following:false}}:name==='social_profile'?{public_id:p.p_public_id,display_name:'Target',level:5,vip_level:0}:name==='profile_relationships'?(cp?[{subject_public_id:p.p_public_id,relation_id:'a1e00000-0000-4000-8000-000000000001',type_id:'love',type_label:'رفيق الروح',is_primary:true,accepted_at:'2026-05-01T00:00:00Z',server_now:'2026-10-06T00:00:00Z',ended_at:null,partner:{public_id:451307,display_name:'Partner'},days:158}]:[]):null,error:name==='room_user_permissions'&&fail?{message:'unavailable'}:null}),channel:()=>{const ch:any={on:()=>ch,subscribe:()=>ch};return ch},removeChannel:async()=>{}};
 const temp=await mkdtemp(join(process.cwd(),'.sheet-test-'));let root:ReturnType<typeof createRoot>|undefined;
 try{
 await build({stdin:{contents:"export {RoomUserProfileModal} from './src/components/rooms/RoomUserProfileModal';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,loader:{'.png':'dataurl','.css':'empty'},packages:'external',platform:'node',format:'esm',outfile:join(temp,'bundle.mjs'),plugins:[{name:'isolated-server',setup(b){b.onResolve({filter:/\/context\/AppContext$/},()=>({path:'context',namespace:'test'}));b.onResolve({filter:/\/services\/supabase$|^\.\/supabase$/},()=>({path:'supabase',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='context'?'export const useApp=()=>globalThis.__sheetContext;':'export const supabase=globalThis.__sheetClient;'}))}}]});
 const {RoomUserProfileModal}=await import(pathToFileURL(join(temp,'bundle.mjs')).href);
 root=createRoot(dom.window.document.getElementById('root')!);
 let key=0;
 const render=async()=>{await act(async()=>root!.render(React.createElement(RoomUserProfileModal,{key:++key,isOpen:true,targetUser:target,onClose:()=>{},onManage:()=>{},onGift:()=>{},onMessage:()=>{},onMention:()=>{},onOpenMore:()=>{}})))};
 const texts=()=>dom.window.document.body.textContent!;
 await render();assert.equal(dom.window.document.querySelector('[aria-label="أدوات الإشراف"]'),null);assert.ok(texts().includes('متابعة'));assert.ok(texts().includes('رسالة خاصة'));
 target={...target,roomRole:'moderator'} as any;await render();assert.equal(dom.window.document.querySelector('[aria-label="أدوات الإشراف"]'),null);
 // Moderator -> ordinary, server explicitly supplies permissions.
 target={...target,roomRole:'member'} as any;actions=['mute','down','kick','ban'];await render();assert.ok(texts().includes('كتم الصوت'));assert.ok(texts().includes('الطرد من الغرفة'));assert.equal(texts().includes('إدارة المشرفين'),false);
 // Owner -> moderator/member; identical sheet shape, additional allowed action only.
 manage=true;target={...target,roomRole:'moderator'} as any;await render();assert.ok(texts().includes('إدارة المشرفين'));
 target={...target,roomRole:'member'} as any;cp=true;await render();assert.ok(dom.window.document.querySelector('[data-testid="profile-couple"]'));assert.ok(texts().includes('Partner'));
 cp=false;await render();assert.equal(dom.window.document.querySelector('[data-testid="profile-couple"]'),null);
 // Self is protected even if an invalid response contains stale moderation actions.
 self=true;target=me;await render();assert.equal(dom.window.document.querySelector('[aria-label="أدوات الإشراف"]'),null);assert.equal(texts().includes('إدارة المشرفين'),false);assert.equal(texts().includes('رسالة خاصة'),false);
 self=false;target={...emptyUser,id:'451306',name:'Target'};fail=true;await render();assert.equal(dom.window.document.querySelector('[aria-label="أدوات الإشراف"]'),null);assert.equal(texts().includes('متابعة'),false);
 }finally{if(root)await act(async()=>root!.unmount());dom.window.close();await rm(temp,{recursive:true,force:true});delete (globalThis as any).__sheetContext;delete (globalThis as any).__sheetClient;for(const k of keys){const d=saved.get(k);if(d)Object.defineProperty(globalThis,k,d);else delete(globalThis as any)[k]}}
});
test('seat visuals distinguish empty, locked, occupied, muted and speaking without changing seat count',async()=>{
 const temp=await mkdtemp(join(process.cwd(),'.seat-test-'));
 try{
 await build({stdin:{contents:"export {MicrophoneSeat} from './src/components/rooms/MicrophoneSeat';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:join(temp,'bundle.mjs'),plugins:[{name:'snapshot',setup(b){b.onResolve({filter:/\/hooks\/useRoomSeatProfile$/},()=>({path:'snapshot',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const useRoomSeatProfile=u=>u;'}))}}]});
 const {renderToStaticMarkup}=await import('react-dom/server');const {MicrophoneSeat}=await import(pathToFileURL(join(temp,'bundle.mjs')).href);
 for(const state of ['empty','locked','occupied','muted','speaking']){
  const seat={seatIndex:4,isLocked:state==='locked',isMuted:state==='muted',isSpeaking:state==='speaking',user:['occupied','muted','speaking'].includes(state)?{...emptyUser,id:'451306',name:'Target',level:5,hasPublicLevel:true,roomRole:'moderator',vipLevel:2}:undefined};
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(MicrophoneSeat,{seat,onSeatClick:()=>{}})));
  if(state==='empty'||state==='locked')assert.ok(dom.window.document.querySelector(`[aria-label="${state==='locked'?'مقعد 5 مقفل':'الجلوس في المقعد 5'}"]`));
  else{assert.equal(dom.window.document.querySelector('[data-seat-state]')?.getAttribute('data-seat-state'),state);assert.ok(dom.window.document.body.textContent?.includes('مشرف'));assert.ok(dom.window.document.querySelector(`[aria-label="${state==='muted'?'المايك مكتوم':state==='speaking'?'يتحدث الآن':'المايك مفتوح'}"]`))}
  dom.window.close();
 }
 }finally{await rm(temp,{recursive:true,force:true})}
});
test('relationship days use a start date and server time; absent EXP never becomes a fake rank',async()=>{
 const temp=await mkdtemp(join(process.cwd(),'.relationship-test-'));
 try{
 await build({stdin:{contents:"export {RelationshipCard,relationshipDays} from './src/components/common/RelationshipCard';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,loader:{'.css':'empty'},packages:'external',platform:'node',format:'esm',outfile:join(temp,'bundle.mjs')});
 const {RelationshipCard,relationshipDays}=await import(pathToFileURL(join(temp,'bundle.mjs')).href);const {renderToStaticMarkup}=await import('react-dom/server');
 const relation={id:'relation',typeId:'love',label:'رفيق الروح',primary:true,startedAt:'2026-01-01T00:00:00Z',serverNow:'2026-01-11T00:00:00Z',days:999,thresholds:[],presentation:{icon:'💗',accent:'#fb7185'},partner:{id:'451306',name:'Partner',avatar:'/partner.jpg',vipLevel:0}};
 assert.equal(relationshipDays(relation,Date.parse(relation.serverNow)),10);assert.equal(relationshipDays(relation,Date.parse('2026-01-12T00:00:00Z')),11);
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(RelationshipCard,{subject:{id:'451305',name:'Subject',avatar:'/subject.jpg'},relation})));
 assert.ok(dom.window.document.body.textContent?.includes('10 يوم'));assert.equal(dom.window.document.body.textContent?.includes('999'),false);assert.equal(dom.window.document.body.textContent?.includes('EXP'),false);assert.equal(dom.window.document.querySelector('progress'),null);dom.window.close();
 }finally{await rm(temp,{recursive:true,force:true})}
});
