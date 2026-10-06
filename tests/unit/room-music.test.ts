import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RoomMusicPublisher} from '../../src/services/roomMusic';

test('music disposal cancels pending publication and cannot start playback after leaving',async()=>{
  let played=0,stopped=0,closed=0,unpublished=0;const names:string[]=[];
  const savedAudio=Object.getOwnPropertyDescriptor(globalThis,'Audio');
  const savedContext=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
  const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
  let resolvePublish!:()=>void;const publication=new Promise<void>(resolve=>{resolvePublish=resolve});
  Object.defineProperty(globalThis,'Audio',{configurable:true,value:class{onended:unknown;onerror:unknown;src='';pause(){}removeAttribute(){}async play(){played++}}});
  Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:class{destination={};createMediaElementSource(){return {connect(){},disconnect(){}}}createMediaStreamDestination(){return {stream:{getAudioTracks:()=>[{stop(){stopped++}}]}}}async resume(){}async close(){closed++}}});
  URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>{};
  try {
    const music=new RoomMusicPublisher(name=>names.push(name));
    let allowed=true;
    const pending=music.start(new File(['song'],'phone.mp3',{type:'audio/mpeg'}),{publishTrack:()=>publication,unpublishTrack:async()=>{unpublished++}},()=>allowed);
    await Promise.resolve();allowed=false;music.stop();resolvePublish();await pending;
    assert.equal(played,0);assert.equal(stopped,1);assert.equal(closed,1);assert.ok(unpublished>=1);assert.ok(names.every(name=>name===''));
    await assert.rejects(()=>music.start(new File(['song'],'phone.mp3',{type:'audio/mpeg'}),{publishTrack:async()=>{},unpublishTrack:async()=>{}},()=>false),/اختر مقعداً/);
  } finally {
    if(savedAudio)Object.defineProperty(globalThis,'Audio',savedAudio);else delete(globalThis as any).Audio;
    if(savedContext)Object.defineProperty(globalThis,'AudioContext',savedContext);else delete(globalThis as any).AudioContext;
    URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
  }
});
