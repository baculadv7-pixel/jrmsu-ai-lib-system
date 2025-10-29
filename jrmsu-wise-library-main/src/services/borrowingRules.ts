/**
 * Borrowing Rules & Overdue Calculation Service
 * 
 * Rules:
 * - OUTSIDE Campus: Can borrow for 1 night (e.g., borrow Monday morning, return Tuesday)
 * - INSIDE Campus: Until afternoon only (e.g., borrow Monday morning, return Monday 4PM)
 * - Overdue: After 7 BUSINESS DAYS (excluding Saturday and Sunday)
 */

export type BorrowLocation = 'inside' | 'outside';

export interface BorrowingPeriod {
  location: BorrowLocation;
  borrowDate: Date;
  dueDate: Date;
  dueDateString: string;
  maxDurationHours: number;
}

export interface OverdueCalculation {
  isOverdue: boolean;
  daysOverdue: number;
  businessDaysOverdue: number;
  dueDate: Date;
  returnDate?: Date;
}

export class BorrowingRulesService {
  
  // Library operating hours
  private static readonly AFTERNOON_RETURN_TIME = 16; // 4:00 PM
  private static readonly MORNING_BORROW_TIME = 8; // 8:00 AM
  
  /**
   * Calculate due date based on location
   * 
   * OUTSIDE Campus: 1 night (borrow today, return tomorrow)
   * INSIDE Campus: Same day until 4PM
   */
  static calculateDueDate(borrowDate: Date, location: BorrowLocation): BorrowingPeriod {
    const due = new Date(borrowDate);
    
    if (location === 'outside') {
      // Outside campus: 1 night - return next day by 4PM
      due.setDate(due.getDate() + 1);
      due.setHours(this.AFTERNOON_RETURN_TIME, 0, 0, 0);
      
      return {
        location,
        borrowDate,
        dueDate: due,
        dueDateString: this.formatDueDate(due),
        maxDurationHours: 24 + (this.AFTERNOON_RETURN_TIME - this.MORNING_BORROW_TIME)
      };
    } else {
      // Inside campus: Same day until 4PM
      due.setHours(this.AFTERNOON_RETURN_TIME, 0, 0, 0);
      
      // If borrowed after 4PM, allow until next day 4PM
      if (borrowDate.getHours() >= this.AFTERNOON_RETURN_TIME) {
        due.setDate(due.getDate() + 1);
      }
      
      return {
        location,
        borrowDate,
        dueDate: due,
        dueDateString: this.formatDueDate(due),
        maxDurationHours: this.AFTERNOON_RETURN_TIME - this.MORNING_BORROW_TIME
      };
    }
  }

  /**
   * Check if book is overdue
   * Overdue = 7 BUSINESS DAYS past due date (excluding weekends)
   */
  static checkOverdue(dueDate: Date, returnDate?: Date): OverdueCalculation {
    const checkDate = returnDate || new Date();
    const businessDaysOverdue = this.calculateBusinessDays(dueDate, checkDate);
    const calendarDaysOverdue = this.calculateCalendarDays(dueDate, checkDate);
    
    const isOverdue = businessDaysOverdue > 7;
    
    return {
      isOverdue,
      daysOverdue: calendarDaysOverdue,
      businessDaysOverdue,
      dueDate,
      returnDate
    };
  }

  /**
   * Calculate business days between two dates (excluding Saturday and Sunday)
   */
  static calculateBusinessDays(startDate: Date, endDate: Date): number {
    if (endDate <= startDate) return 0;
    
    let count = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  /**
   * Calculate calendar days between two dates
   */
  static calculateCalendarDays(startDate: Date, endDate: Date): number {
    if (endDate <= startDate) return 0;
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get overdue status message
   */
  static getOverdueMessage(overdue: OverdueCalculation): string {
    if (!overdue.isOverdue) {
      const remaining = 7 - overdue.businessDaysOverdue;
      if (remaining <= 2) {
        return `Due soon: ${remaining} business day${remaining > 1 ? 's' : ''} remaining`;
      }
      return `${remaining} business days remaining`;
    }
    
    const daysOver = overdue.businessDaysOverdue - 7;
    return `OVERDUE: ${daysOver} business day${daysOver > 1 ? 's' : ''} late`;
  }

  /**
   * Calculate fine/penalty (if applicable)
   * Example: ₱10 per business day overdue after 7 days
   */
  static calculateFine(overdue: OverdueCalculation, finePerDay: number = 10): number {
    if (!overdue.isOverdue) return 0;
    
    const daysOver = overdue.businessDaysOverdue - 7;
    return daysOver * finePerDay;
  }

  /**
   * Check if book is due soon (within 1 business day)
   */
  static isDueSoon(dueDate: Date): boolean {
    const now = new Date();
    const businessDaysUntilDue = this.calculateBusinessDays(now, dueDate);
    return businessDaysUntilDue <= 1 && businessDaysUntilDue >= 0;
  }

  /**
   * Format due date for display
   */
  private static formatDueDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-PH', options);
  }

  /**
   * Get borrowing rules description
   */
  static getBorrowingRules(): {
    inside: string;
    outside: string;
    overdue: string;
  } {
    return {
      inside: `Inside Campus: Borrow in the morning, return by ${this.AFTERNOON_RETURN_TIME}:00 (4PM) same day`,
      outside: `Outside Campus: Can borrow for 1 night (e.g., borrow Monday, return Tuesday by 4PM)`,
      overdue: `Overdue: After 7 BUSINESS DAYS (excluding Saturday & Sunday). Late fees may apply.`
    };
  }

  /**
   * Validate borrowing eligibility
   */
  static canBorrow(userId: string, currentBorrowCount: number, maxBorrows: number = 3): {
    eligible: boolean;
    reason?: string;
  } {
    if (currentBorrowCount >= maxBorrows) {
      return {
        eligible: false,
        reason: `Maximum borrowing limit reached (${maxBorrows} books)`
      };
    }
    
    return { eligible: true };
  }

  /**
   * Get next available return time for inside campus
   */
  static getNextReturnTime(location: BorrowLocation): Date {
    const now = new Date();
    const returnTime = new Date(now);
    
    if (location === 'inside') {
      // Same day 4PM or next day 4PM
      returnTime.setHours(this.AFTERNOON_RETURN_TIME, 0, 0, 0);
      if (now.getHours() >= this.AFTERNOON_RETURN_TIME) {
        returnTime.setDate(returnTime.getDate() + 1);
      }
    } else {
      // Next day 4PM
      returnTime.setDate(returnTime.getDate() + 1);
      returnTime.setHours(this.AFTERNOON_RETURN_TIME, 0, 0, 0);
    }
    
    return returnTime;
  }

  /**
   * Example usage and test cases
   */
  static runTestCases(): void {
    console.log('=== Borrowing Rules Test Cases ===\n');
    
    // Test 1: Inside campus borrowing
    const insideBorrow = new Date('2025-01-27T10:00:00'); // Monday 10 AM
    const insideRules = this.calculateDueDate(insideBorrow, 'inside');
    console.log('Test 1 - Inside Campus:');
    console.log(`Borrow: ${insideBorrow.toLocaleString()}`);
    console.log(`Due: ${insideRules.dueDateString}`);
    console.log(`Duration: ${insideRules.maxDurationHours} hours\n`);
    
    // Test 2: Outside campus borrowing
    const outsideBorrow = new Date('2025-01-27T09:00:00'); // Monday 9 AM
    const outsideRules = this.calculateDueDate(outsideBorrow, 'outside');
    console.log('Test 2 - Outside Campus:');
    console.log(`Borrow: ${outsideBorrow.toLocaleString()}`);
    console.log(`Due: ${outsideRules.dueDateString}`);
    console.log(`Duration: ${outsideRules.maxDurationHours} hours\n`);
    
    // Test 3: Overdue calculation (7 business days)
    const dueDate = new Date('2025-01-20T16:00:00'); // Monday 4 PM
    const returnDate = new Date('2025-01-31T10:00:00'); // Friday (11 days later)
    const overdue = this.checkOverdue(dueDate, returnDate);
    console.log('Test 3 - Overdue Calculation:');
    console.log(`Due: ${dueDate.toLocaleString()}`);
    console.log(`Returned: ${returnDate.toLocaleString()}`);
    console.log(`Calendar Days: ${overdue.daysOverdue}`);
    console.log(`Business Days: ${overdue.businessDaysOverdue}`);
    console.log(`Is Overdue: ${overdue.isOverdue}`);
    console.log(`Message: ${this.getOverdueMessage(overdue)}`);
    console.log(`Fine: ₱${this.calculateFine(overdue)}\n`);
  }
}

// Export instance for convenience
export const borrowingRules = BorrowingRulesService;
