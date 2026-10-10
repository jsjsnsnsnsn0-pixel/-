import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./styles.css',import.meta.url),'utf8');
const core=readFileSync(new URL('./pages-core.js',import.meta.url),'utf8');
test('OAuth returns to the standalone dashboard, never the consumer app',()=>{
 assert.match(app,/new URL\(window\.location\.pathname,window\.location\.origin\)/);
 assert.doesNotMatch(app,/github\.io\/TotiChat/);
 assert.match(app,/dashboard_session/);
});
test('role-aware navigation remains intact with mobile accessibility',()=>{
 assert.match(app,/sections\.filter\(visible\)/);
 assert.match(app,/aria-current/);
 assert.match(app,/aria-expanded/);
 assert.match(app,/closeNav/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/focus-visible/);
});
test('overview continues to use authenticated Supabase RPC, not mock counters',()=>{
 assert.match(core,/rpc\('dashboard_overview'\)/);
 assert.match(core,/allowed\(permission\)/);
 assert.doesNotMatch(core,/Math\.random/);
});

const approved=readFileSync(new URL('./approved-theme.css',import.meta.url),'utf8');
const reference=readFileSync(new URL('./approved-20261007-original.html',import.meta.url),'utf8');
const build=readFileSync(new URL('./build.mjs',import.meta.url),'utf8');
test('approved Oct 7 dashboard is preserved as the visual reference',()=>{
 assert.match(reference,/TotiChat Admin Dashboard — Prototype/);
 assert.match(reference,/id="globalSearch"/);
 assert.match(reference,/data-page="agencies"/);
 assert.match(approved,/--purple:#9d63ff/);
 assert.match(approved,/approvedOwnerPill/);
 assert.match(build,/approved-theme\.css/);
});
test('original search and dashboard use real authenticated APIs in production interface',()=>{
 assert.match(app,/state\.userSearchQuery/);
 assert.match(app,/state\.section='users'/);
 assert.match(core,/rpc\('dashboard_users'/);
 assert.match(core,/rpc\('dashboard_audit_history'/);
 assert.match(core,/rpc\('dashboard_overview'/);
 assert.doesNotMatch(core,/128,420/);
 assert.doesNotMatch(core,/Math\.random/);
});
test('restricted agency pages require owner or trusted partner flag in UI',()=>{
 assert.match(app,/state\.session\?\.primary_partner===true/);
 assert.match(app,/principal\(\)\&\&allowed/);
});

const liveFrontend=readFileSync(new URL('./approved-front.js',import.meta.url),'utf8');
const liveHTML=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const liveCSS=readFileSync(new URL('./approved-front.css',import.meta.url),'utf8');
test('root uses Owner-approved look with real authentication gate',()=>{
 assert.ok(liveHTML.includes('id="dashboardShell" hidden'));
 assert.ok(liveHTML.includes('id="authGate"'));
 assert.ok(liveHTML.includes('src="/approved-front.js"'));
 assert.ok(liveHTML.includes('id="globalSearch"'));
 assert.ok(liveHTML.includes('class="stats"'));
 assert.ok(liveHTML.includes('class="agency-grid"'));
 assert.ok(!liveHTML.includes('const users=['));
 assert.ok(!liveHTML.includes('128,420'));
});
test('connected frontend reads real Supabase data without fake seeds',()=>{
 assert.ok(!liveFrontend.includes('const users=['));
 assert.ok(!liveFrontend.includes('Math.random'));
 for(const fn of ['dashboard_overview','dashboard_users','dashboard_agency_registrations','dashboard_audit_history']){
  assert.ok(liveFrontend.includes("rpc('"+fn+"'"));
 }
});
test('Owner and trusted partner have distinct permissions from DB employee',()=>{
 assert.ok(liveFrontend.includes('primary_partner===true'));
 assert.ok(liveFrontend.includes('if(isDB())return false'));
 assert.ok(liveFrontend.includes("id==='agency-requests'"));
 assert.ok(liveFrontend.includes("id==='agencies'&&!principal()"));
});
test('unverified prototype controls are disabled, never faked',()=>{
 assert.ok(liveFrontend.includes("removeAttribute('onclick')"));
 assert.ok(liveFrontend.includes('x.disabled=true'));
 assert.ok(liveCSS.includes('[hidden]'));
});

const roleCreate=readFileSync(new URL('./pages-role-create.js',import.meta.url),'utf8');
const staffRolePage=readFileSync(new URL('./pages-roles.js',import.meta.url),'utf8');
test('add-role action lists all agreed identities without creating Owner or partner duplicates',()=>{
 for(const id of ['owner','primary_partner','extra_super','admin','support','db','charging_agent','host_agent'])
  assert.ok(roleCreate.includes("key:'"+id+"'"));
 assert.ok(roleCreate.includes('＋ إضافة رتبة'));
 assert.ok(roleCreate.includes('readonly:true'));
 assert.ok(roleCreate.includes("role.key==='owner'"));
 assert.ok(roleCreate.includes("role.key==='primary_partner'"));
 assert.ok(staffRolePage.includes('addRoleToolbar(work,data)'));
});
test('new role editor keeps charging/host app-only and DB limited to opening host agencies',()=>{
 assert.ok(roleCreate.includes('صلاحيات داخل تطبيق TotiChat فقط'));
 assert.ok(roleCreate.includes('فتح وكالات المضيفين'));
 assert.ok(roleCreate.includes('agency_manager'));
 assert.ok(roleCreate.includes('blockedForAdmin'));
 assert.ok(roleCreate.includes('permissions'));
 assert.ok(roleCreate.includes('dashboard_save_role'));
});
test('role editor is included in deployable frontend and Super Admin template stays read-only',()=>{
 assert.ok(build.includes("'pages-role-create.js'"));
 assert.ok(staffRolePage.includes("picker.value==='super_admin'"));
});
