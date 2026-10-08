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
test('room gift selection sends only on Send, with current recipient/quantity and a single in-flight request',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://test.invalid'});
 const keys=['window','document','navigator','HTMLElement','Element','IS_REACT_ACT_ENVIRONMENT'];const saved=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const k of keys)Object.defineProperty(globalThis,k,{configurable:true,value:k==='IS_REACT_ACT_ENVIRONMENT'?true:(dom.window as any)[k]});
 const user={...emptyUser,id:'1001',authId:'actor',gold:1000,name:'Sender'};const target={...emptyUser,id:'1002',name:'First'},other={...emptyUser,id:'1003',name:'Second'};
 const room={id:'room',members:[target,other,user],seats:[]};let calls:any[][]=[],resolveSend:(value:boolean)=>void=()=>{};
 (globalThis as any).__giftContext={user,refreshWallet:async()=>{},sendGiftInRoom:(...args:any[])=>{calls.push(args);return new Promise<boolean>(resolve=>{resolveSend=resolve})},reportError:()=>{},setActiveSubScreen:()=>{}};
 const gifts=[{key:'gift:g1',kind:'gift',id:'g1',name:'Rose',price:10,gift:{id:'g1',price:10}},{key:'gift:g2',kind:'gift',id:'g2',name:'Heart',price:50,gift:{id:'g2',price:50}}];
 (globalThis as any).__giftData={items:gifts,categories:[]};
 const temp=await mkdtemp(join(process.cwd(),'.gift-test-'));let root:ReturnType<typeof createRoot>|undefined;
 try{
 await build({stdin:{contents:"export {GiftBoxContent} from './src/components/screens/GiftBoxScreen';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,loader:{'.css':'empty'},packages:'external',platform:'node',format:'esm',outfile:join(temp,'bundle.mjs'),plugins:[{name:'fixture',setup(b){b.onResolve({filter:/\/context\/AppContext$/},()=>({path:'context',namespace:'fixture'}));b.onResolve({filter:/\/services\/giftBox$/},()=>({path:'gifts',namespace:'fixture'}));b.onResolve({filter:/\/services\/supabase$|^\.\/supabase$/},()=>({path:'supabase',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='context'?'export const useApp=()=>globalThis.__giftContext;':a.path==='gifts'?'export const emptyGiftBox={items:[],categories:[]};export const loadGiftBox=async()=>globalThis.__giftData;export const loadInventory=loadGiftBox;export const canSendBoxGift=(i,id)=>!!id;':'export const supabase={};'}))}}]});
 const {GiftBoxContent}=await import(pathToFileURL(join(temp,'bundle.mjs')).href);root=createRoot(dom.window.document.getElementById('root')!);
 await act(async()=>root!.render(React.createElement(GiftBoxContent,{room,compact:true,onClose:()=>{},onRecharge:()=>{}})));
 const button=(label:string)=>[...dom.window.document.querySelectorAll('button')].find(el=>el.textContent===label||el.getAttribute('aria-label')===label)!;
 const click=async(label:string)=>act(async()=>button(label).click());
 await click('تحديد Heart');assert.equal(calls.length,0);assert.equal(button('تحديد Heart').getAttribute('aria-pressed'),'true');assert.equal(button('1').getAttribute('aria-pressed'),'true');
 await click('7');assert.ok(dom.window.document.body.textContent!.includes((350).toLocaleString('ar-IQ')));
 await click('تحديد Rose');await click('Second');assert.equal(calls.length,0);
 await act(async()=>{button('إرسال').click();button('إرسال').click()});assert.equal(calls.length,1);assert.equal(calls[0][0].id,'g1');assert.equal(calls[0][1].id,'1003');assert.equal(calls[0][5],7);
 await act(async()=>resolveSend(true));
 await click('1');await click('إرسال');assert.equal(calls[1][5],1);await act(async()=>resolveSend(true));
 user.gold=0;await click('777');await click('إرسال');assert.equal(calls.length,2);assert.equal(button('إرسال').disabled,true);assert.ok(dom.window.document.body.textContent!.includes('الرصيد غير كافٍ')); 
 }finally{await act(async()=>root?.unmount());dom.window.close();for(const [key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete (globalThis as any)[key]}delete (globalThis as any).__giftContext;delete (globalThis as any).__giftData;await rm(temp,{recursive:true,force:true})}
});
