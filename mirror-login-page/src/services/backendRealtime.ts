// Realtime updates for Mirror via Socket.IO with CDN fallback
import { API } from "@/config/api";

let socket: any = null;
let _io: any = null;

async function getIO() {
  if (_io) return _io;
  try {
    // Try local dependency first (if installed)
    // @ts-ignore
    const mod = await import(/* @vite-ignore */ 'socket.io-client');
    _io = (mod as any).io || (mod as any).default?.io || (mod as any).default;
  } catch {
    // Fallback to CDN ESM build
    // @ts-ignore
    const mod = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/socket.io-client@4.7.5/dist/socket.io.esm.min.js');
    _io = (mod as any).io || (mod as any).default;
  }
  return _io;
}

export type MirrorEvent =
  | 'session_update'
  | 'session_cleanup'
  | 'user.updated'
  | 'students.updated'
  | 'admins.updated'
  | 'book.added'
  | 'book.removed'
  | 'book.borrowed'
  | 'book.returned'
  | 'book.overdue';

export async function connectRealtime(
  onEvent: (event: MirrorEvent, payload: any) => void,
  opts?: { userId?: string }
) {
  const io = await getIO();
  try { socket?.disconnect(); } catch {}
  socket = io(API.BACKEND.BASE, { transports: ["websocket"], withCredentials: true, query: { userId: opts?.userId || '' } });
  const events: MirrorEvent[] = [
    'session_update','session_cleanup','user.updated','students.updated','admins.updated',
    'book.added','book.removed','book.borrowed','book.returned','book.overdue'
  ];
  events.forEach(ev => socket.on(ev, (p: any) => onEvent(ev, p)));
  return () => { try { socket?.disconnect(); } catch {}; socket = null; };
}
