#!/usr/bin/env python3
"""
Library Entry/Exit System Endpoints
For Mirror Login Page (Port 8081)
"""

import time
import uuid
from flask import request, jsonify
from db import execute_query

# In-memory library sessions storage (dev only)
LIBRARY_SESSIONS = {}  # session_id -> session_data

def _notify_all_admins(app, message: str, notification_type: str = 'library', meta: dict = None):
    """Notify all admin users"""
    from db import AdminDB
    try:
        admins = AdminDB.list_all_admins()
        for admin in admins:
            admin_id = admin.get('admin_id') or admin.get('id')
            if admin_id:
                from app import _new_notif_id, _ensure_user_store, _emit
                notif = {
                    'id': _new_notif_id(),
                    'user_id': admin_id,
                    'title': 'Library Activity',
                    'body': message,
                    'type': notification_type,
                    'meta': meta or {},
                    'created_at': int(time.time()),
                    'read': False,
                    'action_required': False,
                    'action_payload': None,
                    'actor_id': 'system',
                }
                lst = _ensure_user_store(admin_id)
                lst.insert(0, notif)
                _emit('notification.new', admin_id, notif)
    except Exception as e:
        print(f"Error notifying admins: {e}")

def register_library_endpoints(app):
    """Register all library-related endpoints"""
    
    @app.route('/api/library/login', methods=['POST'])
    def library_login():
        """Track user entry to library"""
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        user_type = (body.get('userType') or '').strip()
        full_name = (body.get('fullName') or '').strip()
        
        if not user_id or not user_type:
            return jsonify(error='User ID and type required'), 400
        
        # Create session
        session_id = f"lib-{uuid.uuid4()}"
        session_data = {
            'sessionId': session_id,
            'userId': user_id,
            'userType': user_type,
            'fullName': full_name,
            'loginTime': int(time.time()),
            'status': 'active'
        }
        
        # Check for reservations and borrowed books
        # TODO: Query actual database tables
        session_data['hasReservations'] = False
        session_data['hasBorrowedBooks'] = False
        session_data['reservedBooks'] = []
        session_data['borrowedBooks'] = []
        
        LIBRARY_SESSIONS[session_id] = session_data
        
        # Notify all admins
        _notify_all_admins(app, f"{full_name} ({user_id}) entered the library", 'library_entry', {
            'userId': user_id,
            'userType': user_type,
            'action': 'entry'
        })
        
        print(f"✅ Library entry: {full_name} ({user_id})")
        return jsonify(session_data)
    
    @app.route('/api/library/logout', methods=['POST'])
    def library_logout():
        """Track user exit from library"""
        body = request.get_json(force=True)
        session_id = (body.get('sessionId') or '').strip()
        user_id = (body.get('userId') or '').strip()
        
        if session_id in LIBRARY_SESSIONS:
            session = LIBRARY_SESSIONS[session_id]
            session['logoutTime'] = int(time.time())
            session['status'] = 'logged_out'
            
            # Notify all admins
            _notify_all_admins(app, f"{session['fullName']} ({user_id}) exited the library", 'library_exit', {
                'userId': user_id,
                'userType': session['userType'],
                'action': 'exit'
            })
            
            print(f"✅ Library exit: {session['fullName']} ({user_id})")
            del LIBRARY_SESSIONS[session_id]
            
        return jsonify(ok=True)
    
    @app.route('/api/library/user-status/<user_id>', methods=['GET'])
    def library_user_status(user_id: str):
        """Check if user has reservations or borrowed books"""
        try:
            # Query reservations table
            reservations_query = """
                SELECT r.*, b.title, b.author 
                FROM reservations r
                JOIN books b ON r.book_id = b.id
                WHERE r.user_id = %s AND r.status = 'pending' AND r.cancelled_at IS NULL
            """
            reservations = execute_query(reservations_query, (user_id,), fetch_all=True) or []
            
            # Query borrow_records table
            borrowed_query = """
                SELECT br.*, b.title, b.author
                FROM borrow_records br
                JOIN books b ON br.book_id = b.id
                WHERE br.user_id = %s AND br.return_date IS NULL
            """
            borrowed = execute_query(borrowed_query, (user_id,), fetch_all=True) or []
            
            return jsonify({
                'userId': user_id,
                'hasReservations': len(reservations) > 0,
                'hasBorrowedBooks': len(borrowed) > 0,
                'reservedBooks': reservations,
                'borrowedBooks': borrowed
            })
        except Exception as e:
            print(f"Error querying user status: {e}")
            # Return empty status on error
            return jsonify({
                'userId': user_id,
                'hasReservations': False,
                'hasBorrowedBooks': False,
                'reservedBooks': [],
                'borrowedBooks': []
            })
    
    @app.route('/api/library/user-reservations/<user_id>', methods=['GET'])
    def library_user_reservations(user_id: str):
        """Get all reserved books for user"""
        # TODO: Query reservations table
        return jsonify(reservations=[])
    
    @app.route('/api/library/user-borrowed/<user_id>', methods=['GET'])
    def library_user_borrowed(user_id: str):
        """Get all borrowed books for user"""
        # TODO: Query borrow_records table
        return jsonify(borrowed=[])
    
    @app.route('/api/library/borrow-book', methods=['POST'])
    def library_borrow_book():
        """Mark reserved book as borrowed"""
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        book_id = (body.get('bookId') or '').strip()
        session_id = (body.get('sessionId') or '').strip()
        
        if not user_id or not book_id:
            return jsonify(error='User ID and Book ID required'), 400
        
        # TODO: Update borrow_records table
        # Mark reservation as borrowed
        
        # Get user info
        session = LIBRARY_SESSIONS.get(session_id, {})
        full_name = session.get('fullName', user_id)
        
        # Notify all admins
        _notify_all_admins(app, f"{full_name} borrowed a book (ID: {book_id})", 'book_borrowed', {
            'userId': user_id,
            'bookId': book_id,
            'action': 'borrow'
        })
        
        print(f"✅ Book borrowed: {book_id} by {user_id}")
        return jsonify(ok=True, message='Book borrowed successfully')
    
    @app.route('/api/library/return-book', methods=['POST'])
    def library_return_book():
        """Mark borrowed book as returned"""
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        book_id = (body.get('bookId') or '').strip()
        session_id = (body.get('sessionId') or '').strip()
        
        if not user_id or not book_id:
            return jsonify(error='User ID and Book ID required'), 400
        
        # TODO: Update borrow_records table
        # Mark book as returned
        
        # Get user info
        session = LIBRARY_SESSIONS.get(session_id, {})
        full_name = session.get('fullName', user_id)
        
        # Notify all admins
        _notify_all_admins(app, f"{full_name} returned a book (ID: {book_id})", 'book_returned', {
            'userId': user_id,
            'bookId': book_id,
            'action': 'return'
        })
        
        print(f"✅ Book returned: {book_id} by {user_id}")
        return jsonify(ok=True, message='Book returned successfully')
    
    @app.route('/api/library/cancel-reservation', methods=['POST'])
    def library_cancel_reservation():
        """Cancel book reservation"""
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        book_id = (body.get('bookId') or '').strip()
        session_id = (body.get('sessionId') or '').strip()
        
        if not user_id or not book_id:
            return jsonify(error='User ID and Book ID required'), 400
        
        # TODO: Update reservations table
        # Set cancelled_at, cancelled_by, cancellation_reason
        
        # Get user info
        session = LIBRARY_SESSIONS.get(session_id, {})
        full_name = session.get('fullName', user_id)
        
        # Notify all admins
        _notify_all_admins(app, f"{full_name} cancelled a book reservation (ID: {book_id})", 'reservation_cancelled', {
            'userId': user_id,
            'bookId': book_id,
            'action': 'cancel'
        })
        
        print(f"✅ Reservation cancelled: {book_id} by {user_id}")
        return jsonify(ok=True, message='Reservation cancelled successfully')
    
    @app.route('/api/library/activate-return-time', methods=['POST'])
    def library_activate_return_time():
        """Activate return time when book is scanned at logout"""
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        book_id = (body.get('bookId') or '').strip()
        session_id = (body.get('sessionId') or '').strip()
        
        if not user_id or not book_id:
            return jsonify(error='User ID and Book ID required'), 400
        
        # TODO: Update borrow_records table
        # Set return_time_activated = TRUE, scan_time = NOW(), scanned_at_logout = TRUE
        
        # Get user info
        session = LIBRARY_SESSIONS.get(session_id, {})
        full_name = session.get('fullName', user_id)
        
        # Notify all admins
        _notify_all_admins(app, f"{full_name} activated return time for book (ID: {book_id})", 'return_time_activated', {
            'userId': user_id,
            'bookId': book_id,
            'action': 'activate_return_time'
        })
        
        print(f"✅ Return time activated: {book_id} by {user_id}")
        return jsonify(ok=True, message='Return time activated successfully')
    
    @app.route('/api/library/active-sessions', methods=['GET'])
    def library_active_sessions():
        """Get all active library sessions"""
        user_type = request.args.get('userType', None)
        active = [s for s in LIBRARY_SESSIONS.values() if s.get('status') == 'active']
        
        if user_type:
            active = [s for s in active if s.get('userType') == user_type]
        
        # Count by type
        students = len([s for s in active if s.get('userType') == 'student'])
        admins = len([s for s in active if s.get('userType') == 'admin'])
        
        return jsonify(
            sessions=active, 
            count=len(active),
            students=students,
            admins=admins
        )
    
    @app.route('/api/library/forgotten-logouts', methods=['GET'])
    def library_forgotten_logouts():
        """Check for users who forgot to logout (run at 5 PM)"""
        current_time = int(time.time())
        forgotten = []
        
        for session_id, session in LIBRARY_SESSIONS.items():
            if session.get('status') == 'active':
                # Check if logged in for more than 8 hours (example threshold)
                login_time = session.get('loginTime', 0)
                if current_time - login_time > (8 * 3600):
                    forgotten.append(session)
        
        # Notify all admins and users
        for session in forgotten:
            user_id = session['userId']
            full_name = session['fullName']
            
            # Generate AI warning (TODO: integrate with Ollama)
            warning_message = f"Reminder: {full_name}, you forgot to logout from the library. Please logout before leaving. The library closes at 5 PM."
            
            # Notify all admins
            _notify_all_admins(app, f"{full_name} ({user_id}) forgot to logout", 'forgotten_logout', {
                'userId': user_id,
                'userType': session['userType'],
                'loginTime': session['loginTime']
            })
            
            # Notify user
            try:
                from app import _new_notif_id, _ensure_user_store, _emit
                notif = {
                    'id': _new_notif_id(),
                    'user_id': user_id,
                    'title': 'Logout Reminder',
                    'body': warning_message,
                    'type': 'forgotten_logout',
                    'meta': {'sessionId': session_id},
                    'created_at': current_time,
                    'read': False,
                    'action_required': True,
                    'action_payload': None,
                    'actor_id': 'system',
                }
                lst = _ensure_user_store(user_id)
                lst.insert(0, notif)
                _emit('notification.new', user_id, notif)
            except Exception as e:
                print(f"Error notifying user {user_id}: {e}")
        
        return jsonify(forgotten=forgotten, count=len(forgotten))
    
    @app.route('/api/ai/generate-logout-warning', methods=['POST'])
    def ai_generate_logout_warning():
        """Generate varied AI warning message for forgotten logout"""
        body = request.get_json(force=True)
        full_name = (body.get('fullName') or 'User').strip()
        user_type = (body.get('userType') or 'student').strip()
        login_time = body.get('loginTime', int(time.time()))
        
        # TODO: Integrate with Ollama AI (LLaMA 3)
        # For now, return varied messages
        import random
        messages = [
            f"Hi {full_name}! We noticed you're still logged in at the library. Please remember to logout before leaving. The library closes at 5 PM.",
            f"Hello {full_name}! You forgot to logout from the library system. Kindly logout before you leave to help us track library usage accurately.",
            f"Good afternoon {full_name}! Your library session is still active. Please logout before leaving the premises. Thank you!",
            f"Reminder for {full_name}: You're still logged in at the library. Please logout before leaving. Library hours end at 5 PM.",
            f"Hey {full_name}! Don't forget to logout from the library system before you go. Your session is still active."
        ]
        
        warning = random.choice(messages)
        
        return jsonify(warning=warning, generated_at=int(time.time()))
    
    print("✅ Library endpoints registered")
