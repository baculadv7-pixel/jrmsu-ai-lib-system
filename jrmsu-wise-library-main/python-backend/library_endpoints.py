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
    
    @app.route('/api/library/dev-login', methods=['POST'], endpoint='lib_dev_login')
    def library_dev_login():
        """Dev-only: Track user entry to library (in-memory)"""
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        user_type = (body.get('userType') or '').strip()
        full_name = (body.get('fullName') or '').strip()
        
        if not user_id or not user_type:
            return jsonify(error='User ID and type required'), 400
        
        # Create session (in-memory)
        session_id = f"lib-{uuid.uuid4()}"
        session_data = {
            'sessionId': session_id,
            'userId': user_id,
            'userType': user_type,
            'fullName': full_name,
            'loginTime': int(time.time()),
            'status': 'active'
        }
        
        # Placeholder flags
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
        
        print(f"✅ [DEV] Library entry: {full_name} ({user_id})")
        return jsonify(session_data)
    
    @app.route('/api/library/dev-logout', methods=['POST'], endpoint='lib_dev_logout')
    def library_dev_logout():
        """Dev-only: Track user exit from library (in-memory)"""
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
            
            print(f"✅ [DEV] Library exit: {session['fullName']} ({user_id})")
            del LIBRARY_SESSIONS[session_id]
            
        return jsonify(ok=True)
    
    @app.route('/api/library/user-status/<user_id>', methods=['GET'])
    def library_user_status(user_id: str):
        """Check if user has reservations or borrowed books.

        NOTE:
        - Uses LEFT JOIN so that reservations are still visible even if a matching
          row in `books` is missing (e.g. book deleted or IDs out of sync).
        - Falls back to r.book_title when b.title is NULL.
        """
        try:
            # Pending reservations for this user
            reservations_query = """
                SELECT
                  r.*,
                  COALESCE(b.title, r.book_title) AS title,
                  b.author
                FROM reservations r
                LEFT JOIN books b ON r.book_id = b.id
                WHERE r.user_id = %s
                  AND r.status = 'pending'
                  AND r.cancelled_at IS NULL
            """
            reservations = execute_query(reservations_query, (user_id,), fetch_all=True) or []
            
            # Active borrowed books for this user
            borrowed_query = """
                SELECT br.*, b.title, b.author
                FROM borrow_records br
                JOIN books b ON br.book_id = b.id
                WHERE br.user_id = %s AND br.status = 'borrowed' AND br.returned_at IS NULL
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
        """Get all reserved books for user.

        Uses LEFT JOIN + COALESCE so reservations remain visible even when the
        corresponding book row is missing in `books`.
        """
        try:
            query = """
                SELECT
                  r.*,
                  COALESCE(b.title, r.book_title) AS title,
                  b.author
                FROM reservations r
                LEFT JOIN books b ON r.book_id = b.id
                WHERE r.user_id = %s
                  AND r.status = 'pending'
                  AND r.cancelled_at IS NULL
                ORDER BY r.reserved_at DESC
            """
            rows = execute_query(query, (user_id,), fetch_all=True) or []
            return jsonify(reservations=rows)
        except Exception as e:
            print(f"Error querying user reservations: {e}")
            return jsonify(reservations=[]), 500

    @app.route('/api/library/reservations-all', methods=['GET'])
    def library_all_reservations():
        """Get all active (pending) reservations for all users (admin view).

        Uses LEFT JOIN + COALESCE for the same reason as user-reservations: we
        still want to see reservations even if the referenced book has been
        removed from the `books` table.
        """
        try:
            query = """
                SELECT
                  r.*,
                  COALESCE(b.title, r.book_title) AS title,
                  b.author
                FROM reservations r
                LEFT JOIN books b ON r.book_id = b.id
                WHERE r.status = 'pending'
                  AND r.cancelled_at IS NULL
                ORDER BY r.reserved_at DESC
            """
            rows = execute_query(query, (), fetch_all=True) or []
            return jsonify(reservations=rows)
        except Exception as e:
            print(f"Error querying all reservations: {e}")
            return jsonify(reservations=[]), 500
    
    @app.route('/api/library/user-borrowed/<user_id>', methods=['GET'])
    def library_user_borrowed(user_id: str):
        """Get all active borrowed books for a specific user"""
        try:
            query = """
                SELECT br.*, b.title, b.author
                FROM borrow_records br
                JOIN books b ON br.book_id = b.id
                WHERE br.user_id = %s AND br.status = 'borrowed' AND br.returned_at IS NULL
                ORDER BY br.borrowed_at DESC
            """
            rows = execute_query(query, (user_id,), fetch_all=True) or []
            return jsonify(borrowed=rows)
        except Exception as e:
            print(f"Error querying user borrowed books: {e}")
            return jsonify(borrowed=[]), 500

    @app.route('/api/library/borrowed-all', methods=['GET'])
    def library_all_borrowed():
        """Get all active borrowed books for all users (admin view).

        Returns only currently borrowed (not returned) records to match the
        "Borrowed Books" dashboard semantics.
        """
        try:
            query = """
                SELECT br.*, b.title, b.author
                FROM borrow_records br
                JOIN books b ON br.book_id = b.id
                WHERE br.status = 'borrowed' AND br.returned_at IS NULL
                ORDER BY br.borrowed_at DESC
            """
            rows = execute_query(query, (), fetch_all=True) or []
            return jsonify(borrowed=rows)
        except Exception as e:
            print(f"Error querying all borrowed books: {e}")
            return jsonify(borrowed=[]), 500

    @app.route('/api/library/borrow-history', methods=['GET'])
    def library_borrow_history_all():
        """Full borrow/return history for all users (admin reports/history).

        Includes returned and overdue items, ordered by most recent borrow.
        """
        try:
            query = """
                SELECT br.*, b.title, b.author
                FROM borrow_records br
                JOIN books b ON br.book_id = b.id
                ORDER BY br.borrowed_at DESC
            """
            rows = execute_query(query, (), fetch_all=True) or []
            return jsonify(history=rows)
        except Exception as e:
            print(f"Error querying borrow history (all): {e}")
            return jsonify(history=[]), 500

    @app.route('/api/library/borrow-history/<user_id>', methods=['GET'])
    def library_borrow_history_user(user_id: str):
        """Borrow/return history for a specific user."""
        try:
            query = """
                SELECT br.*, b.title, b.author
                FROM borrow_records br
                JOIN books b ON br.book_id = b.id
                WHERE br.user_id = %s
                ORDER BY br.borrowed_at DESC
            """
            rows = execute_query(query, (user_id,), fetch_all=True) or []
            return jsonify(history=rows)
        except Exception as e:
            print(f"Error querying borrow history for user {user_id}: {e}")
            return jsonify(history=[]), 500

    @app.route('/api/library/borrow-book', methods=['POST'])
    def library_borrow_book():
        """Mark reserved book as borrowed.
        This will:
        - Validate there is a pending reservation for this user/book (if present)
        - Insert a row into borrow_records
        - Mark the reservation as fulfilled
        - Decrement available_copies on books and update status
        """
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        book_id = (body.get('bookId') or '').strip()
        session_id = (body.get('sessionId') or '').strip()
        
        if not user_id or not book_id:
            return jsonify(error='User ID and Book ID required'), 400
        
        try:
            # Look up pending reservation (if any) – ensures only reserving user is borrowing
            reservation = execute_query(
                """
                SELECT * FROM reservations
                WHERE user_id = %s AND book_id = %s
                  AND status = 'pending' AND cancelled_at IS NULL
                ORDER BY reserved_at DESC
                LIMIT 1
                """,
                (user_id, book_id),
                fetch_one=True,
            )
            
            # Get book details
            book = execute_query(
                "SELECT id, title, available_copies, total_copies, status FROM books WHERE id = %s",
                (book_id,),
                fetch_one=True,
            )
            if not book:
                return jsonify(error='Book not found'), 404
            
            # If there is NO reservation and no available copies, block borrow.
            # If there IS a reservation, allow borrow even when available_copies
            # is 0, because reserve-book may have already decremented the count.
            if book.get('available_copies', 0) <= 0 and not reservation:
                return jsonify(error='Book unavailable'), 400
            
            # Determine user type and book title from reservation or book table
            user_type = (reservation.get('user_type') if reservation else 'student')
            book_title = reservation.get('book_title') if reservation else book.get('title')
            
            borrow_id = f"BR-{int(time.time() * 1000)}"
            
            # Insert borrow record (tolerant to older schemas that may not
            # have return_time_activated / scan_time / scanned_at_logout).
            try:
                insert_sql = """
                    INSERT INTO borrow_records (
                        borrow_id, user_id, user_type, book_id, book_title,
                        borrowed_at, due_date, status, return_time_activated,
                        scan_time, scanned_at_logout
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 'borrowed',
                        FALSE, NULL, FALSE
                    )
                """
                execute_query(insert_sql, (borrow_id, user_id, user_type, book_id, book_title))
            except Exception as e:
                msg = str(e)
                # Fallback when newer columns are missing in older schemas
                unknown_new_cols = [
                    'return_time_activated',
                    'scan_time',
                    'scanned_at_logout',
                ]
                if any(col in msg and 'Unknown column' in msg for col in unknown_new_cols):
                    insert_sql = """
                        INSERT INTO borrow_records (
                            borrow_id, user_id, user_type, book_id, book_title,
                            borrowed_at, due_date, status
                        ) VALUES (
                            %s, %s, %s, %s, %s,
                            NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 'borrowed'
                        )
                    """
                    execute_query(insert_sql, (borrow_id, user_id, user_type, book_id, book_title))
                else:
                    raise
            
            # Mark reservation as fulfilled (if it existed)
            if reservation:
                execute_query(
                    "UPDATE reservations SET status = 'fulfilled', fulfilled_at = NOW() WHERE id = %s",
                    (reservation['id'],),
                )
            
            # Update book availability and status
            update_book_sql = """
                UPDATE books
                SET available_copies = GREATEST(available_copies - 1, 0),
                    status = CASE WHEN available_copies - 1 <= 0 THEN 'unavailable' ELSE status END
                WHERE id = %s
            """
            execute_query(update_book_sql, (book_id,))
            
            # Get user info from session for human-readable notifications
            session = LIBRARY_SESSIONS.get(session_id, {})
            full_name = session.get('fullName', user_id)
            
            # Notify all admins
            _notify_all_admins(app, f"{full_name} borrowed a book (ID: {book_id})", 'book_borrowed', {
                'userId': user_id,
                'bookId': book_id,
                'action': 'borrow'
            })
            # Broadcast realtime update
            try:
                from app import _broadcast
                _broadcast('book.borrowed', { 'userId': user_id, 'bookId': book_id, 'timestamp': int(time.time()) })
            except Exception:
                pass
            
            print(f"✅ Book borrowed: {book_id} by {user_id}")
            return jsonify(ok=True, message='Book borrowed successfully', borrowId=borrow_id)
        except Exception as e:
            print(f"Error in library_borrow_book: {e}")
            # Surface details to client for easier debugging (non-production).
            return jsonify(error='Failed to borrow book', details=str(e)), 500
    
    @app.route('/api/library/return-book', methods=['POST'])
    def library_return_book():
        """Mark borrowed book as returned.
        This will:
        - Find the most recent active borrow_records row
        - Mark it as returned
        - Increment available_copies on books and update status
        """
        body = request.get_json(force=True)
        user_id = (body.get('UserId') or body.get('userId') or '').strip()
        book_id = (body.get('BookId') or body.get('bookId') or '').strip()
        session_id = (body.get('sessionId') or '').strip()
        
        if not user_id or not book_id:
            return jsonify(error='User ID and Book ID required'), 400
        
        try:
            # Find active borrow record
            borrow = execute_query(
                """
                SELECT * FROM borrow_records
                WHERE user_id = %s AND book_id = %s
                  AND status = 'borrowed' AND returned_at IS NULL
                ORDER BY borrowed_at DESC
                LIMIT 1
                """,
                (user_id, book_id),
                fetch_one=True,
            )
            if not borrow:
                return jsonify(error='No active borrow record found'), 404
            
            # Mark as returned
            execute_query(
                "UPDATE borrow_records SET status = 'returned', returned_at = NOW() WHERE id = %s",
                (borrow['id'],),
            )
            
            # Increment book availability and restore status
            update_book_sql = """
                UPDATE books
                SET available_copies = LEAST(total_copies, IFNULL(available_copies, 0) + 1),
                    status = 'available'
                WHERE id = %s
            """
            execute_query(update_book_sql, (book_id,))
            
            # Get user info
            session = LIBRARY_SESSIONS.get(session_id, {})
            full_name = session.get('FullName') or session.get('fullName') or user_id
            
            # Notify all admins
            _notify_all_admins(app, f"{full_name} returned a book (ID: {book_id})", 'book_returned', {
                'userId': user_id,
                'bookId': book_id,
                'action': 'return'
            })
            # Broadcast realtime update
            try:
                from app import _broadcast
                _broadcast('book.returned', { 'userId': user_id, 'BookId': book_id, 'timestamp': int(time.time()) })
            except Exception:
                pass
            
            print(f"✅ Book returned: {book_id} by {user_id}")
            return jsonify(ok=True, message='Book returned successfully')
        except Exception as e:
            print(f"Error in library_return_book: {e}")
            return jsonify(error='Failed to return book'), 500
    
    @app.route('/api/library/reserve-book', methods=['POST'])
    def library_reserve_book():
        """Create or reuse a pending reservation for a user/book.
        This now supports quantity and will decrement available_copies
        for the reserved book so that all views stay in sync.
        """
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        book_id = (body.get('bookId') or '').strip()
        user_type = (body.get('userType') or 'student').strip() or 'student'
        book_title = (body.get('bookTitle') or '').strip()
        # Optional quantity from frontend; default to 1 if missing/invalid
        try:
            quantity = int(body.get('quantity') or 1)
        except Exception:
            quantity = 1
        if quantity <= 0:
            quantity = 1

        if not user_id or not book_id:
            return jsonify(error='User ID and Book ID required'), 400

        try:
            # Ensure book exists and get title + availability if not provided
            book = execute_query(
                "SELECT id, title, available_copies, total_copies, status FROM books WHERE id = %s",
                (book_id,),
                fetch_one=True,
            )
            if not book:
                return jsonify(error='Book not found'), 404

            if not book_title:
                book_title = book.get('title') or ''

            available = book.get('available_copies', 0) or 0
            if available < quantity:
                return jsonify(error='Not enough available copies for reservation'), 400

            # If there is already a pending reservation for this user/book, just return success
            existing = execute_query(
                """
                SELECT * FROM reservations
                WHERE user_id = %s AND book_id = %s
                  AND status = 'pending' AND cancelled_at IS NULL
                ORDER BY reserved_at DESC
                LIMIT 1
                """,
                (user_id, book_id),
                fetch_one=True,
            )
            if existing:
                return jsonify(ok=True, message='Reservation already exists', reservationId=existing.get('id'))

            # Generate a unique reservation id; also use it for legacy reservation_id column if present
            import uuid
            reservation_id = f"RV-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6]}"

            try:
                # Preferred insert: includes reservation_id column for schemas that have it
                insert_sql = """
                    INSERT INTO reservations (
                        id, reservation_id, user_id, user_type, book_id, book_title,
                        status, reserved_at, fulfilled_at, cancelled_at, cancelled_by
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s,
                        'pending', NOW(), NULL, NULL, NULL
                    )
                """
                execute_query(insert_sql, (reservation_id, reservation_id, user_id, user_type, book_id, book_title))
            except Exception as e:
                msg = str(e)
                # If reservation_id column does not exist, fall back to older schema
                if "Unknown column 'reservation_id'" in msg or 'reservation_id' in msg and 'column' in msg:
                    insert_sql = """
                        INSERT INTO reservations (
                            id, user_id, user_type, book_id, book_title,
                            status, reserved_at, fulfilled_at, cancelled_at, cancelled_by
                        ) VALUES (
                            %s, %s, %s, %s, %s,
                            'pending', NOW(), NULL, NULL, NULL
                        )
                    """
                    execute_query(insert_sql, (reservation_id, user_id, user_type, book_id, book_title))
                else:
                    # Re-raise unexpected DB errors to be handled by outer except
                    raise

            # Decrement available copies for this book to reflect the reservation.
            try:
                update_book_sql = """
                    UPDATE books
                    SET available_copies = GREATEST(available_copies - %s, 0),
                        status = CASE WHEN available_copies - %s <= 0 THEN 'unavailable' ELSE status END
                    WHERE id = %s
                """
                execute_query(update_book_sql, (quantity, quantity, book_id))
            except Exception as e:
                # If decrement fails, log but do not crash reservation creation; admins can reconcile.
                print(f"Error updating book availability on reserve: {e}")

            # Optional: notify admins about new reservation
            _notify_all_admins(app, f"{user_id} reserved a book (ID: {book_id})", 'reservation_created', {
                'userId': user_id,
                'bookId': book_id,
                'action': 'reserve',
                'quantity': quantity
            })
            # Optional broadcast for dashboards
            try:
                from app import _broadcast
                _broadcast('reservation.created', {
                    'userId': user_id,
                    'bookId': book_id,
                    'quantity': quantity,
                    'timestamp': int(time.time()),
                })
            except Exception:
                pass

            print(f"✅ Reservation created: {book_id} x{quantity} by {user_id}")
            return jsonify(ok=True, message='Reservation created successfully', reservationId=reservation_id, quantity=quantity)
        except Exception as e:
            # Log full error for debugging
            print(f"Error in library_reserve_book: {e}")
            msg = str(e)
            # Let the client see the real DB error so we can diagnose non-schema issues
            return jsonify(error='Failed to create reservation', details=msg), 500

    @app.route('/api/library/cancel-reservation', methods=['POST'])
    def library_cancel_reservation():
        """Cancel book reservation.
        Only the user who owns the reservation can cancel it.
        """
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        book_id = (body.get('bookId') or '').strip()
        session_id = (body.get('sessionId') or '').strip()
        
        if not user_id or not book_id:
            return jsonify(error='User ID and Book ID required'), 400
        
        try:
            # Find pending reservation for this user/book
            reservation = execute_query(
                """
                SELECT * FROM reservations
                WHERE user_id = %s AND book_id = %s
                  AND status = 'pending' AND cancelled_at IS NULL
                ORDER BY reserved_at DESC
                LIMIT 1
                """,
                (user_id, book_id),
                fetch_one=True,
            )
            if not reservation:
                # Either already cancelled/fulfilled, or belongs to another user
                return jsonify(error='No cancellable reservation found'), 404
            
            # Mark reservation as cancelled
            execute_query(
                """
                UPDATE reservations
                SET status = 'cancelled',
                    cancelled_at = NOW(),
                    cancelled_by = %s
                WHERE id = %s
                """,
                (user_id, reservation['id']),
            )
            
            # (Optional) restore book availability if you decrement on reserve –
            # here we assume reserve does NOT change available_copies, so we skip it.
            
            # Get user info
            session = LIBRARY_SESSIONS.get(session_id, {})
            full_name = session.get('fullName', user_id)
            
            # Notify all admins
            _notify_all_admins(app, f"{full_name} cancelled a book reservation (ID: {book_id})", 'reservation_cancelled', {
                'userId': user_id,
                'bookId': book_id,
                'action': 'cancel'
            })
            # Optional broadcast
            try:
                from app import _broadcast
                _broadcast('reservation.cancelled', { 'userId': user_id, 'bookId': book_id, 'timestamp': int(time.time()) })
            except Exception:
                pass
            
            print(f"✅ Reservation cancelled: {book_id} by {user_id}")
            return jsonify(ok=True, message='Reservation cancelled successfully')
        except Exception as e:
            print(f"Error in library_cancel_reservation: {e}")
            return jsonify(error='Failed to cancel reservation'), 500
    
    @app.route('/api/library/activate-return-time', methods=['POST'])
    def library_activate_return_time():
        """Activate return time when book is scanned at logout.
        Marks the latest borrow_records row as having a scan_time and return_time_activated.
        """
        body = request.get_json(force=True)
        user_id = (body.get('userId') or '').strip()
        book_id = (body.get('bookId') or '').strip()
        session_id = (body.get('sessionId') or '').strip()
        
        if not user_id or not book_id:
            return jsonify(error='User ID and Book ID required'), 400
        
        try:
            update_sql = """
                UPDATE borrow_records
                SET return_time_activated = TRUE,
                    scan_time = NOW(),
                    scanned_at_logout = TRUE
                WHERE user_id = %s AND book_id = %s AND status = 'borrowed'
                ORDER BY borrowed_at DESC
                LIMIT 1
            """
            execute_query(update_sql, (user_id, book_id))
            
            # Get user info
            session = LIBRARY_SESSIONS.get(session_id, {})
            full_name = session.get('fullName', user_id)
            
            # Notify all admins
            _notify_all_admins(app, f"{full_name} activated return time for book (ID: {book_id})", 'return_time_activated', {
                'userId': user_id,
                'bookId': book_id,
                'action': 'activate_return_time'
            })
            # Optional broadcast
            try:
                from app import _broadcast
                _broadcast('return_time.activated', { 'userId': user_id, 'bookId': book_id, 'timestamp': int(time.time()) })
            except Exception:
                pass
            
            print(f"✅ Return time activated: {book_id} by {user_id}")
            return jsonify(ok=True, message='Return time activated successfully')
        except Exception as e:
            print(f"Error in library_activate_return_time: {e}")
            return jsonify(error='Failed to activate return time'), 500
    
    # DEV-only endpoints below are namespaced under /api/library/dev to avoid clashing with DB-backed routes
    @app.route('/api/library/dev/active-sessions', methods=['GET'])
    def library_active_sessions():
        """[DEV] Get all active library sessions from in-memory store"""
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
    
    @app.route('/api/library/dev/forgotten-logouts', methods=['GET'])
    def library_forgotten_logouts():
        """[DEV] Check for users who forgot to logout using in-memory sessions (run at 5 PM)"""
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
            warning_message = f"Reminder: {full_name}, you forgot to logout from the library. Please logout before leaving."
            
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
