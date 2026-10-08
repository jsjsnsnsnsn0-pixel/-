# TotiChat — UI/UX scope v2 (user report, 32 sections)

Date: 2026-10-09. Visual identity stays as in existing TotiChat (current colors, wordmark, assets).
Only isolated `preview/uiux-only-20261009` changes. Real backend is untouched. This is a traceability draft, NOT functional completion.

## Status keys
- **Reviewable UI**: a visual clickable mock exists on the preview branch; no server claim.
- **Needs audit**: original React screen may exist, but its actions/states are not proved.
- **Backend pending**: cannot pass acceptance without live permission, service and data tests.
- **Out of scope for UI-only work**: real ledger, money issuance, moderation or audio testing.

## Source section traceability (32)
| Section | Feature | Preview route | Buttons in first-pass action inventory | Current status |
|---|---|---|---|---|
| 01 | الفكرة والهدف | `home` | 3 | audit/design; functional server testing pending |
| 02 | قواعد إكمال الواجهات | `scope_v2` | 3 | audit/design; functional server testing pending |
| 03 | التنقل الرئيسي | `community` | 5 | UI demo |
| 04 | التسجيل والدخول | `auth_demo` | 7 | audit/design; functional server testing pending |
| 05 | الرئيسية واكتشاف الغرف | `home` | 6 | audit/design; functional server testing pending |
| 06 | إنشاء الغرفة | `create` | 5 | audit/design; functional server testing pending |
| 07 | الغرفة الصوتية | `voice` | 7 | audit/design; functional server testing pending |
| 08 | مقاعد المايك | `voice` | 7 | audit/design; functional server testing pending |
| 09 | بطاقة المستخدم في الغرفة | `voice` | 7 | audit/design; functional server testing pending |
| 10 | رسائل الغرفة ولوحة المفاتيح | `voice` | 5 | audit/design; functional server testing pending |
| 11 | الصوت والاتصال | `voice` | 5 | audit/design; functional server testing pending |
| 12 | الموسيقى داخل الغرفة | `voice` | 7 | audit/design; functional server testing pending |
| 13 | صندوق الهدايا | `gifts` | 5 | audit/design; functional server testing pending |
| 14 | هدايا الحظ والمؤثرات | `gifts` | 4 | audit/design; functional server testing pending |
| 15 | الملف الشخصي | `profile` | 5 | audit/design; functional server testing pending |
| 16 | الأصدقاء والمتابعة والمجتمع | `community` | 7 | UI demo |
| 17 | الرسائل والإشعارات | `messages` | 6 | audit/design; functional server testing pending |
| 18 | المحفظة والشحن عبر الوكلاء | `wallet` | 6 | audit/design; functional server testing pending |
| 19 | المستويات وVIP والشارات | `vip` | 5 | audit/design; functional server testing pending |
| 20 | المتجر والحقيبة | `store` | 6 | audit/design; functional server testing pending |
| 21 | نظام CP | `profile` | 5 | audit/design; functional server testing pending |
| 22 | الوكالات والمضيفون | `agency` | 6 | audit/design; functional server testing pending |
| 23 | الإغلاق والتسوية الشهرية | `admin_demo` | 5 | audit/design; functional server testing pending |
| 24 | الترتيب والفعاليات والمهام | `home` | 4 | audit/design; functional server testing pending |
| 25 | الإعدادات والخصوصية والأمان | `settings` | 5 | audit/design; functional server testing pending |
| 26 | الدعم والإبلاغ | `help_center` | 5 | audit/design; functional server testing pending |
| 27 | لوحة الإدارة المستقلة | `admin_demo` | 7 | audit/design; functional server testing pending |
| 28 | الأدوار والصلاحيات | `admin_demo` | 4 | audit/design; functional server testing pending |
| 29 | الحالات المشتركة | `uiux_audit` | 3 | audit/design; functional server testing pending |
| 30 | مصفوفة الأزرار والواجهات | `scope_v2` | 3 | audit/design; functional server testing pending |
| 31 | معايير القبول النهائية | `uiux_audit` | 3 | audit/design; functional server testing pending |
| 32 | مخرجات التسليم | `scope_v2` | 3 | audit/design; functional server testing pending |

## Critical acceptance
- Real sign-in, OTP and account IDs must be authoritative and server-side; demo OTP is sample only.
- The microphone cannot be enabled for another person remotely without their consent.
- Room switching must explicitly inform user it disconnects another room.
- Room mini-player is preview-only (no background audio claim).
- Gift selection alone never sends. Recipient/quantity/total review, server idempotency and real ledger required for production.
- Recharge uses approved agents, not app payments. Coins/Diamonds/entitlements must be distinct.
- Unknown rates, salaries, odds, commission splits and targets must not be invented.
- Monthly settlement **logs entitlement and report first**, then resets monthly operational diamonds, never unpaid payable balances; server idempotency required.
- Owner account cannot be escalated to or modified by other staff; backend permission enforcement mandatory.
- Distinct `slow internet` popup replaces suggestions to “fix your Internet”. Browser network hints or explicit preview simulation trigger the mock; real weak-network measurement needs separate server telemetry.
- At every step include loading/empty/error/permission/retry and no silent controls.
- Prioritize 320/360/390/430dp, text scale 150%, Arabic RTL and keyboard/safe-area QA.

## Action inventory
The `سجل المتطلبات والأزرار` screen gives 164 uniquely labeled first-pass control entries, in the pattern `SC##-B##`. An inspectable detail panel records expected permission, action, target, pending state, success/failure, service and test gaps. It must be expanded with individual screen coordinates, owner decisions and actual QA evidence before acceptance.

## Role policy outline
- **زائر**: الصفحات العامة فقط حسب سياسة المنتج
- **مستخدم**: الحساب والغرف والمراسلات والهدايا ضمن قواعده
- **مضيف**: مزايا المضيف المصرح بها فقط
- **مشرف غرفة**: تنظيم المايك والرسائل ضمن غرفته
- **مالك غرفة**: إعدادات غرفته وإدارة مشرفيها
- **مدير وكالة**: المضيفون والتقارير لوكالته
- **وكيل شحن**: الشحن عبر المسارات المالية الرسمية المصرح بها
- **موظف دعم**: طلبات الدعم ضمن نطاق التعيين
- **مشرف محتوى**: مراجعة البلاغات والمحتوى المخالف
- **مسؤول مالي**: المحافظ والتسويات بإجراءات مسجلة
- **مدير نظام**: إدارة تشغيلية حسب التفويض دون صلاحيات المالك
- **مالك التطبيق**: صلاحيات عليا محمية لا يمكن للموظفين منحها لأنفسهم

## Dashboard modules
- AD-01: نظرة عامة
- AD-02: المستخدمون
- AD-03: الغرف
- AD-04: المحتوى
- AD-05: الهدايا
- AD-06: المتجر
- AD-07: المستويات وVIP
- AD-08: الشارات
- AD-09: CP
- AD-10: الوكالات
- AD-11: وكلاء الشحن
- AD-12: المحفظة والخزينة
- AD-13: التسوية الشهرية
- AD-14: الفعاليات
- AD-15: الإعلانات
- AD-16: الدعم
- AD-17: الإشعارات
- AD-18: الصلاحيات
- AD-19: سجل التدقيق
- AD-20: إعدادات النظام

## Remaining
Most of 32 sections are NOT implemented end-to-end. A UI mock does not authorize real money, notifications, music or moderation. Test on actual devices and several accounts after separate backend implementation. The live preview must be checked against the exact commit before calling it updated.
