import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readRoomOwnerCountries} from '../../src/services/roomOwnerCountries';

test('room discovery respects own-profile RLS and resolves genuine public owner country',async()=>{
 let calls=0;
 const owners=[
  {owner_id:'me',owner_public_id:11},
  {owner_id:'external-1',owner_public_id:700100},
  {owner_id:'external-2',owner_public_id:700100},
  {owner_id:'no-id',owner_public_id:null},
 ];
 const lookup=async(publicId:string)=>{calls++;assert.equal(publicId,'700100');return 'iq';};
 const found=await readRoomOwnerCountries(owners,'me','SA',lookup);
 assert.equal(found.get('me'),'SA');
 assert.equal(found.get('external-1'),'IQ');
 assert.equal(found.get('external-2'),'IQ');
 assert.equal(found.has('no-id'),false);
 assert.equal(calls,1,'same public owner must be fetched once');
 const foundAgain=await readRoomOwnerCountries(owners,'me','SA',lookup);
 assert.equal(foundAgain.get('external-1'),'IQ');
 assert.equal(calls,1,'short-lived public metadata cache limits mobile requests');
});
test('missing or denied public country metadata never turns into a guessed flag',async()=>{
 const owner=[{owner_id:'restricted-owner',owner_public_id:700201}];
 const missing=await readRoomOwnerCountries(owner,'me',undefined,async()=>{throw new Error('Access denied')});
 assert.equal(missing.size,0,'room should remain visible but without country');
 const other=[{owner_id:'different-owner',owner_public_id:700202}];
 const invalid=await readRoomOwnerCountries(other,'me',undefined,async()=> 'unknown');
 assert.equal(invalid.size,0,'invalid ISO values must be ignored');
});
