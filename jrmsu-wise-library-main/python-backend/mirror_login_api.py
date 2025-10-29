"""
Mirror Login API - Library Entry/Exit System Backend
Handles all library entry/exit workflows, book borrowing/returning, and notifications
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import os
from typing import Dict, List, Optional

# Create Blueprint
mirror_api = Blueprint('mirror_api', __name__, url_prefix='/api')

# In-memory storage for library sessions (use database in production)
LIBRARY_SESSIONS = {}  # user_id -> session_data
RESERVED_BOOKS = {}  # user_id -> [book_ids]
BORROWED_BOOKS = {}  # user_id -> [borrow_records]
LIBRARY_ACCESS_LOG = []  # List of entry/exit records

# ==================== HELPER FUNCTIONS ====================

def get_current_time():
    return datetime.now().isoformat()

def notify_all_admins(message: str, notification_type: str = 'system'):
    """Send notification to all admin users"""
    from adminNotifications import AdminNotificationService
    # This will be integrated with your existing notification system
    print(f"[ADMIN NOTIFICATION] {notification_type.upper()}: {message}")
    # TODO: Integrate with your NotificationsService
    pass

def notify_user(user_id: str, message: str, notification_type: str = 'system'):
    """Send notification to specific user"""
    print(f"[USER NOTIFICATION] {user_id}: {message}")
    # TODO: Integrate with your NotificationsService
    pass

def generate_ai_warning(user_name: str, forgot_logout: bool = False):
    """Generate dynamic warning message using AI Jose"""
    if forgot_logout:
        templates = [
            f"Hi {user_name}, it looks like you forgot to log out at 5:00 PM. Please remember to log out before leaving the library next time!",
            f"Hello {user_name}, we noticed you didn't log out before the library closed. Don't forget to log out next time!",
            f"Dear {user_name}, you may have forgotten to log out earlier. Please ensure you log out when leaving the library. Thank you!",
            f"{user_name}, friendly reminder: You didn't log out at closing time. Please remember for next visit!",
            f"Hi there {user_name}! Looks like logging out slipped your mind. No worries, but please remember next time!"
        ]
        import random
        return random.choice(templates)
    return f"Hello {user_name}, please remember to follow library protocols."

# ==================== LIBRARY ACCESS ENDPOINTS ====================

@mirror_api.route('/library/access', methods=['POST'])
def record_library_access():
    """Record user entry or exit from library"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        action = data.get('action')  # 'entry' or 'exit'
        method = data.get('method')  # 'manual' or 'qrcode'
        timestamp = data.get('timestamp', get_current_time())
        
        if not user_id or not action:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get user info (integrate with your user service)
        user = get_user_info(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create access record
        access_record = {
            'userId': user_id,
            'userName': user['fullName'],
            'userType': user['role'],
            'action': action,
            'method': method,
            'timestamp': timestamp
        }
        
        LIBRARY_ACCESS_LOG.append(access_record)
        
        # Update session
        if action == 'entry':
            LIBRARY_SESSIONS[user_id] = {
                'entryTime': timestamp,
                'isInLibrary': True,
                'entryMethod': method
            }
            is_entry = True
            
            # Notify admins of entry
            notify_all_admins(
                f"{'👨‍💼' if user['role'] == 'admin' else '👨‍🎓'} {user['fullName']} ({user_id}) entered library via {method}",
                'system'
            )
            
        else:  # exit
            if user_id in LIBRARY_SESSIONS:
                LIBRARY_SESSIONS[user_id]['exitTime'] = timestamp
                LIBRARY_SESSIONS[user_id]['isInLibrary'] = False
                
            is_entry = False
            
            # Notify admins of exit
            notify_all_admins(
                f"{'👨‍💼' if user['role'] == 'admin' else '👨‍🎓'} {user['fullName']} ({user_id}) exited library",
                'system'
            )
        
        return jsonify({
            'success': True,
            'isEntry': is_entry,
            'timestamp': timestamp
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== RESERVED BOOKS ENDPOINTS ====================

@mirror_api.route('/books/reserved/<user_id>', methods=['GET'])
def get_reserved_books(user_id):
    """Check if user has reserved books"""
    try:
        reserved = RESERVED_BOOKS.get(user_id, [])
        has_reserved = len(reserved) > 0
        
        # Get book details (integrate with your book service)
        books = []
        for book_id in reserved:
            book_info = get_book_info(book_id)
            if book_info:
                books.append(book_info)
        
        return jsonify({
            'hasReservedBooks': has_reserved,
            'books': books,
            'count': len(books)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== BOOK BORROWING ENDPOINTS ====================

@mirror_api.route('/books/borrow', methods=['POST'])
def borrow_book():
    """Process book borrowing with QR scan"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        book_id = data.get('bookId')
        borrow_location = data.get('borrowLocation', 'inside')  # 'inside' or 'outside'
        is_mirror_borrow = data.get('isMirrorBorrow', True)
        
        if not user_id or not book_id:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get user and book info
        user = get_user_info(user_id)
        book = get_book_info(book_id)
        
        if not user or not book:
            return jsonify({'error': 'User or book not found'}), 404
        
        # Calculate due date using borrowing rules
        from borrowingRules import BorrowingRulesService
        borrowing = BorrowingRulesService.calculateDueDate(
            datetime.now(),
            borrow_location
        )
        
        # Create borrow record
        borrow_record = {
            'borrowId': f"BR-{int(datetime.now().timestamp())}",
            'userId': user_id,
            'userName': user['fullName'],
            'bookId': book_id,
            'bookTitle': book['title'],
            'borrowDate': borrowing['borrowDate'].isoformat(),
            'dueDate': borrowing['dueDate'].isoformat(),
            'dueDateString': borrowing['dueDateString'],
            'location': borrow_location,
            'status': 'active',
            'isMirrorBorrow': is_mirror_borrow
        }
        
        # Save borrow record
        if user_id not in BORROWED_BOOKS:
            BORROWED_BOOKS[user_id] = []
        BORROWED_BOOKS[user_id].append(borrow_record)
        
        # Remove from reserved if it was reserved
        if user_id in RESERVED_BOOKS and book_id in RESERVED_BOOKS[user_id]:
            RESERVED_BOOKS[user_id].remove(book_id)
        
        # Notify all admins
        notify_all_admins(
            f"📖 {'🏛️' if borrow_location == 'inside' else '🏠'} Book borrowed: \"{book['title']}\" ({book_id}) by {user['fullName']} ({user_id}). Due: {borrowing['dueDateString']}",
            'borrow'
        )
        
        # Notify user
        notify_user(
            user_id,
            f"You have successfully borrowed \"{book['title']}\". Due date: {borrowing['dueDateString']}",
            'borrow'
        )
        
        return jsonify({
            'success': True,
            'borrowId': borrow_record['borrowId'],
            'bookTitle': book['title'],
            'dueDate': borrowing['dueDateString'],
            'location': borrow_location
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mirror_api.route('/books/activate-return-time', methods=['POST'])
def activate_return_time():
    """Activate return time tracking when user scans book at logout"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        book_id = data.get('bookId')
        
        if not user_id or not book_id:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Find the borrow record
        if user_id in BORROWED_BOOKS:
            for record in BORROWED_BOOKS[user_id]:
                if record['bookId'] == book_id and record['status'] == 'active':
                    record['returnTimeActivated'] = True
                    record['activatedAt'] = get_current_time()
                    
                    user = get_user_info(user_id)
                    book = get_book_info(book_id)
                    
                    # Notify admins
                    notify_all_admins(
                        f"⏰ Return time activated: \"{book['title']}\" ({book_id}) - {user['fullName']} ({user_id})",
                        'system'
                    )
                    
                    return jsonify({
                        'success': True,
                        'message': 'Return time activated successfully'
                    })
        
        return jsonify({'error': 'Active borrow record not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== BOOK RETURN ENDPOINTS ====================

@mirror_api.route('/books/borrowed/<user_id>', methods=['GET'])
def get_borrowed_books(user_id):
    """Get user's currently borrowed books"""
    try:
        borrowed = BORROWED_BOOKS.get(user_id, [])
        active_borrows = [b for b in borrowed if b['status'] == 'active']
        
        has_borrowed = len(active_borrows) > 0
        
        return jsonify({
            'hasBorrowedBooks': has_borrowed,
            'books': active_borrows,
            'count': len(active_borrows)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mirror_api.route('/books/return', methods=['POST'])
def return_book():
    """Process book return with QR scan"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        book_id = data.get('bookId')
        return_location = data.get('returnLocation', 'inside')
        
        if not user_id or not book_id:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get user and book info
        user = get_user_info(user_id)
        book = get_book_info(book_id)
        
        if not user or not book:
            return jsonify({'error': 'User or book not found'}), 404
        
        # Find the borrow record
        if user_id not in BORROWED_BOOKS:
            return jsonify({'error': 'No borrow records found'}), 404
        
        borrow_record = None
        for record in BORROWED_BOOKS[user_id]:
            if record['bookId'] == book_id and record['status'] == 'active':
                borrow_record = record
                break
        
        if not borrow_record:
            return jsonify({'error': 'Active borrow record not found'}), 404
        
        # Check if returned on time
        from borrowingRules import BorrowingRulesService
        due_date = datetime.fromisoformat(borrow_record['dueDate'])
        return_date = datetime.now()
        
        overdue_check = BorrowingRulesService.checkOverdue(due_date, return_date)
        on_time = not overdue_check['isOverdue']
        
        # Update borrow record
        borrow_record['status'] = 'returned'
        borrow_record['returnDate'] = return_date.isoformat()
        borrow_record['returnLocation'] = return_location
        borrow_record['onTime'] = on_time
        borrow_record['daysOverdue'] = overdue_check['businessDaysOverdue'] - 7 if overdue_check['isOverdue'] else 0
        
        # Calculate fine if overdue
        if overdue_check['isOverdue']:
            fine = BorrowingRulesService.calculateFine(overdue_check)
            borrow_record['fine'] = fine
        
        # Notify all admins
        status_icon = '✅' if on_time else '⚠️'
        status_text = 'on time' if on_time else f"late ({borrow_record['daysOverdue']} business days)"
        
        notify_all_admins(
            f"📗 {status_icon} Book returned {status_text}: \"{book['title']}\" ({book_id}) by {user['fullName']} ({user_id})",
            'return'
        )
        
        # Notify user
        notify_user(
            user_id,
            f"You have successfully returned \"{book['title']}\". {status_text.capitalize()}.",
            'return'
        )
        
        return jsonify({
            'success': True,
            'bookTitle': book['title'],
            'onTime': on_time,
            'daysOverdue': borrow_record.get('daysOverdue', 0),
            'fine': borrow_record.get('fine', 0)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== CANCEL RESERVATION ENDPOINT ====================

@mirror_api.route('/books/cancel-reservation', methods=['POST'])
def cancel_reservation():
    """Cancel book reservation"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        book_id = data.get('bookId')
        
        if not user_id or not book_id:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Remove reservation
        if user_id in RESERVED_BOOKS and book_id in RESERVED_BOOKS[user_id]:
            RESERVED_BOOKS[user_id].remove(book_id)
            
            user = get_user_info(user_id)
            book = get_book_info(book_id)
            
            # Notify admins
            notify_all_admins(
                f"❌ Reservation cancelled: \"{book['title']}\" ({book_id}) by {user['fullName']} ({user_id})",
                'system'
            )
            
            return jsonify({
                'success': True,
                'message': 'Reservation cancelled successfully'
            })
        
        return jsonify({'error': 'Reservation not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== FORGOTTEN LOGOUT CHECK ====================

@mirror_api.route('/library/check-forgotten-logouts', methods=['POST'])
def check_forgotten_logouts():
    """Check for users who haven't logged out by 5 PM and send warnings"""
    try:
        current_time = datetime.now()
        current_hour = current_time.hour
        
        # Only run at 5 PM (17:00)
        if current_hour != 17:
            return jsonify({'message': 'Not time to check yet'})
        
        forgotten_users = []
        
        # Check all active sessions
        for user_id, session in LIBRARY_SESSIONS.items():
            if session.get('isInLibrary', False):
                user = get_user_info(user_id)
                if user:
                    # Generate AI warning message
                    warning_message = generate_ai_warning(user['fullName'], forgot_logout=True)
                    
                    # Notify admins
                    notify_all_admins(
                        f"⚠️ FORGOT LOGOUT: {user['fullName']} ({user_id}) did not log out by 5:00 PM",
                        'system'
                    )
                    
                    # Notify user with AI-generated warning
                    notify_user(user_id, warning_message, 'warning')
                    
                    forgotten_users.append({
                        'userId': user_id,
                        'userName': user['fullName'],
                        'entryTime': session.get('entryTime')
                    })
        
        return jsonify({
            'success': True,
            'forgottenCount': len(forgotten_users),
            'users': forgotten_users
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== USER & BOOK INFO HELPERS ====================

def get_user_info(user_id: str) -> Optional[Dict]:
    """Get user information (integrate with your user service)"""
    # TODO: Integrate with your actual user database
    # This is a placeholder
    return {
        'id': user_id,
        'fullName': 'Sample User',
        'role': 'student' if user_id.startswith('KC-') else 'admin',
        'email': f'{user_id.lower()}@jrmsu.edu.ph'
    }

def get_book_info(book_id: str) -> Optional[Dict]:
    """Get book information (integrate with your book service)"""
    # TODO: Integrate with your actual book database
    # This is a placeholder
    return {
        'id': book_id,
        'title': 'Sample Book Title',
        'author': 'Sample Author',
        'isbn': '1234567890',
        'available': True
    }

# ==================== EXPORT BLUEPRINT ====================

def init_mirror_api(app):
    """Initialize mirror API blueprint with Flask app"""
    app.register_blueprint(mirror_api)
    print("[Mirror Login API] Initialized successfully")
