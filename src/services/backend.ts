import { supabase } from './supabase';

// These contracts were checked against the existing production RPCs. No client
// entitlement or balance is changed; successful mutations are read back.
export async function rpc<T>(name: string, parameters: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name, parameters);
  if (error) throw error;
  return data as T;
}

export interface CatalogItem {
  id: string; name: string; category: string; price: number;
  currency: 'gold' | 'silver'; icon: string; description: string;
  duration_days: number | null; vip_level: number | null;
  relationship_type_id?: string | null; presentation?: Record<string, unknown>; preview_url?: string | null;
}

export async function catalog(): Promise<CatalogItem[]> {
  const { data, error } = await supabase.from('store_catalog').select('*')
    .eq('is_active', true).eq('is_reward', false).order('price');
  if (error) throw error;
  return (data || []).map(item => ({...item, price: Number(item.price)}));
}

export function backendMessage(error: unknown): string {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  const messages: Record<string, string> = {
    'previous week top three required': 'هذه المكافأة تخص أصحاب المراكز الثلاثة الأولى في الأسبوع السابق.',
    'gift inventory unavailable': 'لا توجد وحدة صالحة من هذه الهدية في حقيبتك.',
    'gift box unavailable': 'تعذر تحميل صندوق الهدايا.',
    'active matching relationship required': 'تحتاج علاقة فعالة مطابقة لتفعيل هذه البطاقة.',
    'card type mismatch': 'هذه البطاقة لا تناسب نوع العلاقة الحالية.',
    'valid ownership required': 'تحتاج امتلاك منتج صالح قبل تفعيله.',
    'not authorized': 'لا يملك حسابك الصلاحية المطلوبة.',
    'insufficient diamonds': 'رصيد الألماس غير كافٍ.',
    'insufficient redeemable diamonds': 'الماس القابل للفك غير كافٍ. الماس القديم يحتاج مراجعة المصدر.',
    'diamond amount is too small': 'كمية الماس لا تنتج Coin كاملة بعد التقريب.',
    'invalid diamond amount': 'أدخل كمية ماس صحيحة ضمن الحد المسموح.',
    'request id already used': 'معرّف العملية مستخدم لكمية أخرى.',
    'insufficient gold': 'رصيد الذهب غير كافٍ.',
    'insufficient silver': 'رصيد الفضة غير كافٍ.',
    'item unavailable': 'هذا المنتج غير متاح حالياً.',
    'item already owned': 'هذا المنتج مملوك بالفعل.',
    'cannot downgrade active VIP': 'لا يمكن تخفيض اشتراك VIP النشط.',
    'lifetime VIP already active': 'اشتراك VIP الدائم نشط بالفعل.',
    'task incomplete': 'لم تكتمل شروط المهمة بعد.',
    'threshold not reached': 'لم يبلغ الشحن المعتمد قيمة المكافأة بعد.',
    'authentication required': 'يرجى تسجيل الدخول مجدداً.',
    'monthly recharge requirement not met': 'لم يبلغ الشحن المعتمد قيمة المكافأة بعد.',
    'user is blocked': 'هذه العملية غير متاحة بسبب الحظر.',
    'blocked': 'هذه العملية غير متاحة بسبب الحظر.',
    'partner already linked for CP type': 'أحد الحسابين مرتبط مسبقاً بهذا النوع من CP أو بنوع يتعارض معه.',
    'pair already linked': 'يوجد ارتباط نشط بينكما؛ أنهِه قبل إنشاء نوع آخر بين نفس الحسابين.',
    'CP type not available': 'هذا النوع من الارتباط غير متاح حالياً.',
    'incoming request required': 'لا يوجد طلب ارتباط وارد قابل للقبول أو الرفض.',
    'couple request limit reached': 'وصلت للحد المسموح من طلبات الارتباط المعلقة.',
    'agency unavailable': 'تعذر تحميل معلومات الوكالة. أعد المحاولة.',
    'agency not found': 'هذه الوكالة لم تعد متاحة.',
    'already in agency': 'لديك عضوية وكالة بالفعل.',
    'user already belongs to an agency': 'لديك عضوية وكالة بالفعل.',
    'agency registration pending': 'لديك طلب تسجيل وكالة قيد المراجعة بالفعل.',
    'invalid agency application': 'تحقق من اسم الوكالة والبلد ورقم الوكيل والاسم الثلاثي.',
    'agency documents required': 'أرفق الصور الثلاث المطلوبة وتأكد من اكتمال رفعها.',
    'agency preview upload disabled': 'هذه معاينة فقط؛ إرسال الطلب ورفع مستندات الهوية متاحان داخل التطبيق الفعلي.',
    'application limit reached': 'وصلت إلى الحد المسموح من طلبات الانضمام المعلقة.',
  };
  return messages[message] || 'تعذر إتمام العملية من الخادم. حاول مجدداً.';
}
