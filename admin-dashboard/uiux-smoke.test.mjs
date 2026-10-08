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
