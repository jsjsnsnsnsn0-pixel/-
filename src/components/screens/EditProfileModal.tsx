import React, {useEffect, useRef, useState} from 'react';
import {supabase} from '../../services/supabase';
import {useApp} from '../../context/AppContext';
import {setImageFallback} from '../../utils/imageFallback';
import {Camera, Check, ChevronDown, ChevronRight, Crown, ImagePlus, MapPin, Pencil, Save, Sparkles, UserRound, X, CalendarDays} from 'lucide-react';
import {SHIMMER_THEMES, ShimmerStyleKey} from '../common/ShimmeringAccountName';

type Country = {name:string;code:string;flag:string};
const countries: Country[] = [
  {name:'العراق',code:'IQ',flag:'🇮🇶'},{name:'السعودية',code:'SA',flag:'🇸🇦'},{name:'الإمارات',code:'AE',flag:'🇦🇪'},
  {name:'مصر',code:'EG',flag:'🇪🇬'},{name:'الأردن',code:'JO',flag:'🇯🇴'},{name:'الكويت',code:'KW',flag:'🇰🇼'},
  {name:'قطر',code:'QA',flag:'🇶🇦'},{name:'البحرين',code:'BH',flag:'🇧🇭'},{name:'عُمان',code:'OM',flag:'🇴🇲'},
  {name:'اليمن',code:'YE',flag:'🇾🇪'},{name:'سوريا',code:'SY',flag:'🇸🇾'},{name:'لبنان',code:'LB',flag:'🇱🇧'},
  {name:'فلسطين',code:'PS',flag:'🇵🇸'},{name:'المغرب',code:'MA',flag:'🇲🇦'},{name:'الجزائر',code:'DZ',flag:'🇩🇿'},
  {name:'تونس',code:'TN',flag:'🇹🇳'},{name:'ليبيا',code:'LY',flag:'🇱🇾'},{name:'السودان',code:'SD',flag:'🇸🇩'},
  {name:'تركيا',code:'TR',flag:'🇹🇷'},{name:'الولايات المتحدة',code:'US',flag:'🇺🇸'},
  {name:'المملكة المتحدة',code:'GB',flag:'🇬🇧'},{name:'ألمانيا',code:'DE',flag:'🇩🇪'},{name:'فرنسا',code:'FR',flag:'🇫🇷'},
  {name:'الهند',code:'IN',flag:'🇮🇳'}
];
const panel='rounded-[20px] border border-[#e8c477] bg-gradient-to-l from-[#054834] via-[#032c24] to-[#011d18] shadow-[inset_0_0_14px_rgba(32,207,144,.16),0_4px_15px_rgba(0,0,0,.4)]';
const field=panel+' flex items-center gap-3 p-3 mb-3';
const input='min-w-0 w-full rounded-xl border border-[#257b5f] bg-[#001d19]/90 text-[#fff1ce] outline-none px-3 py-3 text-sm focus:border-[#f5d58c] focus:ring-1 focus:ring-[#f0c778] placeholder:text-[#84a99c]';

export const EditProfileModal: React.FC = () => {
 const {user,updateProfile,setSelectedChatUser,setActiveSubScreen,reportError}=useApp();
 const [name,setName]=useState(user.name||'');
 const [bio,setBio]=useState(user.bio||'');
 const currentCountry=countries.find(c=>c.code===user.countryCode);
 const [country,setCountry]=useState<Country>({name:user.country||currentCountry?.name||'',code:user.countryCode||'',flag:user.countryFlag||currentCountry?.flag||'🌍'});
 // Existing region column stores the editable city: no backend schema change.
 const [city,setCity]=useState(user.region||'');
 const [birthday,setBirthday]=useState(user.birthday||'');
 const [gender,setGender]=useState<'male'|'female'|''>(user.gender||'');
 const [shimmer,setShimmer]=useState<ShimmerStyleKey|undefined>(user.nameShimmerStyle);
 const [showShimmer,setShowShimmer]=useState(false);
 const [photoPicker,setPhotoPicker]=useState(false);
 const [countryPicker,setCountryPicker]=useState(false);
 const [photo,setPhoto]=useState<File|null>(null);
 const [previewUrl,setPreviewUrl]=useState('');
 const [presetAvatar,setPresetAvatar]=useState('');
 const [saving,setSaving]=useState(false);
 const [validation,setValidation]=useState('');
 const fileInput=useRef<HTMLInputElement>(null);
 const today=new Date().toISOString().slice(0,10);
 useEffect(()=>{if(!photo)return;const url=URL.createObjectURL(photo);setPreviewUrl(url);return()=>URL.revokeObjectURL(url)},[photo]);
 const avatar=photo?(previewUrl||user.avatar):(presetAvatar||user.avatar);
 const presets=[
  '/assets/images/mr_balmain_avatar_1790227488334.jpg',
  '/assets/images/avatar_prince_arab_1790226081300.jpg',
  '/assets/images/avatar_layla_arab_1790226090704.jpg',
  '/assets/images/avatar_male_ghutra_1790628422202.jpg',
  '/assets/images/avatar_female_ghutra_1790628438051.jpg'
 ];
 const back=()=>{if(saving)return;setSelectedChatUser(null);setActiveSubScreen('user_detail_profile')};
 const chooseFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setValidation('اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 5 ميغابايت.');return}
  setPhoto(file);setPresetAvatar('');setPhotoPicker(false);setValidation('');
 };
 const save=async()=>{
  if(saving)return;
  const cleanName=name.trim(),cleanBio=bio.trim();
  if(cleanName.length<2||cleanName.length>35){setValidation('الاسم يجب أن يتكوّن من حرفين إلى 35 حرفاً.');return}
  if(cleanBio.length>150||city.trim().length>80){setValidation('النبذة لا تتجاوز 150 حرفاً والمدينة 80 حرفاً.');return}
  if(birthday&&(Number.isNaN(Date.parse(birthday))||birthday>today||birthday<'1900-01-01')){setValidation('تاريخ الميلاد غير صحيح.');return}
  setValidation('');setSaving(true);let uploaded='';
  try{
   let photoURL=presetAvatar||user.avatar;
   if(photo){
    if(!user.authId){setValidation('يجب تسجيل الدخول قبل رفع الصورة.');return}
    const ext=photo.type==='image/jpeg'?'jpg':photo.type==='image/png'?'png':'webp';
    uploaded=user.authId+'/'+crypto.randomUUID()+'.'+ext;
    const result=await supabase.storage.from('avatars').upload(uploaded,photo,{contentType:photo.type,upsert:false});
    if(result.error)throw result.error;
    photoURL=supabase.storage.from('avatars').getPublicUrl(uploaded).data.publicUrl;
   }
   const ok=await updateProfile({name:cleanName,bio:cleanBio,avatar:photoURL,gender:gender||undefined,
    birthday:birthday||undefined,region:city.trim()||undefined,country:country.name||undefined,
    countryCode:country.code||undefined,countryFlag:country.flag||undefined,nameShimmerStyle:shimmer});
   if(!ok){
    if(uploaded)await supabase.storage.from('avatars').remove([uploaded]);
    setValidation('تعذّر حفظ التغييرات. بقيت البيانات المدخلة محفوظة هنا.');return;
   }
   setSelectedChatUser(null);setActiveSubScreen('user_detail_profile');
  }catch{
   if(uploaded)await supabase.storage.from('avatars').remove([uploaded]);
   reportError('تعذّر حفظ الملف الشخصي. تأكد من الاتصال وحاول مجدداً.');
   setValidation('لم يتم حفظ التغييرات. يمكنك المحاولة مرة أخرى.');
  }finally{setSaving(false)}
 };
 return <main dir="rtl" className="min-h-[100dvh] text-[#ffebbe] pb-[max(100px,env(safe-area-inset-bottom))] overflow-x-hidden"
  style={{background:'radial-gradient(ellipse at 50% 0%,#185c42,#083f31 28%,#001f19 66%,#00140f)'}}>
  <header className="relative pt-7 pb-5 px-4 text-center">
   <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage:"url('/assets/images/agency_login_portal_1790714750581.jpg')",backgroundSize:'cover',backgroundPosition:'center'}} />
   <button onClick={back} aria-label="رجوع" className="absolute right-4 top-5 z-10 w-12 h-12 rounded-full grid place-items-center bg-[#03352c] border border-[#f0cc7b] text-[#ffe5a3] shadow-[0_0_15px_#ffd06e8c]"><ChevronRight size={29}/></button>
   <h1 className="relative text-[23px] font-black drop-shadow-[0_3px_5px_#00180f]">تعديل الملف الشخصي</h1>
   <p className="relative mt-1 text-[13px] text-[#e2e6d4]">عدّل صورتك وبياناتك الشخصية</p>
  </header>
  <section className="px-3 max-w-xl mx-auto">
   <div className={panel+' relative px-4 py-5 mb-5'}>
    <div className="flex items-center gap-4">
     <div className="relative w-[118px] h-[118px] shrink-0">
      <img src={avatar||'/assets/images/default_arab_user_avatar_1790806239365.jpg'}
       onError={e=>setImageFallback(e,'/assets/images/default_arab_user_avatar_1790806239365.jpg')}
       alt="صورتك الشخصية" className="w-full h-full object-cover rounded-full border-[3px] border-[#f5d687] ring-2 ring-[#236b4b] shadow-[0_0_18px_#e9c57484]"/>
      {(user.vipLevel??0)>0&&<Crown size={29} className="absolute -top-3 -right-2 text-[#ffdd87]"/>}
      <button onClick={()=>setPhotoPicker(true)} disabled={saving} aria-label="تغيير الصورة" className="absolute -bottom-1 right-0 w-10 h-10 bg-[#063b30] rounded-full grid place-items-center border border-[#f4d285] text-[#ffe5a1] shadow-lg"><Camera size={19}/></button>
     </div>
     <div className="flex-1 min-w-0">
      <p className="text-lg sm:text-xl font-black break-words text-[#ffe9b1]">{name||user.name} <span className="text-[#57b6f6]">{gender==='female'?'♀':'♂'}</span></p>
      <p className="text-xs text-[#cde6d9] mt-1">{country.flag} {country.name} │ ID: {user.id}</p>
      <button onClick={()=>setPhotoPicker(true)} disabled={saving} className="mt-3 px-3 py-2 border border-[#e8c376] rounded-full bg-[#013323] text-xs font-extrabold text-[#f8e1a7] flex items-center gap-2"><Camera size={14}/> تغيير الصورة</button>
      <p className="text-[10px] mt-1.5 text-[#a7c2b6]">JPG / PNG / WebP · حتى 5MB</p>
     </div>
    </div>
   </div>
   <div className={field}>
    <label htmlFor="edit-visible-name" className="w-[98px] shrink-0 text-xs font-extrabold flex items-center gap-1"><UserRound size={17}/> الاسم الظاهر</label>
    <div className="min-w-0 flex-1 flex items-center gap-1"><input id="edit-visible-name" className={input} value={name} maxLength={35} onChange={e=>setName(e.target.value)}/>
     {name&&<button type="button" aria-label="مسح الاسم" onClick={()=>setName('')}><X size={16}/></button>}
     <button type="button" title="زينة الاسم" aria-label="زينة الاسم" onClick={()=>setShowShimmer(v=>!v)}><Sparkles size={18}/></button>
    </div>
   </div>
   {showShimmer&&<div className={panel+' p-3 mb-3'}>
    <h3 className="text-xs font-bold mb-2">✨ ألوان ولمعان الاسم</h3>
    <div className="grid grid-cols-2 gap-2">{SHIMMER_THEMES.map(t=><button key={t.id} type="button" onClick={()=>setShimmer(t.id)}
     className={'text-[11px] p-2 border rounded-xl '+(shimmer===t.id?'bg-[#705620] border-[#f9dc98]':'bg-[#092c25] border-[#39745c]')}>
     {shimmer===t.id&&<Check size={12} className="inline"/>} {t.name}</button>)}</div>
   </div>}
   <div className={field}>
    <label className="w-[98px] shrink-0 text-xs font-extrabold flex items-center gap-1"><MapPin size={17}/> الدولة</label>
    <button type="button" onClick={()=>setCountryPicker(v=>!v)} className={input+' flex items-center justify-between text-right'}><span>{country.flag} {country.name||'اختر الدولة'}</span><ChevronDown size={15}/></button>
   </div>
   {countryPicker&&<div className={panel+' grid grid-cols-2 gap-2 p-2 mb-3 max-h-52 overflow-y-auto'}>{countries.map(c=><button type="button" key={c.code} onClick={()=>{setCountry(c);setCountryPicker(false)}} className="text-xs text-right p-2 bg-[#063327] border border-[#438363] rounded-xl">{c.flag} {c.name}</button>)}</div>}
   <div className={field}><label htmlFor="edit-city" className="w-[98px] shrink-0 text-xs font-extrabold flex items-center gap-1"><MapPin size={17}/> المدينة</label>
    <input id="edit-city" className={input} value={city} onChange={e=>setCity(e.target.value)} maxLength={80} placeholder="مدينتك"/></div>
   <div className={field}><label htmlFor="edit-dob" className="w-[98px] shrink-0 text-xs font-extrabold flex items-center gap-1"><CalendarDays size={17}/> تاريخ الميلاد</label>
    <input id="edit-dob" type="date" className={input+' [color-scheme:dark]'} min="1900-01-01" max={today} value={birthday} onChange={e=>setBirthday(e.target.value)}/></div>
   <fieldset className={field}>
    <legend className="sr-only">الجنس</legend>
    <span className="w-[98px] shrink-0 text-xs font-extrabold flex items-center gap-1"><UserRound size={17}/> الجنس</span>
    <div className="flex-1 min-w-0 flex gap-1">{([['male','ذكر ♂'],['female','أنثى ♀']] as const).map(g=><button type="button" key={g[0]} onClick={()=>setGender(g[0])} aria-pressed={gender===g[0]}
     className={'flex-1 p-3 rounded-xl text-xs font-extrabold border '+(gender===g[0]?'bg-gradient-to-b from-[#ffebad] to-[#d6a245] border-[#fff2b7] text-[#342408]':'bg-[#03241b] border-[#c1a261] text-[#e6e2cf]')}>{g[1]}</button>)}</div>
   </fieldset>
   <div className={panel+' p-3 mb-5'}>
    <label htmlFor="edit-biography" className="text-sm font-extrabold flex items-center gap-2 mb-2"><Pencil size={17}/> نبذة عني</label>
    <textarea id="edit-biography" className={input+' min-h-[107px] resize-y'} value={bio} onChange={e=>setBio(e.target.value)} maxLength={150} placeholder="اكتب نبذة قصيرة عنك..."/>
    <small dir="ltr" className="block text-left text-[#a8c9b5]">{bio.length}/150</small>
   </div>
   {validation&&<p role="alert" className="p-3 mb-3 border border-[#e99a8d] bg-[#4a1f20] rounded-xl text-sm text-[#ffe0db]">{validation}</p>}
   <div className="flex gap-3">
    <button disabled={saving} onClick={()=>void save()} className="flex-[1.7] min-h-[55px] flex items-center justify-center gap-2 rounded-2xl border border-[#fff3ba] bg-gradient-to-r from-[#ffeaa8] via-[#f5cb6a] to-[#e7a63c] text-[#37270c] font-black disabled:opacity-50"><Save size={21}/>{saving?'جارٍ الحفظ…':'حفظ التغييرات'}</button>
    <button disabled={saving} onClick={back} className="flex-1 rounded-2xl border border-[#e4bb71] bg-[#05352a] text-[#fce0a5] font-extrabold">إلغاء</button>
   </div>
   <p className="text-center text-[11px] text-[#a7ceba] mt-3">سيتم حفظ معلومات الملف الشخصي فقط. إعدادات الحساب والأمان منفصلة.</p>
  </section>
  <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} className="hidden"/>
  {photoPicker&&<div role="dialog" aria-modal="true" aria-label="اختيار صورة الملف الشخصي" className="fixed inset-0 z-[100] bg-[#000c0ae8] backdrop-blur-md flex items-end sm:items-center justify-center">
   <div className={panel+' w-full max-w-md p-4'}>
    <div className="flex justify-between items-center mb-4"><h2 className="font-black">الصورة الشخصية</h2><button aria-label="إغلاق" onClick={()=>setPhotoPicker(false)}><X size={22}/></button></div>
    <button type="button" onClick={()=>fileInput.current?.click()} className="w-full p-3 flex justify-center items-center gap-2 border border-[#f0d389] bg-[#16503e] rounded-xl font-bold"><ImagePlus size={19}/> اختيار صورة من المعرض</button>
    <p className="text-xs my-3 text-[#b3d4bc]">أو اختر صورة رمزية:</p>
    <div className="grid grid-cols-5 gap-2">{presets.map(p=><button type="button" key={p} onClick={()=>{setPresetAvatar(p);setPhoto(null);setPreviewUrl('');setPhotoPicker(false)}} className="aspect-square rounded-full overflow-hidden border-2 border-[#d9b777]">
     <img alt="صورة رمزية" src={p} className="w-full h-full object-cover" onError={e=>setImageFallback(e,'/assets/images/default_arab_user_avatar_1790806239365.jpg')}/></button>)}</div>
   </div>
  </div>}
 </main>;
};
