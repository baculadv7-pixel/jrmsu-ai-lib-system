"""
Flask routes for Notifications API
Handles notification CRUD operations and WebSocket events
"""

from flask import Blueprint, request, jsonify
from flask_socketio import emit, join_room
from notifications_service import (
    NotificationsService,
    notify_all_admins,
    notify_user,
    log_activity
)
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

# ============================================
# REST API Routes
# ============================================

@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get notifications for a user"""
    user_id = request.headers.get('X-User-Id')
    role = request.args.get('role', 'admin')  # Default to admin
    filter_type = request.args.get('filter', 'all')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('page', 1)) - 1) * limit
    
    notifications = NotificationsService.get_notifications(
        user_id=user_id,
        role=role,
        filter=filter_type,
        limit=limit,
        offset=offset
    )
    
    unread_count = NotificationsService.get_unread_count(user_id=user_id, role=role)
    
    return jsonify({
        'items': notifications,
        'total': len(notifications),
        'unread': unread_count
    })

@notifications_bp.route('/api/notifications/<notification_id>', methods=['GET'])
def get_notification(notification_id):
    """Get a single notification"""
    user_id = request.headers.get('X-User-Id')
    
    notifications = NotificationsService.get_notifications(user_id=user_id, limit=1000)
    notification = next((n for n in notifications if n['id'] == notification_id), None)
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    return jsonify(notification)

@notifications_bp.route('/api/notifications/mark-read', methods=['POST'])
def mark_read():
    """Mark notifications as read"""
    data = request.json
    notification_ids = data.get('notificationIds', [])
    
    NotificationsService.mark_as_read(notification_ids)
    
    return jsonify({'success': True})

@notifications_bp.route('/api/notifications/mark-all-read', methods=['POST'])
def mark_all_read():
    """Mark all notifications as read"""
    user_id = request.headers.get('X-User-Id')
    role = request.args.get('role', 'admin')
    
    NotificationsService.mark_all_as_read(user_id=user_id, role=role)
    
    return jsonify({'success': True})

@notifications_bp.route('/api/activity-log', methods=['GET'])
def get_activity_log():
    """Get recent activity log"""
    limit = int(request.args.get('limit', 100))
    offset = (int(request.args.get('page', 1)) - 1) * limit
    
    activities = NotificationsService.get_activity_log(limit=limit, offset=offset)
    
    return jsonify({
        'items': activities,
        'total': len(activities)
    })

# ============================================
# Notification Creation Routes
# ============================================

@notifications_bp.route('/api/notifications/create', methods=['POST'])
def create_notification():
    """
    Generic route for creating notifications
    Used by frontend and mirror page
    """
    data = request.json
    notif_type = data.get('type')
    notif_data = data.get('data', {})
    timestamp = data.get('timestamp', datetime.now().strftime('%m/%d/%Y %I:%M %p'))
    
    # Map notification types to handlers
    handlers = {
        'library_login_manual': handle_library_login_manual,
        'library_logout_manual': handle_library_logout_manual,
        'library_login_qr': handle_library_login_qr,
        'library_logout_qr': handle_library_logout_qr,
        'book_reserved': handle_book_reserved,
        'book_borrowed': handle_book_borrowed,
        'book_returned': handle_book_returned,
        'book_overdue': handle_book_overdue,
    }
    
    handler = handlers.get(notif_type)
    if handler:
        notif_id = handler(notif_data, timestamp)
        return jsonify({'success': True, 'notificationId': notif_id})
    
    return jsonify({'error': 'Unknown notification type'}), 400

# ============================================
# Notification Handlers
# ============================================

def handle_library_login_manual(data, timestamp):
    """Handle library login (manual) notification"""
    user_id = data.get('userId')
    full_name = data.get('fullName')
    user_type = data.get('userType')
    
    # Notify all admins
    notif_id = notify_all_admins(
        event_type='library_login_manual',
        title='Library Login (Manual)',
        variables={'userId': user_id, 'timestamp': timestamp},
        details={'userId': user_id, 'fullName': full_name, 'userType': user_type},
        source='MIRROR'
    )
    
    # Log activity
    log_activity(
        event_type='library_login',
        user_id=user_id,
        summary=f'{user_id} successful login in the library',
        details={'method': 'manual', 'timestamp': timestamp},
        source='MIRROR'
    )
    
    # Emit WebSocket event
    emit_notification_to_admins(notif_id)
    
    return notif_id

def handle_library_logout_manual(data, timestamp):
    """Handle library logout (manual) notification"""
    user_id = data.get('userId')
    full_name = data.get('fullName')
    user_type = data.get('userType')
    
    # Notify all admins
    notif_id = notify_all_admins(
        event_type='library_logout_manual',
        title='Library Logout (Manual)',
        variables={'userId': user_id, 'timestamp': timestamp},
        details={'userId': user_id, 'fullName': full_name, 'userType': user_type},
        source='MIRROR'
    )
    
    # Log activity
    log_activity(
        event_type='library_logout',
        user_id=user_id,
        summary=f'{user_id} successful logout from the library',
        details={'method': 'manual', 'timestamp': timestamp},
        source='MIRROR'
    )
    
    # Emit WebSocket event
    emit_notification_to_admins(notif_id)
    
    return notif_id

def handle_library_login_qr(data, timestamp):
    """Handle library login (QR) notification"""
    user_id = data.get('userId')
    full_name = data.get('fullName')
    user_type = data.get('userType')
    
    # Notify all admins
    notif_id = notify_all_admins(
        event_type='library_login_qr',
        title='Library Login (QR Code)',
        variables={'userId': user_id, 'timestamp': timestamp},
        details={'userId': user_id, 'fullName': full_name, 'userType': user_type},
        source='MIRROR'
    )
    
    # Log activity
    log_activity(
        event_type='library_login',
        user_id=user_id,
        summary=f'{user_id} successful login in the library',
        details={'method': 'qr', 'timestamp': timestamp},
        source='MIRROR'
    )
    
    # Emit WebSocket event
    emit_notification_to_admins(notif_id)
    
    return notif_id

def handle_library_logout_qr(data, timestamp):
    """Handle library logout (QR) notification"""
    user_id = data.get('userId')
    full_name = data.get('fullName')
    user_type = data.get('userType')
    
    # Notify all admins
    notif_id = notify_all_admins(
        event_type='library_logout_qr',
        title='Library Logout (QR Code)',
        variables={'userId': user_id, 'timestamp': timestamp},
        details={'userId': user_id, 'fullName': full_name, 'userType': user_type},
        source='MIRROR'
    )
    
    # Log activity
    log_activity(
        event_type='library_logout',
        user_id=user_id,
        summary=f'{user_id} successful logout from the library',
        details={'method': 'qr', 'timestamp': timestamp},
        source='MIRROR'
    )
    
    # Emit WebSocket event
    emit_notification_to_admins(notif_id)
    
    return notif_id

def handle_book_reserved(data, timestamp):
    """Handle book reserved notification"""
    user_id = data.get('userId')
    full_name = data.get('fullName')
    book_id = data.get('bookId')
    book_title = data.get('bookTitle')
    
    # Notify all admins
    notif_id = notify_all_admins(
        event_type='book_reserved',
        title='Book Reserved',
        variables={'userId': user_id, 'bookId': book_id, 'bookTitle': book_title, 'timestamp': timestamp},
        details={'userId': user_id, 'fullName': full_name, 'bookId': book_id, 'bookTitle': book_title},
        source='MAIN'
    )
    
    # Log activity
    log_activity(
        event_type='book_reserved',
        user_id=user_id,
        summary=f'{user_id} successful reserved book',
        details={'bookId': book_id, 'bookTitle': book_title, 'timestamp': timestamp},
        source='MAIN'
    )
    
    # Emit WebSocket event
    emit_notification_to_admins(notif_id)
    
    return notif_id

def handle_book_borrowed(data, timestamp):
    """Handle book borrowed notification"""
    user_id = data.get('userId')
    full_name = data.get('fullName')
    book_id = data.get('bookId')
    book_title = data.get('bookTitle')
    
    # Notify all admins
    notif_id = notify_all_admins(
        event_type='book_borrowed',
        title='Book Borrowed',
        variables={'userId': user_id, 'bookId': book_id, 'bookTitle': book_title, 'timestamp': timestamp},
        details={'userId': user_id, 'fullName': full_name, 'bookId': book_id, 'bookTitle': book_title},
        source='MIRROR'
    )
    
    # Log activity
    log_activity(
        event_type='book_borrowed',
        user_id=user_id,
        summary=f'{user_id} successful borrowed book',
        details={'bookId': book_id, 'bookTitle': book_title, 'timestamp': timestamp},
        source='MIRROR'
    )
    
    # Emit WebSocket event
    emit_notification_to_admins(notif_id)
    
    return notif_id

def handle_book_returned(data, timestamp):
    """Handle book returned notification"""
    user_id = data.get('userId')
    full_name = data.get('fullName')
    book_id = data.get('bookId')
    book_title = data.get('bookTitle')
    
    # Notify all admins
    notif_id = notify_all_admins(
        event_type='book_returned',
        title='Book Returned',
        variables={'userId': user_id, 'bookId': book_id, 'bookTitle': book_title, 'timestamp': timestamp},
        details={'userId': user_id, 'fullName': full_name, 'bookId': book_id, 'bookTitle': book_title},
        source='MIRROR'
    )
    
    # Log activity
    log_activity(
        event_type='book_returned',
        user_id=user_id,
        summary=f'{user_id} successful returned book',
        details={'bookId': book_id, 'bookTitle': book_title, 'timestamp': timestamp},
        source='MIRROR'
    )
    
    # Emit WebSocket event
    emit_notification_to_admins(notif_id)
    
    return notif_id

def handle_book_overdue(data, timestamp):
    """Handle book overdue notification"""
    user_id = data.get('userId')
    full_name = data.get('fullName')
    book_id = data.get('bookId')
    book_title = data.get('bookTitle')
    borrowed_time = data.get('borrowedTime')
    
    # Notify all admins
    notif_id = notify_all_admins(
        event_type='book_overdue',
        title='Book Overdue',
        variables={'userId': user_id, 'bookId': book_id, 'bookTitle': book_title, 'borrowedTime': borrowed_time},
        details={'userId': user_id, 'fullName': full_name, 'bookId': book_id, 'bookTitle': book_title, 'borrowedTime': borrowed_time},
        source='MAIN'
    )
    
    # Log activity
    log_activity(
        event_type='book_overdue',
        user_id=user_id,
        summary=f'{user_id} overdue the book',
        details={'bookId': book_id, 'bookTitle': book_title, 'borrowedTime': borrowed_time, 'timestamp': timestamp},
        source='MAIN'
    )
    
    # Emit WebSocket event
    emit_notification_to_admins(notif_id)
    
    return notif_id

# ============================================
# WebSocket Helpers
# ============================================

def emit_notification_to_admins(notification_id):
    """Emit notification to all connected admin clients"""
    from app import socketio  # Import here to avoid circular dependency
    
    # Get notification details
    notifications = NotificationsService.get_notifications(role='admin', limit=1000)
    notification = next((n for n in notifications if n['id'] == notification_id), None)
    
    if notification:
        socketio.emit('notification:new', notification, room='admins')

def emit_notification_to_user(user_id, notification_id):
    """Emit notification to specific user"""
    from app import socketio
    
    notifications = NotificationsService.get_notifications(user_id=user_id, limit=1000)
    notification = next((n for n in notifications if n['id'] == notification_id), None)
    
    if notification:
        socketio.emit('notification:new', notification, room=f'user_{user_id}')

# ============================================
# WebSocket Events
# ============================================

def register_socketio_events(socketio):
    """Register SocketIO event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')
    
    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')
    
    @socketio.on('join_admin_room')
    def handle_join_admin():
        join_room('admins')
        print('Admin joined notification room')
    
    @socketio.on('join_user_room')
    def handle_join_user(data):
        user_id = data.get('userId')
        join_room(f'user_{user_id}')
        print(f'User {user_id} joined notification room')
