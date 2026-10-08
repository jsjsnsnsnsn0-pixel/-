import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveGiftAnimation } from '../../types';
import { Sparkles } from 'lucide-react';

interface GiftOverlayAnimationProps {
  overlayData: ActiveGiftAnimation | null;
}

export const GiftOverlayAnimation: React.FC<GiftOverlayAnimationProps> = ({ overlayData }) => {
  if (!overlayData) return null;

  const { gift } = overlayData;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-[60] flex flex-col items-center justify-center p-4">
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


      </div>
    </AnimatePresence>
  );
};
