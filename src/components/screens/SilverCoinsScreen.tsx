import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight, Coins, Check, Gift, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  reward: number;
  completed: boolean;
  claimed: boolean;
  progress: string;
}

export const SilverCoinsScreen: React.FC = () => {
  const { user, setUser, setActiveSubScreen } = useApp();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 't1',
      title: 'تسجيل الدخول اليومي للتطبيق',
      reward: 50,
      completed: true,
      claimed: false,
      progress: '1/1',
    },
    {
      id: 't2',
      title: 'الاستماع لغرفة صوتية لمدة 5 دقائق',
      reward: 70,
      completed: true,
      claimed: false,
      progress: '5/5 دقيقة',
    },
    {
      id: 't3',
      title: 'التحدث على مايكروفون الغرفة 3 دقائق',
      reward: 100,
      completed: false,
      claimed: false,
      progress: '1/3 دقائق',
    },
    {
      id: 't4',
      title: 'متابعة صديقين جديدين',
      reward: 40,
      completed: true,
      claimed: false,
      progress: '2/2',
    },
    {
      id: 't5',
      title: 'مشاركة رابط غرفة في وسائل التواصل',
      reward: 60,
      completed: false,
      claimed: false,
      progress: '0/1',
    },
  ]);

  const [claimedDays, setClaimedDays] = useState<number[]>([1]);
  const [justClaimedNotice, setJustClaimedNotice] = useState<string | null>(null);

  const handleClaimTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.completed || task.claimed) return;

    setUser((prev) => ({
      ...prev,
      silverCoins: (prev.silverCoins || 0) + task.reward,
    }));

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, claimed: true } : t))
    );

    setJustClaimedNotice(`تم استلام ${task.reward} عملة فضية بنجاح!`);
    setTimeout(() => setJustClaimedNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubScreen(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Coins size={18} />
            </div>
            <h1 className="text-base font-bold text-slate-900">مركز العملات الفضية والمهام</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200/60 px-3 py-1 rounded-full text-xs font-bold text-purple-700 font-mono">
          <span>🥈</span>
          <span>{(user.silverCoins || 0).toLocaleString('ar-SA')}</span>
        </div>
      </header>

      {/* Notice */}
      {justClaimedNotice && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs">
          <Check size={16} className="text-emerald-600" />
          <span>{justClaimedNotice}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="p-4">
        <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white p-5 shadow-sm relative overflow-hidden">
          <span className="text-xs bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black inline-block mb-2">
            جديد وخاص مجاناً ✨
          </span>
          <h2 className="text-lg font-black mb-1">أكمل المهام واكسب العملات الفضية</h2>
          <p className="text-xs text-white/80 max-w-xs leading-relaxed">
            استبدل العملات الفضية بإطارات مميزة، وهدايا مجانية تدعم بها أصدقاءك في الغرف!
          </p>
          <div className="absolute -left-3 -bottom-5 text-6xl opacity-20">🪙</div>
        </div>
      </div>

      {/* 7-Day Check-in Strip */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={16} className="text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900">سجل الحضور اليومي:</h3>
            </div>
            <span className="text-[11px] text-purple-600 font-bold">تسجيل متواصل</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {[
              { day: 1, reward: 20 },
              { day: 2, reward: 30 },
              { day: 3, reward: 40 },
              { day: 4, reward: 50 },
              { day: 5, reward: 60 },
              { day: 6, reward: 80 },
              { day: 7, reward: 150 },
            ].map((d) => {
              const isClaimed = claimedDays.includes(d.day);
              return (
                <div
                  key={d.day}
                  className={`p-2 rounded-2xl flex flex-col items-center justify-between border transition-all ${
                    isClaimed
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'bg-slate-50 border-slate-200/60 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-bold">يوم {d.day}</span>
                  <span className="text-xs font-black my-1">
                    {isClaimed ? '✓' : `+${d.reward}`}
                  </span>
                  <span className="text-[9px]">🥈</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Tasks List */}
      <div className="px-4 space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 px-1">المهام اليومية المتجددة:</h3>

        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3.5 rounded-3xl bg-white border border-slate-100 shadow-xs flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-xs text-slate-800">{task.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                <span className="text-purple-600 font-bold">+{task.reward} فضة</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">التقدم: {task.progress}</span>
              </div>
            </div>

            <div>
              {task.claimed ? (
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold">
                  تم الاستلام
                </span>
              ) : task.completed ? (
                <button
                  onClick={() => handleClaimTask(task.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  استلام
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium">
                  قيد التنفيذ
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
