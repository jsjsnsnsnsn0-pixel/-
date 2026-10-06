import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoomCard } from '../rooms/RoomCard';
import { SearchBar } from '../common/SearchBar';
import { Radio, Plus, Flame, Users, Sparkles, Heart } from 'lucide-react';

export const RoomsListScreen: React.FC = () => {
  const { rooms, ownedClosedRooms, reopenRoom, joinRoom, setActiveTab } = useApp();
  const [activeTab, setActiveTabState] = useState<'all' | 'live' | 'popular' | 'new' | 'friends'>('all');
  const [reopening,setReopening] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'all', label: 'الكل', icon: Sparkles },
    { id: 'live', label: 'نشطة الآن', icon: Radio },
    { id: 'popular', label: 'الأكثر شعبية', icon: Flame },
    { id: 'new', label: 'جديدة', icon: Sparkles },
    { id: 'friends', label: 'أصدقائي', icon: Heart },
  ];

  const getFilteredRooms = () => {
    let list = [...rooms];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.id.includes(q) ||
          r.owner.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    switch (activeTab) {
      case 'live':
        return list.filter((r) => r.status === 'live');
      case 'popular':
        return list.sort((a, b) => b.usersCount - a.usersCount);
      case 'new':
        return list.reverse();
      case 'friends':
        return list.slice(0, 2);
      default:
        return list;
    }
  };

  const filteredRooms = getFilteredRooms();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-24 select-none" dir="rtl">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 pt-3 pb-2.5 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200/70 flex items-center justify-center">
              <Radio size={18} className="stroke-[2.5]" />
            </div>
            <h1 className="text-base font-black text-slate-900">استكشف الغرف الصوتية</h1>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>إنشاء غرفة</span>
          </button>
        </div>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ابحث بالاسم أو رقم ID الغرفة..."
        />

        {/* Tabs Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                aria-pressed={isActive} onClick={() => setActiveTabState(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon size={12} className={isActive ? 'text-cyan-300' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {ownedClosedRooms.length > 0 && <section aria-label="غرفي المغلقة" dir="rtl" className="mx-4 mt-4 p-4 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-sm font-bold mb-3">غرفي المغلقة</h2>
        <div className="space-y-2">{ownedClosedRooms.map(room=><div key={room.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
          <span className="min-w-0 text-sm font-semibold truncate">{room.title}</span>
          <button type="button" disabled={reopening!==null} aria-label={`إعادة فتح ${room.title}`} onClick={async()=>{if(reopening!==null)return;setReopening(room.id);try{await reopenRoom(room);}finally{setReopening(null);}}} className="shrink-0 px-3 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold disabled:opacity-50">{reopening===room.id?'جارٍ الفتح…':'إعادة فتح'}</button>
        </div>)}</div>
      </section>}
      {/* Rooms Grid */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-medium">
          <span>الغرف المتاحة ({filteredRooms.length})</span>
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            تحديث فوري ⚡️
          </span>
        </div>

        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                variant="standard"
                onJoin={(r) => joinRoom(r)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <Radio size={36} className="text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 mb-1">لا توجد غرف تطابق بحثك</h3>
            <p className="text-xs text-slate-400 mb-4">جرب البحث بكلمات أخرى أو أنشئ غرفتك الخاصة الآن</p>
            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-105 cursor-pointer"
            >
              إنشاء غرفة جديدة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
