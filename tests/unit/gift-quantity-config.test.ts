import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFT_QUANTITIES, normalizeGiftQuantities} from '../../src/utils/giftQuantities';

test('gift quantity selection defaults to the requested options',()=>{
  assert.deepEqual(normalizeGiftQuantities(null), [...DEFAULT_GIFT_QUANTITIES]);
  assert.deepEqual(normalizeGiftQuantities([777,7,1,77]), [777,7,1,77]);
});
test('gift quantity selections reject invalid and duplicate values',()=>{
  assert.deepEqual(normalizeGiftQuantities([1,7,7,0,-1,1.5,100000,'bad']), [1,7]);
  assert.deepEqual(normalizeGiftQuantities([7,77]), [...DEFAULT_GIFT_QUANTITIES]);
});
