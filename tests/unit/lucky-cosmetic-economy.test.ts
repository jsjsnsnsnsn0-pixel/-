import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('cosmetic lucky bonuses never mutate financial balances',async()=>{
  const sql=await readFile('supabase/migrations/20261008120000_cosmetic_lucky_rewards.sql','utf8');
  assert.match(sql,/after insert on public\.gift_events/);
  assert.match(sql,/gift_event_id uuid primary key/);
  assert.match(sql,/random\(\)\*v_total/);
  assert.match(sql,/pg_advisory_xact_lock/);
  assert.match(sql,/lucky_points bigint not null/);
  assert.doesNotMatch(sql,/update public\.profiles set (?:gold|diamonds)/i);
  assert.doesNotMatch(sql,/insert into public\.diamond_lots/i);
  assert.doesNotMatch(sql,/insert into public\.wallet_transactions/i);
});
