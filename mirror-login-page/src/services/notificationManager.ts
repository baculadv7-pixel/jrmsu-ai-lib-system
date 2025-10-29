/**
 * Notification Manager for Mirror Page
 * Sends notifications to backend API which will notify all admins
 */

const API_BASE = 'http://localhost:5000';

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

// Send notification to backend
async function sendToBackend(type: string, data: any) {
  try {
    await fetch(`${API_BASE}/api/notifications/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, timestamp: getTimestamp() })
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

export class NotificationManager {
  
  /**
   * Library login via manual authentication
   */
  static async libraryLoginManual(userId: string, fullName: string, userType: 'admin' | 'student') {
    await sendToBackend('library_login_manual', {
      userId,
      fullName,
      userType,
      method: 'manual'
    });
  }
  
  /**
   * Library logout via manual authentication
   */
  static async libraryLogoutManual(userId: string, fullName: string, userType: 'admin' | 'student') {
    await sendToBackend('library_logout_manual', {
      userId,
      fullName,
      userType,
      method: 'manual'
    });
  }
  
  /**
   * Library login via QR code
   */
  static async libraryLoginQR(userId: string, fullName: string, userType: 'admin' | 'student') {
    await sendToBackend('library_login_qr', {
      userId,
      fullName,
      userType,
      method: 'qr'
    });
  }
  
  /**
   * Library logout via QR code
   */
  static async libraryLogoutQR(userId: string, fullName: string, userType: 'admin' | 'student') {
    await sendToBackend('library_logout_qr', {
      userId,
      fullName,
      userType,
      method: 'qr'
    });
  }
  
  /**
   * Book reserved
   */
  static async bookReserved(userId: string, fullName: string, bookId: string, bookTitle: string) {
    await sendToBackend('book_reserved', {
      userId,
      fullName,
      bookId,
      bookTitle
    });
  }
  
  /**
   * Book borrowed/scanned
   */
  static async bookBorrowed(userId: string, fullName: string, bookId: string, bookTitle: string) {
    await sendToBackend('book_borrowed', {
      userId,
      fullName,
      bookId,
      bookTitle
    });
  }
  
  /**
   * Book returned
   */
  static async bookReturned(userId: string, fullName: string, bookId: string, bookTitle: string) {
    await sendToBackend('book_returned', {
      userId,
      fullName,
      bookId,
      bookTitle
    });
  }
  
  /**
   * Book overdue
   */
  static async bookOverdue(userId: string, fullName: string, bookId: string, bookTitle: string, borrowedTime: string) {
    await sendToBackend('book_overdue', {
      userId,
      fullName,
      bookId,
      bookTitle,
      borrowedTime
    });
  }
  
  /**
   * Reservation cancelled
   */
  static async reservationCancelled(userId: string, fullName: string, bookId: string, bookTitle: string) {
    await sendToBackend('reservation_cancelled', {
      userId,
      fullName,
      bookId,
      bookTitle
    });
  }
  
  /**
   * Return time activated
   */
  static async returnTimeActivated(userId: string, fullName: string, bookId: string, bookTitle: string) {
    await sendToBackend('return_time_activated', {
      userId,
      fullName,
      bookId,
      bookTitle
    });
  }
}
