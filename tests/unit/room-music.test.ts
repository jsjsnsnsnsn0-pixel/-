import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RoomMusicPublisher} from '../../src/services/roomMusic';

test('local music volume leaves broadcast untouched and pending resume cannot revive stopped music',async()=>{
  const originals=['Audio','AudioContext'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
  const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
  const connections:unknown[]=[];let played=0,published=0;
  const output={stream:{getAudioTracks:()=>[{stop(){}}]}};
  const gain={gain:{value:1},connect(){},disconnect(){}};
  let resume:()=>Promise<void>=async()=>{};
  Object.defineProperty(globalThis,'Audio',{configurable:true,value:class{src='';pause(){}removeAttribute(){}async play(){played++}}});
  Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:class{
    destination={};createGain(){return gain}createMediaElementSource(){return {connect(node:unknown){connections.push(node)},disconnect(){}}}
    createMediaStreamDestination(){return output}resume(){return resume()}async close(){}
  }});
  URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>{};
  try{
    const music=new RoomMusicPublisher(()=>{});
    music.setLocalVolume(0.25);
    const participant={publishTrack:async()=>{published++},unpublishTrack:async()=>{}};
    await music.start(new File(['song'],'phone.mp3',{type:'audio/mpeg'}),participant,()=>true);
    assert.equal(gain.gain.value,0.25);
    assert.deepEqual(connections,[output,gain]);
    music.setLocalVolume(0);assert.equal(gain.gain.value,0);assert.equal(published,1);
    let release!:()=>void;resume=()=>new Promise<void>(resolve=>{release=resolve});
    const pending=music.resume();music.stop();release();assert.equal(await pending,false);assert.equal(played,1);
    const starting=music.start(new File(['song'],'phone.mp3',{type:'audio/mpeg'}),participant,()=>true);
    music.stop();release();await starting;
    assert.equal(published,1,'stopping during AudioContext resume must prevent publication');
  }finally{
    for(const [key,value] of originals){if(value)Object.defineProperty(globalThis,key,value);else delete(globalThis as any)[key];}
    URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
  }
});

test('music disposal cancels pending publication and cannot start playback after leaving',async()=>{
  let played=0,stopped=0,closed=0,unpublished=0;const names:string[]=[];
  const savedAudio=Object.getOwnPropertyDescriptor(globalThis,'Audio');
  const savedContext=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
  const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
  let resolvePublish!:()=>void;const publication=new Promise<void>(resolve=>{resolvePublish=resolve});
  Object.defineProperty(globalThis,'Audio',{configurable:true,value:class{onended:unknown;onerror:unknown;src='';pause(){}removeAttribute(){}async play(){played++}}});
  Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:class{destination={};createGain(){return {gain:{value:1},connect(){},disconnect(){}}}createMediaElementSource(){return {connect(){},disconnect(){}}}createMediaStreamDestination(){return {stream:{getAudioTracks:()=>[{stop(){stopped++}}]}}}async resume(){}async close(){closed++}}});
  URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>{};
  try {
    const music=new RoomMusicPublisher(name=>names.push(name));
    let allowed=true;
    const pending=music.start(new File(['song'],'phone.mp3',{type:'audio/mpeg'}),{publishTrack:()=>publication,unpublishTrack:async()=>{unpublished++}},()=>allowed);
    await Promise.resolve();allowed=false;music.stop();resolvePublish();await pending;
    assert.equal(played,0);assert.equal(stopped,1);assert.equal(closed,1);assert.equal(unpublished,1,'a cancelled pending publication must be unpublished exactly once');assert.ok(names.every(name=>name===''));
    await assert.rejects(()=>music.start(new File(['song'],'phone.mp3',{type:'audio/mpeg'}),{publishTrack:async()=>{},unpublishTrack:async()=>{}},()=>false),/اختر مقعداً/);
  } finally {
    if(savedAudio)Object.defineProperty(globalThis,'Audio',savedAudio);else delete(globalThis as any).Audio;
    if(savedContext)Object.defineProperty(globalThis,'AudioContext',savedContext);else delete(globalThis as any).AudioContext;
    URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
  }
});


test('music pauses and resumes without touching the published voice session',async()=>{
  let played=0,paused=0,unpublished=0;const names:string[]=[];
  const savedAudio=Object.getOwnPropertyDescriptor(globalThis,'Audio');
  const savedContext=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
  const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
  Object.defineProperty(globalThis,'Audio',{configurable:true,value:class{onended:unknown;onerror:unknown;src='';preload='';paused=true;pause(){paused++;this.paused=true}removeAttribute(){}async play(){played++;this.paused=false}}});
  Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:class{destination={};createGain(){return {gain:{value:1},connect(){},disconnect(){}}}createMediaElementSource(){return {connect(){},disconnect(){}}}createMediaStreamDestination(){return {stream:{getAudioTracks:()=>[{stop(){}}]}}}async resume(){}async close(){}}});
  URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>{};
  try {
    const music=new RoomMusicPublisher(name=>names.push(name));
    await music.start(new File(['song'],'phone.mp3',{type:'audio/mpeg'}),{publishTrack:async()=>{},unpublishTrack:async()=>{unpublished++}},()=>true);
    assert.equal(played,1);
    assert.equal(music.pause(),true);
    assert.equal(paused,1);
    assert.equal(unpublished,0);
    assert.equal(await music.resume(),true);
    assert.equal(played,2);
    assert.equal(unpublished,0);
    music.stop();
    assert.equal(unpublished,1);
    assert.equal(names.at(-1),'');
  } finally {
    if(savedAudio)Object.defineProperty(globalThis,'Audio',savedAudio);else delete(globalThis as any).Audio;
    if(savedContext)Object.defineProperty(globalThis,'AudioContext',savedContext);else delete(globalThis as any).AudioContext;
    URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
  }
});

test('stopping a music track before publishing does not unpublish a track that never existed',async()=>{
 let unpublishCount=0, publishCount=0;
 const savedAudio=Object.getOwnPropertyDescriptor(globalThis,'Audio');
 const savedContext=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
 const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 let releaseResume!:()=>void;
 const resumePromise=new Promise<void>(r=>{releaseResume=r});
 Object.defineProperty(globalThis,'Audio',{configurable:true,value:class{src='';onended:unknown;onerror:unknown;preload='';pause(){}removeAttribute(){}async play(){}}});
 Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:class{
   destination={};createGain(){return {gain:{value:1},connect(){},disconnect(){}}}
   createMediaElementSource(){return {connect(){},disconnect(){}}}
   createMediaStreamDestination(){return {stream:{getAudioTracks:()=>[{stop(){}}]}}}
   resume(){return resumePromise}async close(){}
 }});
 URL.createObjectURL=()=> 'blob:pending';URL.revokeObjectURL=()=>{};
 try{
   const publisher=new RoomMusicPublisher(()=>{});
   const pending=publisher.start(new File(['song'],'test.mp3',{type:'audio/mpeg'}),{
     publishTrack:async()=>{publishCount++},unpublishTrack:async()=>{unpublishCount++}
   },()=>true);
   publisher.stop();
   releaseResume();
   await pending;
   assert.equal(publishCount,0);
   assert.equal(unpublishCount,0,'a never-published track must not be unpublished');
 }finally{
   if(savedAudio)Object.defineProperty(globalThis,'Audio',savedAudio);else delete(globalThis as any).Audio;
   if(savedContext)Object.defineProperty(globalThis,'AudioContext',savedContext);else delete(globalThis as any).AudioContext;
   URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;
 }
});
