import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('listeners can see the current track but cannot invoke room-wide music commands',async()=>{
 const temp=await mkdtemp(join(process.cwd(),'.music-controls-'));
 try{
  await build({
   stdin:{contents:"export {RoomStage} from './src/components/rooms/ui/RoomStage';",resolveDir:process.cwd(),loader:'tsx'},
   bundle:true,platform:'node',format:'esm',packages:'external',outfile:join(temp,'stage.mjs'),
   loader:{'.css':'empty'},
   plugins:[{name:'isolate-music-ui',setup(b){
    b.onResolve({filter:/RoomMusicPanel$/},()=>({path:'panel',namespace:'test'}));
    b.onResolve({filter:/useDismissableLayer$/},()=>({path:'hook',namespace:'test'}));
    b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:args.path==='panel'
     ?'export const RoomMusicPanel=()=>null;'
     :'export const useDismissableLayer=()=>({current:null});'
    }));
   }}]
  });
  const {RoomStage}=await import(pathToFileURL(join(temp,'stage.mjs')).href);
  const base={title:'Room',cover:'/room.png',count:2,welcome:'',seats:null,messages:[],chatEnabled:true,
   text:'',sending:false,muted:true,micBusy:false,seated:false,speaker:true,handRaised:false,
   audioConnected:true,musicName:'Song.mp3',musicPaused:false,
   onText:()=>{},onSend:()=>{},onInfo:()=>{},onUsers:()=>{},onExit:()=>{},onGift:()=>{},onMic:()=>{},
   onSpeaker:()=>{},onHand:()=>{},onLeaveSeat:()=>{},onManage:()=>{},onMessages:()=>{}
  };
  const listener=renderToStaticMarkup(React.createElement(RoomStage,{...base,canModerate:false,canControlMusic:false}));
  assert.match(listener,/Song\.mp3/,'listeners must see the track name');
  assert.doesNotMatch(listener,/aria-label="إيقاف الموسيقى مؤقتاً"/);
  assert.doesNotMatch(listener,/>إيقاف<\/button>/,'listeners must not see the stop command');
  const moderator=renderToStaticMarkup(React.createElement(RoomStage,{...base,canModerate:true,canControlMusic:true}));
  assert.match(moderator,/aria-label="إيقاف الموسيقى مؤقتاً"/);
  assert.match(moderator,/>إيقاف<\/button>/);
 }finally{await rm(temp,{recursive:true,force:true})}
});
