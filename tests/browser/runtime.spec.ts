import { test, expect, Page } from '@playwright/test';
const actor = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const roomId = '33333333-3333-4333-8333-333333333333';
const profile = {id: actor, public_id: 920003, username: 'test_user', display_name: 'حساب الاختبار', avatar_url: '/assets/images/default_arab_user_avatar_1790806239365.jpg', level: 1, vip_level: 0, gold: 100, diamonds: 90, silver_coins: 0, country_code: 'IQ', country_name: 'العراق'};
const room = {id: roomId, owner_id: actor, name: 'غرفة الاختبار', description: 'دردشة فعلية', max_seats: 4, is_active: true, is_private: false, is_vip: false, category: 'عامة', tags: [], owner_public_id: 920003, owner_display_name: 'حساب الاختبار'};
const authUser = {id: actor, aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', app_metadata: {provider: 'google'}, user_metadata: {}, created_at: new Date().toISOString()};
const token = `${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:actor,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.dGVzdA`;
const session = {access_token: token, refresh_token:'test-refresh', token_type:'bearer', expires_in:3600, expires_at:Math.floor(Date.now()/1000)+3600, user: authUser};
async function setup(page: Page, loggedIn = true, overrides: {country?: string; rooms?: boolean; conversionError?: boolean; currency?: boolean; conversionDelay?: boolean; quoteError?: boolean; messages?: boolean; agent?: boolean; zero?: boolean; giftFunds?: boolean; profileError?: boolean; noAgent?: boolean; otherMember?: boolean; commerce?: boolean; purchaseError?: boolean; social?: boolean; roomProfile?: Record<string,unknown>; roomProfileError?: boolean; noMemberId?: boolean; roomCouple?: boolean; roomAgency?: boolean; optionalProfileError?: boolean; roomSeatVip?: number; roomSeatLevel?: number; roomSettings?: boolean; settingsError?: boolean; listener?: boolean; economy?: boolean; tenSeats?: boolean; longText?: boolean; startUnmuted?: boolean; muteDelay?: boolean} = {}) {
  const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  let membershipRemoved = false;
  let currentMuted = !overrides.startUnmuted;
  let currentRoom = {...room,max_seats:overrides.tenSeats?10:room.max_seats, owner_id:overrides.listener?other:actor, welcome_message: overrides.roomSettings ? 'ترحيب محفوظ' : room.description, chat_enabled: !overrides.roomSettings, gift_effects_enabled: !overrides.roomSettings, vehicle_effects_enabled: !overrides.roomSettings, entrance_effects_enabled: !overrides.roomSettings};
  let current = {...profile,display_name:overrides.longText?'اسم مستخدم عربي طويل جداً لاختبار المساحة وتناسق الملف الشخصي':profile.display_name, sent_gold:overrides.economy?16000:0,received_gold:overrides.economy?20000:0, gold: overrides.zero ? 0 : overrides.giftFunds ? 1000 : profile.gold, diamonds: overrides.zero ? 0 : profile.diamonds, country_code: overrides.country === '' ? '' : 'IQ'};
  const directMessages: any[] = overrides.messages ? [{id:'incoming',sender_id:other,recipient_id:actor,recipient_public_id:920003,sender_public_id:451305,sender_display_name:'مستخدم الرسائل',recipient_display_name:'حساب الاختبار',message_type:'text',content:'رسالة واردة',created_at:new Date().toISOString(),read_at:null}] : [];
  const requests: {path: string; body: any}[]=[];
  let fixed=overrides.currency?100000:60; let lucky=overrides.currency?100000:20; let legacy=overrides.currency?777:10; const redemptions = new Map<string,any>();
  if(overrides.currency)current={...current,diamonds:fixed+lucky+legacy};
  const walletHistory:any[] = overrides.currency ? [
    {id:'fixed-received',transaction_type:'fixed_gift_diamonds_received',gold_delta:0,diamond_delta:100000,created_at:new Date().toISOString()},
    {id:'lucky-received',transaction_type:'lucky_gift_diamonds_received',gold_delta:0,diamond_delta:100000,created_at:new Date().toISOString()},
  ] : [];
  let followed=false; let friendStatus='none'; const purchased:string[]=[]; let rewardClaimed=false; let notificationRead=false;
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
    if (path.endsWith('/rooms')) return respond(overrides.rooms ? [currentRoom] : []);
    if (path.endsWith('/gift_catalog')) return respond([{id:'g1',name:'وردة الاختبار',price:10,diamond_source_type:'FIXED_GIFT',is_active:true}]);
    if (path.endsWith('/room_members')) return respond(overrides.rooms && !membershipRemoved ? [{id:'member',room_id:roomId,user_id:actor,seat_number:overrides.listener?null:1,role:overrides.listener?'member':'owner',is_muted:currentMuted,member_public_id:920003,member_display_name:'حساب الاختبار'}, ...(overrides.otherMember ? [{id:'other-member',room_id:roomId,user_id:other,seat_number:2,role:'member',is_muted:true,member_public_id:overrides.noMemberId ? null : 451306,member_display_name:'مشارك آخر',member_level:overrides.roomSeatLevel ?? overrides.roomProfile?.level ?? 0,member_vip_level:overrides.roomSeatVip ?? overrides.roomProfile?.vip_level ?? 0,member_avatar_url:overrides.roomProfile?.avatar_url ?? null}] : [])] : []);
    if (path.endsWith('/wallet_transactions')) return respond(walletHistory);
    if (path.endsWith('/recharge_packages')) return respond([{id:'44444444-4444-4444-8444-444444444444',price_usd:0.99,gold_amount:4900}]);
    if (path.endsWith('/create_recharge_request')) {
      if (overrides.noAgent) return respond({message:'no official recharge agent is configured for this country'},400);
      return respond([{request_id:'request',agent_id:'existing-agent',agent_display_name:'TotiChat Official Recharge',country_code:'IQ',country_name:'Iraq',agent_phone:null,gold_amount:4900,price_usd:0.99,payment_methods:[],contact_info:{channel:'in_app',public_id:'451305',phone:null,whatsapp:null}}]);
    }
    if (path.endsWith('/social_profile') && body.p_public_id===451306) {
      if(overrides.roomProfileError)return respond({message:'profile unavailable'},500);
      return respond({id:other,public_id:451306,display_name:'مشارك آخر',level:0,vip_level:0,...overrides.roomProfile});
    }
    if (path.endsWith('/social_profile')) return respond(body.p_public_id===920003 ? {...current,friends_count:0,following_count:followed?1:0,followers_count:0} : {id:other,public_id:body.p_public_id,display_name:body.p_public_id===451306?'مشارك آخر':'مستخدم البحث',level:1,vip_level:0,is_following:followed,is_blocked:false,friend_status:friendStatus});
    if (path.endsWith('/social_list')) return respond(overrides.social ? [{id:other,public_id:451305,display_name:'مستخدم العلاقة',level:1,vip_level:0}] : []);
    if (path.endsWith('/social_action')) {if(body.p_action==='follow') followed=true;if(body.p_action==='request')friendStatus='sent';return respond({public_id:451305,is_following:followed,friend_status:friendStatus});}
    if (path.endsWith('/room_user_permissions')) {
      const self=body.p_public_id===920003;
      const owner=currentRoom.owner_id===actor;
      return respond({
        self,
        social:{follow:!self,message:!self,gift:true,mention:!self,is_following:followed},
        moderation:owner&&!self?['unmute','down','kick','ban']:[],
        manage_moderators:owner&&!self
      });
    }
    if (path.endsWith('/moderate_room_user')) return respond(null);
    if (path.endsWith('/couple_state')) {if(overrides.optionalProfileError)return respond({message:'unavailable'},500);return respond({relations:overrides.roomCouple ? [{accepted_at:'2026-01-01T00:00:00Z',ended_at:null,partner:{public_id:451306,display_name:'مشارك آخر',level:0,vip_level:0}}] : [],current:[],previous:[]});}
    if (path.endsWith('/agency_state')) {if(overrides.optionalProfileError)return respond({message:'unavailable'},500);return respond({agency:overrides.roomAgency?{id:87,name:'وكالة حقيقية للاختبار',owner_id:actor}:null,members:overrides.roomAgency?[{public_id:920003},{public_id:451306}]:[],applications:[],available:[]});}
    if (path.endsWith('/user_notifications')) {if(method==='PATCH')notificationRead=true;return respond(overrides.commerce ? [{id:'notification',type:'system',title:'إشعار من الخادم',description:'محتوى حقيقي من الاستجابة',created_at:new Date().toISOString(),read_at:notificationRead?new Date().toISOString():null}] : []);}
    if (path.endsWith('/store_catalog')) return respond(overrides.commerce ? [{id:'server-frame',name:'إطار الخادم',category:'frames',price:37,currency:'gold',icon:'🌸',description:'منتج من الخادم',duration_days:7},{id:'server-entrance',name:'دخول الخادم',category:'entrances',price:41,currency:'gold',icon:'✨',description:'مؤثر دخول من الخادم',duration_days:7},{id:'server-card',name:'بطاقة حب الخادم',category:'cards',price:43,currency:'gold',icon:'💗',description:'بطاقة CP من الخادم',duration_days:30,relationship_type_id:'love',preview_url:null},{id:'vip1',name:'VIP1',category:'vip',price:50,currency:'gold',vip_level:1,duration_days:30}] : []);
    if (path.endsWith('/store_purchases')) return respond(purchased.map(id=>({item_id:id,expires_at:null})));
    if (path.endsWith('/purchase_store_item')) {
      if(overrides.purchaseError)return respond({message:'insufficient gold'},400);
      purchased.push(body.p_item_id);current={...current,gold:current.gold-(body.p_item_id==='vip1'?50:37),vip_level:body.p_item_id==='vip1'?1:current.vip_level};return respond({id:'server-purchase'});
    }
    if (path.endsWith('/claim_reward')) {const already=rewardClaimed;rewardClaimed=true;if(!already)current={...current,gold:current.gold+300,silver_coins:150};return respond({gold:300,silver:150,already_claimed:already});}
    if (path.endsWith('/submit_support_ticket')) return respond('55555555-5555-4555-8555-555555555555');
    if (path.endsWith('/get_gift_rankings')) return respond(overrides.economy?{wealth:[{public_id:920003,display_name:'حساب الاختبار',score:16000},{public_id:451305,display_name:'مستخدم آخر',score:1000}],charm:[{public_id:920003,display_name:'حساب الاختبار',score:20000}],rooms:[]}:{wealth:[],charm:[],rooms:[]});
    if (path.endsWith('/search_public_profiles')) return respond([{public_id:451305,display_name:overrides.agent ? 'TR72' : 'مستخدم البحث',username:'other',level:1,vip_level:0}]);
    if (path.endsWith('/wallet_diamond_state')) return respond({fixed_diamonds:fixed,lucky_diamonds:lucky,legacy_diamonds:legacy,diamonds_balance:current.diamonds});
    if (path.endsWith('/preview_diamond_redemption')) {
      if(overrides.quoteError)return respond({message:'insufficient redeemable diamonds'},400);
      const f=Math.min(body.p_diamonds,fixed);const l=body.p_diamonds-f;
      if(l>lucky)return respond({message:'insufficient redeemable diamonds'},400);
      return respond({diamonds_amount:body.p_diamonds,fixed_diamonds:f,lucky_diamonds:l,coins_amount:Math.floor(f*3/10)+Math.floor(l/10)});
    }
    if (path.endsWith('/redeem_diamonds')) {
      if(overrides.conversionDelay)await new Promise(resolve=>setTimeout(resolve,650));
      if (overrides.conversionError) return respond({message:'insufficient diamonds'},400);
      let quote=redemptions.get(body.p_request_id);
      if(!quote){const f=Math.min(body.p_diamonds,fixed);const l=body.p_diamonds-f;quote={diamonds_amount:body.p_diamonds,fixed_diamonds:f,lucky_diamonds:l,coins_amount:Math.floor(f*3/10)+Math.floor(l/10)};
      fixed-=f;lucky-=l;current={...current,diamonds:current.diamonds-body.p_diamonds,gold:current.gold+quote.coins_amount};redemptions.set(body.p_request_id,quote);
      for(const [type,diamonds,coins] of [['fixed_diamonds_redeemed',-f,0],['lucky_diamonds_redeemed',-l,0],['coins_from_diamond_redemption',0,quote.coins_amount]]){if(diamonds||coins)walletHistory.push({id:type,transaction_type:type,diamond_delta:diamonds,gold_delta:coins,created_at:new Date().toISOString()});}
      }
      return respond(quote);
    }
    if (path.endsWith('/update_room_settings')) {
      if (overrides.settingsError) return respond({message:'save failed'},400);
      currentRoom = {...currentRoom, name:body.p_name, description:body.p_welcome_message, welcome_message:body.p_welcome_message, chat_enabled:body.p_chat_enabled, gift_effects_enabled:body.p_gift_effects_enabled, vehicle_effects_enabled:body.p_vehicle_effects_enabled, entrance_effects_enabled:body.p_entrance_effects_enabled};
      return respond(null);
    }
    if (path.endsWith('/reopen_room')) {currentRoom.is_active=true;return respond(null);}
    if (path.endsWith('/close_room')) {currentRoom.is_active=false;return respond(null);}
    if (path.endsWith('/create_room')) return respond(roomId);
    if (path.endsWith('/set_my_room_muted')) {if(overrides.muteDelay)await new Promise(resolve=>setTimeout(resolve,650));currentMuted=body.p_muted;return respond(null);}
    if (path.includes('/rpc/')) return respond(null);
    return respond([]);
  });
  await page.addInitScript(({session,loggedIn})=>{
    // A forged legacy local profile must never become the authenticated identity.
    localStorage.setItem('app_user_profile',JSON.stringify({id:'30301',gold:999999,name:'الحساب الوهمي'}));
    if (loggedIn) localStorage.setItem('sb-bfadhdnudmsggylunhlh-auth-token',JSON.stringify(session));
  },{session,loggedIn});
  return {errors,requests, removeMembership: () => {membershipRemoved = true;}};
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
  await expect(page.getByRole('heading',{name:'أنشئ غرفة',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('room seats are rendered from the database and recharge opens while joined', async ({page})=>{
  const {errors}=await setup(page,true,{rooms:true}); await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await expect(page.getByText('دردشة فعلية',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'الجلوس في المقعد 4',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'إرسال هدية',exact:true}).click();
  await page.getByTitle('شحن رصيد',{exact:true}).click();
  await expect(page.getByRole('heading',{name:'شحن العملات',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

// Reference regression: gift send must not restore the removed center-screen luxury notice.
test('gift selection waits for Send, supports agreed quantities and blocks rapid duplicates', async ({page})=>{
  const {requests,errors}=await setup(page,true,{rooms:true,giftFunds:true}); await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByRole('button',{name:'إرسال هدية',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'صندوق الهدايا',exact:true});
  await expect(dialog.getByText('وردة الاختبار',{exact:true})).toBeVisible();
  await dialog.getByText('وردة الاختبار',{exact:true}).click();
  expect(requests.filter(r=>r.path.endsWith('/send_room_gift_batch'))).toHaveLength(0);
  await dialog.getByRole('button',{name:'اختيار كمية 77',exact:true}).click();
  const send=dialog.getByRole('button',{name:/إرسال الهدية/});
  await send.dblclick();
  await expect(dialog.getByText('تم الإرسال بنجاح!',{exact:true})).toBeVisible();
  await expect(page.getByTestId('room-gift-animation')).toBeVisible();
  const announcement=page.getByTestId('room-gift-announcement');
  await expect(announcement).toBeVisible();
  await expect(announcement).toContainText('أرسل');
  await expect(announcement).toContainText('وردة الاختبار');
  await expect(page.getByText('هدية فاخرة',{exact:true})).toHaveCount(0);
  const calls=requests.filter(r=>r.path.endsWith('/send_room_gift_batch'));
  expect(calls).toHaveLength(1);
  expect(calls[0].body.p_quantity).toBe(77);
  expect(calls[0].body.p_recipient_public_id).toBe(920003);
  expect(calls[0].body.p_gift_id).toBe('g1');
  expect(typeof calls[0].body.p_request_id).toBe('string');
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
  await page.getByRole('button',{name:'أرباح الهدايا',exact:true}).click();
  await page.getByRole('button',{name:'تحويل',exact:true}).click();
  await page.getByRole('spinbutton',{name:'كمية الماس'}).fill('10');
  await page.getByRole('button',{name:'معاينة الفك',exact:true}).click();
  await page.getByRole('button',{name:/تأكيد فك الماس والتحويل/}).click();
  await expect(page.getByRole('alert')).toContainText('رصيد الألماس غير كاف');
  expect(requests.find(r=>r.path.endsWith('/redeem_diamonds'))?.body.p_diamonds).toBe(10);
  expect(requests.some(r=>r.path.endsWith('/profiles')&&r.body?.gold)).toBe(false);
  expect(errors).toEqual([]);
});

test('profile screens render without hook errors or blank navigation', async ({page})=>{
  const {errors}=await setup(page); await page.goto('/');
  for (const [label,heading] of [['شارة','ميدالية'],['السحر/ الثروة','مستوى الثروة'],['اكسب عملات فضية','مركز العملات الفضية والمهام'],['مركز المساعدة','مركز المساعدة'],['اعدادات','الإعدادات'],['المتجر','متجر TotiChat'],['الحقيبة','الحقيبة'],['وكالة','بوابة الوكالات']]) {
    await page.goto('/'); await page.getByTitle('أنا').click();
    await page.getByText(label,{exact:true}).first().click();
    await expect(page.locator('body')).not.toContainText('حدث خطأ أثناء تحميل الصفحة');
    await expect(page.locator('body')).toContainText(heading);
  }
  expect(errors).toEqual([]);
});


test('store exposes server-backed entrance and CP card tabs and inventory stays separate', async ({page})=>{
  const {errors}=await setup(page,true,{commerce:true});await page.goto('/');
  await page.getByTitle('أنا').click();await page.getByText('المتجر',{exact:true}).click();
  await expect(page.getByRole('heading',{name:'متجر TotiChat',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'بطاقات CP',exact:true}).click();
  await expect(page.getByText('بطاقة حب الخادم',{exact:true})).toBeVisible();
  await expect(page.getByText('CP: love',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'مؤثر الدخول',exact:true}).click();
  await expect(page.getByText('دخول الخادم',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'فتح الحقيبة',exact:true}).click();
  await expect(page.getByRole('heading',{name:'الحقيبة',exact:true})).toBeVisible();
  await expect(page.getByText('لا توجد مقتنيات في هذا القسم',{exact:true})).toBeVisible();
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
    ['text:زائر','شبكة الأصدقاء والمتابعين'],
    ['text:عرض المزايا','VIP'],
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

test('store reads server prices, confirms purchase and equips only owned products', async ({page})=>{
  const {requests,errors}=await setup(page,true,{commerce:true});await page.goto('/');await page.getByTitle('أنا').click();await page.getByText('المتجر',{exact:true}).click();
  await expect(page.getByText('إطار الخادم',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'شراء',exact:true}).click();
  await expect(page.getByText('تم اعتماد الشراء من الخادم.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'تجهيز',exact:true}).click();
  await expect(page.getByText('تم اعتماد تجهيز المنتج.',{exact:true})).toBeVisible();
  const purchase=requests.find(r=>r.path.endsWith('/purchase_store_item'))!;
  expect(purchase.body.p_item_id).toBe('server-frame');expect(purchase.body.p_request_id).toMatch(/^[\da-f-]{36}$/);
  expect(purchase.body.price).toBeUndefined();expect(requests.some(r=>r.path.endsWith('/profiles')&&r.body?.gold)).toBe(false);
  expect(requests.some(r=>r.path.endsWith('/equip_store_item'))).toBe(true);expect(errors).toEqual([]);
});
test('failed store purchase retains retry identifier and never displays success', async ({page})=>{
  const {requests,errors}=await setup(page,true,{commerce:true,purchaseError:true});await page.goto('/');await page.getByTitle('أنا').click();await page.getByText('المتجر',{exact:true}).click();
  await page.getByRole('button',{name:'شراء',exact:true}).click();await expect(page.getByText('رصيد الذهب غير كافٍ.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'إغلاق',exact:true}).click();await page.getByRole('button',{name:'شراء',exact:true}).click();
  await expect(page.getByText('رصيد الذهب غير كافٍ.',{exact:true})).toBeVisible();
  const attempts=requests.filter(r=>r.path.endsWith('/purchase_store_item'));expect(attempts).toHaveLength(2);expect(attempts[0].body.p_request_id).toBe(attempts[1].body.p_request_id);
  await expect(page.getByText('تم اعتماد الشراء من الخادم.',{exact:true})).toHaveCount(0);expect(errors).toEqual([]);
});
test('real relationships record visits and persist follow/friend requests via RPC', async ({page})=>{
  const {requests,errors}=await setup(page,true,{social:true});await page.goto('/');await page.getByTitle('أنا').click();await page.getByText('متابعين',{exact:true}).click();
  await page.getByRole('button').filter({hasText:'مستخدم العلاقة'}).click();await page.getByRole('button',{name:'متابعة',exact:true}).click();
  await expect(page.getByRole('button',{name:'إلغاء المتابعة',exact:true})).toBeVisible();await page.getByRole('button',{name:'طلب صداقة',exact:true}).click();
  await expect(page.getByRole('button',{name:'إلغاء الطلب',exact:true})).toBeVisible();
  expect(requests.some(r=>r.path.endsWith('/social_profile')&&r.body.p_visit&&r.body.p_public_id===451305)).toBe(true);
  expect(requests.some(r=>r.path.endsWith('/social_action')&&r.body.p_action==='request')).toBe(true);expect(errors).toEqual([]);
});
test('system messages show server notifications and persist read status', async ({page})=>{
  const {requests,errors}=await setup(page,true,{commerce:true});await page.goto('/');await page.getByTitle('الرسائل',{exact:true}).click();await page.getByRole('heading',{name:'رسائل النظام',exact:true}).click();
  await expect(page.getByText('إشعار من الخادم\nمحتوى حقيقي من الاستجابة',{exact:true})).toBeVisible();
  expect(requests.some(r=>r.path.endsWith('/user_notifications')&&r.body?.read_at)).toBe(true);expect(errors).toEqual([]);
});
test('reward and feedback confirmations require successful server replies', async ({page})=>{
  const {requests,errors}=await setup(page);await page.goto('/');await page.getByTitle('أنا').click();await page.getByText('اكسب عملات فضية',{exact:true}).click();
  await page.getByRole('button',{name:'استلام',exact:true}).first().click();await expect(page.getByRole('status')).toContainText('اعتمد الخادم');
  await page.goto('/');await page.getByTitle('أنا').click();await page.getByText('مركز المساعدة',{exact:true}).click();
  await page.getByPlaceholder('اكتب رسالتك أو استفسارك هنا بالتفصيل...').fill('ملاحظة اختبار موثقة من الخادم');await page.getByRole('button',{name:'إرسال للدعم الفني',exact:true}).click();
  await expect(page.getByText('شكراً لك! تم تسجيل ملاحظتك لدى الدعم.',{exact:true})).toBeVisible();
  expect(requests.some(r=>r.path.endsWith('/claim_reward'))).toBe(true);expect(requests.some(r=>r.path.endsWith('/submit_support_ticket'))).toBe(true);expect(errors).toEqual([]);
});

test('late microphone permission result is stopped after leaving the room', async ({page})=>{
  const {errors,requests}=await setup(page,true,{rooms:true});
  await page.addInitScript(()=>{
    (window as any).stoppedCapture=0;
    Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:()=>new Promise(resolve=>{
      (window as any).finishCapture=()=>resolve({getTracks:()=>[{stop:()=>{(window as any).stoppedCapture++;}}],getAudioTracks:()=>[]});
    })});
  });
  await page.goto('/');await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByRole('button',{name:'تشغيل المايكروفون',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>typeof (window as any).finishCapture)).toBe('function');
  await page.getByRole('button',{name:'خيارات الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'مغادرة الغرفة',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'التنقل الرئيسي'})).toBeVisible();
  await page.evaluate(()=>(window as any).finishCapture());
  await expect.poll(()=>page.evaluate(()=>(window as any).stoppedCapture)).toBe(1);
  expect(requests.some(r=>r.path.endsWith('/set_my_room_muted'))).toBe(false);expect(errors).toEqual([]);
});

async function openOtherRoomProfile(page: Page, overrides: Parameters<typeof setup>[2] = {}) {
  const result=await setup(page,true,{rooms:true,otherMember:true,...overrides});await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();await page.getByTestId('occupied-seat').nth(1).click();
  const card=page.getByRole('dialog',{name:'بطاقة مستخدم الغرفة'});await expect(card).toBeVisible();return {...result,card};
}
test('ordinary room user B has no VIP8, invented ranks, CP, medals, agency or Iraq fallback',async({page})=>{
  const {card,errors,requests}=await openOtherRoomProfile(page);
  await expect(card.getByRole('status')).toHaveCount(0);await expect(card.getByText('مشارك آخر',{exact:true})).toBeVisible();
  await expect(card.getByText('حساب الاختبار',{exact:true})).toHaveCount(0);
  for(const section of ['profile-vip','profile-couple','profile-agency','profile-country'])await expect(card.getByTestId(section)).toHaveCount(0);
  await expect(card.locator('[aria-label="المستوى 0"]')).toBeVisible();
  await expect(card.locator('[aria-label^="مستوى السحر"],[aria-label^="مستوى الثروة"]')).toHaveCount(0);
  for(const fake of ['VIP8','20M','5M','263','1331','IQ','🇮🇶','xنَفِسهـ🍁'])await expect(card).not.toContainText(fake);
  await expect(card.getByAltText('صورة افتراضية')).toHaveAttribute('src','/assets/images/default-user.svg');
  expect(requests.some(r=>r.path.endsWith('/social_profile')&&r.body.p_public_id===451306&&r.body.p_visit===false)).toBe(true);expect(errors).toEqual([]);
});
test('room profile header is standard without VIP and dynamic when VIP is active',async({page})=>{
  const result=await openOtherRoomProfile(page);
  await expect(result.card.getByTestId('standard-profile-header')).toBeVisible();
  await expect(result.card.getByTestId('vip-profile-header')).toHaveCount(0);
  await result.card.getByRole('button',{name:'إغلاق البطاقة'}).click();
});

test('self room profile exposes real seat controls while microphone is muted',async({page})=>{
  const first=await setup(page,true,{rooms:true});await page.goto('/');await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByTestId('occupied-seat').first().click();
  let card=page.getByRole('dialog',{name:'بطاقة مستخدم الغرفة'});
  await expect(card.getByRole('button',{name:'تشغيل المايك',exact:true})).toBeVisible();
  await expect(card.getByRole('button',{name:'النزول من المايك',exact:true})).toBeVisible();
  await expect(card.getByRole('button',{name:'إدارة الغرفة',exact:true})).toBeVisible();
  await card.getByRole('button',{name:'إغلاق البطاقة'}).click();
  expect(first.errors).toEqual([]);
});

test('self room profile reflects an active microphone state',async({page})=>{
  const result=await setup(page,true,{rooms:true,startUnmuted:true});await page.goto('/');await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByTestId('occupied-seat').first().click();
  const card=page.getByRole('dialog',{name:'بطاقة مستخدم الغرفة'});
  await expect(card.getByRole('button',{name:'كتم المايك',exact:true})).toBeVisible();
  await expect(card.getByRole('button',{name:'النزول من المايك',exact:true})).toBeVisible();
  expect(result.errors).toEqual([]);
});

test('other user profile uses social actions and server-backed owner moderation permissions',async({page})=>{
  const {card,requests,errors}=await openOtherRoomProfile(page);
  await expect(card.getByRole('button',{name:'متابعة',exact:true})).toBeVisible();
  await expect(card.getByRole('button',{name:'دردشة',exact:true})).toBeVisible();
  await expect(card.getByRole('button',{name:'إرسال هدية',exact:true})).toBeVisible();
  await expect(card.getByText('إجراءات الإشراف',{exact:true})).toBeVisible();
  await expect(card.getByRole('button',{name:'فتح صوت العضو',exact:true})).toBeVisible();
  await card.getByRole('button',{name:'متابعة',exact:true}).click();
  await expect(card.getByRole('button',{name:'تمت المتابعة',exact:true})).toBeVisible();
  expect(requests.some(r=>r.path.endsWith('/social_action')&&r.body.p_action==='follow')).toBe(true);
  expect(errors).toEqual([]);
});

test('room public data and authorized CP/agency show actual values without private identifiers',async({page})=>{
  const data={display_name:'الاسم الحقيقي B',avatar_url:'/assets/images/female_luxury_avatar_1790230899789.jpg',level:7,vip_level:2,country_code:'EG',gender:'female',email:'hidden@example.invalid',phone:'private-phone',auth_metadata:{role:'admin'}};
  const {card,errors}=await openOtherRoomProfile(page,{roomProfile:data,roomCouple:true,roomAgency:true,roomSeatLevel:0,roomSeatVip:8});
  const seat=page.getByTestId('occupied-seat').nth(1);
  await expect(seat).toHaveAttribute('aria-label','عرض ملف الاسم الحقيقي B');await expect(seat.locator('[aria-label="المستوى 7"]')).toBeVisible();await expect(seat).toContainText('VIP2');await expect(seat).not.toContainText('VIP8');
  await expect(card.getByTestId('profile-vip')).toContainText('VIP2');await expect(card.getByTestId('vip-profile-header')).toHaveAttribute('data-vip-level','2');await expect(card.getByTestId('profile-country')).toContainText('EG');
  await expect(card.getByTestId('profile-avatar-frame')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(card.getByTestId('profile-agency')).toContainText('وكالة حقيقية للاختبار');await expect(card.getByTestId('profile-couple')).toContainText('حساب الاختبار');
  await expect(card.locator('[aria-label="المستوى 7"]')).toBeVisible();await expect(card.getByTitle('معرف الحساب: 451306 (انقر للنسخ)')).toBeVisible();
  for(const privateValue of [actor,other,'hidden@example.invalid','private-phone','auth_metadata'])await expect(card).not.toContainText(privateValue);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/room-profile-real-data.png'});expect(errors).toEqual([]);
});
test('missing Public ID cannot become 1331 or open the current account details',async({page})=>{
  const {card,errors,requests}=await openOtherRoomProfile(page,{noMemberId:true});
  await expect(card.getByRole('alert')).toContainText('معرف المستخدم غير متاح');await expect(card.getByRole('button',{name:'المزيد',exact:true})).toBeDisabled();
  await expect(card.locator('[title^="معرف الحساب"]')).toHaveCount(0);await expect(card).not.toContainText('1331');await expect(card).not.toContainText('حساب الاختبار');
  expect(requests.filter(r=>r.path.endsWith('/social_profile')&&r.body.p_public_id===451306)).toHaveLength(0);expect(errors).toEqual([]);
});
test('profile lookup failure retains B snapshot and the room remains usable',async({page})=>{
  const {card,errors}=await openOtherRoomProfile(page,{roomProfileError:true});
  await expect(card.getByRole('alert')).toContainText('تعذر تحميل تفاصيل المستخدم');await expect(card.getByText('مشارك آخر',{exact:true})).toBeVisible();await expect(card).not.toContainText('حساب الاختبار');
  await expect(card.getByTestId('profile-vip')).toHaveCount(0);
  await page.route('**/rest/v1/rpc/social_profile',route=>route.request().postDataJSON()?.p_public_id===451306 ? route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({public_id:451306,display_name:'مشارك آخر',level:3,vip_level:1})}) : route.fallback());
  await card.getByRole('button',{name:'إعادة المحاولة',exact:true}).click();await expect(card.getByTestId('profile-vip')).toContainText('VIP1');await expect(card.getByRole('alert')).toHaveCount(0);
  await card.getByRole('button',{name:'إغلاق البطاقة'}).click();await expect(page.getByRole('textbox',{name:'رسالة الغرفة'})).toBeVisible();expect(errors).toEqual([]);
});
test('optional relationship lookup failure hides CP/agency without losing the public profile',async({page})=>{
  const {card,errors}=await openOtherRoomProfile(page,{optionalProfileError:true,roomProfile:{level:4,vip_level:1}});
  await expect(card.getByTestId('profile-vip')).toContainText('VIP1');await expect(card.getByTestId('profile-couple')).toHaveCount(0);await expect(card.getByTestId('profile-agency')).toHaveCount(0);await expect(card.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);
});

test('expired VIP in a room snapshot is never displayed as an active seat entitlement',async({page})=>{
  const {card,requests,errors}=await openOtherRoomProfile(page,{roomSeatVip:8,roomProfile:{vip_level:0}});
  await expect(card.getByRole('button',{name:'المزيد',exact:true})).toBeEnabled();
  await expect(page.getByTestId('occupied-seat').nth(1)).not.toContainText('VIP8');await expect(card.getByTestId('profile-vip')).toHaveCount(0);
  expect(requests.some(r=>r.path.endsWith('/social_profile')&&r.body.p_public_id===451306)).toBe(true);expect(errors).toEqual([]);
});


test('wallet shows Coins, source breakdown and mixed server preview then refreshes on confirmation',async({page})=>{
 const {requests,errors}=await setup(page,true,{currency:true,conversionDelay:true});await page.goto('/');
 await page.getByTitle('أنا').click();await page.getByText('شحن / محفظة',{exact:true}).click();
 await expect(page.getByText('الشحن للـCoins',{exact:false})).toBeVisible();
 await page.getByTitle('سجل العمليات',{exact:true}).click();
 await expect(page.getByRole('heading',{name:'المحفظة والسجل',exact:true})).toBeVisible();
 await expect(page.getByText('Coins 🪙',{exact:true})).toBeVisible();
 await expect(page.getByText('Diamonds 💎',{exact:true})).toBeVisible();
 await expect(page.getByText('Fixed',{exact:true})).toBeVisible();
 await expect(page.getByText('Lucky',{exact:true})).toBeVisible();
 await expect(page.getByText('Legacy',{exact:true})).toBeVisible();
 await expect(page.getByText('100,000',{exact:true})).toHaveCount(2);
 await expect(page.getByText('777',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'فك الماس',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog.getByText('ماس الهدايا الثابتة: 30% · ماس هدايا الحظ: 10%',{exact:true})).toBeVisible();
 await expect(dialog.getByText('Fixed Diamonds: 100,000 💎',{exact:true})).toBeVisible();
 await expect(dialog.getByText('Lucky Diamonds: 100,000 💎',{exact:true})).toBeVisible();
 await expect(dialog.getByText(/777/)).toBeVisible();
 await dialog.getByRole('button',{name:'اختيار كل الماس القابل للفك'}).click();
 await dialog.getByRole('button',{name:'معاينة الفك',exact:true}).click();
 await expect(dialog.getByTestId('diamond-quote')).toContainText('200,000');
 await expect(dialog.getByTestId('diamond-quote')).toContainText('40,000 Coins');
 expect(requests.filter(r=>r.path.endsWith('/redeem_diamonds'))).toHaveLength(0);
 await dialog.getByRole('button',{name:/تأكيد فك الماس والتحويل/}).click();
 await expect(dialog.getByRole('button',{name:/تأكيد فك الماس والتحويل/})).toBeDisabled();
 await expect(dialog.getByText('جارٍ تأكيد الفك في الخادم…')).toBeVisible();
 await expect(dialog.getByText(/تم فك 200,000/)).toBeVisible();
 const request=requests.find(r=>r.path.endsWith('/redeem_diamonds'))!;
 expect(Object.keys(request.body).sort()).toEqual(['p_diamonds','p_request_id']);
 expect(request.body.p_diamonds).toBe(200000);
 await dialog.getByRole('button',{name:'إغلاق فك الماس'}).click();
 await expect(page.getByText('Fixed',{exact:true}).locator('..').getByText('0',{exact:true})).toBeVisible();
 await expect(page.getByText('Lucky',{exact:true}).locator('..').getByText('0',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'التحويل',exact:true}).click();
 await expect(page.getByText('فك ماس ثابت — 30%',{exact:true})).toBeVisible();
 await expect(page.getByText('فك ماس الحظ — 10%',{exact:true})).toBeVisible();
 await expect(page.getByText('Coins من فك الماس',{exact:true})).toBeVisible();
 await expect(page.getByText('40,000',{exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'مستلمة',exact:true}).click();
 await expect(page.getByText('ماس هدية ثابتة',{exact:true})).toBeVisible();
 await expect(page.getByText('ماس هدية حظ',{exact:true})).toBeVisible();
 await expect(page.getByText('Coins من فك الماس',{exact:true})).toHaveCount(0);
 expect(requests.some(r=>r.path.endsWith('/profiles')&&r.body?.gold)).toBe(false);expect(errors).toEqual([]);
});

test('failed redemption retries with the same ID and never shows fake success',async({page})=>{
 const {requests,errors}=await setup(page,true,{currency:true,conversionError:true});await page.goto('/');
 await page.getByTitle('أنا').click();await page.getByText('شحن / محفظة',{exact:true}).click();
 await page.getByRole('button',{name:'أرباح الهدايا',exact:true}).click();await page.getByRole('button',{name:'تحويل',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('spinbutton').fill('200000');
 await dialog.getByRole('button',{name:'معاينة الفك'}).click();
 await dialog.getByRole('button',{name:/تأكيد فك الماس والتحويل/}).click();await expect(dialog.getByRole('alert')).toContainText('غير كاف');
 await expect(dialog.getByText(/تم فك /)).toHaveCount(0);
 await dialog.getByRole('button',{name:/تأكيد فك الماس والتحويل/}).click();await expect.poll(()=>requests.filter(r=>r.path.endsWith('/redeem_diamonds')).length).toBe(2);
 const calls=requests.filter(r=>r.path.endsWith('/redeem_diamonds'));expect(calls[0].body.p_request_id).toBe(calls[1].body.p_request_id);expect(errors).toEqual([]);
});

test('redemption rejects legacy-only preview and invalid amounts before confirmation',async({page})=>{
 const {requests,errors}=await setup(page,true,{currency:true});await page.goto('/');
 await page.getByTitle('أنا').click();await page.getByText('شحن / محفظة',{exact:true}).click();
 await page.getByRole('button',{name:'أرباح الهدايا',exact:true}).click();await page.getByRole('button',{name:'تحويل',exact:true}).click();
 const dialog=page.getByRole('dialog');
 for(const amount of ['0','-10','1.5','9007199254740992']){await dialog.getByRole('spinbutton').fill(amount);await dialog.getByRole('button',{name:'معاينة الفك'}).click();await expect(dialog.getByRole('alert')).toContainText('صحيحة');}
 expect(requests.filter(r=>r.path.endsWith('/preview_diamond_redemption'))).toHaveLength(0);
 await dialog.getByRole('spinbutton').fill('200777');await dialog.getByRole('button',{name:'معاينة الفك'}).click();await expect(dialog.getByRole('alert')).toContainText('الماس القديم');
 await expect(dialog.getByRole('button',{name:/تأكيد فك الماس/})).toHaveCount(0);expect(requests.filter(r=>r.path.endsWith('/redeem_diamonds'))).toHaveLength(0);expect(errors).toEqual([]);
});


test('room settings preserve disabled server flags and refresh the announcement after saving', async ({page}) => {
  const {requests,errors}=await setup(page,true,{rooms:true,roomSettings:true});
  await page.goto('/');await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await expect(page.getByText('ترحيب محفوظ',{exact:true})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'رسالة الغرفة',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'أدوات الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'إدارة الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
  for (const name of ['الدردشة العامة','تأثير الهدية','تأثير المركبة','تأثيرات الدخول']) {
    await expect(page.getByRole('button',{name: new RegExp(name)})).toHaveAttribute('aria-pressed','false');
  }
  await page.getByLabel('اسم الغرفة').fill('اسم جديد');
  await page.getByLabel('رسالة الترحيب').fill('ترحيب جديد');
  await page.getByRole('button',{name:'حفظ الإعدادات',exact:true}).click();
  await expect(page.getByText('تم حفظ إعدادات الغرفة',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'إغلاق إدارة الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'معلومات الغرفة',exact:true}).click();
  await expect(page.getByRole('heading',{name:'اسم جديد',exact:true})).toBeVisible();
  await expect(page.getByRole('dialog',{name:'معلومات الغرفة والموجودون',exact:true}).getByText('ترحيب جديد',{exact:true})).toBeVisible();
  const save=requests.find(r=>r.path.endsWith('/update_room_settings'));
  expect(save?.body).toMatchObject({p_room_id:roomId,p_chat_enabled:false,p_gift_effects_enabled:false,p_vehicle_effects_enabled:false,p_entrance_effects_enabled:false});
  expect(errors).toEqual([]);
});

test('failed room settings save keeps the confirmed room name and shows no success',async({page})=>{
  const {errors}=await setup(page,true,{rooms:true,settingsError:true});await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByRole('button',{name:'أدوات الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'إدارة الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
  await page.getByLabel('اسم الغرفة').fill('اسم غير محفوظ');
  await page.getByRole('button',{name:'حفظ الإعدادات',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('تعذر حفظ إعدادات الغرفة');
  await expect(page.getByText('تم حفظ إعدادات الغرفة',{exact:true})).toHaveCount(0);
  await page.getByRole('alert').getByRole('button',{name:'إغلاق',exact:true}).click();
  await page.getByRole('button',{name:'إغلاق إدارة الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'معلومات الغرفة',exact:true}).click();
  await expect(page.getByRole('heading',{name:'غرفة الاختبار',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'اسم غير محفوظ',exact:true})).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('membership removal clears the active public room and stops microphone capture',async({page})=>{
  const {removeMembership,errors}=await setup(page,true,{rooms:true});
  await page.addInitScript(()=>{
    (window as any).captureStopped=false;
    const track={kind:'audio',enabled:false,stop:()=>{(window as any).captureStopped=true;}};
    Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>({getTracks:()=>[track],getAudioTracks:()=>[track]})});
  });
  await page.goto('/');await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await expect(page.getByRole('button',{name:'خيارات الغرفة',exact:true})).toBeVisible();
  // Start the actual microphone before removing the membership.
  await page.getByRole('button',{name:'تشغيل المايكروفون',exact:true}).click();
  await expect(page.getByRole('button',{name:'كتم المايكروفون',exact:true})).toBeVisible();
  removeMembership();
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('button',{name:'خيارات الغرفة',exact:true})).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>(window as any).captureStopped)).toBe(true);
  expect(errors).toEqual([]);
});

test('owner closing the room clears the active room immediately',async({page})=>{
  const {requests,errors}=await setup(page,true,{rooms:true});await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByRole('button',{name:'أدوات الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'إدارة الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'إغلاق الروم',exact:true}).click();
  await expect(page.getByRole('button',{name:'خيارات الغرفة',exact:true})).toHaveCount(0);
  expect(requests.filter(r=>r.path.endsWith('/close_room'))).toHaveLength(1);
  expect(errors).toEqual([]);
});


test('ordinary listener opens live room information and member list without moderator RPC',async({page})=>{
  const {requests,errors}=await setup(page,true,{rooms:true,listener:true,otherMember:true});await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await expect(page.getByRole('button',{name:'إدارة الغرفة',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'الموجودون في الغرفة',exact:true}).click();
  const info=page.getByRole('dialog',{name:'معلومات الغرفة والموجودون',exact:true});
  await expect(info).toContainText('الموجودون (2)');
  await expect(info.getByRole('button',{name:'عرض ملف مشارك آخر'})).toBeVisible();
  expect(requests.filter(r=>r.path.endsWith('/get_room_management_members'))).toHaveLength(0);
  await info.getByRole('button',{name:'إغلاق معلومات الغرفة'}).click();
  await expect(page.getByRole('button',{name:'خيارات الغرفة',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('owner closes then reopens the same room from the closed room list',async({page})=>{
  const {requests,errors}=await setup(page,true,{rooms:true});await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByRole('button',{name:'أدوات الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'إدارة الغرفة',exact:true}).click();
  await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'إغلاق الروم',exact:true}).click();
  const closed=page.getByRole('region',{name:'غرفي المغلقة',exact:true});
  await expect(closed).toBeVisible();
  await closed.getByRole('button',{name:'إعادة فتح غرفة الاختبار',exact:true}).click();
  await expect(closed).toHaveCount(0);
  expect(requests.find(r=>r.path.endsWith('/reopen_room'))?.body.p_room_id).toBe(roomId);
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await expect(page.getByRole('button',{name:'خيارات الغرفة',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

for(const economy of [false,true]) test(`wealth and charm display persisted server totals without testing actions (${economy})`,async({page})=>{
  const {errors,requests}=await setup(page,true,{economy});
  for(const [label,total] of [['الثروة',economy?'16,000':'0'],['الجاذبية',economy?'20,000':'0']]){
    await page.goto('/');await page.getByText(label,{exact:true}).first().click();
    await expect(page.getByText(label==='الثروة'?'إجمالي دعمك داخل الغرف:':'إجمالي استلامك داخل الغرف:',{exact:false})).toContainText(total);
    await expect(page.getByText(/50,000/)).toHaveCount(0);
    await expect(page.getByRole('button',{name:/ادعم الآن|استلم دعم|تأكيد الدعم/})).toHaveCount(0);
  }
  expect(requests.some(r=>r.path.endsWith('/get_gift_rankings'))).toBe(true);expect(errors).toEqual([]);
});

test('room minimizes to home with membership retained and no full screen loading message',async({page})=>{
 const {requests,errors}=await setup(page,true,{rooms:true});await page.goto('/');await page.getByText('غرفة الاختبار',{exact:true}).first().click();
 await page.getByRole('button',{name:'خيارات الغرفة',exact:true}).click();await expect(page.getByRole('dialog',{name:'خيارات الغرفة'})).toBeVisible();
 await page.getByRole('button',{name:'تصغير الغرفة',exact:true}).click();
 await expect(page.getByRole('button',{name:'العودة إلى غرفة غرفة الاختبار'})).toBeVisible();
 await expect(page.getByTitle('الصفحة الرئيسية')).toBeVisible();
 await expect(page.getByText('جارٍ تحميل الشاشة…',{exact:true})).toHaveCount(0);
 expect(requests.some(r=>r.path.endsWith('/leave_room'))).toBe(false);
 await page.getByRole('button',{name:'العودة إلى غرفة غرفة الاختبار'}).click();await expect(page.getByRole('button',{name:'تشغيل المايكروفون',exact:true})).toBeVisible();expect(errors).toEqual([]);
});

test('mute button changes visually before the delayed server acknowledgement',async({page})=>{
 const {requests,errors}=await setup(page,true,{rooms:true,startUnmuted:true,muteDelay:true});await page.goto('/');
 await page.getByText('غرفة الاختبار',{exact:true}).first().click();
 const mute=page.getByRole('button',{name:'كتم المايكروفون',exact:true});await expect(mute).toBeVisible();
 await mute.click();
 await expect(page.getByRole('button',{name:'تشغيل المايكروفون',exact:true})).toBeVisible({timeout:250});
 await expect.poll(()=>requests.filter(r=>r.path.endsWith('/set_my_room_muted')).length).toBe(1);
 expect(errors).toEqual([]);
});

test('denied microphone permission never unmutes the server seat',async({page})=>{
 const {requests,errors}=await setup(page,true,{rooms:true});await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{throw new DOMException('denied','NotAllowedError');}})});
 await page.goto('/');await page.getByText('غرفة الاختبار',{exact:true}).first().click();await page.getByRole('button',{name:'تشغيل المايكروفون',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('تم رفض إذن المايكروفون');expect(requests.some(r=>r.path.endsWith('/set_my_room_muted'))).toBe(false);expect(errors).toEqual([]);
});

for(const width of [320,360,430]) test(`room controls and sheets retain actions at ${width}px`,async({page})=>{
 const {errors,requests}=await setup(page,true,{rooms:true,tenSeats:true});await page.setViewportSize({width,height:780});await page.goto('/');
 await page.getByRole('button',{name:'دخول غرفة غرفة الاختبار',exact:true}).first().click();
 await expect(page.getByRole('button',{name:'الجلوس في المقعد 10',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'أدوات الغرفة',exact:true}).click();
 for(const name of ['كتم سماعة الغرفة','رفع اليد','مغادرة المقعد']){const box=await page.getByRole('button',{name,exact:true}).boundingBox();expect(box?.width).toBeGreaterThanOrEqual(44);expect(box?.height).toBeGreaterThanOrEqual(44);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole('button',{name:'إغلاق الأدوات',exact:true}).click();
 await page.getByRole('button',{name:'خيارات الغرفة',exact:true}).click();await expect(page.getByRole('dialog',{name:'خيارات الغرفة'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'خيارات الغرفة'})).toHaveCount(0);
 await page.getByRole('button',{name:'إرسال هدية',exact:true}).click();await expect(page.getByRole('dialog',{name:'صندوق الهدايا',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'صندوق الهدايا',exact:true})).toHaveCount(0);
 await page.screenshot({path:`test-results/ui-review/room-${width}.png`,fullPage:true});expect(requests.some(r=>r.path.endsWith('/leave_room'))).toBe(false);expect(errors).toEqual([]);
});

for(const width of [320,360,430]) test(`UI review keeps Arabic screens within ${width}px`,async({page})=>{
 const {errors}=await setup(page,true,{longText:true});await page.setViewportSize({width,height:780});await page.emulateMedia({reducedMotion:'reduce'});
 const capture=async(name:string)=>{await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name).toBe(true);await page.screenshot({path:`test-results/ui-review/${name}-${width}.png`,fullPage:true});};
 await page.goto('/');await expect(page.getByTitle('بحث',{exact:true})).toBeVisible();for(const name of ['بحث','إنشاء غرفة']){const b=await page.getByTitle(name,{exact:true}).boundingBox();expect(b!.width).toBeGreaterThanOrEqual(44);expect(b!.height).toBeGreaterThanOrEqual(44);}
 await capture('home');
 await page.getByTitle('الرسائل',{exact:true}).click();await expect(page.getByText('لا توجد محادثات بعد',{exact:true})).toBeVisible();await capture('messages');
 await page.getByTitle('أنا',{exact:true}).click();await expect(page.getByTitle('اسم الحساب')).toBeVisible();await capture('profile');
 await page.getByTitle('عرض الملف الشخصي الكامل والشارات').click();await expect(page.getByRole('button',{name:'انضم إلى وكالة',exact:true})).toBeVisible();const copyId=page.getByRole('button',{name:'نسخ معرف الحساب 920003',exact:true});await expect(copyId).toBeVisible();const idBrightness=await copyId.locator('span').first().evaluate(el=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d')!;ctx.fillStyle=getComputedStyle(el).color;ctx.fillRect(0,0,1,1);return Math.min(...ctx.getImageData(0,0,1,1).data.slice(0,3));});expect(idBrightness).toBeGreaterThan(230);await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));await copyId.focus();await page.keyboard.press('Enter');await expect(page.getByText('تم نسخ المعرف!',{exact:true})).toBeVisible();await capture('full-profile');
 await page.goto('/');await page.getByTitle('بحث',{exact:true}).click();await page.getByPlaceholder('ابحث عن غرفة، اسم مستخدم، أو رقم ID...').fill('451305');await expect(page.getByRole('button',{name:'مراسلة مستخدم البحث',exact:true})).toBeVisible();await capture('search');
 await page.goto('/');await page.getByText('الثروة',{exact:true}).first().click();await expect(page.getByText('لا توجد عمليات مؤهلة في هذه الفترة',{exact:true})).toBeVisible();await capture('wealth');
 await page.goto('/');await page.getByTitle('أنا',{exact:true}).click();await page.getByText('شحن / محفظة',{exact:true}).click();await page.getByTitle('سجل العمليات',{exact:true}).click();await expect(page.getByText('لا توجد طلبات شحن',{exact:true})).toBeVisible();await capture('wallet');
 await page.goto('/');await page.getByTitle('أنا',{exact:true}).click();await page.getByText('وكالة',{exact:true}).click();await expect(page.getByText('بوابة الوكالات',{exact:true})).toBeVisible();await capture('agency');
 await page.goto('/');await page.getByTitle('إنشاء غرفة',{exact:true}).click();await expect(page.getByRole('button',{name:'إنشاء غرفة',exact:true})).toBeDisabled();await capture('create');expect(errors).toEqual([]);
});

test('edit profile sheet dismisses first and search remains usable in a short keyboard-sized viewport',async({page})=>{
 const {errors}=await setup(page);await page.setViewportSize({width:320,height:480});await page.goto('/');await page.getByTitle('أنا',{exact:true}).click();await page.getByTitle('تعديل الملف الشخصي والصورة والاسم').click();
 await page.getByText('اسم الكنية',{exact:true}).click();await expect(page.getByRole('dialog',{name:'تعديل بيانات الملف'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'تعديل بيانات الملف'})).toHaveCount(0);
 await page.goto('/');await page.getByTitle('بحث',{exact:true}).click();const input=page.getByPlaceholder('ابحث عن غرفة، اسم مستخدم، أو رقم ID...');await input.fill('451305');await expect(page.getByRole('button',{name:'مراسلة مستخدم البحث',exact:true})).toBeVisible();const box=await input.boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(480);await page.screenshot({path:'test-results/ui-review/search-short-viewport.png',fullPage:true});expect(errors).toEqual([]);
});

test('banner indicators retain small visual dots inside full touch targets',async({page})=>{
 await setup(page);await page.setViewportSize({width:320,height:780});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const indicator=page.getByRole('button',{name:'الشريحة 2',exact:true});await expect(indicator).toBeVisible();const box=await indicator.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
 const dot=await indicator.locator('span').boundingBox();expect(dot!.height).toBeLessThan(10);await indicator.click();await expect(indicator).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
