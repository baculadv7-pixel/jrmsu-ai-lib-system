/**
 * Admin Notification Service
 * Sends notifications to ALL admins when important events occur
 */

import { NotificationsService } from './notifications';
import { databaseService } from './database';

export class AdminNotificationService {
  
  /**
   * Notify all admins about an event
   */
  private static notifyAllAdmins(message: string, type: 'borrow' | 'return' | 'overdue' | 'system' = 'system') {
    // Get all admin users
    const allUsers = databaseService.getAllUsers();
    const admins = allUsers.filter(u => u.role === 'admin');
    
    // Send notification to each admin
    admins.forEach(admin => {
      NotificationsService.add({
        receiverId: admin.id,
        message,
        type
      });
    });
    
    // Also send to generic ADMIN channel
    NotificationsService.add({
      receiverId: 'ADMIN',
      message,
      type
    });
  }

  /**
   * 1. User successfully registered
   */
  static userRegistered(userId: string, userType: 'admin' | 'student', fullName: string) {
    const icon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    const tag = userType === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS';
    this.notifyAllAdmins(
      `${icon} New ${userType} registered: ${fullName} (${userId}) - ${tag}`,
      'system'
    );
  }

  /**
   * 2. User successfully logged in (Manual or QR Code)
   */
  static userLoggedIn(userId: string, fullName: string, method: 'manual' | 'qrcode', userType: 'admin' | 'student') {
    const methodIcon = method === 'manual' ? '🔑' : '📱';
    const typeIcon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    this.notifyAllAdmins(
      `${methodIcon} ${typeIcon} ${fullName} (${userId}) logged in via ${method === 'manual' ? 'password' : 'QR code'}`,
      'system'
    );
  }

  /**
   * 3. User changed password
   */
  static passwordChanged(userId: string, fullName: string, userType: 'admin' | 'student') {
    const icon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    this.notifyAllAdmins(
      `🔒 ${icon} ${fullName} (${userId}) changed their password`,
      'system'
    );
  }

  /**
   * 4. User enabled/disabled 2FA
   */
  static twoFactorToggled(userId: string, fullName: string, enabled: boolean, userType: 'admin' | 'student') {
    const icon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    const status = enabled ? 'enabled' : 'disabled';
    const statusIcon = enabled ? '✅' : '❌';
    this.notifyAllAdmins(
      `${statusIcon} ${icon} ${fullName} (${userId}) ${status} Two-Factor Authentication`,
      'system'
    );
  }

  /**
   * 5. User edited profile information
   */
  static profileUpdated(userId: string, fullName: string, fieldsChanged: string[], userType: 'admin' | 'student') {
    const icon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    const fields = fieldsChanged.join(', ');
    this.notifyAllAdmins(
      `✏️ ${icon} ${fullName} (${userId}) updated profile: ${fields}`,
      'system'
    );
  }

  /**
   * 6. User updated profile picture
   */
  static profilePictureUpdated(userId: string, fullName: string, userType: 'admin' | 'student') {
    const icon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    this.notifyAllAdmins(
      `📸 ${icon} ${fullName} (${userId}) updated their profile picture`,
      'system'
    );
  }

  /**
   * 7. New book added to library
   */
  static bookAdded(bookTitle: string, bookId: string, addedBy: string) {
    this.notifyAllAdmins(
      `📚 New book added: "${bookTitle}" (ID: ${bookId}) by ${addedBy}`,
      'system'
    );
  }

  /**
   * 8. Book borrowed
   */
  static bookBorrowed(bookTitle: string, bookId: string, borrowerId: string, borrowerName: string, dueDate: string, location: 'inside' | 'outside') {
    const locationIcon = location === 'inside' ? '🏛️' : '🏠';
    this.notifyAllAdmins(
      `📖 ${locationIcon} Book borrowed: "${bookTitle}" (${bookId}) by ${borrowerName} (${borrowerId}). Due: ${dueDate}`,
      'borrow'
    );
  }

  /**
   * 9. Book returned
   */
  static bookReturned(bookTitle: string, bookId: string, borrowerId: string, borrowerName: string, onTime: boolean) {
    const statusIcon = onTime ? '✅' : '⚠️';
    const status = onTime ? 'on time' : 'late';
    this.notifyAllAdmins(
      `📗 ${statusIcon} Book returned ${status}: "${bookTitle}" (${bookId}) by ${borrowerName} (${borrowerId})`,
      'return'
    );
  }

  /**
   * 10. Book is overdue
   */
  static bookOverdue(bookTitle: string, bookId: string, borrowerId: string, borrowerName: string, daysOverdue: number) {
    this.notifyAllAdmins(
      `⚠️ OVERDUE: "${bookTitle}" (${bookId}) - ${borrowerName} (${borrowerId}) - ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} late`,
      'overdue'
    );
  }

  /**
   * 11. Multiple books overdue (summary)
   */
  static overdueBooksSummary(count: number) {
    this.notifyAllAdmins(
      `📊 Overdue Summary: ${count} book${count > 1 ? 's are' : ' is'} currently overdue`,
      'overdue'
    );
  }

  /**
   * 12. System event
   */
  static systemEvent(message: string) {
    this.notifyAllAdmins(
      `🔧 SYSTEM: ${message}`,
      'system'
    );
  }

  /**
   * 13. Book due soon (1 day before)
   */
  static bookDueSoon(bookTitle: string, bookId: string, borrowerId: string, borrowerName: string, dueDate: string) {
    this.notifyAllAdmins(
      `⏰ Due Tomorrow: "${bookTitle}" (${bookId}) - ${borrowerName} (${borrowerId}) - Due: ${dueDate}`,
      'system'
    );
  }

  /**
   * 14. Book renewal requested
   */
  static bookRenewalRequested(bookTitle: string, bookId: string, borrowerId: string, borrowerName: string) {
    this.notifyAllAdmins(
      `🔄 Renewal Request: "${bookTitle}" (${bookId}) by ${borrowerName} (${borrowerId})`,
      'system'
    );
  }

  /**
   * 15. Library Entry - Manual Login
   */
  static libraryEntryManual(userId: string, fullName: string, userType: 'admin' | 'student') {
    const icon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    this.notifyAllAdmins(
      `🏛️ ${icon} Library Entry: ${fullName} (${userId}) entered via manual login`,
      'system'
    );
  }

  /**
   * 16. Library Entry - QR Code
   */
  static libraryEntryQR(userId: string, fullName: string, userType: 'admin' | 'student') {
    const icon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    this.notifyAllAdmins(
      `🏛️ 📱 ${icon} Library Entry: ${fullName} (${userId}) entered via QR scan`,
      'system'
    );
  }

  /**
   * 17. Library Exit - Manual Logout
   */
  static libraryExitManual(userId: string, fullName: string, userType: 'admin' | 'student') {
    const icon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    this.notifyAllAdmins(
      `🚪 ${icon} Library Exit: ${fullName} (${userId}) left via manual logout`,
      'system'
    );
  }

  /**
   * 18. Library Exit - QR Code
   */
  static libraryExitQR(userId: string, fullName: string, userType: 'admin' | 'student') {
    const icon = userType === 'admin' ? '👨‍💼' : '👨‍🎓';
    this.notifyAllAdmins(
      `🚪 📱 ${icon} Library Exit: ${fullName} (${userId}) left via QR scan`,
      'system'
    );
  }

  /**
   * 19. Book Reservation Created
   */
  static bookReserved(bookTitle: string, bookId: string, userId: string, userName: string) {
    this.notifyAllAdmins(
      `📌 Book Reserved: "${bookTitle}" (${bookId}) by ${userName} (${userId})`,
      'system'
    );
  }

  /**
   * 20. Book Reservation Cancelled
   */
  static reservationCancelled(bookTitle: string, bookId: string, userId: string, userName: string, reason?: string) {
    const reasonText = reason ? ` - Reason: ${reason}` : '';
    this.notifyAllAdmins(
      `❌ Reservation Cancelled: "${bookTitle}" (${bookId}) by ${userName} (${userId})${reasonText}`,
      'system'
    );
  }

  /**
   * 21. Return Time Activated
   */
  static returnTimeActivated(bookTitle: string, bookId: string, userId: string, userName: string) {
    this.notifyAllAdmins(
      `⏰ Return Time Activated: "${bookTitle}" (${bookId}) by ${userName} (${userId})`,
      'system'
    );
  }
}
