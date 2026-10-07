import React from 'react';
import {Minimize2, Power} from 'lucide-react';
import {useDismissableLayer} from '../../../hooks/useDismissableLayer';

export function RoomExitOverlay({open,onClose,onLeave,onMinimize}:{open:boolean;onClose:()=>void;onLeave:()=>void;onMinimize:()=>void}) {
  const layerRef=useDismissableLayer(open,onClose);
  if(!open)return null;
  return <div ref={layerRef} className="room-exit-overlay" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label="خيارات الغرفة" className="room-exit-actions" onClick={event=>event.stopPropagation()}>
      <button type="button" className="room-exit-action room-exit-leave" onClick={onLeave}>
        <span className="room-exit-icon" aria-hidden="true"><Power/></span>
        <span>مغادرة الغرفة</span>
      </button>
      <button type="button" className="room-exit-action room-exit-minimize" onClick={onMinimize}>
        <span className="room-exit-icon" aria-hidden="true"><Minimize2/></span>
        <span>تصغير الغرفة</span>
      </button>
    </div>
  </div>;
}
