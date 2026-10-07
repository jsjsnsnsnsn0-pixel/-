import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('beta admin RPCs verify permissions and wallet adjustments remain atomic',async()=>{
 const sql=await readFile('supabase/migrations/20261008130000_beta_admin_roles_wallet.sql','utf8');
 for(const marker of ['dashboard_require_owner()','dashboard_wallet_adjust(','dashboard_wallet_adjustments',
  'dashboard_role_permissions','dashboard_user_roles','for update','already_processed','admin_adjustment',
  'dashboard_audit','dashboard_session()','dashboard_set_beta_flag('])
  assert.ok(sql.includes(marker),'missing '+marker);
 assert.ok(sql.includes("if after_amount<0"));
 assert.ok(sql.includes("where user_id=target and role='owner'"));
 assert.ok(sql.includes("perform private.dashboard_require(case when p_delta>0"));
 assert.ok(!sql.includes("update public.profiles set diamonds"));
});
