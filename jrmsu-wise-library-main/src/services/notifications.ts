export type NotificationStatus = "unread" | "read";
export type NotificationType = "borrow" | "return" | "overdue" | "system";

export interface AppNotification {
  id: string; // NT-<timestamp>
  receiverId: string; // user id (student/admin id) or "ADMIN"
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string; // ISO datetime
}

const KEY = "jrmsu_notifications";
const CHANNEL = "jrmsu_notifications_channel";

function readAll(): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as AppNotification[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(items: AppNotification[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function broadcast() {
  try {
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage({ type: "refresh" });
    ch.close();
  } catch {
    // BroadcastChannel may be unsupported; ignore
  }
}

export const NotificationsService = {
  list(receiverId?: string): AppNotification[] {
    const all = readAll();
    if (!receiverId) return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return all
      .filter((n) => n.receiverId === receiverId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  add(input: Omit<AppNotification, "id" | "status" | "createdAt"> & { status?: NotificationStatus }): AppNotification {
    const item: AppNotification = {
      id: `NT-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
      status: input.status ?? "unread",
      createdAt: new Date().toISOString(),
      receiverId: input.receiverId,
      type: input.type,
      message: input.message,
    };
    const all = readAll();
    all.unshift(item);
    writeAll(all);
    broadcast();
    return item;
  },
  markRead(id: string) {
    const all = readAll();
    const idx = all.findIndex((n) => n.id === id);
    if (idx !== -1) {
      all[idx].status = "read";
      writeAll(all);
      broadcast();
    }
  },
  markAllRead(receiverId: string) {
    const all = readAll().map((n) => (n.receiverId === receiverId ? { ...n, status: "read" } : n));
    writeAll(all);
    broadcast();
  },
  remove(id: string) {
    const all = readAll().filter((n) => n.id !== id);
    writeAll(all);
    broadcast();
  },
  subscribe(callback: () => void) {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = () => callback();
    } catch {
      // no-op
    }
    return () => {
      if (ch) ch.close();
    };
  },
};


