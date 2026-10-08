import type {SupabaseClient} from '@supabase/supabase-js';
import {sampleGifts} from '../data/mockData';
// Standalone design-review fake. No network, account access, payments or data writes.
export const isSupabaseConfigured=true;
const response=(table:string)=>({data:table==='gift_catalog'?sampleGifts.map(g=>({...g,is_active:true,diamond_source_type:'FIXED_GIFT'})):table==='room_messages'?[]:[],error:null,count:0,status:200,statusText:'OK'});
const fakeQuery=(table:string):any=>{
 const result=Promise.resolve(response(table));
 return new Proxy({}, {get(_target,key){
   if(key==='then') return result.then.bind(result);
   if(key==='catch') return result.catch.bind(result);
   if(key==='finally') return result.finally.bind(result);
   return (..._args:any[])=>fakeQuery(table);
 }});
};
const channel:any={on(){return this;},subscribe(){return this;},unsubscribe(){return Promise.resolve('ok');},send(){return Promise.resolve('ok');}};
const fake:any={
 from:(table:string)=>fakeQuery(table),
 rpc:async()=>({data:[],error:null}),
 channel:()=>channel,
 removeChannel:async()=>{},
 removeAllChannels:async()=>{},
 functions:{invoke:async()=>({data:null,error:null})},
 storage:{from:()=>({getPublicUrl:()=>({data:{publicUrl:''}}),upload:async()=>({data:null,error:null})})},
 auth:{
 getSession:async()=>({data:{session:{user:{id:'preview-user'}}},error:null}),
 getUser:async()=>({data:{user:{id:'preview-user'}},error:null}),
 onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
 signOut:async()=>({error:null}),
 signInWithOAuth:async()=>({data:{url:null,provider:'google'},error:null})
 }
};
export const supabase=fake as SupabaseClient;
