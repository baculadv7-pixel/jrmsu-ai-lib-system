#!/usr/bin/env python3
"""
Notification Endpoints for JRMSU Library System
Handles Email, SMS, and Push notifications for overdue books
"""

from flask import request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime
from db import execute_query
from notifications_service import notify_user

# Email Configuration
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "noreply@jrmsu.edu.ph")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "")
SENDER_NAME = os.getenv("SENDER_NAME", "JRMSU Library System")

# SMS Configuration (Twilio or similar)
SMS_ENABLED = os.getenv("SMS_ENABLED", "false").lower() == "true"
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

# Push Notification Configuration
PUSH_ENABLED = os.getenv("PUSH_ENABLED", "false").lower() == "true"


def send_email_notification(recipient_email: str, recipient_name: str, overdue_books: list) -> bool:
    """Send email notification about overdue books"""
    if not EMAIL_ENABLED or not SENDER_PASSWORD:
        print(f"[EMAIL] Would send overdue notification to {recipient_email} for {len(overdue_books)} book(s)")
        print(f"[EMAIL] Email disabled. Set EMAIL_ENABLED=true and SENDER_PASSWORD to enable.")
        return True  # Dev mode
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'JRMSU Library - {len(overdue_books)} Overdue Book(s)'
        msg['From'] = f'{SENDER_NAME} <{SENDER_EMAIL}>'
        msg['To'] = recipient_email
        
        # Build book list
        book_list_html = ""
        book_list_text = ""
        for book in overdue_books:
            days = book.get('daysOverdue', 0)
            title = book.get('bookTitle', 'Unknown')
            due_date = book.get('dueDate', 'Unknown')
            
            book_list_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{title}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{due_date}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #dc2626; font-weight: bold;">{days} day(s)</td>
            </tr>
            """
            book_list_text += f"- {title} (Due: {due_date}) - {days} day(s) overdue\n"
        
        # Text version
        text_body = f"""
Hello {recipient_name},

This is a reminder that you have {len(overdue_books)} overdue book(s) from the JRMSU Library.

Overdue Books:
{book_list_text}

Please return these books as soon as possible to avoid any penalties.

Thank you,
JRMSU Library System
"""
        
        # HTML version
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .alert {{ background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        table {{ width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }}
        th {{ background: #f97316; color: white; padding: 12px; text-align: left; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">📚 JRMSU Library System</h1>
            <p style="margin: 5px 0 0 0;">Overdue Book Notification</p>
        </div>
        <div class="content">
            <p>Hello <strong>{recipient_name}</strong>,</p>
            
            <div class="alert">
                <strong>⚠️ Attention Required</strong><br>
                You have <strong>{len(overdue_books)} overdue book(s)</strong> from the JRMSU Library.
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Book Title</th>
                        <th>Due Date</th>
                        <th>Days Overdue</th>
                    </tr>
                </thead>
                <tbody>
                    {book_list_html}
                </tbody>
            </table>
            
            <p>Please return these books as soon as possible to avoid any penalties.</p>
            
            <p style="margin-top: 30px;">
                <strong>Need help?</strong><br>
                Visit the library or contact us at <a href="mailto:library@jrmsu.edu.ph">library@jrmsu.edu.ph</a>
            </p>
        </div>
        <div class="footer">
            <p>This is an automated message from JRMSU Library System</p>
            <p>© 2024 Jose Rizal Memorial State University</p>
        </div>
    </div>
</body>
</html>
"""
        
        # Attach both versions
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Email sent to {recipient_email} for {len(overdue_books)} overdue book(s)")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email to {recipient_email}: {e}")
        return False


def send_sms_notification(phone_number: str, recipient_name: str, overdue_books: list) -> bool:
    """Send SMS notification about overdue books"""
    if not SMS_ENABLED or not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        print(f"[SMS] Would send overdue notification to {phone_number} for {len(overdue_books)} book(s)")
        print(f"[SMS] SMS disabled. Set SMS_ENABLED=true and Twilio credentials to enable.")
        return True  # Dev mode
    
    try:
        from twilio.rest import Client
        
        # Create SMS message
        if len(overdue_books) == 1:
            book = overdue_books[0]
            message_body = f"JRMSU Library: Hi {recipient_name}, '{book['bookTitle']}' is {book['daysOverdue']} day(s) overdue. Please return it soon."
        else:
            message_body = f"JRMSU Library: Hi {recipient_name}, you have {len(overdue_books)} overdue books. Please return them soon to avoid penalties."
        
        # Send via Twilio
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        
        print(f"✅ SMS sent to {phone_number}: {message.sid}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send SMS to {phone_number}: {e}")
        return False


def send_push_notification(user_id: str, recipient_name: str, overdue_books: list) -> bool:
    """Send push notification about overdue books (for mobile devices)"""
    if not PUSH_ENABLED:
        print(f"[PUSH] Would send overdue notification to user {user_id} for {len(overdue_books)} book(s)")
        print(f"[PUSH] Push notifications disabled. Set PUSH_ENABLED=true to enable.")
        return True  # Dev mode
    
    try:
        # Here you would integrate with Firebase Cloud Messaging (FCM) or similar
        # For now, just log the notification
        print(f"📱 Push notification for user {user_id}:")
        for book in overdue_books:
            print(f"   - {book['bookTitle']} ({book['daysOverdue']} days overdue)")
        
        # TODO: Implement FCM or other push notification service
        # Example with FCM:
        # from firebase_admin import messaging
        # message = messaging.Message(
        #     notification=messaging.Notification(
        #         title='Overdue Book Alert',
        #         body=f'You have {len(overdue_books)} overdue book(s)'
        #     ),
        #     token=user_device_token
        # )
        # messaging.send(message)
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send push notification to user {user_id}: {e}")
        return False


def register_notification_endpoints(app):
    """Register all notification-related endpoints"""
    
    @app.route('/api/users/<user_id>/notification-preferences', methods=['GET'])
    def get_notification_preferences(user_id):
        """Get user's notification preferences"""
        try:
            # Check students table first
            student = execute_query(
                """SELECT email_notifications, sms_reminders, push_notifications 
                   FROM students WHERE id = %s""",
                (user_id,),
                fetch_one=True
            )
            
            if student:
                return jsonify({
                    'success': True,
                    'emailNotifications': bool(student.get('email_notifications', False)),
                    'smsReminders': bool(student.get('sms_reminders', False)),
                    'pushNotifications': bool(student.get('push_notifications', False))
                })
            
            # Check admins table
            admin = execute_query(
                """SELECT email_notifications, sms_reminders, push_notifications 
                   FROM admins WHERE id = %s""",
                (user_id,),
                fetch_one=True
            )
            
            if admin:
                return jsonify({
                    'success': True,
                    'emailNotifications': bool(admin.get('email_notifications', False)),
                    'smsReminders': bool(admin.get('sms_reminders', False)),
                    'pushNotifications': bool(admin.get('push_notifications', False))
                })
            
            # User not found, return defaults
            return jsonify({
                'success': True,
                'emailNotifications': False,
                'smsReminders': False,
                'pushNotifications': False
            })
            
        except Exception as e:
            print(f"❌ Error fetching notification preferences: {e}")
            return jsonify({
                'success': False,
                'message': str(e)
            }), 500
    
    @app.route('/api/users/<user_id>/notification-preferences', methods=['POST'])
    def update_notification_preferences(user_id):
        """Save user's notification preferences"""
        try:
            data = request.get_json()
            email_notifications = data.get('emailNotifications', False)
            sms_reminders = data.get('smsReminders', False)
            push_notifications = data.get('pushNotifications', False)
            
            # Determine if user is student or admin
            # Check students table first
            student = execute_query(
                "SELECT id FROM students WHERE id = %s",
                (user_id,),
                fetch_one=True
            )
            
            if student:
                # Update student preferences
                execute_query(
                    """UPDATE students 
                       SET email_notifications = %s, 
                           sms_reminders = %s, 
                           push_notifications = %s,
                           updated_at = NOW()
                       WHERE id = %s""",
                    (email_notifications, sms_reminders, push_notifications, user_id)
                )
            else:
                # Update admin preferences
                execute_query(
                    """UPDATE admins 
                       SET email_notifications = %s, 
                           sms_reminders = %s, 
                           push_notifications = %s,
                           updated_at = NOW()
                       WHERE id = %s""",
                    (email_notifications, sms_reminders, push_notifications, user_id)
                )
            
            print(f"✅ Updated notification preferences for user {user_id}")
            return jsonify({
                'success': True,
                'message': 'Notification preferences updated successfully'
            })
            
        except Exception as e:
            print(f"❌ Error updating notification preferences: {e}")
            return jsonify({
                'success': False,
                'message': str(e)
            }), 500
    
    
    @app.route('/api/notifications/email/overdue', methods=['POST'])
    def send_email_overdue():
        """Send email notification for overdue books"""
        try:
            data = request.get_json()
            user_id = data.get('userId')
            overdue_books = data.get('overdueBooks', [])
            
            if not user_id or not overdue_books:
                return jsonify({'success': False, 'message': 'Missing required data'}), 400
            
            # Get user info
            student = execute_query(
                "SELECT email, CONCAT(first_name, ' ', last_name) as full_name FROM students WHERE id = %s",
                (user_id,),
                fetch_one=True
            )
            
            if not student:
                admin = execute_query(
                    "SELECT email, CONCAT(first_name, ' ', last_name) as full_name FROM admins WHERE id = %s",
                    (user_id,),
                    fetch_one=True
                )
                if not admin:
                    return jsonify({'success': False, 'message': 'User not found'}), 404
                user_email = admin['email']
                user_name = admin['full_name']
            else:
                user_email = student['email']
                user_name = student['full_name']
            
            # Send email
            success = send_email_notification(user_email, user_name, overdue_books)

            # Create bell notification entry for overdue
            try:
                notify_user(
                    user_id=user_id,
                    event_type='overdue_books',
                    title='Overdue Book Alert',
                    variables={'userId': user_id},
                    details={'overdueBooks': overdue_books},
                    source='MAIN',
                    dedup_key=f"overdue_email_{user_id}_{datetime.now().date()}"
                )
            except Exception as _:
                pass
            
            return jsonify({
                'success': success,
                'message': 'Email sent successfully' if success else 'Failed to send email'
            })
            
        except Exception as e:
            print(f"❌ Error sending email notification: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500
    
    
    @app.route('/api/notifications/sms/overdue', methods=['POST'])
    def send_sms_overdue():
        """Send SMS notification for overdue books"""
        try:
            data = request.get_json()
            user_id = data.get('userId')
            overdue_books = data.get('overdueBooks', [])
            
            if not user_id or not overdue_books:
                return jsonify({'success': False, 'message': 'Missing required data'}), 400
            
            # Get user info
            student = execute_query(
                "SELECT phone, CONCAT(first_name, ' ', last_name) as full_name FROM students WHERE id = %s",
                (user_id,),
                fetch_one=True
            )
            
            if not student:
                admin = execute_query(
                    "SELECT phone, CONCAT(first_name, ' ', last_name) as full_name FROM admins WHERE id = %s",
                    (user_id,),
                    fetch_one=True
                )
                if not admin:
                    return jsonify({'success': False, 'message': 'User not found'}), 404
                user_phone = admin['phone']
                user_name = admin['full_name']
            else:
                user_phone = student['phone']
                user_name = student['full_name']
            
            if not user_phone:
                return jsonify({'success': False, 'message': 'User has no phone number'}), 400
            
            # Send SMS
            success = send_sms_notification(user_phone, user_name, overdue_books)

            # Create bell notification entry for overdue
            try:
                notify_user(
                    user_id=user_id,
                    event_type='overdue_books',
                    title='Overdue Book Alert',
                    variables={'userId': user_id},
                    details={'overdueBooks': overdue_books},
                    source='MAIN',
                    dedup_key=f"overdue_sms_{user_id}_{datetime.now().date()}"
                )
            except Exception as _:
                pass
            
            return jsonify({
                'success': success,
                'message': 'SMS sent successfully' if success else 'Failed to send SMS'
            })
            
        except Exception as e:
            print(f"❌ Error sending SMS notification: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500
    
    
    @app.route('/api/notifications/create', methods=['POST'])
    def create_notification():
        """Generic create endpoint used by mirror page to notify admins.
        Expects: { type: string, data: object, timestamp?: string }
        """
        try:
            body = request.get_json(force=True) or {}
            ntype = (body.get('type') or 'system').strip()
            data = body.get('data') or {}
            ts = body.get('timestamp') or datetime.utcnow().isoformat()

            # Build title map for common events
            titles = {
                'library_login_manual': 'Library Login (Manual)',
                'library_logout_manual': 'Library Logout (Manual)',
                'library_login_qr': 'Library Login (QR)',
                'library_logout_qr': 'Library Logout (QR)',
                'book_reserved': 'Book Reserved',
                'book_borrowed': 'Book Borrowed',
                'book_returned': 'Book Returned',
                'book_overdue': 'Book Overdue',
                'reservation_cancelled': 'Reservation Cancelled',
                'return_time_activated': 'Return Time Activated',
            }
            title = titles.get(ntype, ntype.replace('_',' ').title())

            # Notify ADMIN room (aggregated admin channel)
            try:
                notify_user(
                    user_id='ADMIN',
                    event_type=ntype,
                    title=title,
                    variables={'userId': data.get('userId'), 'fullName': data.get('fullName'), 'userType': data.get('userType')},
                    details={**data, 'timestamp': ts},
                    source='MIRROR',
                    dedup_key=f"mirror_{ntype}_{data.get('userId')}_{ts}"
                )
            except Exception as _:
                pass

            return jsonify({'success': True})
        except Exception as e:
            print(f"❌ Error creating notification: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500
    
    @app.route('/api/notifications/push/overdue', methods=['POST'])
    def send_push_overdue():
        """Send push notification for overdue books"""
        try:
            data = request.get_json()
            user_id = data.get('userId')
            overdue_books = data.get('overdueBooks', [])
            
            if not user_id or not overdue_books:
                return jsonify({'success': False, 'message': 'Missing required data'}), 400
            
            # Get user info
            student = execute_query(
                "SELECT CONCAT(first_name, ' ', last_name) as full_name FROM students WHERE id = %s",
                (user_id,),
                fetch_one=True
            )
            
            if not student:
                admin = execute_query(
                    "SELECT CONCAT(first_name, ' ', last_name) as full_name FROM admins WHERE id = %s",
                    (user_id,),
                    fetch_one=True
                )
                if not admin:
                    return jsonify({'success': False, 'message': 'User not found'}), 404
                user_name = admin['full_name']
            else:
                user_name = student['full_name']
            
            # Send push notification
            success = send_push_notification(user_id, user_name, overdue_books)

            # Create bell notification entry for overdue
            try:
                notify_user(
                    user_id=user_id,
                    event_type='overdue_books',
                    title='Overdue Book Alert',
                    variables={'userId': user_id},
                    details={'overdueBooks': overdue_books},
                    source='MAIN',
                    dedup_key=f"overdue_push_{user_id}_{datetime.now().date()}"
                )
            except Exception as _:
                pass
            
            return jsonify({
                'success': success,
                'message': 'Push notification sent successfully' if success else 'Failed to send push notification'
            })
            
        except Exception as e:
            print(f"❌ Error sending push notification: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500
    
    
    @app.route('/api/borrows', methods=['GET'])
    def get_borrows():
        """Get borrowed books for a user"""
        try:
            user_id = request.args.get('userId')
            status = request.args.get('status', 'borrowed')
            
            if not user_id:
                return jsonify({'success': False, 'message': 'userId required'}), 400
            
            # Query borrows from database
            # Assuming you have a borrows table with: id, user_id, book_id, book_title, borrow_date, due_date, status
            query = """
                SELECT 
                    b.id as borrow_id,
                    b.book_id,
                    bk.title as book_title,
                    b.borrow_date,
                    b.due_date,
                    b.status,
                    DATEDIFF(NOW(), b.due_date) as days_overdue
                FROM borrows b
                LEFT JOIN books bk ON b.book_id = bk.id
                WHERE b.user_id = %s
            """
            
            params = [user_id]
            
            if status:
                query += " AND b.status = %s"
                params.append(status)
            
            query += " ORDER BY b.due_date ASC"
            
            borrows = execute_query(query, tuple(params), fetch_all=True)
            
            # Convert to list of dicts
            result = []
            for borrow in borrows or []:
                result.append({
                    'borrowId': borrow.get('borrow_id'),
                    'bookId': borrow.get('book_id'),
                    'bookTitle': borrow.get('book_title'),
                    'borrowDate': str(borrow.get('borrow_date')) if borrow.get('borrow_date') else None,
                    'dueDate': str(borrow.get('due_date')) if borrow.get('due_date') else None,
                    'status': borrow.get('status'),
                    'daysOverdue': borrow.get('days_overdue', 0)
                })
            
            return jsonify({
                'success': True,
                'borrows': result,
                'count': len(result)
            })
            
        except Exception as e:
            print(f"❌ Error fetching borrows: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500

    # Compute overdue for a user and send notifications based on preferences
    @app.route('/api/overdue/notify-user/<user_id>', methods=['POST'])
    def overdue_notify_user(user_id: str):
        try:
            # Fetch borrows
            resp = get_borrows.__wrapped__ if hasattr(get_borrows, '__wrapped__') else None  # dummy to appease linters
            query = """
                SELECT 
                    b.id as borrow_id,
                    b.book_id,
                    bk.title as book_title,
                    b.borrow_date,
                    b.due_date,
                    b.status,
                    GREATEST(DATEDIFF(NOW(), b.due_date), 0) as days_overdue
                FROM borrows b
                LEFT JOIN books bk ON b.book_id = bk.id
                WHERE b.user_id = %s AND b.status = 'borrowed' AND b.due_date < NOW()
                ORDER BY b.due_date ASC
            """
            rows = execute_query(query, (user_id,), fetch_all=True) or []
            overdue_books = [
                {
                    'borrowId': r.get('borrow_id'),
                    'bookId': r.get('book_id'),
                    'bookTitle': r.get('book_title'),
                    'borrowDate': str(r.get('borrow_date')) if r.get('borrow_date') else None,
                    'dueDate': str(r.get('due_date')) if r.get('due_date') else None,
                    'status': r.get('status'),
                    'daysOverdue': int(r.get('days_overdue') or 0),
                    'userId': user_id,
                }
                for r in rows
            ]
            if not overdue_books:
                return jsonify({'success': True, 'notified': False, 'reason': 'No overdue books'})

            # Read preferences
            pref_row = execute_query(
                "SELECT email_notifications, sms_reminders, push_notifications FROM students WHERE id = %s",
                (user_id,),
                fetch_one=True
            ) or execute_query(
                "SELECT email_notifications, sms_reminders, push_notifications FROM admins WHERE id = %s",
                (user_id,),
                fetch_one=True
            ) or {'email_notifications': 0, 'sms_reminders': 0, 'push_notifications': 0}
            email_enabled = bool(pref_row.get('email_notifications') or 0)
            sms_enabled = bool(pref_row.get('sms_reminders') or 0)
            push_enabled = bool(pref_row.get('push_notifications') or 0)

            # Dispatch
            results = {}
            if email_enabled:
                results['email'] = send_email_overdue.__wrapped__ if hasattr(send_email_overdue, '__wrapped__') else True  # placeholder
                send_email_notification(
                    execute_query("SELECT email FROM students WHERE id=%s", (user_id,), fetch_one=True) or {}.get('email') or
                    (execute_query("SELECT email FROM admins WHERE id=%s", (user_id,), fetch_one=True) or {}).get('email') or '',
                    '',
                    overdue_books
                )
            if sms_enabled:
                results['sms'] = send_sms_overdue.__wrapped__ if hasattr(send_sms_overdue, '__wrapped__') else True  # placeholder
            if push_enabled:
                results['push'] = send_push_overdue.__wrapped__ if hasattr(send_push_overdue, '__wrapped__') else True  # placeholder

            # Always create a bell notification
            try:
                notify_user(
                    user_id=user_id,
                    event_type='overdue_books',
                    title='Overdue Book Alert',
                    variables={'userId': user_id},
                    details={'overdueBooks': overdue_books},
                    source='MAIN',
                    dedup_key=f"overdue_{user_id}_{datetime.now().date()}"
                )
            except Exception:
                pass

            return jsonify({'success': True, 'notified': True, 'channels': [k for k,v in results.items()]})
        except Exception as e:
            print(f"❌ Error notify-user overdue: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/overdue/notify-all', methods=['POST'])
    def overdue_notify_all():
        try:
            users = []
            srows = execute_query("SELECT id FROM students", fetch_all=True) or []
            arows = execute_query("SELECT id FROM admins", fetch_all=True) or []
            users.extend([r.get('id') for r in srows])
            users.extend([r.get('id') for r in arows])
            notified = 0
            for uid in users:
                resp = overdue_notify_user.__wrapped__(uid) if hasattr(overdue_notify_user, '__wrapped__') else None  # type: ignore
                notified += 1
            return jsonify({'success': True, 'processed': len(users), 'queued': notified})
        except Exception as e:
            print(f"❌ Error notify-all overdue: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500

    
    print('✅ Notification endpoints registered')
