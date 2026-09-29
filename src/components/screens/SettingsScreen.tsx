import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronRight,
  User,
  Shield,
  Bell,
  Volume2,
  Globe,
  Moon,
  Lock,
  HelpCircle,
  ChevronLeft,
  LogOut,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { setActiveSubScreen, logout } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const settingsGroups = [
    {
      title: 'إعدادات الحساب والملف',
      items: [
        { icon: User, label: 'معلومات الحساب الشخصي', desc: 'تعديل الاسم والصورة والسيرة' },
        { icon: Lock, label: 'الأمان وكلمة المرور', desc: 'حماية الحساب والتحقق بخطوتين' },
      ],
    },
    {
      title: 'الصوت والمايكروفون',
      items: [
        { icon: Volume2, label: 'جودة الصوت ومؤثرات الروم', desc: 'HD Voice & 3D Spatial Audio' },
      ],
    },
    {
      title: 'الخصوصية والتفضيلات',
      items: [
        { icon: Shield, label: 'الخصوصية وقائمة الحظر', desc: 'إدارة من يمكنه إرسال الرسائل لك' },
        { icon: Globe, label: 'لغة التطبيق', desc: 'العربية (افتراضي)' },
        { icon: Moon, label: 'المظهر', desc: 'الوضع الليلي الفاخر (افتراضي)' },
      ],
    },
    {
      title: 'الدعم والمساعدة',
      items: [
        { icon: HelpCircle, label: 'مركز المساعدة وخدمة العملاء VIP', desc: 'تواصل معنا على مدار الساعة' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0c16] text-slate-100 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0b0c16]/95 border-b border-purple-500/20 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubScreen(null)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
          <h1 className="text-base font-bold text-slate-100">الإعدادات والتفضيلات</h1>
        </div>
      </header>

      {/* Settings list */}
      <div className="p-4 space-y-5">
        {/* Toggle options */}
        <div className="bg-[#141629] border border-purple-500/15 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center">
                <Bell size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">إشعارات التطبيق</span>
                <span className="text-[11px] text-slate-400">تنبيهات الهدايا ودعوات الغرف</span>
              </div>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                notificationsEnabled ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'left-1' : 'right-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-purple-500/10" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-300 flex items-center justify-center">
                <Volume2 size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">عزل الضوضاء بالذكاء الاصطناعي</span>
                <span className="text-[11px] text-slate-400">تنقية صوت المايك من صدى الغرفة</span>
              </div>
            </div>
            <button
              onClick={() => setNoiseSuppression(!noiseSuppression)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                noiseSuppression ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  noiseSuppression ? 'left-1' : 'right-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Grouped Settings */}
        {settingsGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block px-1">
              {group.title}
            </span>
            <div className="bg-[#141629] border border-purple-500/15 rounded-2xl overflow-hidden divide-y divide-purple-500/10">
              {group.items.map((item, iIdx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={iIdx}
                    onClick={() => {
                      if (item.label === 'معلومات الحساب الشخصي') {
                        setActiveSubScreen('edit_profile');
                      }
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-[#1a1c33] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1b1d35] text-purple-300 flex items-center justify-center">
                        <IconComponent size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-400">{item.desc}</span>
                      </div>
                    </div>
                    <ChevronLeft size={16} className="text-slate-500" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Log out & New User Registration buttons */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => setActiveSubScreen('fill_info')}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between hover:bg-emerald-900/40 transition-all cursor-pointer shadow-lg active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <User size={16} className="text-emerald-400" />
              <span>تسجيل مستخدم جديد (ملء المعلومات)</span>
            </div>
            <ChevronLeft size={16} className="text-emerald-400" />
          </button>

          <button
            onClick={() => logout()}
            className="w-full py-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-900/40 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
