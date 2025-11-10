// Realtime updates for dashboard overlays via Socket.IO
import { API } from "@/config/api";

let socket: any = null;
let _io: any = null;

async function getIO() {
  if (_io) return _io;
  try {
    // Try local dependency
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

export type DashboardEvent =
  | 'book.added'
  | 'book.removed'
  | 'book.borrowed'
  | 'book.returned'
  | 'book.overdue'
  | 'reservation.cancelled'
  | 'book.return_time_activated';

export function connectDashboardRealtime(onEvent: (event: DashboardEvent, payload: any) => void) {
  if (socket) try { socket.disconnect(); } catch {}
  let cancelled = false;
  (async () => {
    try {
      const io = await getIO();
      if (cancelled) return;
      socket = io(API.BACKEND.BASE, { transports: ["websocket"], withCredentials: true });
      const events: DashboardEvent[] = ['book.added','book.removed','book.borrowed','book.returned','book.overdue','reservation.cancelled','book.return_time_activated'];
      events.forEach(ev => socket.on(ev, (p: any) => onEvent(ev, p)));
    } catch (e) {
      console.warn('Dashboard realtime disabled', e);
    }
  })();
  return () => { cancelled = true; try { socket?.disconnect(); } catch {}; socket = null; };
}
