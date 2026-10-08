import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseGiftAnnouncement,enqueueAnnouncement} from '../../src/services/giftAnnouncements';
const now=Date.now();
const row={id:'gift-1',room_id:'room-a',gift_id:'g1',gift_name:'وردة',sender_name:'ليلى',recipient_name:'أحمد',created_at:new Date(now).toISOString()};
test('announcement requires complete public snapshots and rejects stale or malformed events',()=>{
 assert.equal(parseGiftAnnouncement(row,now)?.gift_name,'وردة');
 for(const value of [{...row,sender_name:null},{...row,room_id:''},{...row,created_at:'invalid'},{...row,created_at:new Date(now-20001).toISOString()},{...row,created_at:new Date(now+5001).toISOString()}])assert.equal(parseGiftAnnouncement(value,now),null);
 assert.equal('sender_id' in parseGiftAnnouncement({...row,sender_id:'private-uuid'},now)!,false);
});
test('global queue deduplicates, caps busy events and expires old waiting events',()=>{
 const a=parseGiftAnnouncement(row,now)!;
 assert.deepEqual(enqueueAnnouncement([a],a,now),[a]);
 const full=['a','b','c'].map(id=>({...a,id}));
 assert.deepEqual(enqueueAnnouncement(full,{...a,id:'d'},now).map(item=>item.id),['b','c','d']);
 assert.deepEqual(enqueueAnnouncement([{...a,created_at:new Date(now-21000).toISOString()}],{...a,id:'new'},now).map(item=>item.id),['new']);
});
