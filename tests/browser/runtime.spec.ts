import { test, expect, Page } from '@playwright/test';
const actor = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const roomId = '33333333-3333-4333-8333-333333333333';
const profile = {id: actor, public_id: 920003, username: 'test_user', display_name: 'حساب الاختبار', avatar_url: '/assets/images/default_arab_user_avatar_1790806239365.jpg', level: 1, vip_level: 0, gold: 100, diamonds: 90, silver_coins: 0, country_code: 'IQ', country_name: 'العراق'};
const room = {id: roomId, owner_id: actor, name: 'غرفة الاختبار', description: 'دردشة فعلية', max_seats: 4, is_active: true, is_private: false, is_vip: false, category: 'عامة', tags: [], owner_public_id: 920003, owner_display_name: 'حساب الاختبار'};
const authUser = {id: actor, aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', app_metadata: {provider: 'google'}, user_metadata: {}, created_at: new Date().toISOString()};
const token = `${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:actor,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.dGVzdA`;
const session = {access_token: token, refresh_token:'test-refresh', token_type:'bearer', expires_in:3600, expires_at:Math.floor(Date.now()/1000)+3600, user: authUser};
async function setup(page: Page, loggedIn = true, overrides: {country?: string; rooms?: boolean; conversionError?: boolean; currency?: boolean; conversionDelay?: boolean; quoteError?: boolean; messages?: boolean; agent?: boolean; zero?: boolean; giftFunds?: boolean; profileError?: boolean; noAgent?: boolean; otherMember?: boolean; commerce?: boolean; giftShop?: boolean; purchaseError?: boolean; admin?: boolean; social?: boolean; roomProfile?: Record<string,unknown>; roomProfileError?: boolean; noMemberId?: boolean; roomCouple?: boolean; roomAgency?: boolean; typedRelationships?: boolean; hideRelationships?: boolean; optionalProfileError?: boolean; roomSeatVip?: number; roomSeatLevel?: number; roomSettings?: boolean; settingsError?: boolean; listener?: boolean; economy?: boolean; tenSeats?: boolean; longText?: boolean; startUnmuted?: boolean; muteDelay?: boolean} = {}) {
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
  const giftFeed:any[]=[];let followed=false; let friendStatus='none'; const purchased:string[]=[]; const adminAdjustments=new Map<string,any>(); let savedGiftCount=0; const giftStockRequests=new Set<string>(); let rewardClaimed=false; let notificationRead=false;
  await page.route('https://**.supabase.co/**', async route => {
    const url=new URL(route.request().url()); const path=url.pathname; const method=route.request().method();
    const body=route.request().postDataJSON(); if (!['GET','HEAD'].includes(method)) requests.push({path,body});
    const headers={'access-control-allow-origin':'*','content-type':'application/json'};
    const respond=(value: any,status=200)=>route.fulfill({status,headers,body:JSON.stringify(value)});
    if (method==='OPTIONS') return route.fulfill({status:204,headers:{...headers,'access-control-allow-headers':'*','access-control-allow-methods':'*'}});
    if (path.endsWith('/dashboard_session'))return respond(overrides.admin?{allowed:true,owner:true,role:'owner',permissions:['dashboard.view','users.view','wallet.view','wallet.credit','wallet.debit','wallet.history','roles.view','roles.manage','roles.assign','agencies.view','audit.view','system.settings']}:{allowed:false,permissions:[]});
    if (path.endsWith('/dashboard_overview'))return respond({users:1,active_users:1,active_rooms:overrides.rooms?1:0,gifts_today:0,coins_in_circulation:current.gold,agencies:0,hosts:0,pending_agency_registrations:0});
    if (path.endsWith('/dashboard_users'))return respond([{id:actor,public_id:920003,username:'test_user',display_name:'حساب الاختبار',gold:current.gold,diamonds:current.diamonds,vip_level:1,level:1,country_code:'IQ',avatar_url:null,email:null,created_at:new Date().toISOString()}]);
    if (path.endsWith('/dashboard_wallet_history'))return respond([...adminAdjustments.values()]);
    if (path.endsWith('/dashboard_agency_registrations'))return respond([]);
    if (path.endsWith('/dashboard_audit_history'))return respond([]);
    if (path.endsWith('/dashboard_roles_state'))return respond({roles:[{id:'owner',label:'Owner',permissions:[],built_in:true},{id:'support',label:'Support',permissions:[],built_in:true}],permissions:['dashboard.view','wallet.credit']});
    if (path.endsWith('/beta_flags_state'))return respond({music_enabled:false,cp_store_enabled:true});
    if (path.endsWith('/dashboard_wallet_adjust')) {
      if (!overrides.admin)return respond({message:'dashboard permission denied'},403);
      if (adminAdjustments.has(body.p_request_id))return respond({...adminAdjustments.get(body.p_request_id),already_processed:true});
      if (body.p_public_id!==920003 || current.gold+body.p_delta<0)return respond({message:'insufficient or overflowing coins'},400);
      const before=current.gold;current={...current,gold:before+body.p_delta};
      const record={id:body.p_request_id,request_id:body.p_request_id,operator_name:'مالك الاختبار',public_id:920003,target_public_id:920003,previous_balance:before,new_balance:current.gold,delta:body.p_delta,reason:body.p_reason,created_at:new Date().toISOString()};
      adminAdjustments.set(body.p_request_id,record);return respond(record);
    }
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
    if(path.endsWith('/send_room_gift_batch')){if(!giftFeed.some(row=>row.id===body.p_request_id))giftFeed.push({id:body.p_request_id,room_id:roomId,sender_name:'حساب الاختبار',recipient_name:'حساب الاختبار',recipient_public_id:body.p_recipient_public_id,gift_name:'وردة الاختبار',quantity:body.p_quantity,created_at:new Date().toISOString()});return respond(null)}
    if(path.endsWith('/room_gift_feed'))return respond(giftFeed);
    if (path.endsWith('/room_members')) return respond(overrides.rooms && !membershipRemoved ? [{id:'member',room_id:roomId,user_id:actor,seat_number:overrides.listener?null:1,role:overrides.listener?'member':'owner',is_muted:currentMuted,member_public_id:920003,member_display_name:'حساب الاختبار'}, ...(overrides.otherMember ? [{id:'other-member',room_id:roomId,user_id:other,seat_number:2,role:'member',is_muted:true,member_public_id:overrides.noMemberId ? null : 451306,member_display_name:'مشارك آخر',member_level:overrides.roomSeatLevel ?? overrides.roomProfile?.level ?? 0,member_vip_level:overrides.roomSeatVip ?? overrides.roomProfile?.vip_level ?? 0,member_avatar_url:overrides.roomProfile?.avatar_url ?? null}] : [])] : []);
    if (path.endsWith('/wallet_transactions')) return respond(walletHistory);
    if (path.endsWith('/recharge_packages')) return respond([{id:'44444444-4444-4444-8444-444444444444',price_usd:0.99,gold_amount:4900}]);
    if (path.endsWith('/create_recharge_request')) {
      if (overrides.noAgent) return respond({message:'no official recharge agent is configured for this country'},400);
      return respond([{request_id:'request',agent_id:'existing-agent',agent_display_name:'TotiChat Official Recharge',country_code:'IQ',country_name:'Iraq',agent_phone:null,gold_amount:4900,price_usd:0.99,payment_methods:[],contact_info:{channel:'in_app',public_id:'451305',phone:null,whatsapp:null}}]);
    }
    if (path.endsWith('/social_profile') && body.p_public_id===451306) {
      if(overrides.roomProfileError)return respond({message:'profile unavailable'},500);
      return respond({id:other,public_id:451306,display_name:'مشارك آخر',level:0,vip_level:0,is_following:followed,is_blocked:false,friend_status:friendStatus,...overrides.roomProfile});
    }
    if (path.endsWith('/social_profile')) return respond(body.p_public_id===920003 ? {...current,friends_count:0,following_count:followed?1:0,followers_count:0} : {id:other,public_id:body.p_public_id,display_name:body.p_public_id===451306?'مشارك آخر':'مستخدم البحث',level:1,vip_level:0,is_following:followed,is_blocked:false,friend_status:friendStatus});
    if (path.endsWith('/social_list')) return respond(overrides.social ? [{id:other,public_id:451305,display_name:'مستخدم العلاقة',level:1,vip_level:0}] : []);
    if (path.endsWith('/social_action')) {if(body.p_action==='follow') followed=true;if(body.p_action==='request')friendStatus='sent';return respond({public_id:451305,is_following:followed,friend_status:friendStatus});}
    if (path.endsWith('/room_user_permissions')) {
      const self=body.p_public_id===920003;
      const owner=currentRoom.owner_id===actor;
      return respond({
        room_id:body.p_room_id,subject_public_id:body.p_public_id,self,
        social:{follow:!self,message:!self,gift:true,mention:!self,is_following:followed},
        moderation:owner&&!self?['unmute','down','kick','ban']:[],
        manage_moderators:owner&&!self
      });
    }
    if (path.endsWith('/moderate_room_user')) return respond(null);
    if (path.endsWith('/couple_state')) {if(overrides.optionalProfileError)return respond({message:'unavailable'},500);return respond({relations:overrides.roomCouple ? [{accepted_at:'2026-01-01T00:00:00Z',ended_at:null,partner:{public_id:451306,display_name:'مشارك آخر',level:0,vip_level:0}}] : [],current:[],previous:[]});}
    if (path.endsWith('/profile_relationships')) {
      if(overrides.optionalProfileError)return respond({message:'unavailable'},500);
      if(overrides.hideRelationships||!(overrides.typedRelationships||overrides.roomCouple))return respond([]);
      const subject=Number(body.p_public_id);
      const ownerPartner=subject===920003
        ? {public_id:451306,display_name:'شريك CP',avatar_url:'/assets/images/default-user.svg',level:4,vip_level:2,country_code:'IQ'}
        : {public_id:920003,display_name:'حساب الاختبار',avatar_url:current.avatar_url,level:current.level,vip_level:current.vip_level,country_code:'IQ'};
      return respond([
        {subject_public_id:subject,accepted_at:'2026-09-28T00:00:00Z',ended_at:null,relation_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',type_id:'love',type_label:'CP',is_primary:true,partner:ownerPartner,days:10,experience:650,level_thresholds:[100,500,1000],presentation:{accent:'#fb7185',background:'#35102a',icon:'💗'},card:{id:'cp-card',name:'بطاقة الحب'}},
        {subject_public_id:subject,accepted_at:'2026-09-04T00:00:00Z',ended_at:null,relation_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',type_id:'best_friend',type_label:'صديق للأبد',is_primary:false,partner:{public_id:451305,display_name:'صديق طويل الأمد',avatar_url:'/assets/images/default-user.svg',level:2,vip_level:0},days:34,experience:220,level_thresholds:[100,300,700],presentation:{accent:'#8b5cf6',background:'#1f173a',icon:'🤝'}},
        {subject_public_id:subject,accepted_at:'2026-09-03T00:00:00Z',ended_at:null,relation_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',type_id:'trusted',type_label:'مؤتمن',is_primary:false,partner:{public_id:451307,display_name:'Trusted Friend With Long English Name',avatar_url:'/assets/images/default-user.svg',level:3,vip_level:0},days:35,experience:510,level_thresholds:[100,300,600],presentation:{accent:'#22d3ee',background:'#102a35',icon:'🛡️'}}
      ]);
    }
    if (path.endsWith('/profile_agency')) {
      if(overrides.optionalProfileError)return respond({message:'unavailable'},500);
      return respond(overrides.roomAgency?{id:87,name:'وكالة حقيقية للاختبار',logo_url:null,role:'member',members_count:18}:null);
    }
    if (path.endsWith('/agency_state')) {if(overrides.optionalProfileError)return respond({message:'unavailable'},500);return respond({agency:overrides.roomAgency?{id:87,name:'وكالة حقيقية للاختبار',owner_id:actor}:null,members:overrides.roomAgency?[{public_id:920003},{public_id:451306}]:[],applications:[],available:[]});}
    if (path.endsWith('/user_notifications')) {if(method==='PATCH')notificationRead=true;return respond(overrides.commerce ? [{id:'notification',type:'system',title:'إشعار من الخادم',description:'محتوى حقيقي من الاستجابة',created_at:new Date().toISOString(),read_at:notificationRead?new Date().toISOString():null}] : []);}
    if (path.endsWith('/gift_box_state') && overrides.giftShop) return respond({
      server_now:new Date().toISOString(),categories:[{id:'luck',label:'هدايا الحظ',sort_order:1}],
      gifts:[{id:'lucky-test-1',name:'هدية حظ من الخادم',price:25,icon:'✨',description:'عنصر من مصدر اختبار RPC',category_id:'luck',duration_days:null}],
      inventory:savedGiftCount?[{id:'gift-lot',gift_id:'lucky-test-1',remaining:savedGiftCount,unit_price:25}]:[],
      banner:null,
    });
    if (path.endsWith('/gift_box_state')) return respond({server_now:new Date().toISOString(),categories:[{id:'gift',label:'الهدايا'}],gifts:[{id:'g1',name:'وردة الاختبار',price:10,icon:'🌹',diamond_source_type:'FIXED_GIFT'}],inventory:[],banner:null});
    if (path.endsWith('/buy_gift_stock') && overrides.giftShop) {
      if (!giftStockRequests.has(body.p_request_id)) {
        if (current.gold<25)return respond({message:'insufficient gold'},400);
        giftStockRequests.add(body.p_request_id);savedGiftCount++;current={...current,gold:current.gold-25};
      }
      return respond(body.p_request_id);
    }
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
      return respond({diamonds_amount:body.p_diamonds,fixed_diamonds:f,lucky_diamonds:l,coins_amount:Math.floor(f*3/10)+Math.floor(l*3/10)});
    }
    if (path.endsWith('/redeem_diamonds')) {
      if(overrides.conversionDelay)await new Promise(resolve=>setTimeout(resolve,650));
      if (overrides.conversionError) return respond({message:'insufficient diamonds'},400);
      let quote=redemptions.get(body.p_request_id);
      if(!quote){const f=Math.min(body.p_diamonds,fixed);const l=body.p_diamonds-f;quote={diamonds_amount:body.p_diamonds,fixed_diamonds:f,lucky_diamonds:l,coins_amount:Math.floor(f*3/10)+Math.floor(l*3/10)};
      fixed-=f;lucky-=l;current={...current,diamonds:current.diamonds-body.p_diamonds,gold:current.gold+quote.coins_amount};redemptions.set(body.p_request_id,quote);
      for(const [type,diamonds,coins] of [['fixed_diamonds_redeemed',-f,0],['lucky_diamonds_redeemed',-l,0],['coins_from_diamond_redemption',0,quote.coins_amount]]){if(diamonds||coins)walletHistory.push({id:type,transaction_type:type,diamond_delta:diamonds,gold_delta:coins,created_at:new Date().toISOString()});}
      }
      return respond(quote);
    }
    if (path.endsWith('/update_room_settings')) {
      if (overrides.settingsError) return respond({message:'save failed'},400);
      currentRoom = {...currentRoom, name:body.p_name, description:body.p_welcome_message, welcome_message:body.p_welcome_message, chat_enabled:body.p_chat_enabled, gift_effects_enabled:body.p_gift_effects_enabled, vehicle_effects_enabled:body.p_vehicle_effects_enabled, entran…15233 tokens truncated…bled();
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
 await expect(page.getByText('فك ماس هدايا الحظ الأساسي — 30%',{exact:true})).toBeVisible();
 await expect(page.getByText('Coins من فك الماس',{exact:true})).toBeVisible();
 await expect(page.getByText('60,000',{exact:false}).first()).toBeVisible();
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
 const header=await page.locator('.room-header').boundingBox();expect(header!.height).toBeLessThan(120);await page.screenshot({path:`test-results/ui-review/room-${width}.png`,fullPage:true});expect(requests.some(r=>r.path.endsWith('/leave_room'))).toBe(false);expect(errors).toEqual([]);
});

for(const width of [320,360,430]) test(`UI review keeps Arabic screens within ${width}px`,async({page})=>{
 const {errors}=await setup(page,true,{longText:true});await page.setViewportSize({width,height:780});await page.emulateMedia({reducedMotion:'reduce'});
 const capture=async(name:string)=>{await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name).toBe(true);await page.screenshot({path:`test-results/ui-review/${name}-${width}.png`,fullPage:true});};
 await page.goto('/');await expect(page.getByTitle('بحث',{exact:true})).toBeVisible();for(const name of ['بحث','إنشاء غرفة']){const b=await page.getByTitle(name,{exact:true}).boundingBox();expect(b!.width).toBeGreaterThanOrEqual(44);expect(b!.height).toBeGreaterThanOrEqual(44);}
 await capture('home');
 await page.getByTitle('الرسائل',{exact:true}).click();await expect(page.getByText('لا توجد محادثات بعد',{exact:true})).toBeVisible();await capture('messages');
 await page.getByTitle('أنا',{exact:true}).click();await expect(page.getByTitle('اسم الحساب')).toBeVisible();await capture('profile');
 await page.getByTitle('عرض الملف الشخصي الكامل والشارات').click();await expect(page.getByTestId('self-profile-actions')).toBeVisible();const copyId=page.getByRole('button',{name:'نسخ معرف الحساب 920003',exact:true});await expect(copyId).toBeVisible();await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));await copyId.focus();await page.keyboard.press('Enter');await expect(page.getByText('تم نسخ المعرف!',{exact:true})).toBeVisible();await capture('full-profile');
 await page.goto('/');await page.getByTitle('بحث',{exact:true}).click();await page.getByPlaceholder('ابحث عن حساب باسمه أو معرفه...').fill('451305');await expect(page.getByRole('button',{name:'مراسلة مستخدم البحث',exact:true})).toBeVisible();await capture('search');
 await page.goto('/');await page.getByText('الثروة',{exact:true}).first().click();await expect(page.getByText('لا توجد عمليات مؤهلة في هذه الفترة',{exact:true})).toBeVisible();await capture('wealth');
 await page.goto('/');await page.getByTitle('أنا',{exact:true}).click();await page.getByText('شحن / محفظة',{exact:true}).click();await page.getByTitle('سجل العمليات',{exact:true}).click();await expect(page.getByText('لا توجد طلبات شحن',{exact:true})).toBeVisible();await capture('wallet');
 await page.goto('/');await page.getByTitle('أنا',{exact:true}).click();await page.getByText('وكالة',{exact:true}).click();await expect(page.getByText('بوابة الوكالات',{exact:true})).toBeVisible();await capture('agency');
 await page.goto('/');await page.getByTitle('إنشاء غرفة',{exact:true}).click();await expect(page.getByRole('button',{name:'إنشاء غرفة',exact:true})).toBeDisabled();await capture('create');expect(errors).toEqual([]);
});

test('edit profile sheet dismisses first and search remains usable in a short keyboard-sized viewport',async({page})=>{
 const {errors}=await setup(page);await page.setViewportSize({width:320,height:480});await page.goto('/');await page.getByTitle('أنا',{exact:true}).click();await page.getByTitle('تعديل الملف الشخصي والصورة والاسم').click();
 await page.getByText('اسم الكنية',{exact:true}).click();await expect(page.getByRole('dialog',{name:'تعديل بيانات الملف'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'تعديل بيانات الملف'})).toHaveCount(0);
 await page.goto('/');await page.getByTitle('بحث',{exact:true}).click();const input=page.getByPlaceholder('ابحث عن حساب باسمه أو معرفه...');await input.fill('451305');await expect(page.getByRole('button',{name:'مراسلة مستخدم البحث',exact:true})).toBeVisible();const box=await input.boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(480);await page.screenshot({path:'test-results/ui-review/search-short-viewport.png',fullPage:true});expect(errors).toEqual([]);
});

test('banner indicators retain small visual dots inside full touch targets',async({page})=>{
 await setup(page);await page.setViewportSize({width:320,height:780});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const indicator=page.getByRole('button',{name:'الشريحة 2',exact:true});await expect(indicator).toBeVisible();const box=await indicator.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
 const dot=await indicator.locator('span').boundingBox();expect(dot!.height).toBeLessThan(10);await indicator.click();await expect(indicator).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('dashboard URL requires a real backend authorization response',async({page})=>{
  const {requests,errors}=await setup(page,true,{admin:false});
  await page.goto('/admin');
  await expect(page.getByText('الدخول محمي',{exact:true})).toBeVisible();
  await expect(page.getByTestId('secure-admin-dashboard')).toHaveCount(0);
  expect(requests.some(r=>r.path.endsWith('/dashboard_wallet_adjust'))).toBe(false);
  expect(errors).toEqual([]);
});
test('owner dashboard uses one authenticated RPC to credit Coins with ledger result',async({page})=>{
  const {requests,errors}=await setup(page,true,{admin:true});
  await page.goto('/admin');
  await expect(page.getByTestId('secure-admin-dashboard')).toBeVisible();
  await expect(page.getByText('نظرة عامة مباشرة',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'إدارة العملات'}).click();
  await page.getByLabel('User ID',{exact:true}).fill('920003');
  await page.getByLabel('التعديل — موجب للإضافة، سالب للخصم').fill('100000');
  await page.getByLabel('السبب — إلزامي').fill('منحة اختبار مصرح بها');
  await page.getByRole('button',{name:'تأكيد العملية المالية'}).click();
  await expect(page.getByText('تم حفظ العملية وتأكيدها من الخادم.')).toBeVisible();
  await expect(page.getByText('منحة اختبار مصرح بها',{exact:true})).toBeVisible();
  const calls=requests.filter(r=>r.path.endsWith('/dashboard_wallet_adjust'));
  expect(calls).toHaveLength(1);
  expect(calls[0].body).toMatchObject({p_public_id:920003,p_delta:100000,p_reason:'منحة اختبار مصرح بها'});
  expect(calls[0].body.p_request_id).toMatch(/^[0-9a-f-]{36}$/);
  expect(requests.some(r=>r.path.endsWith('/profiles')&&r.body?.gold)).toBe(false);
  expect(errors).toEqual([]);
});

test('music playlist is reloaded from private account library after the panel closes and app restarts',async({page})=>{
  const {errors}=await setup(page,true,{rooms:true});
  let reads=0;
  await page.route('**/rest/v1/user_music_library*',async route=>{
    reads++;
    await route.fulfill({status:200,
      headers:{'access-control-allow-origin':'*','content-type':'application/json'},
      body:JSON.stringify([{
        id:'55555555-5555-4555-8555-555555555555',user_id:actor,
        name:'أغنية محفوظة.mp3',
        storage_path:actor+'/55555555-5555-4555-8555-555555555555.mp3',
        content_type:'audio/mpeg',file_size_bytes:1536000,duration_seconds:180,
        created_at:'2026-10-08T00:00:00Z'
      }]),
    });
  });
  await page.goto('/');
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByRole('button',{name:'موسيقى الهاتف',exact:true}).click();
  const panel=page.getByRole('dialog',{name:'موسيقى الغرفة'});
  await expect(panel.getByText('أغنية محفوظة.mp3',{exact:true})).toBeVisible();
  await expect(panel.getByRole('button',{name:'تشغيل أغنية محفوظة.mp3'})).toBeVisible();
  await panel.getByRole('button',{name:'إغلاق الموسيقى'}).click();
  await page.getByRole('button',{name:'موسيقى الهاتف',exact:true}).click();
  await expect(panel.getByText('أغنية محفوظة.mp3',{exact:true})).toBeVisible();
  await page.reload();
  await page.getByText('غرفة الاختبار',{exact:true}).first().click();
  await page.getByRole('button',{name:'موسيقى الهاتف',exact:true}).click();
  await expect(panel.getByText('أغنية محفوظة.mp3',{exact:true})).toBeVisible();
  expect(reads).toBeGreaterThanOrEqual(3);
  expect(errors).toEqual([]);
});
