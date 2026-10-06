import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const roomId='11111111-1111-4111-8111-111111111111';
test('server reconciliation authenticates requests, revokes restrictions and retries failed jobs',async()=>{
 const temp=await mkdtemp(join(process.cwd(),'.livekit-reconcile-test-'));
 const saved=Object.getOwnPropertyDescriptor(globalThis,'Deno');
 const calls:any[]=[];let authorized=true;let failure=false;let active=true;
 const members=[{user_id:'speaker',seat_number:1,is_muted:false},{user_id:'muted',seat_number:2,is_muted:true},{user_id:'listener',seat_number:null,is_muted:false},{user_id:'banned',seat_number:3,is_muted:false}];
 (globalThis as any).Deno={env:{get:(key:string)=>({SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'secret',LIVEKIT_URL:'wss://test.invalid',LIVEKIT_API_KEY:'key',LIVEKIT_API_SECRET:'secret'} as any)[key]}};
 (globalThis as any).__reconcileAdmin={rpc:async(name:string,body:any)=>{
  calls.push({name,body});return {data:name==='authorize_livekit_reconcile'?authorized:name==='pending_livekit_reconcile'?[{room_id:roomId,revision:8,identities:['departed']}]:null,error:null};
 },from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:()=>Promise.resolve({data:{is_active:active,max_seats:4},error:null}),then:(resolve:any)=>Promise.resolve({data:table==='room_members'?members:[{user_id:'banned'}],error:null}).then(resolve)};return q;}};
 (globalThis as any).__reconcileService=class{
  async listParticipants(){return ['speaker','muted','listener','banned','outsider'].map(identity=>({identity}));}
  async removeParticipant(room:string,identity:string){calls.push({remove:identity,room});if(failure)throw new Error('server unavailable');}
  async updateParticipant(room:string,identity:string,options:any){calls.push({update:identity,room,options});}
 };
 try{
  await build({entryPoints:['supabase/functions/livekit-reconcile/index.ts'],outfile:join(temp,'handler.mjs'),bundle:true,platform:'node',format:'esm',plugins:[{name:'mocks',setup(b){b.onResolve({filter:/^(@supabase\/supabase-js|livekit-server-sdk)$/},args=>({path:args.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path==='livekit-server-sdk'?'export const RoomServiceClient=globalThis.__reconcileService;export const TrackSource={MICROPHONE:2};':'export const createClient=()=>globalThis.__reconcileAdmin;'}));}}]});
  const {default:handler}=await import(pathToFileURL(join(temp,'handler.mjs')).href);
  const request=()=>new Request('https://test.invalid',{method:'POST',headers:{'x-toti-signature':'a'.repeat(64),'x-toti-timestamp':String(Math.floor(Date.now()/1000))}});
  assert.equal((await handler.fetch(new Request('https://test.invalid',{method:'POST'}))).status,401);assert.equal(calls.length,0);
  authorized=false;assert.equal((await handler.fetch(request())).status,401);assert.equal(calls.some(c=>c.name==='pending_livekit_reconcile'),false);
  authorized=true;calls.length=0;const response=await handler.fetch(request());assert.equal(response.status,200);
  assert.deepEqual(calls.filter(c=>c.remove).map(c=>c.remove).sort(),['banned','departed','outsider']);
  assert.deepEqual(calls.filter(c=>c.update).map(c=>c.update).sort(),['listener','muted']);
  assert.equal(calls.filter(c=>c.update).every(c=>c.options.permission.canPublish===false),true);
  assert.equal(calls.some(c=>c.update==='speaker'),false);assert.equal(calls.some(c=>c.name==='ack_livekit_reconcile'),true);
  calls.length=0;failure=true;assert.equal((await handler.fetch(request())).status,503);assert.equal(calls.some(c=>c.name==='ack_livekit_reconcile'),false);
  calls.length=0;failure=false;active=false;assert.equal((await handler.fetch(request())).status,200);assert.ok(calls.some(c=>c.remove==='speaker'));
 }finally{
  await rm(temp,{recursive:true,force:true});delete (globalThis as any).__reconcileAdmin;delete (globalThis as any).__reconcileService;
  if(saved)Object.defineProperty(globalThis,'Deno',saved);else delete (globalThis as any).Deno;
 }
});
