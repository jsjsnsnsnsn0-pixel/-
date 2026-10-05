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
    'not authorized': 'لا يملك حسابك الصلاحية المطلوبة.',
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
    'already in agency': 'لديك عضوية وكالة بالفعل.',
  };
  return messages[message] || 'تعذر إتمام العملية من الخادم. حاول مجدداً.';
}
