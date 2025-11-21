// Overdue Notifications Service
// Handles Email, SMS, and Push notifications for overdue books

import { pythonApi } from './pythonApi';

export interface OverdueBook {
  bookId: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  daysOverdue: number;
  userId: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsReminders: boolean;
  pushNotifications: boolean;
}

class OverdueNotificationService {
  
  // Get user's notification preferences
  getUserPreferences(userId: string): NotificationPreferences {
    return {
      emailNotifications: localStorage.getItem(`notification_email_${userId}`) === 'true',
      smsReminders: localStorage.getItem(`notification_sms_${userId}`) === 'true',
      pushNotifications: localStorage.getItem(`notification_push_${userId}`) === 'true'
    };
  }

  // Convenience helper: fetch borrowed books for a user and trigger all enabled channels.
  // This uses the existing backend /api/borrows endpoint plus the per-channel email/SMS/push
  // endpoints defined in the Python backend.
  async checkAndNotifyUserById(userId: string): Promise<void> {
    try {
      const borrowedBooks = await this.getUserBorrowedBooks(userId);
      await this.checkAndNotifyUser(userId, borrowedBooks);
    } catch (error) {
      console.error('Failed to run overdue notification check for user', userId, error);
    }
  }

  // Check if book is overdue
  isOverdue(dueDate: string): boolean {
    const due = new Date(dueDate);
    const now = new Date();
    return now > due;
  }

  // Calculate days overdue
  getDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = now.getTime() - due.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Send email notification
  async sendEmailNotification(userId: string, overdueBooks: OverdueBook[]): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/email/overdue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          overdueBooks
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  // Send SMS notification
  async sendSmsNotification(userId: string, overdueBooks: OverdueBook[]): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/sms/overdue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          overdueBooks
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      return false;
    }
  }

  // Send push notification
  async sendPushNotification(userId: string, overdueBooks: OverdueBook[]): Promise<boolean> {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support push notifications');
      return false;
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      console.warn('Push notification permission not granted');
      return false;
    }

    try {
      // Create notification for each overdue book
      for (const book of overdueBooks) {
        const notification = new Notification('Overdue Book Alert', {
          body: `"${book.bookTitle}" is ${book.daysOverdue} day(s) overdue. Please return it soon.`,
          icon: '/jrmsu-logo.png',
          badge: '/jrmsu-logo.png',
          tag: `overdue-${book.bookId}`,
          requireInteraction: true,
          data: {
            bookId: book.bookId,
            userId: userId
          }
        });

        notification.onclick = () => {
          window.focus();
          window.location.href = '/history';
          notification.close();
        };
      }

      // Also send to backend for mobile devices
      await fetch('http://localhost:5000/api/notifications/push/overdue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          overdueBooks
        })
      });

      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  // Main function to send overdue notifications
  async notifyOverdueBooks(userId: string, overdueBooks: OverdueBook[]): Promise<void> {
    if (overdueBooks.length === 0) {
      return;
    }

    const preferences = this.getUserPreferences(userId);

    // Send email notification
    if (preferences.emailNotifications) {
      await this.sendEmailNotification(userId, overdueBooks);
      console.log(`📧 Email notification sent to user ${userId} for ${overdueBooks.length} overdue book(s)`);
    }

    // Send SMS notification
    if (preferences.smsReminders) {
      await this.sendSmsNotification(userId, overdueBooks);
      console.log(`📱 SMS notification sent to user ${userId} for ${overdueBooks.length} overdue book(s)`);
    }

    // Send push notification
    if (preferences.pushNotifications) {
      await this.sendPushNotification(userId, overdueBooks);
      console.log(`🔔 Push notification sent to user ${userId} for ${overdueBooks.length} overdue book(s)`);
    }
  }

  // Check all borrowed books for a user and send notifications if needed
  async checkAndNotifyUser(userId: string, borrowedBooks: any[]): Promise<void> {
    const overdueBooks: OverdueBook[] = [];

    for (const book of borrowedBooks) {
      if (this.isOverdue(book.dueDate)) {
        overdueBooks.push({
          bookId: book.bookId,
          bookTitle: book.bookTitle,
          borrowDate: book.borrowDate,
          dueDate: book.dueDate,
          daysOverdue: this.getDaysOverdue(book.dueDate),
          userId: userId
        });
      }
    }

    if (overdueBooks.length > 0) {
      await this.notifyOverdueBooks(userId, overdueBooks);
    }
  }

  // Schedule daily check (call this on app initialization)
  startDailyCheck(): void {
    // Check immediately
    this.checkAllUsers();

    // Then check every 24 hours
    setInterval(() => {
      this.checkAllUsers();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  // Check all users for overdue books
  private async checkAllUsers(): Promise<void> {
    try {
      // Get all users from localStorage
      const usersData = localStorage.getItem('jrmsu_users_db');
      if (!usersData) return;

      const users = JSON.parse(usersData);

      for (const user of users) {
        // Get borrowed books for this user
        const borrowedBooks = await this.getUserBorrowedBooks(user.id);
        await this.checkAndNotifyUser(user.id, borrowedBooks);
      }
    } catch (error) {
      console.error('Failed to check all users for overdue books:', error);
    }
  }

  // Get borrowed books for a user
  private async getUserBorrowedBooks(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`http://localhost:5000/api/borrows?userId=${userId}&status=borrowed`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.borrows || [];
    } catch (error) {
      console.error('Failed to get borrowed books:', error);
      return [];
    }
  }
}

// Export singleton instance
export const overdueNotificationService = new OverdueNotificationService();
