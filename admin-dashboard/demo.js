import {el,box,panel,note,btn} from './ui.js';
import {clearPreviewGate} from './gate.js';

const areas=[
 ['overview','نظرة عامة','▦','المستخدمون، الغرف، الهدايا، العملات، الوكالات، وحالة النظام'],
 ['users','المستخدمون','♙','بحث حسب ID، المستويات، VIP وحالة الحساب'],
 ['wallet','Treasury Wallet','◈','إضافة وخصم Coins مع سجل الرصيد قبل وبعد وتدقيق العملية'],
 ['roles','الموظفون والصلاحيات','⚿','تعيين الرتب لكل موظف وتحديد الوظائف المسموح بها'],
 ['agencies','الوكالات والمضيفون','⌂','مراجعة طلبات الوكالات، الأعضاء، والأهداف'],
 ['settlements','التسويات الشهرية','▤','الماس المكتسب والمتبقي والعمولات ورواتب المضيفين'],
 ['gifts','الهدايا والحظ','✧','إدارة المتجر والهدايا والفعالية'],
 ['rooms','الغرف الصوتية','◉','متابعة الغرف والمقاعد والبلاغات والإغلاق الإداري'],
 ['tickets','الدعم الفني','▣','الرد على تذاكر المستخدمين ومتابعة حالتها'],
 ['audit','سجل التدقيق','☷','كل التعديلات المالية والإدارية موثقة'],
 ['settings','الإعدادات','⚙','خيارات تجربة Beta والصلاحيات'],
];
export function showDemo(root,{onRealLogin,onReturn}){
 root.replaceChildren();
 let current='overview';
 const mainContent=box('stack');
 const nav=el('nav',{'aria-label':'أقسام معاينة لوحة الإدارة'});
 const tabs=areas.map(([id,name,icon])=>btn(icon+' '+name,()=>{
  current=id;draw();
 },'nav'));
 tabs.forEach(t=>nav.append(t));
 const side=el('aside',{class:'sidebar'},
  box('brand',box('logo','T'),box('',el('b',{},'TotiChat'),note('ADMIN CONTROL CENTER'))),
  nav,box('sidebarFoot','وضع المعاينة — لا يتم تنفيذ أي تغيير على بيانات المستخدمين'));
 const top=box('header',
  box('',note('TotiChat • Admin Panel'),el('h1',{},'لوحة التحكم الرسمية'),note('موقع مستقل — معاينة الواجهة')),
  box('toolbar',el('span',{class:'pill'},'وضع المعاينة'),
   btn('دخول المالك الحقيقي',()=>onRealLogin(),'btn primary'),
   btn('تسجيل خروج',()=>{clearPreviewGate();onReturn()},'btn ghost')));
 const main=el('main',{class:'main'},top,box('message','هذه معاينة للوحة فقط. اسم المستخدم وكلمة المرور المؤقتان لا يمنحان صلاحية مالية أو إدارية. سجّل دخولك بحساب المالك لتفعيل بيانات حقيقية بعد تجهيز الخادم.'),mainContent);
 root.append(box('shell',side,main));
 function draw(){
  tabs.forEach((tab,index)=>{tab.className='nav'+(areas[index][0]===current?' active':'')});
  mainContent.replaceChildren();
  const selected=areas.find(a=>a[0]===current)||areas[0];
  if(current==='overview'){
   const cards=box('metrics');
   for(const name of ['المستخدمون','الغرف النشطة','الهدايا اليوم','Coins المتداولة','الوكالات','طلبات معلقة','الأرباح الشهرية','أخطاء Beta']){
    cards.append(box('metric',note(name),el('b',{},'—')));
   }
   mainContent.append(panel(el('h2',{},'نظرة عامة'),
     note('العدادات محجوبة في وضع المعاينة لحماية بيانات المستخدمين.'),cards));
   const features=box('list');
   for(const [id,label,icon,description] of areas.slice(1,7)){
    features.append(box('item',el('b',{},icon+' '+label),note(description)));
   }
   mainContent.append(panel(el('h2',{},'إدارة TotiChat'),features));
  }else{
   mainContent.append(panel(el('h2',{},selected[2]+' '+selected[1]),note(selected[3]),
    box('item',el('b',{},'جاهز للربط بتصريح المالك'),
      note('هذه الصفحة تعرض هيكل القسم دون معلومات حقيقية. لن تعمل أوامر التعديل باستخدام admin / admin.')),
    btn('التحقق من دخول المالك',()=>onRealLogin(),'btn primary')));
  }
 }
 draw();
}
