"""
Book Borrowing and Return Endpoints
Handles complete borrowing workflow with validation, due date calculation, and status tracking
"""

from flask import Blueprint, request, jsonify
from db import get_db_cursor, execute_query
from datetime import datetime, timedelta
import uuid

# NOTE: This module targets an older/alternate schema (books.book_id, borrow_records.student_id, etc.)
# The main system uses DB-backed endpoints in library_endpoints.py under /api/library.
# To avoid route conflicts (which caused /api/library/borrow-book to hit the wrong handler and 404 for new books),
# expose these legacy endpoints under a different prefix.
borrowing_bp = Blueprint('borrowing', __name__, url_prefix='/api/library-legacy')

# ============================================================================
# BOOK BORROWING ENDPOINT WITH FULL VALIDATION
# ============================================================================

@borrowing_bp.route('/borrow-book', methods=['POST'])
def borrow_book():
    """
    Process book borrowing with complete validation.
    
    Validates:
    - User has valid ID and exists
    - Book exists and has available copies
    - User doesn't already have this book borrowed (not returned)
    - Sets due date to 14 days from today
    - Updates book status to 'borrowed'
    - Creates borrow_records entry
    - Updates copy count
    
    Expected payload:
    {
        "userId": "KC-23-A-00243",
        "bookId": "BOOK-001",
        "sessionId": "optional-session-id"
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('userId')
        book_id = data.get('bookId')
        
        # Validate input
        if not user_id or not book_id:
            return jsonify({'error': 'Missing userId or bookId'}), 400
        
        with get_db_cursor() as cursor:
            # 1. Verify user exists (student or admin)
            cursor.execute('''
                SELECT student_id FROM students WHERE student_id = %s
                UNION ALL
                SELECT admin_id FROM admins WHERE admin_id = %s OR id = %s
            ''', (user_id, user_id, user_id))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # 2. Verify book exists
            cursor.execute('''
                SELECT book_id, title, copies, available, status
                FROM books WHERE book_id = %s
            ''', (book_id,))
            book = cursor.fetchone()
            
            if not book:
                return jsonify({'error': 'Book not found'}), 404
            
            # 3. Check book has available copies
            available = book.get('available', 0)
            if available <= 0:
                return jsonify({'error': 'No copies available for borrowing'}), 409
            
            # 4. Check user doesn't already have this book borrowed (not returned)
            cursor.execute('''
                SELECT borrow_id FROM borrow_records
                WHERE student_id = %s AND book_id = %s AND status = 'borrowed'
                LIMIT 1
            ''', (user_id, book_id))
            existing_borrow = cursor.fetchone()
            
            if existing_borrow:
                return jsonify({'error': 'User already has this book borrowed'}), 409
            
            # 5. Calculate due date (14 days from today)
            due_date = datetime.now() + timedelta(days=14)
            borrowed_at = datetime.now()
            
            # 6. Create borrow_records entry
            borrow_id = f"BR-{uuid.uuid4().hex[:12].upper()}"
            cursor.execute('''
                INSERT INTO borrow_records
                (borrow_id, student_id, book_id, borrowed_at, due_date, status, overdue_days)
                VALUES (%s, %s, %s, %s, %s, 'borrowed', 0)
            ''', (borrow_id, user_id, book_id, borrowed_at, due_date))
            
            # 7. Update book status to 'borrowed'
            cursor.execute('''
                UPDATE books
                SET status = 'borrowed', available = available - 1
                WHERE book_id = %s
            ''', (book_id,))
        
        print(f"✅ Book {book_id} borrowed by {user_id}, due date: {due_date.date()}")
        return jsonify({
            'message': 'Book borrowed successfully',
            'borrowId': borrow_id,
            'bookId': book_id,
            'dueDate': due_date.isoformat(),
            'borrowedAt': borrowed_at.isoformat()
        }), 201
        
    except Exception as e:
        print(f"❌ Borrow book error: {str(e)}")
        return jsonify({'error': f'Borrowing failed: {str(e)}'}), 500


# ============================================================================
# BOOK RETURN ENDPOINT WITH STATUS UPDATE
# ============================================================================

@borrowing_bp.route('/mark-returned', methods=['POST'])
def mark_book_returned():
    """
    Mark a borrowed book as returned.
    
    Updates:
    - Sets status to 'returned'
    - Records returned_at timestamp
    - Changes book status back to 'available'
    - Calculates overdue days if return is late
    - Updates available copy count
    
    Expected payload:
    {
        "borrowId": "BR-XXXXXXXXXX"
    }
    """
    try:
        data = request.get_json()
        borrow_id = data.get('borrowId')
        
        if not borrow_id:
            return jsonify({'error': 'Missing borrowId'}), 400
        
        with get_db_cursor() as cursor:
            # 1. Get borrow record
            cursor.execute('''
                SELECT borrow_id, student_id, book_id, due_date, borrowed_at, status
                FROM borrow_records WHERE borrow_id = %s
            ''', (borrow_id,))
            borrow = cursor.fetchone()
            
            if not borrow:
                return jsonify({'error': 'Borrow record not found'}), 404
            
            if borrow['status'] == 'returned':
                return jsonify({'error': 'Book already marked as returned'}), 409
            
            # 2. Calculate overdue days if applicable
            now = datetime.now()
            due_date = borrow['due_date']
            overdue_days = 0
            
            if isinstance(due_date, str):
                due_date = datetime.fromisoformat(due_date)
            
            if now > due_date:
                overdue_days = (now - due_date).days
            
            # 3. Update borrow record with return info
            cursor.execute('''
                UPDATE borrow_records
                SET status = 'returned', returned_at = %s, overdue_days = %s
                WHERE borrow_id = %s
            ''', (now, overdue_days, borrow_id))
            
            # 4. Update book status back to 'available' and increment available copies
            cursor.execute('''
                UPDATE books
                SET status = 'available', available = available + 1
                WHERE book_id = %s
            ''', (borrow['book_id'],))
        
        print(f"✅ Book {borrow['book_id']} marked as returned. Overdue days: {overdue_days}")
        return jsonify({
            'message': 'Book marked as returned successfully',
            'borrowId': borrow_id,
            'returnedAt': now.isoformat(),
            'overdueDays': overdue_days
        }), 200
        
    except Exception as e:
        print(f"❌ Mark returned error: {str(e)}")
        return jsonify({'error': f'Return marking failed: {str(e)}'}), 500


# ============================================================================
# BORROW HISTORY ENDPOINTS
# ============================================================================

@borrowing_bp.route('/borrow-history/<student_id>', methods=['GET'])
def get_student_borrow_history(student_id):
    """
    Get borrow history for a specific student.
    Called by student to see their borrowing history.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute('''
                SELECT 
                    br.borrow_id,
                    br.book_id,
                    b.title as book_title,
                    br.student_id,
                    br.borrowed_at,
                    br.due_date,
                    br.returned_at,
                    br.status,
                    br.overdue_days
                FROM borrow_records br
                LEFT JOIN books b ON br.book_id = b.book_id
                WHERE br.student_id = %s
                ORDER BY br.borrowed_at DESC
            ''', (student_id,))
            
            records = cursor.fetchall()
        
        # Format response
        history = []
        for record in records:
            history.append({
                'id': record['borrow_id'],
                'borrowId': record['borrow_id'],
                'bookId': record['book_id'],
                'bookTitle': record['book_title'],
                'studentId': record['student_id'],
                'borrowDate': record['borrowed_at'].isoformat() if record['borrowed_at'] else None,
                'dueDate': record['due_date'].isoformat() if record['due_date'] else None,
                'returnDate': record['returned_at'].isoformat() if record['returned_at'] else None,
                'status': record['status'],
                'overduedays': record['overdue_days']
            })
        
        return jsonify({
            'success': True,
            'history': history,
            'count': len(history)
        }), 200
        
    except Exception as e:
        print(f"❌ Get student history error: {str(e)}")
        return jsonify({'error': f'Failed to load history: {str(e)}'}), 500


@borrowing_bp.route('/borrow-history', methods=['GET'])
def get_all_borrow_history():
    """
    Get ALL borrow history (for admin).
    Called by admin to manage library borrowings.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute('''
                SELECT 
                    br.borrow_id,
                    br.book_id,
                    b.title as book_title,
                    br.student_id,
                    s.first_name,
                    s.last_name,
                    br.borrowed_at,
                    br.due_date,
                    br.returned_at,
                    br.status,
                    br.overdue_days
                FROM borrow_records br
                LEFT JOIN books b ON br.book_id = b.book_id
                LEFT JOIN students s ON br.student_id = s.student_id
                ORDER BY br.borrowed_at DESC
            ''')
            
            records = cursor.fetchall()
        
        # Format response
        history = []
        for record in records:
            history.append({
                'id': record['borrow_id'],
                'borrowId': record['borrow_id'],
                'bookId': record['book_id'],
                'bookTitle': record['book_title'],
                'studentId': record['student_id'],
                'studentName': f"{record['first_name']} {record['last_name']}" if record['first_name'] else record['student_id'],
                'borrowDate': record['borrowed_at'].isoformat() if record['borrowed_at'] else None,
                'dueDate': record['due_date'].isoformat() if record['due_date'] else None,
                'returnDate': record['returned_at'].isoformat() if record['returned_at'] else None,
                'status': record['status'],
                'overduedays': record['overdue_days']
            })
        
        return jsonify({
            'success': True,
            'history': history,
            'count': len(history)
        }), 200
        
    except Exception as e:
        print(f"❌ Get all history error: {str(e)}")
        return jsonify({'error': f'Failed to load history: {str(e)}'}), 500


# ============================================================================
# BORROWED BOOKS SUMMARY (for dashboard)
# ============================================================================

@borrowing_bp.route('/borrowed-all', methods=['GET'])
def get_all_borrowed_books():
    """
    Get all currently borrowed books (status = 'borrowed').
    Used for book management and dashboard statistics.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute('''
                SELECT 
                    br.borrow_id,
                    br.book_id,
                    b.title,
                    br.student_id,
                    br.due_date,
                    br.overdue_days,
                    br.status
                FROM borrow_records br
                LEFT JOIN books b ON br.book_id = b.book_id
                WHERE br.status = 'borrowed'
                ORDER BY br.due_date ASC
            ''')
            
            records = cursor.fetchall()
        
        borrowed = []
        for record in records:
            borrowed.append({
                'borrowId': record['borrow_id'],
                'bookId': record['book_id'],
                'bookTitle': record['title'],
                'studentId': record['student_id'],
                'dueDate': record['due_date'].isoformat() if record['due_date'] else None,
                'overduedays': record['overdue_days'],
                'status': record['status']
            })
        
        return jsonify({
            'success': True,
            'borrowed': borrowed,
            'count': len(borrowed)
        }), 200
        
    except Exception as e:
        print(f"❌ Get borrowed all error: {str(e)}")
        return jsonify({'error': f'Failed to load borrowed books: {str(e)}'}), 500


# ============================================================================
# OVERDUE DETECTION
# ============================================================================

@borrowing_bp.route('/overdue-books', methods=['GET'])
def get_overdue_books():
    """
    Get all overdue books (due_date < today and status = 'borrowed').
    Used for notifications and admin alerts.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute('''
                SELECT 
                    br.borrow_id,
                    br.book_id,
                    b.title,
                    br.student_id,
                    s.email,
                    br.due_date,
                    DATEDIFF(NOW(), br.due_date) as days_overdue,
                    br.status
                FROM borrow_records br
                LEFT JOIN books b ON br.book_id = b.book_id
                LEFT JOIN students s ON br.student_id = s.student_id
                WHERE br.status = 'borrowed' AND br.due_date < NOW()
                ORDER BY br.due_date ASC
            ''')
            
            records = cursor.fetchall()
        
        overdue = []
        for record in records:
            overdue.append({
                'borrowId': record['borrow_id'],
                'bookId': record['book_id'],
                'bookTitle': record['title'],
                'studentId': record['student_id'],
                'studentEmail': record['email'],
                'dueDate': record['due_date'].isoformat() if record['due_date'] else None,
                'daysOverdue': record['days_overdue'],
                'status': record['status']
            })
        
        return jsonify({
            'success': True,
            'overdue': overdue,
            'count': len(overdue)
        }), 200
        
    except Exception as e:
        print(f"❌ Get overdue books error: {str(e)}")
        return jsonify({'error': f'Failed to load overdue books: {str(e)}'}), 500
