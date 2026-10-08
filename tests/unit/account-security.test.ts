import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
for(const phoneEnabled of [true,false]) test('account security protects last login with phone provider '+phoneEnabled,async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://test.invalid'});
 const keys=['window','document','navigator','HTMLElement','Element','IS_REACT_ACT_ENVIRONMENT','__securityClient'];
 const saved=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 for(const key of ['window','document','navigator','HTMLElement','Element'])Object.defineProperty(globalThis,key,{configurable:true,value:(dom.window as any)[key]});
 let confirmed=false,unlinkCalls=0;
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 (globalThis as any).__securityClient={auth:{getUser:async()=>({data:{user:{id:'actor',email:'owner@example.invalid',phone:confirmed?'+9647712345678':null,phone_confirmed_at:confirmed?'2026-10-06':null,identities:[{id:'google',identity_id:'google',provider:'google',identity_data:{email:'owner@example.invalid'}}]}},error:null}),updateUser:async()=>({error:new Error('Rejected')}),unlinkIdentity:async()=>{unlinkCalls++;return {error:null}}}};
 const temp=await mkdtemp(join(process.cwd(),'.security-test-'));let root:ReturnType<typeof createRoot>|undefined;
 try{
  await build({stdin:{contents:"export {AccountSecurityScreen} from './src/components/screens/AccountSecurityScreen';",resolveDir:process.cwd(),loader:'tsx'},outfile:join(temp,'bundle.mjs'),bundle:true,packages:'external',platform:'node',format:'esm',define:{'import.meta.env':JSON.stringify({VITE_PHONE_AUTH_ENABLED:String(phoneEnabled)})},plugins:[{name:'server',setup(b){b.onResolve({filter:/\/services\/(supabase|nativeAuth)$/},args=>({path:args.path.endsWith('supabase')?'client':'native',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:args.path==='client'?'export const supabase=globalThis.__securityClient;':'export const linkGoogleAccount=async()=>{};'}))}}]});
  const {AccountSecurityScreen}=await import(pathToFileURL(join(temp,'bundle.mjs')).href);
  root=createRoot(dom.window.document.getElementById('root')!);
  const button=(name:string)=>[...dom.window.document.querySelectorAll('button')].find(b=>b.textContent?.trim()===name)!;
  await act(async()=>root!.render(React.createElement(AccountSecurityScreen,{onBack:()=>{}})));
  assert.equal(button('إلغاء ربط Google').disabled,true);
  const emailForm=dom.window.document.querySelector('input[type=email]')!.closest('form')!;
  await act(async()=>emailForm.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.ok(dom.window.document.querySelector('[role=alert]')?.textContent?.includes('تعذر إتمام الطلب'));
  assert.equal(dom.window.document.body.textContent?.includes('أُرسل طلب تغيير البريد'),false);
  confirmed=true;await act(async()=>root!.render(React.createElement(AccountSecurityScreen,{key:'confirmed',onBack:()=>{}})));
  if(!phoneEnabled){assert.equal(button('إلغاء ربط Google').disabled,true);assert.equal(button('إرسال رمز التحقق').disabled,true);assert.equal(unlinkCalls,0);return;}
  await act(async()=>button('إلغاء ربط Google').click());
  confirmed=false;await act(async()=>button('تأكيد إلغاء ربط Google').click());
  assert.equal(unlinkCalls,0);assert.ok(dom.window.document.querySelector('[role=alert]'));
 }finally{await act(async()=>root?.unmount());dom.window.close();await rm(temp,{recursive:true,force:true});for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete (globalThis as any)[key]}}
});
