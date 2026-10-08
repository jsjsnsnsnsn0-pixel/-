import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validatedProfileCP} from '../../src/services/roomPublicProfile';
const relation={subject_public_id:451306,relation_id:'a1e00000-0000-4000-8000-000000000001',type_id:'love',accepted_at:'2026-05-01T00:00:00Z',ended_at:null,partner:{public_id:451305,display_name:'A'},days:159};
test('CP display rejects ended, mismatched, malformed, wrong-type and self-linked records',()=>{
 assert.equal(validatedProfileCP(relation,'451306')?.partner.id,'451305');
 for(const bad of [{...relation,subject_public_id:451305},{...relation,ended_at:'2026-10-06'},{...relation,accepted_at:null},{...relation,accepted_at:'invalid'},{...relation,type_id:'unknown'},{...relation,relation_id:'invalid'},{...relation,partner:{public_id:451306}},{partner:relation.partner,days:159}])assert.equal(validatedProfileCP(bad,'451306'),undefined);
 assert.equal(validatedProfileCP(null,'451306'),undefined);
 assert.equal(validatedProfileCP({...relation,type_id:'sibling'},'451306','sibling')?.partner.id,'451305');
});
test('target CP uses only validated profile_relationships, and null/error clears even a stale viewer relationship',async()=>{
 const temp=await mkdtemp(join(process.cwd(),'.cp-test-'));
 let cp:unknown=relation,fail=false;const calls:string[]=[];
 (globalThis as any).__profileCPClient={rpc:async(name:string,p:any)=>{calls.push(name);return name==='social_profile'?{data:{public_id:p.p_public_id,display_name:'Target'},error:null}:name==='profile_relationships'?{data:cp?[cp]:[],error:fail?{message:'unavailable'}:null}:name==='couple_state'?{data:{relations:[{accepted_at:relation.accepted_at,ended_at:null,partner:relation.partner}]},error:null}:{data:{agency:null,members:[]},error:null}}};
 try{
  await build({stdin:{contents:"export {loadRoomPublicProfile} from './src/services/roomPublicProfile';",resolveDir:process.cwd(),loader:'ts'},outfile:join(temp,'bundle.mjs'),bundle:true,packages:'external',platform:'node',format:'esm',plugins:[{name:'client',setup(b){b.onResolve({filter:/\/services\/supabase$|^\.\/supabase$/},()=>({path:'client',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const supabase=globalThis.__profileCPClient;'}))}}]});
  const {loadRoomPublicProfile}=await import(pathToFileURL(join(temp,'bundle.mjs')).href);
  assert.equal((await loadRoomPublicProfile('451306','451305')).couple?.partner.id,'451305');
  cp=null;assert.equal((await loadRoomPublicProfile('451306','451305')).couple,undefined);
  cp=relation;fail=true;assert.equal((await loadRoomPublicProfile('451306','451305')).couple,undefined);
  assert.equal(calls.includes('couple_state'),false);
  fail=false;cp={...relation,subject_public_id:451305};assert.equal((await loadRoomPublicProfile('451306','451305')).couple,undefined);
 }finally{await rm(temp,{recursive:true,force:true});delete (globalThis as any).__profileCPClient}
});
