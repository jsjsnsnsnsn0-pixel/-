import {test} from 'node:test';
import assert from 'node:assert/strict';
import {acceptedFriendOwnerIds} from '../../src/services/friendRoomOwners';

test('only accepted friendships owned by the signed-in user can populate friend rooms',()=>{
  const owners = acceptedFriendOwnerIds('me', [
    {user_a:'me',user_b:'friend-a',status:'accepted'},
    {user_a:'friend-b',user_b:'me',status:'accepted'},
    {user_a:'me',user_b:'pending',status:'pending'},
    {user_a:'someone',user_b:'stranger',status:'accepted'},
    {user_a:'me',user_b:'me',status:'accepted'},
    {user_a:'me',user_b:'friend-a',status:'accepted'},
  ]);
  assert.deepEqual([...owners].sort(), ['friend-a','friend-b']);
  assert.equal(owners.has('pending'),false);
  assert.equal(owners.has('stranger'),false);
});
test('empty or missing login never exposes another user friendship',()=>{
  const rows = [{user_a:'other',user_b:'their-friend',status:'accepted'}];
  assert.equal(acceptedFriendOwnerIds('',rows).size,0);
  assert.equal(acceptedFriendOwnerIds('me',rows).size,0);
});
