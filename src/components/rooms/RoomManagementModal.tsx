import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabase';
import { Room } from '../../types';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import {
  X,
  Shield,
  MicOff,
  UserX,
  Lock,
  Unlock,
  Volume2,
  UserPlus,
  Ban,
  Check,
} from 'lucide-react';

interface RoomManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

export const RoomManagementModal: React.FC<RoomManagementModalProps> = ({
  isOpen,
  onClose,
  room,
}) => {
  const { lockSeat, unlockSeat, muteSeatUser, kickSeatUser, user, reportError } = useApp();
  const scheduleTimeout = useTimeouts(isOpen);
  const [activeTab, setActiveTab] = useState<'seats' | 'members' | 'settings'>('seats');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) setSuccessToast(null);
  }, [isOpen]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    scheduleTimeout(() => setSuccessToast(null), 2000);
  };

  if (!isOpen || !room.canModerate) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-xs"
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-md bg-[#111322] border-t border-purple-500/30 rounded-t-3xl p-4 shadow-2xl z-10 max-h-[85vh] flex flex-col"
        >
          <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-3" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/10">
            <div className="flex items-center gap-2">
              <Shield className="text-purple-400" size={20} />
              <div>
                <h3 className="font-bold text-slate-100 text-sm">إدارة الغرفة والمقاعد</h3>
                <span className="text-[11px] text-slate-400">صلاحيات المضيف والمشرفين</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-200">
              <X size={20} />
            </button>
          </div>

          {/* Toast alert */}
          {successToast && (
            <div className="mt-2 text-xs bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 p-2 rounded-xl flex items-center gap-1.5 justify-center">
              <Check size={14} />
              <span>{successToast}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-3 pb-2 border-b border-purple-500/10">
            <button
              onClick={() => setActiveTab('seats')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'seats'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#181a2e] text-slate-400 hover:text-slate-200'
              }`}
            >
              المقاعد والمايكات
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'members'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#181a2e] text-slate-400 hover:text-slate-200'
              }`}
            >
              الأعضاء والمشرفون
            </button>
          </div>

          {/* Content */}
          <div className="py-3 overflow-y-auto max-h-72 no-scrollbar space-y-2">
            {activeTab === 'seats' && (
              <div className="space-y-2">
                <span className="text-xs text-slate-400 block mb-1">
                  إدارة مقاعد التحدث ({room.seats.length} مقاعد):
                </span>
                {room.seats.map((seat) => (
                  <div
                    key={seat.seatIndex}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#16182c] border border-purple-500/15"
                  >
                    <div className="flex items-center gap-2.5">
                      {seat.user ? (
                        <UserAvatar user={seat.user} size="xs" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-xs text-purple-400 font-mono">
                          {seat.seatIndex + 1}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-200">
                            المقعد {seat.seatIndex + 1}
                          </span>
                          {seat.isLocked && (
                            <span className="text-[10px] text-rose-400 bg-rose-950/40 px-1.5 py-0.2 rounded-sm border border-rose-500/20">
                              مقفل
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[120px]">
                          {seat.user ? seat.user.name : 'مقعد شاغر'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {seat.user && (
                        <>
                          <button
                            onClick={async () => {
                              if (await muteSeatUser(seat.seatIndex)) showToast(seat.isMuted ? 'تم إلغاء كتم المستخدم' : 'تم كتم المستخدم');
                            }}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                              seat.isMuted
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                            }`}
                            disabled={seat.seatIndex === 0}
                            title={seat.isMuted ? 'إلغاء الكتم' : 'كتم المايك'}
                          >
                            {seat.isMuted ? <Volume2 size={14} /> : <MicOff size={14} />}
                          </button>
                          <button
                            onClick={async () => {
                              if (await kickSeatUser(seat.seatIndex)) showToast('تم إنزال المستخدم من المايك');
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 text-xs cursor-pointer"
                            disabled={seat.seatIndex === 0}
                            title="إنزال من المقعد"
                          >
                            <UserX size={14} />
                          </button>
                        </>
                      )}

                      <button
                        onClick={async () => {
                          if (seat.isLocked) {
                            if (await unlockSeat(seat.seatIndex)) showToast('تم فتح المقعد');
                          } else {
                            if (await lockSeat(seat.seatIndex)) showToast('تم قفل المقعد');
                          }
                        }}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                          seat.isLocked
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        disabled={seat.seatIndex === 0 || room.ownerAuthId !== user.authId}
                        title={seat.isLocked ? 'فتح المقعد' : 'قفل المقعد'}
                      >
                        {seat.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16182c] border border-purple-500/15">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={room.owner} size="xs" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-300">{room.owner.name}</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded-sm border border-amber-500/30">
                          صاحب الغرفة
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">مالك الروم</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-slate-400 block mb-2">إجراءات سريعة:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => { const id = window.prompt('أدخل معرف المستخدم'); if (!id || !/^\d{1,18}$/.test(id)) return; const {error} = await supabase.rpc('invite_room_user', {p_room_id: room.id, p_target_public_id: Number(id)}); if (error) reportError('تعذر إرسال الدعوة. تحقق من المعرف والصلاحيات.'); else showToast('تم إرسال دعوة الغرفة'); }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-600/30"
                    >
                      <UserPlus size={14} />
                      <span>دعوة مستخدم</span>
                    </button>
                    <button
                      onClick={() => reportError('إدارة قائمة الحظر غير متاحة من هذه الشاشة حالياً.')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-600/30"
                    >
                      <Ban size={14} />
                      <span>المستخدمون المحظورون</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
