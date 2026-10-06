import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Room as LiveKitRoom, RoomEvent} from 'livekit-client';
import './index.css';
import './modern.css';

type LiveKitBootstrapGlobal = typeof globalThis & {
  LivekitClient?: {
    Room: typeof LiveKitRoom;
    RoomEvent: typeof RoomEvent;
  };
};

(globalThis as LiveKitBootstrapGlobal).LivekitClient = {
  Room: LiveKitRoom,
  RoomEvent,
};

void import('./App.tsx')
  .then(({default: App}) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error) => {
    console.error('TotiChat bootstrap failed:', error);
    const root = document.getElementById('root');
    if (root) root.textContent = 'تعذر تشغيل التطبيق. أغلق التطبيق وافتحه من جديد.';
  });