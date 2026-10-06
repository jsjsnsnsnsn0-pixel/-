import {test} from 'node:test';
import assert from 'node:assert/strict';
import {backDestination,dismissTopOverlay,isTopOverlay,registerOverlay} from '../../src/services/overlayNavigation';

test('Back dismisses only the top overlay and removes stale registrations',()=>{
  const closed:string[]=[];const parent=registerOverlay(()=>closed.push('parent'));const child=registerOverlay(()=>closed.push('child'));
  assert.equal(isTopOverlay(parent.token),false);assert.equal(isTopOverlay(child.token),true);
  assert.equal(dismissTopOverlay(),true);assert.deepEqual(closed,['child']);child.remove();
  dismissTopOverlay();assert.deepEqual(closed,['child','parent']);parent.remove();assert.equal(dismissTopOverlay(),false);
});
test('Back preserves room session and uses options before leaving',()=>{
  assert.equal(backDestination({subScreen:'home',tab:'home',inRoom:true}),'screen');
  assert.equal(backDestination({subScreen:null,tab:'home',inRoom:true}),'room-options');
  assert.equal(backDestination({subScreen:null,tab:'messages',inRoom:false}),'home');
  assert.equal(backDestination({subScreen:null,tab:'home',inRoom:false}),'minimize-app');
});
