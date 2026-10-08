import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('room music state checks membership, role, flag, idempotency and realtime',async()=>{
 const sql=await readFile('supabase/migrations/20261007234219_room_music_state.sql','utf8');
 for(const marker of ['private.room_access_allowed','m.role=\'moderator\'',
 'music_enabled','room_music_commands','request_details<>details',
 'room_music_state_read','room_music_control(','supabase_realtime'])
 assert.ok(sql.includes(marker),'missing '+marker);
 assert.ok(!sql.includes('update public.profiles set'));
});
