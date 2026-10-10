import {state,rpc,load,change,allowed} from './context.js';
import {el,box,panel,title,note,btn,field,metric,money,date} from './ui.js';

const canManage=()=>Boolean(state.session?.owner||state.session?.primary_partner===true);
const canOpen=()=>canManage()||['db_employee','agency_manager'].includes(state.session?.role);
const statusLabel={pending:'بانتظار المراجعة',approved:'مقبول',rejected:'مرفوض'};
const badge=(label,kind='neutral')=>el('span',{class:'agencyBadge '+kind},label);
const empty=(heading,description)=>box('agencyEmpty',el('span',{'aria-hidden':'true',class:'emptyGlyph'},'⌁'),el('strong',{},heading),note(description));
const hasValue=x=>x!==null&&x!==undefined&&x!=='';
const format=x=>hasValue(x)?money(x):'—';
const firstOfMonth=()=>{
 const d=new Date();
 d.setDate(1);d.setMonth(d.getMonth()-1);
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
};

export function agencies(work){
 if(!canManage()){work.append(panel(empty('الوصول مقيد','إدارة وكالات المضيفين متاحة فقط للمالك وشريكه الرئيسي.')));return;}
 const controls=box('agencyControlRow');
 const search=field('اسم الوكالة أو الوكيل أو المعرّف');
 search.input.placeholder='ابحث في جميع الوكالات…';
 search.input.setAttribute('aria-label','البحث عن وكالة');
 const month=field('شهر التقرير','month');
 month.input.value=firstOfMonth();
 month.input.max=new Date().toISOString().slice(0,7);
 controls.append(search.label,month.label);
 const summary=box('agencySummary metrics');
 const directoryItems=box('agencyDirectoryList');
 const detail=box('agencyDetails');
 const side=box('agencyDirectoryPanel',box('rowHead',title('دليل الوكالات'),badge('بيانات حقيقية','live')),directoryItems);
 const layout=box('agencyWorkspace',side,detail);
 work.append(
  box('agencyHero',
   box('agencyHeroCopy',badge('قسم خاص بالمالك والشريك','trusted'),
    el('h2',{},'إدارة وكالات المضيفين'),note('تابع الوكالات والمضيفين والتارجت والتسويات في مساحة واحدة. كل الأرقام من قاعدة TotiChat.')),
   el('div',{class:'agencyHeroArt','aria-hidden':'true'},'✦')),
  panel(box('rowHead',title('استعراض الوكالات'),note('يمكن البحث واختيار الشهر بدون تعديل أي بيانات مالية.')),controls,summary),
  layout
 );
 let all=[],selected=null,query='',report=null,reportMonth='';
 const byId=a=>String(a.id)===String(selected);
 function findAgency(){return all.find(byId)}
 function updateSummary(){
  const total=all.reduce((n,a)=>n+Number(a.members_count||0),0);
  summary.replaceChildren(metric('عدد الوكالات',all.length),metric('المضيفون المسجلون',total),metric('الوكالات المطابقة',all.filter(matches).length));
 }
 function matches(a){
  const q=query.trim().toLowerCase();
  return !q||[a.name,a.owner_name,a.id].some(v=>String(v||'').toLowerCase().includes(q));
 }
 function renderDirectory(){
  directoryItems.replaceChildren();
  const filtered=all.filter(matches);
  if(!filtered.length){directoryItems.append(empty('لا توجد نتائج','غيّر عبارة البحث أو تأكد من وجود وكالات مسجلة.'));return}
  const list=box('agencyCardList');
  for(const a of filtered){
   const active=byId(a);
   const card=btn('',()=>{selected=a.id;renderDirectory();renderDetail()},'agencyCard'+(active?' selected':''));
   card.setAttribute('aria-pressed',String(active));
   card.append(
    box('agencyAvatar','✦'),
    box('agencyCardText',el('strong',{},a.name||'وكالة بدون اسم'),
     note((a.owner_name||'اسم الوكيل غير متوفر')+' · #'+a.id),
     el('span',{class:'agencyCardMeta'},format(a.members_count)+' مضيف')),
    el('span',{'aria-hidden':'true',class:'agencyCardArrow'},'‹'));
   list.append(card);
  }
  directoryItems.append(list);
 }
 function renderReport(target){
  target.replaceChildren();
  const agency=findAgency();
  if(!agency)return;
  const wrap=panel(box('rowHead',title('التارجت والتسويات'),badge(month.input.value,'month')));
  target.append(wrap);
  if(!report||reportMonth!==month.input.value){
   wrap.append(empty('تحميل بيانات الشهر','استخدم اختيار الشهر ثم اضغط «عرض التقرير» لقراءة السجلات الفعلية.'));return;
  }
  const relevant=(report.entries||[]).filter(entry=>
   (entry.agencies||[]).some(a=>String(a.agency_id)===String(agency.id)));
  const allocations=relevant.flatMap(entry=>(entry.agencies||[])
   .filter(a=>String(a.agency_id)===String(agency.id)).map(a=>({...a,entry})));
  if(!allocations.length){wrap.append(empty('لا توجد تسوية مسجلة لهذا الشهر','قد لا تكون تسويات هذا الشهر قد أُعدّت بعد. لا يتم توليد قيم افتراضية.'));return;}
  const targetTotal=allocations.reduce((n,r)=>n+Number(r.agency_target||0),0);
  const commissions=allocations.reduce((n,r)=>n+Number(r.agent_commission||0),0);
  const salaries=allocations.reduce((n,r)=>n+Number(r.entry.host_salary||0),0);
  const hasCommissions=allocations.some(r=>hasValue(r.agent_commission));
  wrap.append(box('agencySummary metrics',
   metric('المضيفون في التسويات',relevant.length),
   metric('التارجت المسجل',targetTotal),
   metric('العمولات المسجلة',hasCommissions?commissions:'—'),
   metric('رواتب المضيفين المسجلة',salaries)));
  wrap.append(el('h3',{},'المضيفون ضمن تسوية الوكالة'));
  const container=box('agencyTableWrap');
  const table=el('table',{class:'agencyTable'},
   el('thead',{},el('tr',{},...['المضيف','المعرّف','التارجت','راتب المضيف','عمولة الوكيل','حالة التسوية'].map(t=>el('th',{scope:'col'},t)))));
  const body=el('tbody');
  for(const record of allocations){
   const e=record.entry;
   body.append(el('tr',{},
    el('td',{},e.display_name||'—'),
    el('td',{},'#'+e.public_id),
    el('td',{},format(record.agency_target)),
    el('td',{},format(e.host_salary)),
    el('td',{},format(record.agent_commission)),
    el('td',{},badge(e.status==='settled'?'مكتملة':'بانتظار التسوية',e.status==='settled'?'done':'pending'))));
  }
  table.append(body);container.append(table);wrap.append(container,
   note('البيانات الظاهرة من سجلات التسوية الشهرية المحفوظة. لا يُحتسب الماس المكتسب كله للوكالة دون بيانات توزيع موثوقة.'),
   box('agencyCaution',el('strong',{},'حماية المستحقات'),note('لا يُسمح بتصفير أي عداد مالي أو إغلاق دورة من هذه الصفحة قبل اعتماد إجراءات التسوية المحمية على الخادم.')));
 }
 function renderDetail(){
  detail.replaceChildren();
  const a=findAgency();
  if(!a){detail.append(panel(empty('اختر وكالة','اختر وكالة من القائمة لعرض بياناتها.')));return}
  const head=panel(
   box('agencyProfileTop',
    box('agencyProfileLogo','✦'),
    box('agencyProfileTitle',badge('وكالة مضيفين','trusted'),el('h2',{},a.name||'الوكالة'),
     note('معرّف الوكالة #'+a.id))),
   box('agencyInfoGrid',
    box('agencyInfo',note('اسم الوكيل'),el('strong',{},a.owner_name||'—')),
    box('agencyInfo',note('Agency ID'),el('strong',{},'#'+a.id)),
    box('agencyInfo',note('عدد المضيفين'),el('strong',{},format(a.members_count))),
    box('agencyInfo',note('معرّف حساب الوكيل'),el('strong',{},hasValue(a.owner_public_id)?'#'+a.owner_public_id:'غير متوفر من واجهة الدليل الحالية'))),
   box('agencySectionFoot',badge('سجل فعلي من Supabase','live'),note('تفاصيل الرواتب والتارجت من سجلات الشهر المحدد أدناه.')));
  const reportTarget=box('agencyReport');
  const reportButton=btn('عرض تقرير الشهر',()=>{
   const value=month.input.value;
   if(!/^\d{4}-\d{2}$/.test(value))return state.notify?.('اختر شهراً صحيحاً.','error');
   report=null;reportMonth='';
   reportTarget.replaceChildren(panel(note('جارٍ قراءة سجلات التسوية المحمية…')));
   rpc('dashboard_monthly_settlements',{p_month:value+'-01'}).then(result=>{
    if(!document.body.contains(reportTarget))return;
    report=result;reportMonth=value;renderReport(reportTarget);
   }).catch(e=>{reportTarget.replaceChildren(panel(el('p',{class:'message error'},e.message||'تعذر قراءة التقرير.')));});
  },'btn primary agencyReportButton');
  detail.append(head,box('agencyReportControls',el('h3',{},'التقارير الشهرية'),reportButton),reportTarget);
  renderReport(reportTarget);
 }
 search.input.addEventListener('input',()=>{query=search.input.value;renderDirectory();updateSummary()});
 month.input.addEventListener('change',()=>{report=null;reportMonth='';renderDetail()});
 directoryItems.replaceChildren(note('جارٍ تحميل الوكالات من قاعدة البيانات…'));
 rpc('agency_directory').then(data=>{
  all=Array.isArray(data)?data:[];
  selected=all[0]?.id??null;
  renderDirectory();updateSummary();renderDetail();
 }).catch(e=>{directoryItems.replaceChildren(el('p',{class:'message error'},e?.message||'تعذر تحميل الوكالات.'),btn('إعادة المحاولة',()=>state.refresh?.(),'btn ghost'));detail.replaceChildren()});
}

/** Agency registration workflow: dedicated to the designated opening employee and protected principals. */
export function agencyApplications(work){
 if(!canOpen()){work.append(panel(empty('غير مصرح','طلبات فتح وكالات المضيفين لا تظهر لهذا الحساب.')));return}
 const heading=box('agencyHero compact',
  box('agencyHeroCopy',badge('طلبات وكالة المضيفين','trusted'),el('h2',{},'فتح وكالات المضيفين'),
   note('راجع الطلبات المسجلة ثم اعتمد أو ارفض. موظف DB لا يملك صلاحية تعديل الوكالة بعد فتحها.')));
 const stats=box('agencySummary metrics');
 const search=field('البحث باسم الوكالة أو المعرّف');
 search.input.placeholder='ابحث في طلبات الوكالات…';
 const filter=el('select',{'aria-label':'حالة الطلب'},
  el('option',{value:'pending'},'بانتظار المراجعة'),el('option',{value:'approved'},'المقبولة'),
  el('option',{value:'rejected'},'المرفوضة'),el('option',{value:'all'},'الكل'));
 const toolbar=box('agencyFilterBar',search.label,el('label',{class:'field'},el('span',{},'حالة الطلب'),filter));
 const list=box('agencyApplicationList');
 work.append(heading,panel(toolbar,stats,list));
 let applications=[];
 function redraw(){
  const q=search.input.value.trim().toLowerCase();
  const results=applications.filter(a=>(filter.value==='all'||a.status===filter.value)&&
   [a.agency_name,a.full_name,a.applicant_public_id,a.agent_number]
    .some(v=>String(v||'').toLowerCase().includes(q)));
  stats.replaceChildren(
   metric('بانتظار المراجعة',applications.filter(a=>a.status==='pending').length),
   metric('المقبولة',applications.filter(a=>a.status==='approved').length),
   metric('المرفوضة',applications.filter(a=>a.status==='rejected').length));
  list.replaceChildren();
  if(!results.length){list.append(empty('لا توجد طلبات مطابقة','جرب تغيير البحث أو حالة الطلب.'));return}
  for(const application of results){
   const reason=field('ملاحظة الإدارة');
   reason.input.placeholder='ملاحظة رسمية تحفظ مع القرار…';
   const card=box('agencyApplication',
    box('agencyApplicationTop',box('agencyAppTitle',el('strong',{},application.agency_name||'وكالة جديدة'),
     note('مقدم الطلب: '+(application.full_name||'—')+' · ID '+(application.applicant_public_id||'—'))),
    badge(statusLabel[application.status]||application.status,application.status==='pending'?'pending':application.status==='approved'?'done':'neutral')),
    box('agencyInfoGrid',
     box('agencyInfo',note('الدولة'),el('strong',{},application.country_code||'—')),
     box('agencyInfo',note('رقم الوكيل'),el('strong',{},application.agent_number||'—')),
     box('agencyInfo',note('تاريخ الطلب'),el('strong',{},date(application.submitted_at)))));
   const actions=box('actions agencyReviewActions');
   const choices=[
    ['approve','قبول وفتح الوكالة','agencies.approve','btn primary'],
    ['reject','رفض الطلب','agencies.reject','btn danger'],
    ['request_changes','طلب تعديل','agencies.reject','btn ghost']
   ];
   if(application.status==='pending'){
    for(const [action,label,permission,style] of choices){
     if(!allowed(permission))continue;
     actions.append(btn(label,async()=>{
      const memo=reason.input.value.trim();
      if(action!=='approve'&&memo.length<5)return state.notify?.('سبب القرار يجب أن يكون خمسة أحرف على الأقل.','error');
      if(!confirm('تأكيد قرار «'+label+'» للوكالة «'+application.agency_name+'»؟'))return;
      const ok=await change(()=>rpc('dashboard_agency_review',{
       p_application_id:application.id,p_action:action,p_note:memo
      }),'تم توثيق القرار في قاعدة البيانات.',false);
      if(ok)reload();
     },style));
    }
   }
   if(actions.childNodes.length)card.append(reason.label,actions);
   if(application.review_note)card.append(note('ملاحظة المراجعة: '+application.review_note));
   list.append(card);
  }
 }
 function reload(){
  list.replaceChildren(note('جارٍ قراءة طلبات الوكالات الحقيقية…'));
  rpc('dashboard_agency_registrations').then(data=>{
   applications=Array.isArray(data)?data:[];redraw();
  }).catch(e=>{list.replaceChildren(el('p',{class:'message error'},e?.message||'تعذر تحميل الطلبات.'),btn('إعادة المحاولة',reload,'btn ghost'))});
 }
 search.input.addEventListener('input',redraw);
 filter.addEventListener('change',redraw);
 reload();
}
