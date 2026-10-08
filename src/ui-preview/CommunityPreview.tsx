
import React,{useMemo,useState} from 'react';
import {Heart,MessageSquare,Plus,Search,Users,Share2,UserRoundPlus,ChevronLeft,Send,Image,Trash2,X} from 'lucide-react';
type Filter='feed'|'friends'|'following'|'posts';
type Post={id:string;name:string;body:string;likes:number;liked:boolean;comments:string[];sample:boolean};
const people=[{id:'u1',name:'زينب',level:28},{id:'u2',name:'محمد',level:42},{id:'u3',name:'نور',level:13}];
const initial:Post[]=[
{id:'s1',name:'زينب',body:'منو مستعد لسهرتنا الصوتية الليلة؟ 🎙️',likes:19,liked:false,comments:['أحلى جلسة'],sample:true},
{id:'s2',name:'محمد',body:'غرف الموسيقى والأصدقاء تجمعنا 🤍',likes:8,liked:false,comments:[],sample:true}
];
export function CommunityPreview(){
 const [tab,setTab]=useState<Filter>('feed');
 const [query,setQuery]=useState('');
 const [posts,setPosts]=useState<Post[]>(initial);
 const [following,setFollowing]=useState<string[]>(['u1']);
 const [showCompose,setShowCompose]=useState(false);
 const [draft,setDraft]=useState('');
 const [reply,setReply]=useState<Record<string,string>>({});
 const [detail,setDetail]=useState<string|null>(null);
 const [feedback,setFeedback]=useState('');
 const shown=useMemo(()=>posts.filter(p=>p.name.includes(query)||p.body.includes(query)),[posts,query]);
 const toggleFollow=(id:string)=>{setFollowing(list=>list.includes(id)?list.filter(x=>x!==id):[...list,id]);setFeedback('تم تغيير حالة المتابعة في المعاينة فقط.');};
 const update=(id:string,cb:(p:Post)=>Post)=>setPosts(all=>all.map(p=>p.id===id?cb(p):p));
 const publish=()=>{if(!draft.trim()){setFeedback('اكتب نص المنشور أولاً.');return}
 setPosts(a=>[{id:'draft-'+Date.now(),name:'حساب تجريبي',body:draft.trim(),likes:0,liked:false,comments:[],sample:false},...a]);setDraft('');setShowCompose(false);setFeedback('أُضيف المنشور محلياً للمعاينة فقط، دون إرساله للخادم.');setTab('feed');};
 const button='min-h-11 rounded-xl text-xs font-bold px-4';
 return <div dir="rtl" className="min-h-screen bg-[#f6f7f7] text-slate-900 pb-32">
 <header className="sticky top-12 z-10 bg-white px-4 py-4 border-b"><div className="flex items-center justify-between"><div><h1 className="font-black text-xl">المجتمع</h1><p className="text-xs text-slate-500">أصدقاء · متابعة · منشورات</p></div><button type="button" onClick={()=>setShowCompose(true)} className="bg-[#1b7050] text-white rounded-xl min-h-11 flex items-center gap-2 px-3 text-xs font-bold"><Plus size={18}/> منشور</button></div>
 <label className="mt-3 bg-slate-100 border rounded-xl flex items-center gap-2 px-3 min-h-11"><Search size={16} className="text-slate-500"/><input aria-label="بحث المجتمع" value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث عن منشور أو مستخدم" className="min-w-0 flex-1 bg-transparent outline-none text-sm"/>{query&&<button type="button" aria-label="مسح البحث" onClick={()=>setQuery('')}><X size={17}/></button>}</label>
 <nav aria-label="تبويبات المجتمع" className="flex gap-1 mt-3">{([['feed','المجتمع'],['friends','الأصدقاء'],['following','المتابعة'],['posts','منشوراتي']] as const).map(([id,label])=><button type="button" key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)} className={'flex-1 text-[11px] font-bold min-h-11 rounded-lg '+(tab===id?'bg-[#1b7050] text-white':'bg-slate-100 text-slate-700')}>{label}</button>)}</nav></header>
 {feedback&&<p role="status" className="mx-4 mt-3 p-3 rounded-xl bg-amber-50 text-amber-900 text-xs">{feedback}<button type="button" className="mr-3 underline" onClick={()=>setFeedback('')}>إغلاق</button></p>}
 <main className="p-4 space-y-3">
 {(tab==='friends'||tab==='following')&&<section className="bg-white border rounded-2xl p-4"><h2 className="font-bold text-sm mb-2">{tab==='friends'?'أشخاص مقترحون':'الأشخاص الذين تتابعهم'}</h2>{people.filter(p=>tab==='friends'||following.includes(p.id)).map(p=><div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-0"><div className="h-11 w-11 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center"><Users size={19}/></div><div className="flex-1"><b className="text-sm">{p.name}</b><small className="block text-slate-500">Level {p.level} · حساب توضيحي</small></div><button type="button" className={button+' bg-slate-100 text-slate-900'} onClick={()=>toggleFollow(p.id)}>{following.includes(p.id)?'إلغاء المتابعة':'متابعة'}</button></div>)}{tab==='following'&&following.length===0&&<p className="text-xs text-slate-500 p-3">لا يوجد أشخاص متابَعون في هذا المثال.</p>}</section>}
 {(tab==='feed'||tab==='posts')&&<>{shown.filter(p=>tab==='feed'||!p.sample).map(p=><article key={p.id} className="bg-white border rounded-2xl overflow-hidden"><div className="p-4 flex items-center gap-2"><div className="h-10 w-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center"><Users size={19}/></div><div className="flex-1 min-w-0"><b className="text-sm block truncate">{p.name}</b><small className="text-slate-500">منشور {p.sample?'توضيحي':'محلي غير منشور'}</small></div>{!p.sample&&<button type="button" aria-label="حذف منشور محلي" onClick={()=>setPosts(all=>all.filter(x=>x.id!==p.id))} className="p-2 text-rose-500"><Trash2 size={17}/></button>}</div>
 <p className="px-4 pb-4 text-sm leading-7 break-words">{p.body}</p><div className="px-4 py-2 border-t flex items-center justify-between">
 <button type="button" aria-pressed={p.liked} className={'flex gap-2 min-h-11 items-center text-xs '+(p.liked?'text-rose-600':'text-slate-600')} onClick={()=>update(p.id,x=>({...x,liked:!x.liked,likes:x.likes+(x.liked?-1:1)}))}><Heart size={18} fill={p.liked?'currentColor':'none'}/>{p.likes}</button>
 <button type="button" onClick={()=>setDetail(detail===p.id?null:p.id)} className="flex gap-2 min-h-11 items-center text-xs text-slate-600"><MessageSquare size={18}/>{p.comments.length} تعليق</button>
 <button type="button" onClick={()=>setFeedback('المشاركة الحقيقية غير مفعلة في النسخة التجريبية.')} className="flex gap-2 min-h-11 items-center text-xs text-slate-600"><Share2 size={18}/> مشاركة</button></div>
 {detail===p.id&&<div className="border-t p-3 bg-slate-50"><div className="space-y-2">{p.comments.map((c,i)=><p key={i} className="bg-white rounded-xl p-2 text-xs">{c}</p>)}</div><form className="flex gap-2 mt-3" onSubmit={e=>{e.preventDefault();const val=(reply[p.id]||'').trim();if(!val)return;update(p.id,x=>({...x,comments:[...x.comments,val]}));setReply(a=>({...a,[p.id]:''}));setFeedback('أضيف التعليق للمعاينة محلياً فقط.')}}><input aria-label="أضف تعليقاً تجريبياً" className="min-w-0 flex-1 bg-white rounded-xl border px-3 text-sm" value={reply[p.id]||''} onChange={e=>setReply(a=>({...a,[p.id]:e.target.value}))} placeholder="اكتب تعليقاً"/><button type="submit" aria-label="إضافة تعليق" className="min-w-11 min-h-11 grid place-items-center rounded-xl bg-[#1b7050] text-white"><Send size={18}/></button></form></div>}
 </article>)}{shown.filter(p=>tab==='feed'||!p.sample).length===0&&<div className="bg-white border rounded-2xl p-8 text-center"><Search className="mx-auto text-slate-400 mb-2"/><b>ماكو نتائج مطابقة</b><p className="text-xs text-slate-500 mt-2">جرّب تغيير البحث أو افتح قسم المجتمع.</p><button className="mt-3 text-emerald-800 underline" type="button" onClick={()=>{setQuery('');setTab('feed')}}>إعادة تعيين</button></div>}</>}
 </main>
 {showCompose&&<div role="dialog" aria-modal="true" aria-label="نموذج إنشاء منشور" className="fixed inset-0 z-[900] bg-black/55 flex items-end justify-center"><section className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-black">إنشاء منشور تجريبي</h2><button type="button" aria-label="إغلاق كتابة المنشور" className="min-w-11 min-h-11 grid place-items-center" onClick={()=>setShowCompose(false)}><X size={20}/></button></div><p className="text-xs text-slate-500 mb-3">نصّك يظهر محلياً فقط ولا ينشر على التطبيق الحقيقي.</p><textarea value={draft} onChange={e=>setDraft(e.target.value)} maxLength={500} rows={4} className="w-full border border-slate-300 rounded-xl p-3 text-sm" placeholder="شنو أخبارك اليوم؟"/><div className="mt-3 flex gap-2"><button type="button" className={button+' flex-1 bg-slate-100'} onClick={()=>setShowCompose(false)}>إلغاء</button><button type="button" disabled={!draft.trim()} onClick={publish} className={button+' flex-1 bg-[#1b7050] text-white disabled:opacity-40'}>إضافة للمعاينة</button></div></section></div>}
 </div>;
}
