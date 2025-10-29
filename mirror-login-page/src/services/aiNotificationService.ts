// AI Notification Service
// Generates smart notifications and recommendations for users

import { aiService } from './aiService';

export interface AINotification {
  id: string;
  userId: string;
  type: 'recommendation' | 'reminder' | 'alert' | 'insight' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

const AI_NOTIFICATIONS_KEY = 'jrmsu_ai_notifications';

class AINotificationService {
  // Generate book recommendations based on user behavior
  async generateBookRecommendation(userId: string, borrowHistory: any[]): Promise<AINotification> {
    try {
      const categories = borrowHistory.map(b => b.category).join(', ');
      const prompt = `Based on a user's borrowing history in categories: ${categories}, suggest 3 book titles they might enjoy. Keep it brief and friendly.`;
      
      const response = await aiService.sendMessage(prompt, 'system', []);
      
      return this.createNotification({
        userId,
        type: 'recommendation',
        title: '📚 Books You Might Like',
        message: response.content,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to generate book recommendation:', error);
      throw error;
    }
  }

  // Generate overdue book reminder
  async generateOverdueReminder(userId: string, overdueBooks: any[]): Promise<AINotification> {
    const bookTitles = overdueBooks.map(b => b.title).join(', ');
    
    return this.createNotification({
      userId,
      type: 'reminder',
      title: '⚠️ Overdue Books',
      message: `You have ${overdueBooks.length} overdue book${overdueBooks.length > 1 ? 's' : ''}: ${bookTitles}. Please return them as soon as possible to avoid late fees.`,
      priority: 'high',
      actionUrl: '/history'
    });
  }

  // Generate return reminder (1 day before due)
  async generateReturnReminder(userId: string, dueBook: any): Promise<AINotification> {
    return this.createNotification({
      userId,
      type: 'reminder',
      title: '📅 Book Due Tomorrow',
      message: `"${dueBook.title}" is due tomorrow. Please return it or renew your borrowing period.`,
      priority: 'medium',
      actionUrl: '/history'
    });
  }

  // Generate system insights for admins
  async generateAdminInsight(data: {
    totalBorrows: number;
    popularBooks: any[];
    activeUsers: number;
  }): Promise<AINotification> {
    const prompt = `Generate a brief admin insight summary: ${data.totalBorrows} total borrows this week, ${data.activeUsers} active users. Popular books: ${data.popularBooks.map(b => b.title).join(', ')}. Keep it concise and actionable.`;
    
    try {
      const response = await aiService.sendMessage(prompt, 'admin', []);
      
      return this.createNotification({
        userId: 'admin',
        type: 'insight',
        title: '📊 Weekly Library Insights',
        message: response.content,
        priority: 'low',
        actionUrl: '/reports'
      });
    } catch (error) {
      return this.createNotification({
        userId: 'admin',
        type: 'insight',
        title: '📊 Weekly Library Insights',
        message: `This week: ${data.totalBorrows} borrows, ${data.activeUsers} active users. Top books gaining popularity!`,
        priority: 'low',
        actionUrl: '/reports'
      });
    }
  }

  // Generate new book alert
  generateNewBookAlert(userId: string, newBooks: any[]): AINotification {
    const titles = newBooks.slice(0, 3).map(b => b.title).join(', ');
    
    return this.createNotification({
      userId,
      type: 'alert',
      title: '🎉 New Books Available!',
      message: `Check out our latest additions: ${titles}${newBooks.length > 3 ? ` and ${newBooks.length - 3} more` : ''}.`,
      priority: 'low',
      actionUrl: '/books'
    });
  }

  // Generate AI system notification
  generateSystemNotification(userId: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium'): AINotification {
    return this.createNotification({
      userId,
      type: 'system',
      title: '🤖 Jose',
      message,
      priority
    });
  }

  // Create notification helper
  private createNotification(data: Omit<AINotification, 'id' | 'timestamp' | 'read'>): AINotification {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      ...data
    };
  }

  // Save notification to storage
  saveNotification(notification: AINotification): void {
    try {
      // Respect opt-out of logging
      if (localStorage.getItem('jrmsu_ai_opt_out') === 'true') return;
      const notifications = this.getAllNotifications();
      notifications.push(notification);
      // Keep only last 50 notifications per user
      const userNotifs = notifications.filter(n => n.userId === notification.userId);
      const otherNotifs = notifications.filter(n => n.userId !== notification.userId);
      const trimmedUserNotifs = userNotifs.slice(-50);
      
      localStorage.setItem(AI_NOTIFICATIONS_KEY, JSON.stringify([...otherNotifs, ...trimmedUserNotifs]));
    } catch (error) {
      console.error('Failed to save notification:', error);
    }
  }

  // Get all notifications
  getAllNotifications(userId?: string): AINotification[] {
    try {
      const raw = localStorage.getItem(AI_NOTIFICATIONS_KEY);
      if (!raw) return [];
      const notifications = JSON.parse(raw) as AINotification[];
      
      if (userId) {
        return notifications.filter(n => n.userId === userId || n.userId === 'all');
      }
      
      return notifications;
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }
  }

  // Get unread notifications
  getUnreadNotifications(userId: string): AINotification[] {
    return this.getAllNotifications(userId).filter(n => !n.read);
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    try {
      const notifications = this.getAllNotifications();
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem(AI_NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // Mark all as read
  markAllAsRead(userId: string): void {
    try {
      const notifications = this.getAllNotifications();
      const updated = notifications.map(n =>
        n.userId === userId ? { ...n, read: true } : n
      );
      localStorage.setItem(AI_NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    try {
      const notifications = this.getAllNotifications();
      const filtered = notifications.filter(n => n.id !== notificationId);
      localStorage.setItem(AI_NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  // Clear all notifications for a user
  clearAll(userId: string): void {
    try {
      const notifications = this.getAllNotifications();
      const filtered = notifications.filter(n => n.userId !== userId);
      localStorage.setItem(AI_NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  // Schedule periodic notifications (for demo purposes)
  schedulePeriodicChecks(userId: string): void {
    // Check for overdue books every hour (in real app, this would be backend)
    setInterval(() => {
      // This would call actual API to check overdue books
      console.log(`Checking for overdue books for user ${userId}`);
    }, 3600000); // 1 hour
  }
}

// Export singleton instance
export const aiNotificationService = new AINotificationService();
