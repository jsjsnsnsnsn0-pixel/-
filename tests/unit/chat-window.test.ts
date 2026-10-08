import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recentChatMessages} from '../../src/services/chatWindow';

test('long chats render newest 80 messages in chronological order',()=>{
 const history=Array.from({length:1000},(_,i)=>({id:i+1}));
 const visible=recentChatMessages(history,80);
 assert.equal(visible.length,80);
 assert.equal(visible[0].id,921);
 assert.equal(visible.at(-1)?.id,1000);
 assert.equal(history.length,1000,'never delete database-backed messages');
});
test('older history can be progressively revealed without duplicating messages',()=>{
 const history=Array.from({length:170},(_,i)=>i);
 assert.deepEqual(recentChatMessages(history,80),history.slice(90));
 assert.deepEqual(recentChatMessages(history,160),history.slice(10));
 assert.deepEqual(recentChatMessages(history,240),history);
});
test('short or empty conversations remain complete and malformed limits are safe',()=>{
 assert.deepEqual(recentChatMessages(['a','b'],80),['a','b']);
 assert.deepEqual(recentChatMessages([],80),[]);
 assert.deepEqual(recentChatMessages(['a','b'],Number.NaN),['a','b']);
});
