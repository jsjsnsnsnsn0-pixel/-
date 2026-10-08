import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discoverHomeRooms,flagFromCountryCode,HOME_COUNTRIES} from '../../src/services/roomDiscovery';
import type {Room} from '../../src/types';

const makeRoom=(id:string,flag:string|undefined,usersCount:number,createdAt='2026-10-08T12:00:00.000Z')=>({id,countryFlag:flag,usersCount,createdAt}) as Room;

test('country filters contain only genuine room-owner country matches',()=>{
 const rooms=[makeRoom('iraq-1','🇮🇶',4),makeRoom('saudi','🇸🇦',8),makeRoom('unknown',undefined,11),makeRoom('iraq-2','🇮🇶',15)];
 assert.deepEqual(discoverHomeRooms(rooms,'IQ').map(r=>r.id),['iraq-2','iraq-1']);
 assert.deepEqual(discoverHomeRooms(rooms,'SA').map(r=>r.id),['saudi']);
 assert.deepEqual(discoverHomeRooms(rooms,'EG'),[],'Egypt is a valid country chip but must not fabricate rooms');
 assert.deepEqual(discoverHomeRooms(rooms,'trending').map(r=>r.id),['iraq-2','unknown','saudi','iraq-1']);
 assert.deepEqual(rooms.map(r=>r.id),['iraq-1','saudi','unknown','iraq-2'],'filtering must not mutate app state');
});
test('flags only derive from valid public ISO country codes, never guesses',()=>{
 assert.equal(flagFromCountryCode('iq'),'🇮🇶');
 assert.equal(flagFromCountryCode(' sa '),'🇸🇦');
 assert.equal(flagFromCountryCode('EG'),'🇪🇬');
 for(const v of ['','964','IQ-1','a','unknown',null,undefined,33]){
  assert.equal(flagFromCountryCode(v),undefined);
 }
 const options=HOME_COUNTRIES.map(x=>x.id);
 assert.equal(options.length,new Set(options).size);
 assert.equal(options[0],'trending');
});
