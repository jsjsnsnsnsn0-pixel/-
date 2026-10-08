import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRefreshQueue} from '../../src/services/refreshQueue';
const turn=()=>new Promise(resolve=>setTimeout(resolve,15));
test('bursts refresh only their domain and retain changes during an in-flight request',async()=>{
 let calls=0,unrelated=0;let release!:()=>void;
 const blocked=new Promise<void>(resolve=>{release=resolve});
 const queue=createRefreshQueue({messages:async()=>{if(++calls===1)await blocked},wallet:async()=>{unrelated++}},()=>assert.fail('unexpected failure'),0);
 try{
  for(let n=0;n<100;n++)queue.enqueue('messages');
  await turn();assert.equal(calls,1);assert.equal(unrelated,0);
  queue.enqueue('messages');release();await turn();
  assert.equal(calls,2);assert.equal(unrelated,0);
 }finally{release();queue.dispose()}
});
test('one failed domain cannot block others or report errors after account disposal',async()=>{
 const errors:unknown[]=[];let good=0;let reject!:(e:Error)=>void;
 const request=new Promise<void>((_,fail)=>{reject=fail});
 const queue=createRefreshQueue({bad:()=>request,good:async()=>{good++}},e=>errors.push(e),0);
 queue.enqueue('bad','good');await turn();assert.equal(good,1);
 queue.dispose();reject(new Error('old account'));await turn();assert.deepEqual(errors,[]);
 queue.enqueue('good');await turn();assert.equal(good,1);
});
