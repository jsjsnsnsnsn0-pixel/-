import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {RoomCard} from '../../src/components/rooms/RoomCard';
import {emptyUser} from '../../src/services/profile';
import {Room} from '../../src/types';

test('each room card has one native action and cannot fabricate a VIP level',async()=>{
  const dom=new JSDOM('<div id="root"></div>');
  const names=['window','document','navigator','IS_REACT_ACT_ENVIRONMENT'];const saved=names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)] as const);
  for(const n of names)Object.defineProperty(globalThis,n,{configurable:true,value:n==='IS_REACT_ACT_ENVIRONMENT'?true:(dom.window as any)[n]});
  const root=createRoot(dom.window.document.getElementById('root')!);
  const room={id:'long-room-uuid',title:'غرفة ذات اسم طويل للاختبار',coverImage:'',owner:emptyUser,isVIP:true,usersCount:0,category:'عامة'} as Room;
  let joins=0;
  try {
    for(const variant of ['standard','featured'] as const){
      await act(async()=>root.render(React.createElement(RoomCard,{room,variant,onJoin:()=>{joins++;}})));
      const actions=dom.window.document.querySelectorAll('button');assert.equal(actions.length,1);
      assert.equal(actions[0].getAttribute('aria-label'),`دخول غرفة ${room.title}`);
      await act(async()=>actions[0].click());assert.doesNotMatch(dom.window.document.body.textContent||'',/VIP\s*[1-9]/);
    }
    assert.equal(joins,2);
  } finally {await act(async()=>root.unmount());dom.window.close();for(const [n,d] of saved){if(d)Object.defineProperty(globalThis,n,d);else delete (globalThis as any)[n];}}
});
