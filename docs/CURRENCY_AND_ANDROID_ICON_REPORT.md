# تقرير نظام Coins/Diamonds والأيقونة الرسمية — 2026-10-05

## النطاق ونقطة البداية

بدأ التنفيذ من أحدث `origin/integration/frontend-backend` عند `e114cef5d3e7eb231016bc5fd23fd56489e3767d`، مع شجرة نظيفة. التغيير محصور في النظام المالي المطلوب وأيقونة Android واختباراتهما. لم يتم بناء APK أو تشغيل Gradle أو دمج main أو تغيير فروع المصدر. قيمة main المرجعية: `52714370de7e985eab16f550057b747ebe15bd1b`.

## Currency System

فُحص schema الإنتاج والدوال والقيود وRLS قبل التعديل، على مشروع `bfadhdnudmsggylunhlh`. استُخدمت الأسماء الحقيقية الموجودة: `profiles.gold` لعملة Coins، و`profiles.diamonds` لأرباح الهدايا، و`gift_catalog` و`gift_events` و`wallet_transactions`. بقيت أسماء الأعمدة القديمة لتوافق Recharge وStore وVIP والإصلاحات السابقة.

الـMigration الجديدة forward-only هي `supabase/migrations/20261005133246_gift_diamond_sources.sql`. أنشئت أولاً بأمر Supabase CLI migration new، واختبرت داخل transaction مع rollback، ثم طبقت بأداة Supabase apply_migration. طابق اسم الملف version الفعلي في سجل الإنتاج `20261005133246`. لا تعاد migrations القديمة ولا يستخدم db push: سجل المستودع السابق جزئي بالنسبة للإنتاج.

أضيف `gift_catalog.diamond_source_type`، بلا default للمنتجات المستقبلية، بقيم `FIXED_GIFT` و`LUCKY_GIFT`. الهدية الحالية `g11` (نرد الحظ الذهبي) Lucky، وباقي التعريفات الحالية Fixed. أضيف snapshot إلى `gift_events` لكل هدية جديدة؛ أحداث الماضي تحتفظ بـNULL دون استنتاج المصدر من تعريف قابل للتغير.

الدفتر الجديد:

| الجدول | الغرض |
|---|---|
| `diamond_lots` | إصدار ماس: user_id، source_type، source_reference إلى gift_events، diamonds_amount، created_at |
| `diamond_redemptions` | كمية الفك، معرّف إعادة المحاولة، Fixed/Lucky breakdown، Coins الناتجة، وتاريخ العملية |
| `diamond_redemption_allocations` | ربط كمية الماس المستهلكة بكل إصدار وبعملية الفك |

الإصدارات وعمليات الفك واستهلاكاتها append-only؛ triggers تمنع UPDATE/DELETE. المتبقي القابل للفك لكل lot يحسب بواسطة `private.diamond_remaining` كـ`diamonds_amount - SUM(allocations)`؛ هذا مكافئ لremaining_redeemable_diamonds دون تغيير الإصدار الأصلي. توجد فهارس user_id وlot_id ومراجع مالية من `wallet_transactions` إلى الهدية أو عملية الفك.

### إرسال الهدايا

`public.send_room_gift` يحتفظ بعقده القديم، ويفوض إلى الدالة الخاصة `private.send_room_gift`. تتحقق من auth.uid وعضوية الغرفة الحديثة والمستلم الحقيقي، وتقرأ السعر والمصدر من كتالوج الخادم، وتقفل المحفظتين بترتيب ثابت. تخصم Coins وتمنح Diamonds بنفس السعر وتكتب gift event وlot والحركتين الماليتين في transaction واحدة. أي خطأ، بما فيه overflow أو فشل كتابة الدفتر، يرجع الخصم والمنح والسجلات كلها.

Fixed بقيمة 10,000 Coins يمنح 10,000 Fixed Diamonds. Lucky يسجل مقدار الماس الممنوح تحت `LUCKY_GIFT` وفق تعريف الخادم؛ بقي مقدار المنح الاسمي الموجود في النظام، ولم يضف مولد أرباح عشوائي من الواجهة. لا تمرر الواجهة سعراً أو نسبة أو نوعاً لإرسال الهدية. معرّف الهدية ثابت عند retry داخل النافذة.

### فك الماس وحساب النسب

RPCs: `wallet_diamond_state`، `preview_diamond_redemption(p_diamonds)`، و`redeem_diamonds(p_diamonds,p_request_id)`. لا توجد معاملات user_id أو rate أو source_type يقبلها RPC للفك. المصدر والملكية والرصيد والنسب تحددها الدوال الخاصة باستخدام auth.uid.

يستهلك النظام Fixed أولاً ثم Lucky، وFIFO داخل كل مصدر. يجمع الكمية المستهلكة من كل مصدر ثم يطبق floor مرة واحدة لكل مصدر في الطلب، استمراراً لسياسة التقريب للأسفل القديمة:

- Fixed: `floor(fixed_diamonds × 30 / 100)`.
- Lucky: `floor(lucky_diamonds × 10 / 100)`.
- التطبيق integer-only: `(f / 10) * 3 + ((f % 10) * 3) / 10 + l / 10`، بالقسمة الصحيحة. القسمة قبل الضرب تمنع overflow في حساب النسبة؛ overflow في رصيد الوجهة يفشل ويؤدي إلى rollback.
- 10,000 Fixed → 3,000 Coins؛ 100,000 Fixed → 30,000 Coins.
- 10,000 Lucky → 1,000 Coins؛ 100,000 Lucky → 10,000 Coins.
- 100,000 Fixed + 100,000 Lucky → 40,000 Coins.

ترفض القيم غير الموجبة والمقادير الأكبر من `9007199254740991` لتوافق الإدخال الصحيح في JavaScript، كما ترفض عملية ينتج عنها صفر Coins. قد تُفقد الكسور الأصغر من Coin عند التقريب في كل طلب؛ هذا موضح للمستخدم، وليس حساب floating-point.

الفك يقفل صف المحفظة قبل فحص idempotency والاستهلاك، ويكتب allocations ثم الرصيد والسجل داخل transaction واحدة. unique(user_id,request_id) يحمي retry؛ إعادة نفس الطلب تعيد النتيجة دون استهلاك جديد، وتغيير كمية الطلب بالمعرّف نفسه مرفوض. طلب جديد لا يمكنه استهلاك lot سبق استهلاكها. الدالة القديمة `convert_diamonds_to_gold` بقيت متوافقة في نتيجة الاستدعاء لكنها تستخدم نفس دفتر المصادر؛ لا تسمح بتحويل Legacy بنسبة شاملة. لا توفر الدالة القديمة idempotency صريحاً، لذلك الواجهة الجديدة تستخدم redeem_diamonds فقط.

### Compatibility

تنسخ Migration مقدار الرصيد السابق إلى `LEGACY_UNKNOWN` دون تغيير الرصيد أو اعتباره Fixed/Lucky. لا يسمح بفكه تلقائياً؛ يحتاج مراجعة بشرية موثقة لمصدره. أي ماس غير مدعوم بإصدار موثوق يبقى ظاهراً كغير محدد المصدر. وقت التطبيق كان في الإنتاج حسابان بمجموع Coins=0 وDiamonds=0؛ بقي العدد والمجموعان كما هما بعد التطبيق وبعد جميع الاختبارات. لم يتغير رصيد TR72 أو أي مستخدم إنتاج.

## UI

المحفظة تعرض Coins كعملة الشحن والإنفاق، وDiamonds كأرباح الهدايا، وتعرض Fixed/Lucky/Legacy breakdown وإجراء فك الماس.

نافذة الفك تعرض النسبتين وقاعدة الاستهلاك والتقريب، وكمية الماس المستهلكة وCoins الناتجة بمعاينة من الخادم قبل التأكيد. تعرض loading والأخطاء وتحتفظ بمعرّف العملية لإعادة المحاولة. لا نجاح أو زيادة رصيد محلية قبل تأكيد الخادم؛ بعد التأكيد تقرأ الرصيد والسجل وbreakdown مجدداً. إذا تأكد التنفيذ وفشل تحديث البيانات، تخبر المستخدم بذلك صراحة.

Recharge يوضح أن الشحن Coins فقط؛ تبويب Diamonds سمي «أرباح الهدايا»، ويستخدم نافذة الفك نفسها. لم تتغير باقات الشحن أو تفويض الوكيل أو بياناته: TR72 / 451305 / TotiChat Official Recharge / Iraq / IQ / in_app.

سجل العمليات يميز، بالأسماء المتوافقة مع schema:
`recharge`، `gift_sent`، `fixed_gift_diamonds_received`، `lucky_gift_diamonds_received`، `fixed_diamonds_redeemed`، `lucky_diamonds_redeemed`، `coins_from_diamond_redemption`. الأسماء القديمة بقيت صالحة وتعرض كحركات قديمة. تبويب الهدايا المستلمة يشمل النوعين الجديدين.

## Icon

وجد المصدر في المستودع: `public/assets/images/toti_falcon_logo_1790422919580.jpg` (1024×1024)، وفُحص بصرياً: صقر، تاج، Toti Chat، توتي شات، الأسود والذهبي، ورمز الصوت. لم تستخدم صورة إنترنت أو placeholder.

حُفظت الموارد المولدة في `resources/android-launcher/` لأن `android/` مجلد Capacitor مولد ومتجاهل في Git. سكربت `scripts/configure-android.mjs` ينسخ الموارد إلى `android/app/src/main/res/` ضمن مسار Android الحالي. `scripts/generate-android-icons.py` يعيد التوليد من المصدر بواسطة Pillow؛ ملفات PNG الجاهزة مضمّنة ولا تحتاج Pillow عند بناء Android.

| الكثافة | launcher وround | adaptive foreground |
|---|---:|---:|
| mdpi | 48×48 | 108×108 |
| hdpi | 72×72 | 162×162 |
| xhdpi | 96×96 | 216×216 |
| xxhdpi | 144×144 | 324×324 |
| xxxhdpi | 192×192 | 432×432 |

المجموع 15 PNG + ملفا adaptive XML في mipmap-anydpi-v26 + ملف لون خلفية = 18 مورداً. لكل كثافة ic_launcher وic_launcher_round وic_launcher_foreground. الخلفية #080808، وforeground مربع بمقدار 46dp داخل 108dp للحفاظ على الصورة كاملة داخل safe zone الدائرية 66dp. حافظت الصورة على aspect ratio دون تمديد أو قص الصقر والتاج والنص. النص صغير في launcher كما هو متوقع.

الـManifest يشير إلى icon وroundIcon، وتستخدم أيقونتا Android الحديثة adaptive foreground/background. تأكد تثبيت الموارد وإعادة تشغيل سكربت الإعداد دون تكرار إعدادات الصلاحيات. بقي applicationId وnamespace وCapacitor appId جميعها `com.totichat.app`، واسم المشروع وOAuth callback دون تغيير.

## Security

جداول الدفتر الثلاثة عليها RLS وSELECT للمستخدم المالك فقط. INSERT/UPDATE/DELETE غير ممنوحة إلى authenticated/anon/PUBLIC. retained guards تمنع تغيير gold/diamonds مباشرة في profiles. الدوال الخاصة SECURITY DEFINER لها search_path فارغ وفحص auth.uid، والواجهات العامة SECURITY INVOKER؛ EXECUTE مسحوب من PUBLIC/anon وممنوح إلى authenticated للدوال المقصودة فقط. لم يضاف service_role أو secret إلى Frontend.

نجحت اختبارات تزوير إصدار أو مصدر أو allocation أو سجل مالي، وتعديل Coins/Diamonds، وتغيير تعريف Lucky، واستهلاك مال حساب آخر، وتمرير نسبة أو source/user إضافي إلى RPC، والقيم السالبة والصفرية والكبيرة وoverflow، والرصيد غير الكافي وdouble redemption/replay. نجحت اختبارات حقن فشل في إصدار الماس وفي كتابة سجل الفك بعد تعديل الرصيد، مع التحقق من رجوع الأرصدة والallocations والسجلات.

Security Advisor بعد التطبيق: لا تحذيرات جديدة لـRLS أو الدوال؛ لا جدول public بلا RLS. تحذير Auth السابق فقط بقي: `auth_leaked_password_protection`؛ لم يغير هذا العمل إعداداته. اختبارات الصوت بين جهازين وOAuth الحقيقي على Android تبقى فحوص جهاز كما في تقرير Integration السابق، ولا يدعي هذا التقرير تنفيذها.

## Tests

| الفحص | النتيجة |
|---|---|
| npm ci | ناجح |
| TypeScript + lint | ناجح: tsc --noEmit وeslint src |
| assets | ناجح، جميع صور الواجهة موجودة |
| Unit | 16/16؛ منها 3 جديدة للكثافات وadaptive وAndroid identity/installer |
| Browser/E2E | 35/35؛ لا skipped أو تعطيل اختبارات |
| Production build | ناجح بالمفتاح العام الحقيقي؛ الإعدادات لم تنشر في Git |
| Supabase currency | 42/42 assertions ناجحة داخل rollback قبل وبعد التطبيق |
| Supabase regression | 4/4 الملفات السابقة ناجحة بعد التطبيق داخل rollback |
| npm audit | 0 ثغرات بكل الدرجات |
| Capacitor sync android | ناجح |
| Capacitor doctor android | ناجح؛ core/cli/android 8.5.2 |
| Adaptive safe zone | نجاح فحص حدود الصورة في الكثافات الخمس |
| git diff --check | ناجح |

المتصفح يغطي Wallet، breakdown، mixed preview، confirmation، loading، retry ID، server error، إدخالات غير صالحة، استبعاد Legacy، نجاح معتمد من الخادم وتحديث الرصيد والسجل، وRecharge wording. الفحوص السابقة تشمل Auth وMessages Matrix بخمسة عروض وProfiles وRooms وVoice وRecharge Agent وVIP وStore وAgency وFriends/Followers وNotifications وUser Profile Modal وNavigation. استجابات المتصفح fixtures معزولة؛ الاختبارات المالية تنفذ فعلياً على Postgres باستخدام المستخدمين والأدوار وRLS ثم rollback.

الفحوص المالية المطلوبة الثلاثة عشر:

| المطلوب | النتيجة/موضع التغطية |
|---|---|
| Fixed Gift 10,000 Coins → 10,000 Diamonds | PASS؛ currency regression |
| Fixed 10,000 → 3,000 | PASS؛ currency regression |
| Fixed 100,000 → 30,000 | PASS؛ currency regression |
| Lucky 10,000 → 1,000 | PASS؛ currency regression |
| Lucky 100,000 → 10,000 | PASS؛ currency regression |
| Mixed 100,000 + 100,000 → 40,000 | PASS؛ currency regression وBrowser |
| عدم فك نفس الماس مرتين | PASS؛ currency regression وretry |
| عدم تغيير المصدر | PASS؛ ledger وgift catalog وgift event |
| عدم تعديل الرصيد مباشرة | PASS؛ Coins وDiamonds |
| رفض Gift برصيد غير كافٍ | PASS؛ currency regression |
| rollback عند الفشل في المنتصف | PASS؛ gift وredemption وoverflow |
| A لا يفك Diamonds الخاصة بـB | PASS؛ ملكية auth.uid وعزل RLS وعقد RPC |
| Recharge يضيف Coins لا Diamonds | PASS؛ database-feature-regression |

فشلت المحاولة الأولى للمتصفح لعدم اكتمال تثبيت Chromium؛ بعد تثبيته أعيد تشغيل المجموعة بنجاح. فحص preflight الأول شغّل دون تحميل .env.local ثم صحح باستخدام node --env-file=.env.local ونجح. لا فشل متبقٍ مخفي. Supabase المحلي غير مشغل؛ لذلك verification الفعلي يعتمد على MCP وإنتاج Postgres مع rollback، ولا يدعي إعادة بناء الإنتاج من migrations المستودع الجزئية.

بعد آخر فحص للإنتاج: لا مستخدمي اختبار إضافيين، ولا lots/redemptions/allocations أو منتجات اختبار أو triggers/functions لحقن الفشل متبقية. ظلت ميزانيات الإنتاج السابقة دون تغيير.

## Git والتصنيف

النشر يستهدف `origin/integration/frontend-backend` فقط، دون force push أو حذف فروع أو دمج main. يؤكد SHA النهائي وتطابق الشجرة البعيدة مع الشجرة المختبرة في الرد النهائي بعد النشر. لم يتغير Workflow ولم يتم تشغيل بناء APK.

🟢 جاهز للانتقال إلى إعداد GitHub Actions وبناء APK، مع إبقاء فحوص الجهاز وإعدادات OAuth/الصوت المذكورة في تقرير Integration ضمن عملية التحقق من APK لاحقاً.
