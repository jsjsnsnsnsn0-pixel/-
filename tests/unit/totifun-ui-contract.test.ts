import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('TotiFun UI preserves all actual backend games, user history and no-wager rules',async()=>{
 const source=await readFile('src/components/screens/LuckGamesScreen.tsx','utf8');
 for(const name of ["play('dice')","play('rps')","play('lucky_bag')","rpc('play_fun_game'","from('game_results')"]) {
  assert.ok(source.includes(name),`missing functional TotiFun path: ${name}`);
 }
 assert.match(source,/aria-pressed=\{rpsChoice===id\}/);
 assert.match(source,/role="status" aria-live="polite"/);
 assert.match(source,/نقاط آخر \{resultsCount\} جولة محفوظة/);
 assert.match(source,/بدون رهان أو خصم كوينز/);
 assert.doesNotMatch(source,/Math\.random\s*\(/,'game outcomes must come from protected RPC, not client RNG');
 assert.doesNotMatch(source,/profiles.*\.(update|insert)\s*\(/,'game UI must not manipulate balances');
 assert.doesNotMatch(source,/مبروك.*(كوينز|ماس)|فزت.*(كوينز|ماس)/,'no misleading cash/gem prize copy');
});
