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

const agencyView=readFileSync(new URL('./pages-agencies.js',import.meta.url),'utf8');
const compiled=readFileSync(new URL('./build.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
test('full host agencies workspace is limited to Owner and explicitly designated primary partner in UI',()=>{
 assert.match(app,/agencyPrincipal\(\)\&\&allowed\(s\[2\]\)/);
 assert.match(app,/state\.session\?\.primary_partner===true/);
 assert.match(agencyView,/canManage\(\)/);
 assert.match(app,/agency-applications/);
});
test('agency directory, monthly reports and reviews use real RPCs without mocked finance',()=>{
 assert.match(agencyView,/rpc\('agency_directory'\)/);
 assert.match(agencyView,/rpc\('dashboard_monthly_settlements'/);
 assert.match(agencyView,/rpc\('dashboard_agency_registrations'\)/);
 assert.match(agencyView,/rpc\('dashboard_agency_review'/);
 assert.doesNotMatch(agencyView,/Math\.random/);
 assert.doesNotMatch(agencyView,/dashboard_monthly_finalize/);
});
test('new mobile agency workspace styles are included in independent build',()=>{
 assert.match(compiled,/agencies-ui\.css/);
 assert.match(html,/agencies-ui\.css/);
});
