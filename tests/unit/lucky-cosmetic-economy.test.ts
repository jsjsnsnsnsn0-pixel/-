import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('production lucky rewards stay server-side and cosmetic-only',async()=>{
  const sql=await readFile('supabase/migrations/20261007215631_lucky_gifts_safe_rewards.sql','utf8');
  for(const marker of [
    'create table if not exists public.lucky_results',
    'create table if not exists public.lucky_point_balances',
    'gift_events_lucky_reward',
    'pg_advisory_xact_lock',
    'floor(random()*total_weight)',
    'private.require_owner()',
  ]) assert.ok(sql.includes(marker), 'missing financial safety marker: '+marker);
  assert.ok(!sql.includes('update public.profiles set diamonds='));
  assert.ok(!sql.includes('insert into public.diamond_lots'));
});
