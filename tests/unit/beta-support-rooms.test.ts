import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('beta room moderation is server-authorized and auditable',async()=>{
 const sql=await readFile('supabase/migrations/20261007234300_beta_support_rooms.sql','utf8');
 for (const clause of [
  "private.dashboard_require('reports.view')","private.dashboard_require('reports.manage')",
  "private.dashboard_require('rooms.view')","private.dashboard_require('rooms.close')",
  "for update","room_closed","room_moderation_log","dashboard_audit"
 ]) assert.ok(sql.includes(clause),'missing '+clause);
 assert.ok(!sql.includes('delete from public.rooms'));
});
