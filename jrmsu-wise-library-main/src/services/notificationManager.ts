/**
 * Unified Notification Manager
 * Handles all notifications for Admins and Students with AI-generated unique messages
 */

import { NotificationsService } from './notifications';
import { databaseService } from './database';

// AI Message Templates with variations
const AI_TEMPLATES = {
  // Welcome messages
  welcome: [
    "Welcome to JRMSU Library! Your account {userId} is now active.",
    "Hello! Your library account {userId} has been successfully created.",
    "Great to have you! Account {userId} is ready to use.",
    "Welcome aboard! Your account {userId} is all set."
  ],
  
  // Password reset requests
  passwordResetRequest: [
    "Password reset requested for {userId} at {timestamp}",
    "User {userId} has requested a password reset at {timestamp}",
    "{userId} initiated password recovery at {timestamp}",
    "Password reset request received from {userId} at {timestamp}"
  ],
  
  // Registration success
  studentRegistered: [
    "New student {userId} ({fullName}) registered successfully at {timestamp}",
    "Student account created: {userId} - {fullName} at {timestamp}",
    "Welcome new student {fullName} ({userId}) registered at {timestamp}",
    "{fullName} ({userId}) joined as a student at {timestamp}"
  ],
  
  adminRegistered: [
    "New admin {userId} ({fullName}) registered successfully at {timestamp}",
    "Admin account created: {userId} - {fullName} at {timestamp}",
    "Welcome new administrator {fullName} ({userId}) at {timestamp}",
    "{fullName} ({userId}) joined as an admin at {timestamp}"
  ],
  
  // Password changed
  passwordChangedEmail: [
    "Password successfully changed via email for {userId} ({fullName}) at {timestamp}",
    "{fullName} ({userId}) updated password through email verification at {timestamp}",
    "Password reset completed via email for {userId} at {timestamp}"
  ],
  
  passwordChangedAdmin: [
    "Password reset granted by admin for {userId} ({fullName}) at {timestamp}",
    "Admin approved password reset for {fullName} ({userId}) at {timestamp}",
    "Password successfully reset by administrator for {userId} at {timestamp}"
  ],
  
  passwordChanged2FA: [
    "Password changed via 2FA for {userId} ({fullName}) at {timestamp}",
    "{fullName} ({userId}) updated password using 2FA at {timestamp}",
    "Password reset completed through 2FA verification for {userId} at {timestamp}"
  ],
  
  // Library login/logout
  libraryLoginManual: [
    "{userId} logged into library using manual login at {timestamp}",
    "Library access: {userId} entered via manual authentication at {timestamp}",
    "{userId} successfully logged in manually at {timestamp}"
  ],
  
  libraryLogoutManual: [
    "{userId} logged out from library at {timestamp}",
    "Library session ended for {userId} at {timestamp}",
    "{userId} exited library at {timestamp}"
  ],
  
  libraryLoginQR: [
    "{userId} logged into library using QR code at {timestamp}",
    "QR code scan: {userId} entered library at {timestamp}",
    "{userId} accessed library via QR authentication at {timestamp}"
  ],
  
  libraryLogoutQR: [
    "{userId} logged out from library (QR session) at {timestamp}",
    "QR session ended for {userId} at {timestamp}",
    "{userId} exited library (QR code) at {timestamp}"
  ],
  
  // Book operations
  bookReserved: [
    "{userId} reserved '{bookTitle}' ({bookId}) at {timestamp}",
    "Book reservation: '{bookTitle}' ({bookId}) by {userId} at {timestamp}",
    "{userId} placed a hold on '{bookTitle}' ({bookId}) at {timestamp}"
  ],
  
  bookBorrowed: [
    "{userId} borrowed '{bookTitle}' ({bookId}) at {timestamp}",
    "Book checked out: '{bookTitle}' ({bookId}) by {userId} at {timestamp}",
    "{userId} took out '{bookTitle}' ({bookId}) at {timestamp}"
  ],
  
  bookReturned: [
    "{userId} returned '{bookTitle}' ({bookId}) at {timestamp}",
    "Book returned: '{bookTitle}' ({bookId}) by {userId} at {timestamp}",
    "{userId} checked in '{bookTitle}' ({bookId}) at {timestamp}"
  ],
  
  bookOverdue: [
    "OVERDUE: {userId} has '{bookTitle}' ({bookId}) overdue since {borrowedTime}",
    "Book overdue alert: '{bookTitle}' ({bookId}) - {userId} - borrowed {borrowedTime}",
    "{userId} has overdue book '{bookTitle}' ({bookId}) from {borrowedTime}"
  ]
};

// Get random template
function getRandomTemplate(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

// Replace placeholders
function fillTemplate(template: string, data: Record<string, string>): string {
  let message = template;
  Object.keys(data).forEach(key => {
    message = message.replace(new RegExp(`{${key}}`, 'g'), data[key]);
  });
  return message;
}

// Generate timestamp
function getTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export class NotificationManager {
  
  /**
   * Send notification to ALL admins
   */
  private static notifyAllAdmins(message: string, type: 'borrow' | 'return' | 'overdue' | 'system' | 'password_reset_request' = 'system', metadata?: any) {
    const allUsers = databaseService.getAllUsers();
    const admins = allUsers.filter(u => u.role === 'admin' || u.userType === 'admin');
    
    admins.forEach(admin => {
      NotificationsService.add({
        receiverId: admin.id,
        message,
        type: type as any,
        metadata
      });
    });
  }
  
  /**
   * Send notification to specific user
   */
  private static notifyUser(userId: string, message: string, type: 'borrow' | 'return' | 'overdue' | 'system' = 'system') {
    NotificationsService.add({
      receiverId: userId,
      message,
      type: type as any
    });
  }
  
  // ============================================
  // ADMIN NOTIFICATIONS
  // ============================================
  
  /**
   * Welcome new user (Admin sees this)
   */
  static welcomeNewUser(userId: string, userType: 'admin' | 'student') {
    const template = getRandomTemplate(AI_TEMPLATES.welcome);
    const message = fillTemplate(template, { userId, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * Password reset request (Admin sees this)
   */
  static passwordResetRequest(userId: string, fullName: string, email: string) {
    const template = getRandomTemplate(AI_TEMPLATES.passwordResetRequest);
    const message = fillTemplate(template, { userId, fullName, email, timestamp: getTimestamp() });
    
    this.notifyAllAdmins(
      `Password reset request from ${fullName} (${userId})`,
      'password_reset_request',
      {
        requesterId: userId,
        requesterName: fullName,
        requesterEmail: email,
        requestTime: new Date().toISOString()
      }
    );
  }
  
  /**
   * New student registered (Admin sees this)
   */
  static studentRegistered(userId: string, fullName: string) {
    const template = getRandomTemplate(AI_TEMPLATES.studentRegistered);
    const message = fillTemplate(template, { userId, fullName, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * New admin registered (Admin sees this)
   */
  static adminRegistered(userId: string, fullName: string) {
    const template = getRandomTemplate(AI_TEMPLATES.adminRegistered);
    const message = fillTemplate(template, { userId, fullName, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * Password changed via email (Admin sees this)
   */
  static passwordChangedEmail(userId: string, fullName: string, email: string) {
    const template = getRandomTemplate(AI_TEMPLATES.passwordChangedEmail);
    const message = fillTemplate(template, { userId, fullName, email, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * Password changed via admin (Admin sees this)
   */
  static passwordChangedAdmin(userId: string, fullName: string, email: string, granted: boolean) {
    const template = getRandomTemplate(AI_TEMPLATES.passwordChangedAdmin);
    const status = granted ? 'GRANTED' : 'DECLINED';
    const message = fillTemplate(template, { userId, fullName, email, timestamp: getTimestamp() }) + ` - ${status}`;
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * Password changed via 2FA (Admin sees this)
   */
  static passwordChanged2FA(userId: string, fullName: string, email: string) {
    const template = getRandomTemplate(AI_TEMPLATES.passwordChanged2FA);
    const message = fillTemplate(template, { userId, fullName, email, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * Library login manual (Admin sees this)
   */
  static libraryLoginManual(userId: string, userType: 'admin' | 'student') {
    const template = getRandomTemplate(AI_TEMPLATES.libraryLoginManual);
    const message = fillTemplate(template, { userId, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * Library logout manual (Admin sees this)
   */
  static libraryLogoutManual(userId: string, userType: 'admin' | 'student') {
    const template = getRandomTemplate(AI_TEMPLATES.libraryLogoutManual);
    const message = fillTemplate(template, { userId, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * Library login QR (Admin sees this)
   */
  static libraryLoginQR(userId: string, userType: 'admin' | 'student') {
    const template = getRandomTemplate(AI_TEMPLATES.libraryLoginQR);
    const message = fillTemplate(template, { userId, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * Library logout QR (Admin sees this)
   */
  static libraryLogoutQR(userId: string, userType: 'admin' | 'student') {
    const template = getRandomTemplate(AI_TEMPLATES.libraryLogoutQR);
    const message = fillTemplate(template, { userId, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'system');
  }
  
  /**
   * Book reserved (Admin sees this)
   */
  static bookReserved(userId: string, bookId: string, bookTitle: string) {
    const template = getRandomTemplate(AI_TEMPLATES.bookReserved);
    const message = fillTemplate(template, { userId, bookId, bookTitle, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'borrow');
  }
  
  /**
   * Book borrowed (Admin sees this)
   */
  static bookBorrowed(userId: string, bookId: string, bookTitle: string) {
    const template = getRandomTemplate(AI_TEMPLATES.bookBorrowed);
    const message = fillTemplate(template, { userId, bookId, bookTitle, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'borrow');
  }
  
  /**
   * Book returned (Admin sees this)
   */
  static bookReturned(userId: string, bookId: string, bookTitle: string) {
    const template = getRandomTemplate(AI_TEMPLATES.bookReturned);
    const message = fillTemplate(template, { userId, bookId, bookTitle, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'return');
  }
  
  /**
   * Book overdue (Admin sees this)
   */
  static bookOverdue(userId: string, bookId: string, bookTitle: string, borrowedTime: string) {
    const template = getRandomTemplate(AI_TEMPLATES.bookOverdue);
    const message = fillTemplate(template, { userId, bookId, bookTitle, borrowedTime, timestamp: getTimestamp() });
    this.notifyAllAdmins(message, 'overdue');
  }
  
  // ============================================
  // STUDENT NOTIFICATIONS
  // ============================================
  
  /**
   * Welcome message for student
   */
  static welcomeStudent(userId: string) {
    const template = getRandomTemplate(AI_TEMPLATES.welcome);
    const message = fillTemplate(template, { userId, timestamp: getTimestamp() });
    this.notifyUser(userId, message, 'system');
  }
  
  /**
   * Student password changed via email
   */
  static studentPasswordChangedEmail(userId: string, fullName: string, email: string) {
    const message = `You have successfully changed your password via email verification at ${getTimestamp()}`;
    this.notifyUser(userId, message, 'system');
  }
  
  /**
   * Student password changed via admin
   */
  static studentPasswordChangedAdmin(userId: string, fullName: string, email: string, granted: boolean) {
    const status = granted ? 'granted' : 'declined';
    const message = `Your password reset request was ${status} by an administrator at ${getTimestamp()}`;
    this.notifyUser(userId, message, 'system');
  }
  
  /**
   * Student password changed via 2FA
   */
  static studentPasswordChanged2FA(userId: string, fullName: string, email: string) {
    const message = `You have successfully changed your password via 2FA at ${getTimestamp()}`;
    this.notifyUser(userId, message, 'system');
  }
  
  /**
   * Student reserved book
   */
  static studentReservedBook(userId: string, bookId: string, bookTitle: string) {
    const message = `You have reserved '${bookTitle}' (${bookId}) at ${getTimestamp()}`;
    this.notifyUser(userId, message, 'borrow');
  }
  
  /**
   * Student borrowed book
   */
  static studentBorrowedBook(userId: string, bookId: string, bookTitle: string) {
    const message = `You have borrowed '${bookTitle}' (${bookId}) at ${getTimestamp()}`;
    this.notifyUser(userId, message, 'borrow');
  }
  
  /**
   * Student returned book
   */
  static studentReturnedBook(userId: string, bookId: string, bookTitle: string) {
    const message = `You have returned '${bookTitle}' (${bookId}) at ${getTimestamp()}`;
    this.notifyUser(userId, message, 'return');
  }
  
  /**
   * Student book overdue
   */
  static studentBookOverdue(userId: string, bookId: string, bookTitle: string) {
    const message = `Your book '${bookTitle}' (${bookId}) is overdue. Please return it as soon as possible.`;
    this.notifyUser(userId, message, 'overdue');
  }
}
