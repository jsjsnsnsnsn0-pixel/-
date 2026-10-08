import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyUser, editableProfile, profileToUser, countryFlag } from '../../src/services/profile';
test('profile identity and balances come from the database', () => {
  const user = profileToUser({id: 'auth-id', public_id: 920003, display_name: 'أحمد', gold: 27, diamonds: 10, level: 2});
  assert.equal(user.id, '920003'); assert.equal(user.authId, 'auth-id'); assert.equal(user.gold, 27);
  assert.equal(user.name, 'أحمد'); assert.equal(user.level, 2);
});
test('editable profile excludes financial and privileged fields', () => {
  const result = editableProfile({...emptyUser, id: '30301', name: ' اسم ', gold: 100000, vipLevel: 8});
  for (const field of ['id','public_id','gold','diamonds','vip_level','level','silver_coins','sent_gold']) assert.equal(field in result, false);
  assert.equal(result.display_name, 'اسم');
});
test('optional fields use safe defaults and raw numeric totals', () => {
  const user = profileToUser({public_id: 1, sent_gold: 1000, received_gold: 2500});
  assert.equal(user.gold,0); assert.equal(user.sentGiftsCount,'1000'); assert.equal(user.receivedTotal,'2500');
  assert.equal(user.charmLevel,undefined); assert.equal(user.vipLevel,0);
});
test('country flags reject invalid codes', () => {
  assert.equal(countryFlag('IQ'),'🇮🇶'); assert.equal(countryFlag('INVALID'),'');
});

test('expired VIP does not display an active privilege and social counters are server-backed', () => {
  const user = profileToUser({vip_level:8,vip_expires_at:'2000-01-01T00:00:00Z',friends_count:2,followers_count:0,visitors_count:3});
  assert.equal(user.vipLevel,0);assert.equal(user.friendsCount,2);assert.equal(user.followersCount,0);assert.equal(user.visitorsCount,3);
});

test('wealth and charm ranks remain hidden unless the server supplies them',()=>{
  const user=profileToUser({level:99,sent_gold:16000,received_gold:20000});
  assert.equal(user.wealthLevel,undefined);assert.equal(user.charmLevel,undefined);
  const zero=profileToUser({level:99});assert.equal(zero.sentGiftsCount,'0');assert.equal(zero.receivedTotal,'0');assert.equal(zero.wealthLevel,undefined);assert.equal(zero.charmLevel,undefined);
});
