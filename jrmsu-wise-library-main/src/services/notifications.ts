import { aiNotificationService, type AINotification } from './aiNotificationService';

export type NotificationStatus = "unread" | "read";
export type NotificationType = "borrow" | "return" | "overdue" | "system" | "ai";

export interface AppNotification {
  id: string; // NT-<timestamp>
  receiverId: string; // user id (student/admin id) or "ADMIN"
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string; // ISO datetime
  priority?: "low" | "medium" | "high"; // Added for AI notifications
  actionUrl?: string; // Added for AI notifications
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
    
    // Merge AI notifications with regular notifications
    const aiNotifs = receiverId ? aiNotificationService.getAllNotifications(receiverId) : [];
    const mergedAI: AppNotification[] = aiNotifs.map(ai => ({
      id: ai.id,
      receiverId: ai.userId,
      message: ai.message,
      type: 'ai' as NotificationType,
      status: ai.read ? 'read' : 'unread',
      createdAt: ai.timestamp.toISOString(),
      priority: ai.priority,
      actionUrl: ai.actionUrl
    }));
    
    const merged = [...all, ...mergedAI];
    
    if (!receiverId) return merged.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return merged
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
    // Check if it's an AI notification
    if (id.startsWith('notif_')) {
      aiNotificationService.markAsRead(id);
      broadcast();
      return;
    }
    
    const all = readAll();
    const idx = all.findIndex((n) => n.id === id);
    if (idx !== -1) {
      all[idx].status = "read";
      writeAll(all);
      broadcast();
    }
  },
  markAllRead(receiverId: string) {
    // Mark AI notifications as read
    aiNotificationService.markAllAsRead(receiverId);
    
    // Mark regular notifications as read
    const all = readAll().map((n) => (n.receiverId === receiverId ? { ...n, status: "read" } : n));
    writeAll(all);
    broadcast();
  },
  remove(id: string) {
    // Check if it's an AI notification
    if (id.startsWith('notif_')) {
      aiNotificationService.deleteNotification(id);
      broadcast();
      return;
    }
    
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
  
  // AI Notification helpers
  addAINotification(aiNotif: AINotification) {
    // Save to AI service
    aiNotificationService.saveNotification(aiNotif);
    broadcast();
  },
  
  generateBookRecommendation(userId: string, borrowHistory: any[]) {
    aiNotificationService.generateBookRecommendation(userId, borrowHistory)
      .then(notif => {
        aiNotificationService.saveNotification(notif);
        broadcast();
      })
      .catch(err => console.error('Failed to generate book recommendation:', err));
  },
  
  generateOverdueReminder(userId: string, overdueBooks: any[]) {
    const notif = aiNotificationService.generateOverdueReminder(userId, overdueBooks);
    aiNotificationService.saveNotification(notif);
    broadcast();
  },
  
  generateReturnReminder(userId: string, dueBook: any) {
    const notif = aiNotificationService.generateReturnReminder(userId, dueBook);
    aiNotificationService.saveNotification(notif);
    broadcast();
  },
};


