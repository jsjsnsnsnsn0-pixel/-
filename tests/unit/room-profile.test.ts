import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicProfileCard,seatPublicProfile,publicId} from '../../src/services/roomPublicProfile';
import {emptyUser,defaultAvatar,roomMemberToUser} from '../../src/services/profile';
import {isSpeakingSamples} from '../../src/utils/audioActivity';
test('ordinary public profile has no fabricated VIP, ranks, CP, agency or country',()=>{
  const card=publicProfileCard({public_id:451306,display_name:'B',level:0,vip_level:0});
  assert.equal(card.level,0);assert.equal(card.vipLevel,0);
  for(const field of (['charmLevel','wealthLevel','couple','agency','countryCode','countryFlag'] as const))assert.equal(card[field],undefined);
});
test('missing and zero values do not become example levels or IDs',()=>{
  const missing=publicProfileCard({display_name:'B',vip_level:null});
  assert.equal(missing.id,'');assert.equal(missing.avatar,defaultAvatar);assert.equal(missing.level,undefined);assert.equal(missing.vipLevel,0);
  const zero=publicProfileCard({level:0,charm_level:0,wealth_level:0});
  assert.equal(zero.level,0);assert.equal(zero.charmLevel,0);assert.equal(zero.wealthLevel,0);
  for(const value of [null,undefined,'1331 example',-1,'',Number.MAX_SAFE_INTEGER+1])assert.equal(publicId(value),'');
});
test('public presentation strips all private and financial fields',()=>{
  const card=publicProfileCard({public_id:451306,id:'private-uuid',email:'private@example.invalid',phone:'private-phone',gold:1000,auth_metadata:{admin:true},display_name:'B',level:4,vip_level:2,avatar_url:'/real-avatar.png',country_code:'EG',gender:'female'});
  assert.equal(card.id,'451306');assert.equal(card.avatar,'/real-avatar.png');assert.equal(card.level,4);assert.equal(card.vipLevel,2);assert.equal(card.countryFlag,'🇪🇬');assert.equal(card.gender,'female');
  for(const field of ['authId','email','phone','gold','auth_metadata'])assert.equal(field in card,false);
});
test('seat snapshot uses B and never invents missing ranks or membership',()=>{
  const member=roomMemberToUser({user_id:'B-uuid',member_public_id:451306,member_display_name:'B',member_avatar_url:'/B.png',member_level:0,member_vip_level:0});
  const card=seatPublicProfile(member);
  assert.equal(member.authId,'B-uuid');assert.equal(card.name,'B');assert.equal(card.id,'451306');assert.equal(card.level,0);assert.equal(card.vipLevel,0);assert.equal(card.charmLevel,undefined);assert.equal(card.wealthLevel,undefined);
  const incomplete=seatPublicProfile(roomMemberToUser({member_display_name:'B'}));assert.equal(incomplete.id,'');assert.equal(incomplete.level,undefined);
  assert.equal(seatPublicProfile({...emptyUser,name:'B',agencyName:'Unverified',coupleName:'Unverified',countryCode:'IQ'}).agency,undefined);
  assert.equal(seatPublicProfile({...member,vipLevel:8}).vipLevel,0); // Raw snapshots are not effective VIP entitlements.
});
test('speaking indicator requires real signal energy and an unmuted microphone',()=>{
  assert.equal(isSpeakingSamples(new Uint8Array(256).fill(128),false),false);
  assert.equal(isSpeakingSamples(new Uint8Array(256).fill(150),false),true);
  assert.equal(isSpeakingSamples(new Uint8Array(256).fill(150),true),false);
  assert.equal(isSpeakingSamples(new Uint8Array(),false),false);
});
