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
