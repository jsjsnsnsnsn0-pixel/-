import { Room, RoomEvent } from 'livekit-client';

// Bundle the pinned SDK with the app so a CDN outage cannot change transports.
(globalThis as any).LivekitClient = { Room, RoomEvent };
