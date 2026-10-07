import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('production lucky rewards stay server-side and cosmetic-only',async()=>{
  const sql=await readFile('supabase/migrations/20261008102000_lucky_gifts_safe_rewards.sql','utf8');
  assert.match(sql,/create table if not exists public\\.lucky_results/);
  assert.match(sql,/create table if not exists public\\.lucky_point_balances/);
  assert.match(sql,/gift_events_lucky_reward/);
  assert.match(sql,/pg_advisory_xact_lock/);
  assert.match(sql,/floor\\(random\\(\\)\\*total_weight\\)/);
  assert.match(sql,/private\\.require_owner\\(\\)/);
  assert.doesNotMatch(sql,/update public\\.profiles set (?:gold|diamonds)/i);
  assert.doesNotMatch(sql,/insert into public\\.diamond_lots/i);
});
