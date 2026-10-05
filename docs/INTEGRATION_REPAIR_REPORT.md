# تقرير إصلاح Integration — 2026-10-05

## نقطة البداية وحماية Git

الفرع `integration/frontend-backend` بدأ من أحدث origin عند `9e720d6e336bb4612e1bac83c0dd2fec0936acd7`، والـcommit المعروف موجود في تاريخه. كانت شجرة العمل نظيفة. جرى fetch والتحقق من HEAD دون إعادة الدمج أو عكس الإصلاحات السابقة.

الفروع المحمية قبل النشر:
- main: `52714370de7e985eab16f550057b747ebe15bd1b`
- frontend-fixes: `8b14d2b38340714df1913a8489f60099aa9b6b02`
- codex/repair-totichat-runtime: `4171eb011c16fe8f28856521b3c527428d127952`

لم يُعدل main أو الفرعان المصدران. لا force push أو حذف فروع أو reset --hard. نشر الإصلاحات يكون fast-forward على Integration فقط؛ عند استخدام GitHub Git Data API تُقارن tree SHA البعيدة بالشجرة المختبرة حرفياً.

## المشاكل والإصلاحات

- كانت وظائف الإنتاج للعلاقات والمتجر وVIP والوكالات والمكافآت والدعم متاحة، لكن عدة واجهات تعرض عدم التفعيل أو نموذجاً محلياً. تم ربط الوظائف الموجودة دون إنشاء schema أو Migration.
- المتجر يقرأ الأسعار والعملات والصلاحية من `store_catalog`، والملكية من `store_purchases`. الشراء عبر `purchase_store_item` والتجهيز عبر `equip_store_item`. معرّف طلب الشراء يبقى ثابتاً عند إعادة المحاولة بعد الفشل، ولا تمرر الواجهة السعر أو الرصيد إلى RPC. الإطارات والشارات المجهزة تظهر من معلومات الخادم.
- VIP يستخدم منتجات الكتالوج الفعلية، ويقرأ الاستحقاق وتاريخ الانتهاء؛ أزيلت أيام الصلاحية التجريبية من الحالة المعروضة. الخادم يمنع تخفيض الاشتراك النشط. لا منح محلي.
- Friends/Followers/Following/Visitors/Blocked والطلبات تعمل عبر `social_list` و`social_profile` و`social_action`. فتح ملف مستخدم يسجل زيارة بواسطة الخادم، والمتابعة وطلب/قبول الصداقة والحظر عمليات فعلية.
- ربط طلب/قبول/رفض/إنهاء رفيق الروح عبر `couple_state` و`couple_action`؛ الترتيب الأسبوعي من الخادم، واستلام المكافأة عبر `claim_couple_reward` وفق استحقاق الأسبوع السابق.
- شاشة الوكالة تستخدم حساب Supabase الحالي و`agency_state` و`agency_action`. أزيل نموذج كلمة مرور الوكالة المحلي. الانضمام طلب يوافق عليه المدير؛ القبول/الرفض/الإزالة/المغادرة تخضع لتفويض الخادم.
- المكافآت اليومية ومهام الفضة عبر `claim_reward`، ومكافآت الشحن عبر `recharge_reward_tiers` و`claim_recharge_reward`. الحساب الشهري يحسب الطلبات approved فقط. أزيلت أسماء الفائزين والتقدم والأرصدة التجريبية. الطلبات الخاصة لا توصف كامتياز مُنجز؛ تظهر أنها تحتاج مراجعة الإدارة.
- الدعم يسجل ملاحظة فعلية عبر `submit_support_ticket` ولا يعرض النجاح قبل عودة معرّف التذكرة. التواصل يفتح الحساب الحقيقي 451305.
- إشعارات ورسائل النظام من `user_notifications`، وحالة القراءة محفوظة في الخادم. حُذف مولد إشعارات النجاح المحلية غير المستخدم. Conversations تبقى server-backed دون ردود وهمية.
- بقي ترتيب Messages Matrix: رسائل النظام، رسائل رسمية، ثم المحادثات الحقيقية؛ جميع الصفوف تستخدم الأعمدة الثابتة نفسها. اختبارات العرض تغطي 320/360/412/768/1280px.
- المحفظة تعرض حركات gold_delta وdiamond_delta وsilver_delta، بدلاً من تجاهل الألماس والفضة. تحميل المحادثات يأخذ أحدث 1000 رسالة ويرتب المحادثات حسب أحدث نشاط.
- إصلاح انتظار session عند خطأ Auth، وحماية قائمة تعديل الملف من التنفيذ على حساب تغيّر أثناء الانتظار، ومنع نتائج الشاشات القديمة من استبدال البيانات الحالية.
- إضافة heartbeat للعضوية وpresence عبر RPCs الموجودة؛ إصلاح ضياع رسائل Realtime أثناء التحميل الأولي. إيقاف stream إذا عاد إذن الميكروفون بعد المغادرة؛ تنظيف أجهزة التشغيل والاتصالات وقنوات الغرفة.
- Android يحتفظ بالمعرف `com.totichat.app`، مع INTERNET وRECORD_AUDIO وcallback `com.totichat.app://auth/callback` وadjustResize وRTL ومساحات آمنة. لا تعديل غير لازم للمعرف.
- APK preflight يرفض test-publishable-key ومفاتيح الخادم وJWT بغير role anon، ويتطلب القيم الثلاث. أزيلت fallback التجريبية من Workflow وأضيف audit وdoctor وSHA256 وفشل رفع Artifact عند غياب APK.

## Supabase والأمان

تمت مراجعة عقود RPC الموجودة في الإنتاج، سياسات RLS، ودوال SECURITY DEFINER الخاصة بها. لا إعادة تطبيق migrations القديمة أو db push أو DDL أو تغييرات دائمة لبيانات الإنتاج.

أربع مجموعات SQL regression نجحت على المشروع `bfadhdnudmsggylunhlh`؛ كل حساب ورصيد ودور وطلب ورسالة اختبار داخل transaction/rollback:
1. المالية والتحويل والهدايا: منع تعديل الرصيد مباشرة، منع اعتماد غير المدير، خصوصية الغرفة والمقاعد، ثبات الرسائل، idempotent gifting والدفتر المالي. أضيف اختبار رفض إدارة المقعد بواسطة عضو عادي.
2. Audio: منع انتحال مرسل الإشارة، منع غير الأعضاء من القراءة/الإرسال، وصول المستلم، بدء الميكروفونات مكتومة.
3. Integration: تحقق Owner TR72/451305 ووكيل TotiChat Official Recharge/Iraq/IQ/in_app بلا هاتف أو WhatsApp، فتح محادثة حقيقية، طلب شحن pending idempotent، وعدم إضافة رصيد قبل الاعتماد.
4. Features: متجر وVIP ومكافأة يومية لا تتكرر، رفض مكافآت غير مستحقة، منع منح VIP/admin محلياً وتعديل رصيد آخر، علاقات وزيارات، تفويض الوكالة، عزل المشتريات/السجل، منع تزوير إشعار، اعتماد الشحن بواسطة admin مؤقت لحساب اختبار فقط ومنع الاعتماد المكرر. لم يتغير رصيد مستخدم Production.

كل جداول public مفعّل عليها RLS. سياسات storage تمت مراجعتها: رفع الصورة إلى مجلد المستخدم فقط، ورسائل الصوت لا تُقرأ إلا من المشاركين. هذه مراجعة سياسات؛ رفع ملف فعلي من جهاز لم يُختبر هنا.

الاختبار المباشر باستخدام المفتاح العام الحقيقي أكد قبول `/auth/v1/settings` ورفض استدعاء شراء بدون جلسة بـ401/42501. Google مفعّل، وphone معطّل حالياً. لا service_role أو secret داخل source أو APK؛ المفتاح العام المحلي محفوظ في ملف ignored ولم يُنشر.

Security Advisor: تحذير واحد متبقٍ `auth_leaked_password_protection`. لا توجد أداة Auth configuration مصرح بها هنا لتفعيله، لذلك يلزم ضبطه من لوحة Supabase؛ لم تُعدّل جداول Auth لتجاوز ذلك.

## الفحوص النهائية

| الفحص | النتيجة |
|---|---|
| npm ci | ناجح؛ تحذير انتهاء دعم ESLint 9 فقط |
| TypeScript | ناجح — tsc --noEmit |
| lint | ناجح؛ قواعد Hooks وunreachable code مفعّلة |
| assets | كل الصور المشار إليها موجودة |
| unit tests | 8 ناجحة |
| production build | ناجح؛ البناء النهائي بمفتاح publishable حقيقي |
| Browser/E2E | 26 ناجحة؛ استجابات API معزولة بfixtures، لا تدعي اختبار OAuth حقيقي |
| Supabase SQL regression | 4 ملفات ناجحة مع rollback؛ لا fixtures دائمة |
| npm audit | صفر ثغرات بجميع الدرجات |
| Capacitor sync android | ناجح |
| Capacitor doctor android | ناجح؛ core/cli/android 8.5.2 |
| Git diff --check | ناجح |

اختبارات المتصفح تشمل منع تجاوز OTP، التعافي من فشل الملف، navigation والشاشات، شحن/وكيل حقيقي بالاستجابة، Matrix وoverflow، ردود شراء ناجحة ومرفوضة وثبات retry ID، علاقات/زيارات، إشعارات وقراءة، دعم ومكافآت، وتوقف capture المتأخر بعد المغادرة. لا اختبارات معطلة أو فشل مخفي.

## نقاط متبقية واختبار الجهاز

- SMS provider: تسجيل الهاتف معطّل في إعدادات الإنتاج؛ يلزم Provider وإعداد خارجي، دون أرقام أو credentials وهمية.
- Google OAuth مفعّل؛ يلزم اختبار تسجيل الدخول الفعلي على Android والتحقق من redirect allowlist وإعداد Google/Supabase. لم يتم اختبار حساب Google فعلي هنا.
- Leaked-password protection يحتاج تفعيل خارجي. TURN غير مهيأ في التكامل الحالي؛ يلزم حل معتمد لبيانات اعتماد مؤقتة للخادم إذا تعذر الصوت عبر NAT، ولا تُضمّن أسرار TURN ثابتة في source.
- الصوت بين جهازين، الشبكات الخلوية/خلف NAT، استئناف التطبيق، الرفض/السحب الفعلي لإذن الميكروفون، Bluetooth، سماعة الهاتف، لوحة المفاتيح والنوتش وأزرار النظام تحتاج هاتفين فعليين.
- إنشاء وكالة جديدة للإدارة، الرد الإداري على تذاكر الدعم، وسير تنفيذ الجوائز الخاصة/السحب ليس لها لوحة إدارة كاملة في واجهة المستخدم الحالية. الطلبات لا تُعرض كنجاح منح أو دفع.
- رسائل DM الصوتية غير مفعلة في الواجهة الحالية، وتوضح الواجهة ذلك. لا مدة صوتية وهمية. مؤثرات المنتجات المخصصة/الدخول ثلاثية الأبعاد ليست مكتملة لكل منتج؛ الملكية والتجهيز حقيقيان.
- سجل migrations بالمستودع جزئي بالنسبة للإنتاج. الملفات لم تُعدّل ولم تُدفع؛ لا تستخدم db push لإعادة تكوين الإنتاج أو بيئة جديدة اعتماداً عليها وحدها.
- Android Gradle/APK لم يُبنَ محلياً؛ doctor/sync لا يعنيان نجاح تجميع APK. البناء المطلوب عبر Workflow بعد التحقق من متغيرات GitHub.
- قراءة Repository Variables عادت 403. لا يمكن الجزم أن القيم ناقصة؛ يلزم التأكد من VITE_SUPABASE_URL وVITE_SUPABASE_PUBLISHABLE_KEY وVITE_AUTH_REDIRECT_URL قبل workflow_dispatch. لا سر مطلوب في المحادثة.

## الملفات المعدلة
- `.env.example`
- `.github/workflows/main.yml`
- `docs/INTEGRATION_REPAIR_REPORT.md`
- `scripts/check-env.mjs`
- `scripts/configure-android.mjs`
- `scripts/frontend-config.mjs`
- `src/App.tsx`
- `src/components/common/UserAvatar.tsx`
- `src/components/modals/RechargeActivityModal.tsx`
- `src/components/modals/SoulmatesWeeklyModal.tsx`
- `src/components/rooms/GiftStoreModal.tsx`
- `src/components/screens/AgencyScreen.tsx`
- `src/components/screens/ChatDetailScreen.tsx`
- `src/components/screens/DailyGiftModal.tsx`
- `src/components/screens/FriendsModal.tsx`
- `src/components/screens/HelpCenterScreen.tsx`
- `src/components/screens/MessagesScreen.tsx`
- `src/components/screens/SilverCoinsScreen.tsx`
- `src/components/screens/StoreScreen.tsx`
- `src/components/screens/UserDetailProfileScreen.tsx`
- `src/components/screens/VIPScreen.tsx`
- `src/components/screens/VoiceRoomScreen.tsx`
- `src/components/screens/WalletScreen.tsx`
- `src/context/AppContext.tsx`
- `src/hooks/useRoomAudio.ts`
- `src/hooks/useServerData.ts`
- `src/index.css`
- `src/services/backend.ts`
- `src/services/profile.ts`
- `src/services/systemNotificationService.ts`
- `src/types/index.ts`
- `tests/browser/runtime.spec.ts`
- `tests/database-feature-regression.sql`
- `tests/database-regression.sql`
- `tests/unit/build-config.test.ts`
- `tests/unit/profile.test.ts`
