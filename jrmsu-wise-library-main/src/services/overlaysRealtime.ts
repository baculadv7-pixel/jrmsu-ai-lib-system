// Realtime updates for management overlays (students/admins updates and session updates)
import { API } from "@/config/api";

let socket: any = null;
let _io: any = null;

async function getIO() {
  if (_io) return _io;
  try {
    // @ts-ignore
    const mod = await import(/* @vite-ignore */ 'socket.io-client');
    _io = (mod as any).io || (mod as any).default?.io || (mod as any).default;
  } catch {
    // CDN fallback
    // @ts-ignore
    const mod = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/socket.io-client@4.7.5/dist/socket.io.esm.min.js');
    _io = (mod as any).io || (mod as any).default;
  }
  return _io;
}

export type OverlayEvent = 'students.updated' | 'admins.updated' | 'user.updated' | 'session_update';

export function connectOverlaysRealtime(onEvent: (event: OverlayEvent, payload: any) => void) {
  // Reconnect fresh per open overlay usage
  if (socket) try { socket.disconnect(); } catch {}
  let cancelled = false;
  (async () => {
    try {
      const io = await getIO();
      if (cancelled) return;
      socket = io(API.BACKEND.BASE, { transports: ["websocket", "polling"], withCredentials: true });
      const events: OverlayEvent[] = ['students.updated','admins.updated','user.updated','session_update'];
      events.forEach(ev => socket.on(ev, (p: any) => onEvent(ev, p)));
    } catch (e) {
      console.warn('Overlays realtime disabled', e);
    }
  })();
  return () => { cancelled = true; try { socket?.disconnect(); } catch {}; socket = null; };
}