import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveGiftAnimation } from '../../types';
import { Sparkles } from 'lucide-react';

interface GiftOverlayAnimationProps {
  overlayData: ActiveGiftAnimation | null;
}

export const GiftOverlayAnimation: React.FC<GiftOverlayAnimationProps> = ({ overlayData }) => {
  if (!overlayData) return null;

  const { gift, sender, recipient, quantity = 1 } = overlayData;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50 flex flex-col items-center justify-center p-4">
        {/* Glow backdrop burst */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.6, scale: 1.4 }}
          exit={{ opacity: 0, scale: 2 }}
          transition={{ duration: 1 }}
          className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-amber-500/30 via-purple-600/40 to-pink-500/30 blur-3xl"
        />

        {/* Floating and bouncing 3D gift icon */}
        <motion.div
          initial={{ y: 80, scale: 0.2, rotate: -20, opacity: 0 }}
          animate={{
            y: [-20, 0, -10],
            scale: [0.8, 1.35, 1.2],
            rotate: [0, 8, -6, 0],
            opacity: 1,
          }}
          exit={{ y: -120, scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative text-7xl md:text-8xl drop-shadow-[0_10px_25px_rgba(234,179,8,0.5)] mb-3 z-10"
        >
          <span>{gift.icon}</span>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className="absolute -top-2 -right-2 text-amber-300"
          >
            <Sparkles size={28} />
          </motion.div>
        </motion.div>

        {/* Sender -> Recipient Announcement Banner */}
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative max-w-sm w-full bg-gradient-to-r from-purple-950/90 via-[#1e1435]/95 to-purple-950/90 border border-amber-400/50 backdrop-blur-xl rounded-2xl px-5 py-3 text-center shadow-[0_10px_35px_rgba(0,0,0,0.6)] z-10"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
              ✨ هدية فاخرة ✨
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="font-bold text-purple-300 truncate max-w-[100px]">{sender.name}</span>
            <span className="text-slate-400 text-xs">أهدى</span>
            <span className="font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40">
              {gift.name}{quantity > 1 ? ` ×${quantity}` : ''}
            </span>
            <span className="text-slate-400 text-xs">إلى</span>
            <span className="font-bold text-pink-300 truncate max-w-[100px]">{recipient.name}</span>
          </div>

          <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-amber-400/90 font-mono">
            <span>🪙 {gift.price.toLocaleString('ar-SA')} ذهب</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
