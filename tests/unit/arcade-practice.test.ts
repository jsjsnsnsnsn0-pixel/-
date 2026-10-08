import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ARCADE_SYMBOLS,arcadeMatch,pickArcadeIndex} from '../../src/services/arcadePractice';
import {TotiArcade} from '../../src/components/screens/ui/TotiArcade';

test('all no-stake arcade selection indices are bounded and never touch balances',()=>{
 for(let length=1;length<=9;length++){
  assert.equal(pickArcadeIndex(length,()=>0),0);
  assert.equal(pickArcadeIndex(length,()=>0.999999999),length-1);
  assert.equal(pickArcadeIndex(length,()=>0.5),Math.floor(length*.5));
 }
 for(const invalid of [0,-1,101,1.2])assert.throws(()=>pickArcadeIndex(invalid,()=>0),RangeError);
 for(const invalid of [-1,1,NaN])assert.throws(()=>pickArcadeIndex(3,()=>invalid),RangeError);
 assert.equal(ARCADE_SYMBOLS.length,6);
 assert.equal(arcadeMatch(['⭐','⭐','⭐']),true);
 assert.equal(arcadeMatch(['⭐','🌷','⭐']),false);
 assert.equal(arcadeMatch([]),false);
});
test('original arcade contains six actionable local games and honest no-wager labels',async()=>{
 const html=renderToStaticMarkup(React.createElement(TotiArcade));
 for(const name of ['عجلة الألوان','البيض السحري','حديقة توتي','مغلفات المفاجآت','تحدي المربعات','تطابق الرموز']){
  assert.match(html,new RegExp(name));
  assert.match(html,new RegExp('aria-label="اختيار لعبة '+name+'"'));
 }
 const game=await readFile('src/components/screens/ui/TotiArcade.tsx','utf8');
 assert.match(game,/لا تُحفظ بالسيرفر ولا تمنح كوينز أو ماس/);
 assert.doesNotMatch(game,/supabase|rpc\(|wallet_transactions|diamond_lots|store_purchases/);
 const lobby=await readFile('src/components/screens/LuckGamesScreen.tsx','utf8');
 assert.match(lobby,/<TotiArcade\/>/);
 assert.match(lobby,/rpc\('play_fun_game'/,'existing genuine server games must remain wired');
});
