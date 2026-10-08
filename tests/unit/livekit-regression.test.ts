import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';

const deferred = () => {let resolve!: (value:any)=>void; const promise=new Promise<any>(r=>{resolve=r;});return {promise,resolve};};

test('LiveKit endpoint accepts preflight and rejects malformed bodies with CORS',async()=>{
  const temp=await mkdtemp(join(process.cwd(),'.livekit-edge-test-'));
  try {
    await build({entryPoints:['supabase/functions/livekit-room/index.ts'],outfile:join(temp,'edge.mjs'),bundle:true,platform:'node',format:'esm',plugins:[{name:'mock-sdk',setup(b){
      b.onResolve({filter:/^(@supabase\/supabase-js|livekit-server-sdk)$/},args=>({path:args.path,namespace:'mock'}));
      b.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path==='livekit-server-sdk'?'export class AccessToken{}; export class RoomServiceClient{}; export const TrackSource={MICROPHONE:2};':'export function createClient(){throw new Error("unexpected database access");}'}));
    }}]});
    const {default:handler}=await import(pathToFileURL(join(temp,'edge.mjs')).href);
    const options=await handler.fetch(new Request('https://test.invalid',{method:'OPTIONS',headers:{origin:'https://localhost','access-control-request-headers':'authorization,apikey,content-type'}}));
    assert.equal(options.status,204);assert.equal(options.headers.get('access-control-allow-origin'),'*');
    assert.match(options.headers.get('access-control-allow-headers')!,/apikey/);
    for(const body of ['null','[]','{"roomId":123}','"room"']){
      const response=await handler.fetch(new Request('https://test.invalid',{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json'},body}));
      assert.equal(response.status,400);assert.equal((await response.json()).error,'INVALID_BODY');
      assert.equal(response.headers.get('access-control-allow-origin'),'*');
    }
    const unauthorized=await handler.fetch(new Request('https://test.invalid',{method:'POST',body:'{}'}));
    assert.equal(unauthorized.status,401);assert.equal(unauthorized.headers.get('access-control-allow-origin'),'*');
  } finally {await rm(temp,{recursive:true,force:true});}
});

test('LiveKit cannot capture after leaving; mute stops locally even when server sync fails',async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'https://test.invalid'});
  const keys=['window','document','navigator','LivekitClient','IS_REACT_ACT_ENVIRONMENT'];
  const saved=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const key of ['window','document','navigator'])Object.defineProperty(globalThis,key,{configurable:true,value:(dom.window as any)[key]});
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  let capture=deferred();let stopped=0;let failSync=false;let audio:any;const clients:any[]=[];
  let syncGate:ReturnType<typeof deferred>|null=null;
  let enableGate:ReturnType<typeof deferred>|null=null;
  Object.defineProperty(dom.window.navigator,'mediaDevices',{value:{getUserMedia:()=>capture.promise}});
  class Client {
    calls:boolean[]=[];
    localParticipant={setMicrophoneEnabled:async(enabled:boolean)=>{this.calls.push(enabled);if(enabled&&enableGate)await enableGate.promise;},audioTrackPublications:new Map()};
    on(){return this;}async connect(){}async disconnect(){}async startAudio(){}
    constructor(){clients.push(this);}
  }
  (globalThis as any).LivekitClient={Room:Client,RoomEvent:{TrackSubscribed:'track',Disconnected:'disconnected'}};
  (globalThis as any).__livekitTestClient={functions:{invoke:async(_name:string,{body}:any)=>body.action==='token'?{data:{token:'token',url:'wss://test.invalid'},error:null}:syncGate?syncGate.promise:failSync?{data:null,error:new Error('sync failed')}:{data:{canPublish:true},error:null}}};
  const temp=await mkdtemp(join(process.cwd(),'.livekit-hook-test-'));let root:ReturnType<typeof createRoot>|undefined;
  try {
    await build({stdin:{contents:"export {useLiveKitRoomAudio} from './src/hooks/useRoomAudio';",resolveDir:process.cwd(),loader:'tsx'},outfile:join(temp,'hook.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'mock-server',setup(b){b.onResolve({filter:/\/services\/supabase$/},()=>({path:'supabase',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const supabase=globalThis.__livekitTestClient;'}));}}]});
    const {useLiveKitRoomAudio}=await import(pathToFileURL(join(temp,'hook.mjs')).href);
    const errors:string[]=[];const onError=(message:string)=>errors.push(message);
    const room:any={id:'room-a',seats:[{user:{authId:'actor'}}]};
    function Harness({room,muted}:any){audio=useLiveKitRoomAudio(room,'actor',muted,true,onError);return null;}
    root=createRoot(dom.window.document.getElementById('root')!);
    const render=async(room:any,muted:boolean)=>act(async()=>{root!.render(React.createElement(Harness,{room,muted}));});
    await render(room,false);assert.equal(audio.connected,true);
    let result:Promise<any>;
    await act(async()=>{result=audio.enableMicrophone().catch((e:Error)=>e.message);});
    await render(null,false);
    await act(async()=>{capture.resolve({getTracks:()=>[{stop:()=>stopped++}]});await result!;});
    assert.equal(await result!,'ROOM_SESSION_ENDED');assert.equal(stopped,1);assert.equal(clients[0].calls.includes(true),false);
    await render(room,false);capture=deferred();capture.resolve({getTracks:()=>[{stop:()=>stopped++}]});
    await act(async()=>{await audio.enableMicrophone();});assert.equal(clients[1].calls.at(-1),true);
    failSync=true;await render(room,true);
    assert.equal(clients[1].calls.at(-1),false);assert.ok(errors.length>0);
    failSync=false;await render(room,false);
    Object.defineProperty(dom.window.document,'visibilityState',{configurable:true,value:'visible'});
    clients[1].localParticipant.audioTrackPublications.set('music',{source:'screen_share_audio',track:{mediaStreamTrack:{readyState:'live'}}});
    clients[1].calls=[];
    await act(async()=>{dom.window.dispatchEvent(new dom.window.Event('focus'));});
    assert.deepEqual(clients[1].calls,[true],'live music is not a live microphone');
    syncGate=deferred();const oldSync=syncGate;
    await act(async()=>{dom.window.dispatchEvent(new dom.window.Event('focus'));});
    syncGate=null;
    await render({...room,id:'room-b'},false);
    clients[2].calls=[];
    await act(async()=>{oldSync.resolve({data:{canPublish:true},error:null});});
    assert.deepEqual(clients[2].calls,[],'old room permissions must not enable the new room microphone');
    enableGate=deferred();
    await act(async()=>{dom.window.dispatchEvent(new dom.window.Event('focus'));});
    assert.equal(clients[2].calls.at(-1),true);
    await render({...room,id:'room-b'},true);
    await act(async()=>{enableGate!.resolve(undefined);});
    assert.equal(clients[2].calls.at(-1),false,'mute during pending restoration must stop the completed capture');
  } finally {
    if(root)await act(async()=>root!.unmount());await rm(temp,{recursive:true,force:true});dom.window.close();delete (globalThis as any).__livekitTestClient;
    for(const key of keys){const value=saved.get(key);if(value)Object.defineProperty(globalThis,key,value);else delete (globalThis as any)[key];}
  }
});
