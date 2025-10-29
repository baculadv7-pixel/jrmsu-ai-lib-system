"""
Password Reset Admin Response Handler
Handles Grant/Decline actions from admin for password reset requests
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from notifications_service import notify_all_admins, notify_user, log_activity
from db import get_db_connection

password_reset_bp = Blueprint('password_reset_admin', __name__)

@password_reset_bp.route('/api/auth/admin-respond', methods=['POST'])
def admin_respond_password_reset():
    """
    Handle admin response to password reset request
    
    Request body:
    {
        "requesterId": "KC-23-A-00762",
        "action": "grant" | "decline",
        "notificationId": "NT-123456789",
        "adminId": "KCL-00001" (optional)
    }
    """
    data = request.json
    requester_id = data.get('requesterId')
    action = data.get('action')  # 'grant' or 'decline'
    notification_id = data.get('notificationId')
    admin_id = data.get('adminId', 'Admin')
    
    if not requester_id or not action:
        return jsonify({'error': 'Missing required fields'}), 400
    
    if action not in ['grant', 'decline']:
        return jsonify({'error': 'Invalid action'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get requester details
        cursor.execute("""
            SELECT id, first_name, middle_name, last_name, email, user_type 
            FROM (
                SELECT student_id as id, first_name, middle_name, last_name, email, 'student' as user_type 
                FROM students 
                WHERE student_id = %s
                UNION
                SELECT admin_id as id, first_name, middle_name, last_name, email, 'admin' as user_type 
                FROM admins 
                WHERE admin_id = %s
            ) as users
        """, (requester_id, requester_id))
        
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        full_name = f"{user['first_name']} {user.get('middle_name', '')} {user['last_name']}".replace('  ', ' ').strip()
        timestamp = datetime.now().strftime('%m/%d/%Y %I:%M %p')
        
        if action == 'grant':
            # Grant password reset
            
            # 1. Notify the requesting user
            notify_user(
                user_id=requester_id,
                event_type='password_reset_granted',
                title='Password Reset Granted',
                variables={
                    'userId': requester_id,
                    'fullName': full_name,
                    'adminId': admin_id,
                    'timestamp': timestamp
                },
                details={
                    'requesterId': requester_id,
                    'requesterName': full_name,
                    'requesterEmail': user['email'],
                    'grantedBy': admin_id,
                    'grantedAt': timestamp
                },
                source='MAIN'
            )
            
            # 2. Notify all admins
            notify_all_admins(
                event_type='password_reset_granted_admin',
                title='Password Reset Granted',
                variables={
                    'adminId': admin_id,
                    'userId': requester_id,
                    'fullName': full_name,
                    'timestamp': timestamp
                },
                details={
                    'requesterId': requester_id,
                    'requesterName': full_name,
                    'grantedBy': admin_id
                },
                source='MAIN'
            )
            
            # 3. Log activity
            log_activity(
                event_type='password_reset_granted',
                user_id=requester_id,
                summary=f'{requester_id} password reset granted by {admin_id}',
                details={'grantedBy': admin_id, 'timestamp': timestamp},
                source='MAIN'
            )
            
            # 4. Mark original notification as read
            if notification_id:
                cursor.execute(
                    "UPDATE notifications SET read_flag = TRUE WHERE id = %s",
                    (notification_id,)
                )
                conn.commit()
            
            return jsonify({
                'success': True,
                'action': 'granted',
                'message': f'Password reset request for {full_name} ({requester_id}) has been granted.'
            })
            
        else:  # decline
            # Decline password reset
            
            # 1. Notify the requesting user
            notify_user(
                user_id=requester_id,
                event_type='password_reset_declined',
                title='Password Reset Declined',
                variables={
                    'userId': requester_id,
                    'fullName': full_name,
                    'adminId': admin_id,
                    'timestamp': timestamp
                },
                details={
                    'requesterId': requester_id,
                    'requesterName': full_name,
                    'requesterEmail': user['email'],
                    'declinedBy': admin_id,
                    'declinedAt': timestamp
                },
                source='MAIN'
            )
            
            # 2. Notify all admins
            notify_all_admins(
                event_type='password_reset_declined_admin',
                title='Password Reset Declined',
                variables={
                    'adminId': admin_id,
                    'userId': requester_id,
                    'fullName': full_name,
                    'timestamp': timestamp
                },
                details={
                    'requesterId': requester_id,
                    'requesterName': full_name,
                    'declinedBy': admin_id
                },
                source='MAIN'
            )
            
            # 3. Log activity
            log_activity(
                event_type='password_reset_declined',
                user_id=requester_id,
                summary=f'{requester_id} password reset declined by {admin_id}',
                details={'declinedBy': admin_id, 'timestamp': timestamp},
                source='MAIN'
            )
            
            # 4. Mark original notification as read
            if notification_id:
                cursor.execute(
                    "UPDATE notifications SET read_flag = TRUE WHERE id = %s",
                    (notification_id,)
                )
                conn.commit()
            
            return jsonify({
                'success': True,
                'action': 'declined',
                'message': f'Password reset request for {full_name} ({requester_id}) has been declined.'
            })
    
    except Exception as e:
        print(f"Error in admin_respond_password_reset: {e}")
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# Add Jose AI templates for grant/decline
def add_grant_decline_templates():
    """Add Jose AI templates for grant/decline notifications"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        templates = [
            # Password reset granted (to user)
            ('password_reset_granted', 'Your password reset request has been granted by {adminId}. You can now reset your password.', '["userId", "fullName", "adminId", "timestamp"]'),
            ('password_reset_granted', 'Good news! Admin {adminId} approved your password reset request. Please proceed to reset your password.', '["userId", "fullName", "adminId", "timestamp"]'),
            ('password_reset_granted', 'Password reset approved by {adminId} at {timestamp}. You may now create a new password.', '["userId", "fullName", "adminId", "timestamp"]'),
            
            # Password reset declined (to user)
            ('password_reset_declined', 'Your password reset request was declined by {adminId}. Please contact support if you need assistance.', '["userId", "fullName", "adminId", "timestamp"]'),
            ('password_reset_declined', 'Admin {adminId} declined your password reset request at {timestamp}. For help, please reach out to the library staff.', '["userId", "fullName", "adminId", "timestamp"]'),
            ('password_reset_declined', 'Password reset request declined by {adminId}. If you believe this is an error, please contact administration.', '["userId", "fullName", "adminId", "timestamp"]'),
            
            # Password reset granted (to admins)
            ('password_reset_granted_admin', 'Admin {adminId} granted password reset for {fullName} ({userId}) at {timestamp}.', '["adminId", "userId", "fullName", "timestamp"]'),
            ('password_reset_granted_admin', 'Password reset approved: {fullName} ({userId}) by {adminId} at {timestamp}.', '["adminId", "userId", "fullName", "timestamp"]'),
            ('password_reset_granted_admin', '{adminId} has approved password reset request for {userId} - {fullName} at {timestamp}.', '["adminId", "userId", "fullName", "timestamp"]'),
            
            # Password reset declined (to admins)
            ('password_reset_declined_admin', 'Admin {adminId} declined password reset for {fullName} ({userId}) at {timestamp}.', '["adminId", "userId", "fullName", "timestamp"]'),
            ('password_reset_declined_admin', 'Password reset declined: {fullName} ({userId}) by {adminId} at {timestamp}.', '["adminId", "userId", "fullName", "timestamp"]'),
            ('password_reset_declined_admin', '{adminId} has declined password reset request for {userId} - {fullName} at {timestamp}.', '["adminId", "userId", "fullName", "timestamp"]'),
        ]
        
        for event_type, template, variables in templates:
            cursor.execute("""
                INSERT INTO jose_message_templates (event_type, template, variables)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE template = VALUES(template)
            """, (event_type, template, variables))
        
        conn.commit()
        print("✅ Grant/Decline templates added successfully")
        
    finally:
        cursor.close()
        conn.close()

# Run this once to add templates
if __name__ == '__main__':
    add_grant_decline_templates()
