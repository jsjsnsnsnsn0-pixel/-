import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newestRooms} from '../../src/services/newestRooms';

test('new rooms order uses server creation time rather than reversing a list',()=>{
  const source=[
    {id:'new',createdAt:'2026-10-08T14:00:00Z'},
    {id:'old',createdAt:'2026-10-06T14:00:00Z'},
    {id:'middle',createdAt:'2026-10-07T14:00:00Z'},
    {id:'unknown',createdAt:'invalid'},
  ];
  assert.deepEqual(newestRooms(source).map(room=>room.id), ['new','middle','old','unknown']);
  assert.deepEqual(source.map(room=>room.id), ['new','old','middle','unknown'], 'input must remain unchanged');
});
test('equal or missing dates preserve existing stable room order',()=>{
  assert.deepEqual(newestRooms<{id:string;createdAt?:string}>([{id:'a'},{id:'b'},{id:'c'}]).map(r=>r.id),['a','b','c']);
});
