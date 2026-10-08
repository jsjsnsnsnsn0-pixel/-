import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fetchWithDeadline} from '../../src/services/request';
test('stalled requests time out, caller cancellation is retained and writes are never retried',async()=>{
 const original=globalThis.fetch;let attempts=0;
 globalThis.fetch=async(_input,init)=>{
  attempts++;
  return await new Promise<Response>((_,reject)=>{
   if(init?.signal?.aborted){reject(init.signal.reason);return}
   init?.signal?.addEventListener('abort',()=>reject(init.signal?.reason),{once:true});
  });
 };
 try{
  await assert.rejects(()=>fetchWithDeadline('https://test.invalid',{method:'POST'},5),{name:'TimeoutError'});
  assert.equal(attempts,1);
  const caller=new AbortController();caller.abort(new Error('caller cancelled'));
  await assert.rejects(()=>fetchWithDeadline('https://test.invalid',{signal:caller.signal},5),/caller cancelled/);
  assert.equal(attempts,2);
 }finally{globalThis.fetch=original}
});
