import {createClient} from '@supabase/supabase-js';
import {RoomServiceClient} from 'livekit-server-sdk';

const json=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const required=(name:string)=>{const value=Deno.env.get(name)?.trim();if(!value)throw new Error(`Missing ${name}`);return value;};
const secretKey=()=>{
  const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(modern){try{const key=JSON.parse(modern).default;if(typeof key==='string'&&key.trim())return key;}catch{}}
  return required('SUPABASE_SERVICE_ROLE_KEY');
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound=(error:unknown)=>Boolean(error&&typeof error==='object'&&'code' in error&&error.code==='not_found');

export default {
  async fetch(req:Request):Promise<Response>{
    if(req.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
    // This endpoint has custom HMAC authentication. The signing key stays in Vault;
    // no client JWT, room ID, permissions or identities are trusted from the caller.
    const signature=req.headers.get('x-toti-signature');
    const timestamp=req.headers.get('x-toti-timestamp');
    if(!signature||!/^[a-f0-9]{64}$/.test(signature)||!timestamp||!/^\d{10}$/.test(timestamp))return json(401,{error:'UNAUTHORIZED'});
    try{
      const admin=createClient(required('SUPABASE_URL'),secretKey(),{auth:{persistSession:false,autoRefreshToken:false}});
      const authorization=await admin.rpc('authorize_livekit_reconcile',{p_signature:signature,p_timestamp:Number(timestamp)});
      if(authorization.error)throw authorization.error;
      if(authorization.data!==true)return json(401,{error:'UNAUTHORIZED'});
      const pending=await admin.rpc('pending_livekit_reconcile');
      if(pending.error)throw pending.error;
      if(!pending.data?.length)return json(200,{ok:true,processed:0});
      const service=new RoomServiceClient(required('LIVEKIT_URL').replace(/^wss:/i,'https:').replace(/^ws:/i,'http:'),required('LIVEKIT_API_KEY'),required('LIVEKIT_API_SECRET'));
      let processed=0;let failed=0;
      for(const job of pending.data){
        try{
          if(!uuid.test(job.room_id))throw new Error('Invalid queued room');
          const [roomResult,membersResult,bansResult]=await Promise.all([
            admin.from('rooms').select('is_active,max_seats').eq('id',job.room_id).maybeSingle(),
            admin.from('room_members').select('user_id,seat_number,is_muted').eq('room_id',job.room_id),
            admin.from('room_bans').select('user_id').eq('room_id',job.room_id),
          ]);
          for(const result of [roomResult,membersResult,bansResult])if(result.error)throw result.error;
          const members=new Map<string,any>((membersResult.data||[]).map((member:any)=>[member.user_id,member]));
          const banned=new Set((bansResult.data||[]).map((ban:any)=>ban.user_id));
          let participants:any[]=[];
          try{participants=await service.listParticipants(job.room_id);}catch(error){if(!notFound(error))throw error;}
          const identities=new Set<string>([...participants.map(p=>p.identity),...(job.identities||[])]);
          const active=roomResult.data?.is_active===true;
          if(!active)for(const identity of members.keys())identities.add(identity);
          for(const identity of identities){
            const member=members.get(identity);
            if(!active||!member||banned.has(identity)){
              try{await service.removeParticipant(job.room_id,identity);}catch(error){if(!notFound(error))throw error;}
            }else if(member.is_muted!==false||!Number.isInteger(member.seat_number)||member.seat_number<1||member.seat_number>roomResult.data!.max_seats){
              if(!participants.some(p=>p.identity===identity))continue;
              // Reconciliation only revokes. Publishing grants remain authenticated
              // operations in livekit-room; stale background work never grants audio.
              await service.updateParticipant(job.room_id,identity,{permission:{canSubscribe:true,canPublish:false,canPublishData:false,canPublishSources:[],canUpdateMetadata:false}});
            }
          }
          const acknowledgement=await admin.rpc('ack_livekit_reconcile',{p_room_id:job.room_id,p_revision:job.revision});
          if(acknowledgement.error)throw acknowledgement.error;
          processed++;
        }catch(error){failed++;console.error('LiveKit reconciliation failed',{roomId:job.room_id,error:error instanceof Error?error.message:String(error)});}
      }
      return json(failed?503:200,{ok:failed===0,processed,failed});
    }catch(error){console.error('LiveKit reconciliation unavailable',{error:error instanceof Error?error.message:String(error)});return json(503,{error:'RECONCILIATION_UNAVAILABLE'});}
  },
};
