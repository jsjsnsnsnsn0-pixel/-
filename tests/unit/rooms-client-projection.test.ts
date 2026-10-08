import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('the mobile room listing uses a security-invoker projection without room passwords',async()=>{
 const sql=await readFile('supabase/migrations/20261008170000_rooms_client_security_invoker_projection.sql','utf8');
 assert.match(sql,/create or replace view public\.rooms_client[\s\S]*security_invoker\s*=\s*true/);
 assert.match(sql,/grant select on public\.rooms_client to authenticated/);
 assert.match(sql,/from public\.rooms/);
 const projection=sql.slice(sql.indexOf('as\nselect'),sql.indexOf('from public.rooms;'));
 assert.doesNotMatch(projection,/password_hash/);
 assert.doesNotMatch(sql,/drop table|alter table public\.rooms|revoke .* from authenticated/i);
 const source=await readFile('src/context/AppContext.tsx','utf8');
 assert.match(source,/from\('rooms_client'\)\.select\('\*'\)/);
 assert.doesNotMatch(source,/from\('rooms'\)\.select\('\*'\)/);
});
