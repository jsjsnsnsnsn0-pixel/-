import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight, ShoppingBag, Sparkles, Car, MessageCircle, Crown, Check } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  category: 'frames' | 'cars' | 'bubbles' | 'badges';
  price: number;
  currency: 'gold' | 'silver';
  image: string;
  description: string;
  duration: string;
  isOwned?: boolean;
}

export const StoreScreen: React.FC = () => {
  const { user, setUser, setActiveSubScreen } = useApp();
  const [activeTab, setActiveTab] = useState<'frames' | 'cars' | 'bubbles' | 'badges'>('frames');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const items: StoreItem[] = [
    // Frames
    {
      id: 'f1',
      name: 'إطار التنين الذهبي',
      category: 'frames',
      price: 2500,
      currency: 'gold',
      image: '🐉',
      description: 'إطار أسطوري مع لهب ذهبي وتأثيرات براقة',
      duration: '30 يوم',
    },
    {
      id: 'f2',
      name: 'إطار الأجنحة الملكية',
      category: 'frames',
      price: 1800,
      currency: 'gold',
      image: '👑',
      description: 'إطار أنيق بأجنحة ملائكية مشعة لكبار الشخصيات',
      duration: '30 يوم',
    },
    {
      id: 'f3',
      name: 'إطار زهرة الكرز الفضي',
      category: 'frames',
      price: 450,
      currency: 'silver',
      image: '🌸',
      description: 'إطار رقيق مع بتلات ساكورا متساقطة',
      duration: '7 أيام',
    },
    {
      id: 'f4',
      name: 'إطار النيون الفضائي',
      category: 'frames',
      price: 1200,
      currency: 'gold',
      image: '⚡',
      description: 'إطار نيون بألوان متغيرة وتوهج إلكتروني',
      duration: '30 يوم',
    },
    // Cars (Entrance Effects)
    {
      id: 'c1',
      name: 'لامبورغيني أفينتادور الذهبية',
      category: 'cars',
      price: 9900,
      currency: 'gold',
      image: '🏎️',
      description: 'دخول أسطوري بصوت محرك V12 وأضواء مسرحية كاملة للروم',
      duration: '30 يوم',
    },
    {
      id: 'c2',
      name: 'طائرة الهيليكوبتر الخاصة',
      category: 'cars',
      price: 6500,
      currency: 'gold',
      image: '🚁',
      description: 'هبوط ملكي على منصة الروم مع تحية خاصة للحضور',
      duration: '30 يوم',
    },
    {
      id: 'c3',
      name: 'اليخت الملكي الفاخر',
      category: 'cars',
      price: 8000,
      currency: 'gold',
      image: '🛥️',
      description: 'أمواج مائية زرقاء ورذاذ ناصع يدخل به المستخدم',
      duration: '30 يوم',
    },
    {
      id: 'c4',
      name: 'الحصان العربي الأبيض',
      category: 'cars',
      price: 800,
      currency: 'silver',
      image: '🐎',
      description: 'دخول تراثي أصيل مع أهازيج خليجية ترحيبية',
      duration: '15 يوم',
    },
    // Chat Bubbles
    {
      id: 'b1',
      name: 'فقاعة الملكية الذهبية',
      category: 'bubbles',
      price: 800,
      currency: 'gold',
      image: '💬',
      description: 'تصميم ذهبي لرسائلك داخل المحادثات والغرف الصوتية',
      duration: '30 يوم',
    },
    {
      id: 'b2',
      name: 'فقاعة الفضاء الأرجوانية',
      category: 'bubbles',
      price: 300,
      currency: 'silver',
      image: '🔮',
      description: 'فقاعة نصية بأطراف نيون بنفسجية مشعة',
      duration: '15 يوم',
    },
    // Badges
    {
      id: 'bd1',
      name: 'وسام كبار الداعمين',
      category: 'badges',
      price: 3500,
      currency: 'gold',
      image: '💎',
      description: 'شارة شرفية تظهر في ملفك الشخصي وقائمة الحضور',
      duration: 'دائم',
    },
    {
      id: 'bd2',
      name: 'وسام فارس المجلس',
      category: 'badges',
      price: 500,
      currency: 'silver',
      image: '🛡️',
      description: 'شارة خاصة لرواد المجلس الأوفياء',
      duration: 'دائم',
    },
  ];

  const filteredItems = items.filter((item) => item.category === activeTab);

  const handleBuy = (_item: StoreItem) => {
    setPurchaseSuccess('الشراء غير متاح حالياً. لم يتم خصم أي رصيد.');
    setTimeout(() => setPurchaseSuccess(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubScreen(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            <h1 className="text-base font-bold text-slate-900">المتجر الفاخر</h1>
          </div>
        </div>

        {/* User Balance Chips */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-full text-xs font-bold text-amber-700">
            <span>🪙</span>
            <span>{user.gold.toLocaleString('ar-SA')}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full text-xs font-bold text-slate-600">
            <span>🥈</span>
            <span>{(user.silverCoins || 0).toLocaleString('ar-SA')}</span>
          </div>
        </div>
      </header>

      {/* Purchase Notification */}
      {purchaseSuccess && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs animate-fadeIn">
          <Check size={16} className="text-emerald-600" />
          <span>{purchaseSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-3 bg-white border-b border-slate-100 text-xs font-bold">
        {[
          { id: 'frames', label: 'إطارات', icon: Sparkles },
          { id: 'cars', label: 'سيارات الدخول', icon: Car },
          { id: 'bubbles', label: 'فقاعات الشات', icon: MessageCircle },
          { id: 'badges', label: 'شارات الشرف', icon: Crown },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-pink-50 text-pink-600 font-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Store Items Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="h-24 rounded-2xl bg-gradient-to-tr from-slate-50 to-pink-50/40 flex items-center justify-center text-4xl mb-3 border border-pink-100/50">
                {item.image}
              </div>
              <h3 className="font-bold text-xs text-slate-900 mb-1">{item.name}</h3>
              <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 mb-2">
                {item.description}
              </p>
              <span className="text-[10px] text-pink-600 font-semibold bg-pink-50 px-2 py-0.5 rounded-full inline-block mb-3">
                صلاحية {item.duration}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 font-bold text-xs">
                <span>{item.currency === 'gold' ? '🪙' : '🥈'}</span>
                <span className={item.currency === 'gold' ? 'text-amber-600' : 'text-slate-600'}>
                  {item.price.toLocaleString('ar-SA')}
                </span>
              </div>
              <button
                onClick={() => handleBuy(item)}
                className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-bold rounded-xl shadow-xs hover:from-pink-600 hover:to-rose-600 cursor-pointer active:scale-95 transition-all"
              >
                شراء
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
