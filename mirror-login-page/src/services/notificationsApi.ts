import { API } from "@/config/api";

export type NotificationItem = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  meta?: any;
  created_at: number;
  read: boolean;
  action_required?: boolean;
  action_payload?: any;
  actor_id?: string;
};

// Soft dependency on socket.io-client with CDN fallback to avoid build-time failures
let socket: any = null;
let _io: any = null;
async function getIO() {
  if (_io) return _io;
  try {
    // Try local dependency if installed
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

export const NotificationsAPI = {
  async list(params: { userId: string; filter?: "all"|"unread"; page?: number; limit?: number }) {
    const url = new URL(`${API.BACKEND.BASE}/api/notifications`);
    if (params.filter) url.searchParams.set("filter", params.filter);
    if (params.page) url.searchParams.set("page", String(params.page));
    if (params.limit) url.searchParams.set("limit", String(params.limit));
    const r = await fetch(url.toString(), {
      headers: { "Content-Type": "application/json", "X-User-Id": params.userId },
      credentials: "include",
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ items: NotificationItem[]; total: number; unread: number }>;
  },
  async markRead(userId: string, ids: string[]) {
    const r = await fetch(`${API.BACKEND.BASE}/api/notifications/mark-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": userId },
      credentials: "include",
      body: JSON.stringify({ notificationIds: ids }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async markAllRead(userId: string) {
    const r = await fetch(`${API.BACKEND.BASE}/api/notifications/mark-all-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": userId },
      credentials: "include",
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async get(userId: string, id: string) {
    const r = await fetch(`${API.BACKEND.BASE}/api/notifications/${id}`, {
      headers: { "Content-Type": "application/json", "X-User-Id": userId },
      credentials: "include",
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<NotificationItem>;
  },
  connect(userId: string, handlers: {
    onNew?: (n: NotificationItem) => void;
    onUpdate?: (n: NotificationItem) => void;
    onMarkAll?: (p: { userId: string; timestamp: number }) => void;
  }) {
    if (socket) try { socket.disconnect(); } catch {}
    let cancelled = false;
    (async () => {
      try {
        const io = await getIO();
        if (cancelled) return;
        socket = io(API.BACKEND.BASE, { transports: ["websocket"], withCredentials: true, query: { userId } });
        socket.on("connected", () => {});
        socket.on("notification.new", (n: NotificationItem) => handlers.onNew?.(n));
        socket.on("notification.update", (n: NotificationItem) => handlers.onUpdate?.(n));
        socket.on("notification.mark_all_read", (p: any) => handlers.onMarkAll?.(p));
        socket.on("notification.admin_response", (p: any) => handlers.onUpdate?.({
          id: `admin-${Date.now()}`,
          user_id: userId,
          title: "Admin response",
          body: `Status: ${p?.status}`,
          type: "admin_response",
          created_at: Date.now()/1000,
          read: false,
        } as any));
      } catch (e) {
        // If even CDN fails, silently skip realtime
        console.warn('Realtime disabled (socket.io not available)', e);
      }
    })();
    return () => {
      cancelled = true;
      try { socket?.disconnect(); } catch {}
      socket = null;
    };
  },
};
