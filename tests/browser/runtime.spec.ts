import { test, expect, Page } from '@playwright/test';
const actor = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const roomId = '33333333-3333-4333-8333-333333333333';
const profile = {id: actor, public_id: 920003, username: 'test_user', display_name: 'حساب الاختبار', avatar_url: '/assets/images/default_arab_user_avatar_1790806239365.jpg', level: 1, vip_level: 0, gold: 100, diamonds: 90, silver_coins: 0, country_code: 'IQ', country_name: 'العراق'};
const room = {id: roomId, owner_id: actor, name: 'غرفة الاختبار', description: 'دردشة فعلية', max_seats: 4, is_active: true, is_private: false, is_vip: false, category: 'عامة', tags: [], owner_public_id: 920003, owner_display_name: 'حساب الاختبار'};
const authUser = {id: actor, aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', app_metadata: {provider: 'google'}, user_metadata: {}, created_at: new Date().toISOString()};
const token = `${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:actor,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.dGVzdA`;
const session = {access_token: token, refresh_token:'test-refresh', token_type:'bearer', expires_in:3600, expires_at:Math.floor(Date.now()/1000)+3600, user: authUser};
async function setup(page: Page, loggedIn = true, overrides: {country?: string; rooms?: boolean; conversionError?: boolean; messages?: boolean; agent?: boolean; zero?: boolean; profileError?: boolean; noAgent?: boolean; otherMember?: boolean} = {}) {
  const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  let current = {...profile, gold: overrides.zero ? 0 : profile.gold, diamonds: overrides.zero ? 0 : profile.diamonds, country_code: overrides.country === '' ? '' : 'IQ'};
  const directMessages: any[] = overrides.messages ? [{id:'incoming',sender_id:other,recipient_id:actor,recipient_public_id:920003,sender_public_id:451305,sender_display_name:'مستخدم الرسائل',recipient_display_name:'حساب الاختبار',message_type:'text',content:'رسالة واردة',created_at:new Date().toISOString(),read_at:null}] : [];
  const requests: {path: string; body: any}[]=[];
  await page.route('https://**.supabase.co/**', async route => {
    const url=new URL(route.request().url()); const path=url.pathname; const method=route.request().method();
    const body=route.request().postDataJSON(); if (method !== 'GET') requests.push({path,body});
    const headers={'access-control-allow-origin':'*','content-type':'application/json'};
    const respond=(value: any,status=200)=>route.fulfill({status,headers,body:JSON.stringify(value)});
    if (method==='OPTIONS') return route.fulfill({status:204,headers:{...headers,'access-control-allow-headers':'*','access-control-allow-methods':'*'}});
    if (path.includes('/auth/v1/user')) return respond(authUser);
    if (path.includes('/auth/v1/otp')) return respond({message:'SMS is disabled'},400);
    if (path.includes('/auth/v1/verify')) return respond({message:'Invalid OTP'},400);
    if (path.includes('/auth/v1/logout')) return respond({});
    if (path.includes('/auth/v1/token')) return respond(session);
    if (path.endsWith('/profiles')) {
      if (overrides.profileError) return respond({message:'profile unavailable'},500);
      if (method==='PATCH') current={...current,...body};
      return respond(route.request().headers()['accept']?.includes('object') ? current : [current]);
    }
    if (path.endsWith('/direct_messages')) {
      if (method==='POST') directMessages.push({id:'outgoing',sender_id:actor,recipient_id:other,sender_public_id:920003,recipient_public_id:body.recipient_public_id,sender_display_name:'حساب الاختبار',recipient_display_name:overrides.agent ? 'TR72' : 'مستخدم الرسائل',message_type:body.message_type,content:body.content,created_at:new Date().toISOString()});
      if (method==='PATCH') for (const m of directMessages) if (m.recipient_id===actor) m.read_at=new Date().toISOString();
      return respond(directMessages);
    }
    if (path.endsWith('/rooms')) return respond(overrides.rooms ? [room] : []);
    if (path.endsWith('/room_members')) return respond(overrides.rooms ? [{id:'member',room_id:roomId,user_id:actor,seat_number:1,role:'owner',is_muted:true,member_public_id:920003,member_display_name:'حساب الاختبار'}, ...(overrides.otherMember ? [{id:'other-member',room_id:roomId,user_id:other,seat_number:2,role:'member',is_muted:true,member_public_id:451306,member_display_name:'مشارك آخر'}] : [])] : []);
    if (path.endsWith('/recharge_packages')) return respond([{id:'44444444-4444-4444-8444-444444444444',price_usd:0.99,gold_amount:4900}]);
    if (path.endsWith('/create_recharge_request')) {
      if (overrides.noAgent) return respond({message:'no official recharge agent is configured for this country'},400);
      return respond([{request_id:'request',agent_id:'existing-agent',agent_display_name:'TotiChat Official Recharge',country_code:'IQ',country_name:'Iraq',agent_phone:null,gold_amount:4900,price_usd:0.99,payment_methods:[],contact_info:{channel:'in_app',public_id:'451305',phone:null,whatsapp:null}}]);
    }
    if (path.endsWith('/get_gift_rankings')) return respond({wealth:[],charm:[],rooms:[]});
    if (path.endsWith('/search_public_profiles')) return respond([{public_id:451305,display_name:overrides.agent ? 'TR72' : 'مستخدم البحث',username:'other',level:1,vip_level:0}]);
    if (path.endsWith('/convert_diamonds_to_gold')) {
      if (overrides.conversionError) return respond({message:'insufficient diamonds'},400);
      current={...current,diamonds:current.diamonds-body.p_diamonds,gold:current.gold+Math.floor(body.p_diamonds*0.3)};
      return respond([{diamonds_remaining:current.diamonds,gold_balance:current.gold,gold_added:3}]);
    }
    if (path.endsWith('/create_room')) return respond(roomId);
    if (path.includes('/rpc/')) return respond(null);
    return respond([]);
  });
  await page.addInitScript(({session,loggedIn})=>{
    // A forged legacy local profile must never become the authenticated identity.
    localStorage.setItem('app_user_profile',JSON.stringify({id:'30301',gold:999999,name:'الحساب الوهمي'}));
    if (loggedIn) localStorage.setItem('sb-bfadhdnudmsggylunhlh-auth-token',JSON.stringify(session));
  },{session,loggedIn});
  return {errors,requests};
}

test('production login images load and phone cannot bypass OTP', async ({page})=>{
  const {errors,requests}=await setup(page,false);
  await page.goto('/'); await page.getByRole('button',{name:'سجل الدخول عبر الهاتف'}).click();
  await page.getByPlaceholder('771 331 2563').fill('07712345678');
  await page.getByRole('button',{name:'إرسال رمز التحقق',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('SMS');
  await expect(page.getByRole('button',{name:'تأكيد ودخول الحساب'})).toHaveCount(0);
  expect(requests.some(r=>r.path.endsWith('/otp'))).toBe(true);
  const image=page.getByAltText('Toti Chat Background Template');
  await expect.poll(()=>image.evaluate((i:HTMLImageElement)=>i.naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('database account replaces legacy cached identity', async ({page})=>{
  const {errors}=await setup(page); await page.goto('/');
  await page.getByTitle('أنا').click();
  await expect(page.getByText('حساب الاختبار',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('الحساب الوهمي',{exact:true})).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('new authenticated accounts complete server profile without local rewards', async ({page})=>{
  const {requests,errors}=await setup(page,true,{country:''}); await page.goto('/');
  await expect(page.getByText('ملء المعلومات',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'إتمام',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'التنقل الرئيسي'})).toBeVisible();
  const patch=requests.find(r=>r.path.endsWith('/profiles'));
  expect(patch).toBeTruthy(); expect(patch!.body.gold).toBeUndefined();expect(patch!.body.id).toBeUndefined();
  expect(errors).toEqual([]);
});

test('home create action opens a real screen rather than a blank page', async ({page})=>{
  const {errors}=await setup(page); await page.goto('/');
  await page.getByTitle('إنشاء غرفة').click();
  await expect(page.getByText('إنشاء غرفة صوتية جديدة',{exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('room seats are rendered from the database and recharge opens while joined', async ({page})=>{
  const {errors}=await setup(page,true,{rooms:true}); await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await expect(page.getByText('دردشة الغرفة',{exact:true})).toBeVisible();
  await expect(page.getByText('مقعد 4',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'شحن',exact:true}).click();
  await expect(page.getByRole('heading',{name:'شحن العملات',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('search uses server profiles and does not display invented accounts', async ({page})=>{
  const {requests,errors}=await setup(page); await page.goto('/');
  await page.getByTitle('بحث',{exact:true}).click();
  await page.getByPlaceholder('ابحث عن غرفة، اسم مستخدم، أو رقم ID...').fill('451305');
  await expect(page.getByText('مستخدم البحث',{exact:true})).toBeVisible();
  expect(requests.some(r=>r.path.endsWith('/search_public_profiles'))).toBe(true);
  expect(errors).toEqual([]);
});

test('direct messages are received, marked read and sent exactly once', async ({page})=>{
  const {requests,errors}=await setup(page,true,{messages:true}); await page.goto('/');
  await page.getByTitle('الرسائل',{exact:true}).click();
  await page.getByRole('button').filter({hasText:'مستخدم الرسائل'}).click();
  await expect(page.getByText('رسالة واردة',{exact:true})).toBeVisible();
  const input=page.locator('form input'); await input.fill('رسالة جديدة');
  await input.press('Enter');
  await expect(page.getByText('رسالة جديدة',{exact:true})).toHaveCount(1);
  expect(requests.filter(r=>r.path.endsWith('/direct_messages')&&r.body?.content==='رسالة جديدة')).toHaveLength(1);
  expect(requests.some(r=>r.path.endsWith('/direct_messages')&&r.body?.read_at)).toBe(true);
  expect(errors).toEqual([]);
});

test('failed conversion preserves balances and exposes a clear error', async ({page})=>{
  const {requests,errors}=await setup(page,true,{conversionError:true}); await page.goto('/');
  await page.getByTitle('أنا').click(); await page.getByText('شحن / محفظة',{exact:true}).click();
  await page.getByRole('button',{name:'ألماسي',exact:true}).click();
  await page.getByRole('button',{name:'تحويل',exact:true}).click();
  await page.locator('input[type="number"]').fill('1000');
  await page.getByRole('button',{name:/تأكيد فك الماس والتحويل/}).click();
  await expect(page.getByRole('alert')).toContainText('رصيد الألماس غير كاف');
  expect(requests.find(r=>r.path.endsWith('/convert_diamonds_to_gold'))?.body.p_diamonds).toBe(1000);
  expect(requests.some(r=>r.path.endsWith('/profiles')&&r.body?.gold)).toBe(false);
  expect(errors).toEqual([]);
});

test('profile screens render without hook errors or blank navigation', async ({page})=>{
  const {errors}=await setup(page); await page.goto('/');
  for (const [label,heading] of [['شارة','شارة'],['السحر/ الثروة','مستوى الثروة'],['اكسب عملات فضية','مركز العملات الفضية والمهام'],['مركز المساعدة','مركز المساعدة'],['اعدادات','الإعدادات'],['المتجر','المتجر'],['وكالة','بوابة الوكالات']]) {
    await page.goto('/'); await page.getByTitle('أنا').click();
    await page.getByText(label,{exact:true}).first().click();
    await expect(page.locator('body')).not.toContainText('حدث خطأ أثناء تحميل الصفحة');
    await expect(page.locator('body')).toContainText(heading);
  }
  expect(errors).toEqual([]);
});

for (const width of [320, 360, 412, 768, 1280]) {
  test(`messages matrix and long direct messages remain aligned at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:844});
    const {errors}=await setup(page,true,{messages:true});
    await page.addInitScript(()=>{
      localStorage.setItem('toti_system_messages_history','{"broken":true}');
      localStorage.setItem('toti_realtime_wealth_rankings_v4_zeroed','[null]');
      localStorage.setItem('toti_audio_preferences_11111111-1111-4111-8111-111111111111','null');
    });
    await page.goto('/'); await page.getByTitle('الرسائل',{exact:true}).click();
    const system=page.getByRole('heading',{name:'رسائل النظام',exact:true});
    const official=page.getByRole('heading',{name:'رسائل رسمية',exact:true});
    await expect(system).toBeVisible(); await expect(official).toBeVisible();
    const a=await system.boundingBox(), b=await official.boundingBox();
    expect(a!.y).toBeLessThan(b!.y); expect(Math.abs(a!.x-b!.x)).toBeLessThan(1);
    const rows=page.locator('div.grid').filter({has:page.locator('h2')});
    await expect(rows).toHaveCount(2);
    for (const row of await rows.all()) expect(await row.evaluate(el=>getComputedStyle(el).display)).toBe('grid');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width===360) await page.screenshot({path:'test-results/integration-messages-mobile.png',fullPage:true});
    await page.getByRole('button').filter({hasText:'مستخدم الرسائل'}).click();
    await page.locator('form input').fill('ك'.repeat(700)); await page.locator('form input').press('Enter');
    await expect(page.getByText('ك'.repeat(700),{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    if(width===360) await page.screenshot({path:'test-results/integration-chat-mobile.png',fullPage:true});
  });
}

test('existing official recharge agent opens a server-backed chat without invented contact details', async ({page})=>{
  const {errors,requests}=await setup(page,true,{agent:true}); await page.goto('/');
  await page.getByTitle('أنا').click(); await page.getByText('شحن / محفظة',{exact:true}).click();
  await page.getByRole('button',{name:'تأكيد الشحن',exact:true}).click();
  await expect(page.getByText('TotiChat Official Recharge',{exact:true})).toBeVisible();
  await expect(page.getByText('Iraq',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'تواصل مع وكيل الشحن داخل التطبيق',exact:true}).click();
  await expect(page.getByRole('heading',{name:'TR72',exact:true})).toBeVisible();
  await expect(page.locator('a[href*="wa.me"], a[href^="tel:"]')).toHaveCount(0);
  await page.locator('form input').fill('استفسار عن طلب الشحن'); await page.locator('form input').press('Enter');
  await expect(page.getByText('استفسار عن طلب الشحن',{exact:true})).toHaveCount(1);
  expect(requests.filter(r=>r.path.endsWith('/direct_messages')&&r.body?.content==='استفسار عن طلب الشحن')).toHaveLength(1);
  expect(requests.find(r=>r.body?.content==='استفسار عن طلب الشحن')!.body.recipient_public_id).toBe(451305);
  expect(requests.some(r=>r.path.endsWith('/profiles')&&r.body?.gold)).toBe(false);
  expect(errors).toEqual([]);
});

test('official messages route to the existing account and allow real text requests', async ({page})=>{
  const {errors}=await setup(page,true,{agent:true}); await page.goto('/');
  await page.getByTitle('الرسائل',{exact:true}).click(); await page.getByRole('heading',{name:'رسائل رسمية',exact:true}).click();
  await expect(page.getByRole('heading',{name:'TR72',exact:true})).toBeVisible();
  await expect(page.locator('form input')).toBeEnabled();
  expect(errors).toEqual([]);
});

test('zero balances and unavailable recharge agent do not display mock money or payment success', async ({page})=>{
  const {errors,requests}=await setup(page,true,{zero:true,noAgent:true}); await page.goto('/');
  await page.getByTitle('أنا').click(); await page.getByText('شحن / محفظة',{exact:true}).click();
  await expect(page.locator('body')).not.toContainText('119,797,499');
  await page.getByRole('button',{name:'تأكيد الشحن',exact:true}).click();
  await expect(page.getByText('لا يوجد وكيل شحن رسمي لبلدك حالياً.',{exact:true})).toBeVisible();
  await expect(page.getByText('تم إنشاء طلب الشحن. يرجى الدفع للوكيل الرسمي.',{exact:true})).toHaveCount(0);
  expect(requests.some(r=>r.path.endsWith('/profiles')&&r.body?.gold)).toBe(false);
  expect(errors).toEqual([]);
});

test('profile fetch failure offers recovery instead of a white screen', async ({page})=>{
  const {errors}=await setup(page,true,{profileError:true}); await page.goto('/');
  await expect(page.getByRole('button',{name:'إعادة المحاولة',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'تسجيل الخروج',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('room participant profile retains the selected server identity after frontend integration', async ({page})=>{
  const {errors}=await setup(page,true,{rooms:true,otherMember:true}); await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByText('مشارك آخر',{exact:true}).click();
  await page.getByRole('button',{name:'المزيد',exact:true}).click();
  await expect(page.getByTitle('معرف الحساب: 451306 (انقر للنسخ)',{exact:true})).toBeVisible();
  await expect(page.locator('span[dir=auto]').filter({hasText:'مشارك آخر'})).toBeVisible();
  expect(errors).toEqual([]);
});

test('remaining profile navigation and agency support stay usable on a narrow mobile viewport', async ({page})=>{
  await page.setViewportSize({width:320,height:740});
  const {errors}=await setup(page,true,{agent:true});
  for (const [locator,text] of [
    ['title:تعديل الملف الشخصي والصورة والاسم','الاسم'],
    ['title:عرض الملف الشخصي','حساب الاختبار'],
    ['text:متابعين','شبكة الأصدقاء والمتابعين'],
    ['text:زائر','تسجيل زيارات الملف الشخصي لم يُفعّل بعد.'],
    ['text:check now','VIP'],
  ]) {
    await page.goto('/'); await page.getByTitle('أنا').click();
    const [kind,label]=locator.split(':');
    await (kind==='title' ? page.getByTitle(label,{exact:true}) : page.getByText(label,{exact:true})).first().click();
    await expect(page.locator('body')).toContainText(text);
    await expect(page.locator('body')).not.toContainText('حدث خطأ أثناء تحميل الصفحة');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.goto('/'); await page.getByTitle('أنا').click(); await page.getByText('وكالة',{exact:true}).click();
  await page.getByText('451305',{exact:true}).click();
  await expect(page.getByRole('heading',{name:'TR72',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});
