"""
Notifications Service with Jose AI Message Generation
Handles creating, retrieving, and managing notifications with unique AI-generated messages
"""

import random
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
import mysql.connector
from db import get_db_connection

class JoseAI:
    """Jose AI - Generates unique notification messages"""
    
    @staticmethod
    def generate_message(event_type: str, variables: Dict[str, str]) -> str:
        """
        Generate a unique message for the given event type using Jose AI templates
        
        Args:
            event_type: Type of event (e.g., 'welcome_new_user', 'password_reset_request')
            variables: Dictionary of variables to fill in template (e.g., {'userId': 'KC-23-A-00001'})
        
        Returns:
            Unique AI-generated message
        """
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Get all templates for this event type
            cursor.execute(
                "SELECT template FROM jose_message_templates WHERE event_type = %s",
                (event_type,)
            )
            templates = cursor.fetchall()
            
            if not templates:
                # Fallback generic message
                return f"Event: {event_type} - {json.dumps(variables)}"
            
            # Randomly select a template
            template = random.choice(templates)['template']
            
            # Replace variables in template
            message = template
            for key, value in variables.items():
                message = message.replace(f'{{{key}}}', str(value))
            
            return message
            
        finally:
            cursor.close()
            conn.close()

class NotificationsService:
    """Service for managing notifications and activity logs"""
    
    @staticmethod
    def create_notification(
        type: str,
        title: str,
        event_type: str,
        variables: Dict[str, str],
        details: Optional[Dict] = None,
        source: str = 'MAIN',
        target_role: Optional[str] = None,
        target_user_id: Optional[str] = None,
        action_required: bool = False,
        action_type: Optional[str] = None,
        action_payload: Optional[Dict] = None,
        dedup_key: Optional[str] = None
    ) -> str:
        """
        Create a notification with Jose AI-generated message
        
        Args:
            type: Notification type
            title: Short title
            event_type: Event type for Jose AI template selection
            variables: Variables for Jose AI message generation
            details: Additional details as JSON
            source: 'MAIN' or 'MIRROR'
            target_role: 'admin' for all admins, None for specific user
            target_user_id: Specific user ID, None for all admins
            action_required: Whether notification requires action
            action_type: Type of action (e.g., 'grant_decline')
            action_payload: Payload for action
            dedup_key: Key for deduplication (e.g., 'welcome_KC-23-A-00001')
        
        Returns:
            Notification ID
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Check deduplication if key provided
            if dedup_key and target_user_id:
                cursor.execute(
                    "SELECT id FROM notification_dedup WHERE user_id = %s AND event_type = %s AND event_key = %s",
                    (target_user_id, event_type, dedup_key)
                )
                if cursor.fetchone():
                    print(f"Notification deduplicated: {dedup_key}")
                    return None
                
                # Record dedup entry
                cursor.execute(
                    "INSERT INTO notification_dedup (user_id, event_type, event_key) VALUES (%s, %s, %s)",
                    (target_user_id, event_type, dedup_key)
                )
            
            # Generate unique message with Jose AI
            message = JoseAI.generate_message(event_type, variables)
            
            # Generate notification ID
            notif_id = f"NT-{int(datetime.now().timestamp() * 1000)}-{random.randint(1000, 9999)}"
            
            # Insert notification
            cursor.execute("""
                INSERT INTO notifications 
                (id, type, title, message, details, source, target_role, target_user_id, 
                 action_required, action_type, action_payload)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                notif_id,
                type,
                title,
                message,
                json.dumps(details) if details else None,
                source,
                target_role,
                target_user_id,
                action_required,
                action_type,
                json.dumps(action_payload) if action_payload else None
            ))
            
            conn.commit()
            return notif_id
            
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def create_activity_log(
        event_type: str,
        user_id: str,
        summary: str,
        details: Optional[Dict] = None,
        source: str = 'MAIN'
    ):
        """
        Create an activity log entry
        
        Args:
            event_type: Type of event
            user_id: User who performed the action
            summary: Short summary
            details: Additional details as JSON
            source: 'MAIN' or 'MIRROR'
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO activity_log (event_type, user_id, summary, details, source)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                event_type,
                user_id,
                summary,
                json.dumps(details) if details else None,
                source
            ))
            
            conn.commit()
            
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def get_notifications(
        user_id: Optional[str] = None,
        role: Optional[str] = None,
        filter: str = 'all',
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict]:
        """
        Get notifications for a user or role
        
        Args:
            user_id: Specific user ID
            role: Role (e.g., 'admin')
            filter: 'all' or 'unread'
            limit: Maximum number of notifications
            offset: Offset for pagination
        
        Returns:
            List of notifications
        """
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = """
                SELECT * FROM notifications 
                WHERE (target_user_id = %s OR target_role = %s)
            """
            params = [user_id, role]
            
            if filter == 'unread':
                query += " AND read_flag = FALSE"
            
            query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            notifications = cursor.fetchall()
            
            # Parse JSON fields
            for notif in notifications:
                if notif['details']:
                    notif['details'] = json.loads(notif['details'])
                if notif['action_payload']:
                    notif['action_payload'] = json.loads(notif['action_payload'])
            
            return notifications
            
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def get_unread_count(user_id: Optional[str] = None, role: Optional[str] = None) -> int:
        """Get count of unread notifications"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT COUNT(*) FROM notifications 
                WHERE (target_user_id = %s OR target_role = %s) AND read_flag = FALSE
            """, (user_id, role))
            
            return cursor.fetchone()[0]
            
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def mark_as_read(notification_ids: List[str]):
        """Mark notifications as read"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            placeholders = ','.join(['%s'] * len(notification_ids))
            cursor.execute(
                f"UPDATE notifications SET read_flag = TRUE WHERE id IN ({placeholders})",
                notification_ids
            )
            conn.commit()
            
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def mark_all_as_read(user_id: Optional[str] = None, role: Optional[str] = None):
        """Mark all notifications as read for a user or role"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE notifications 
                SET read_flag = TRUE 
                WHERE (target_user_id = %s OR target_role = %s)
            """, (user_id, role))
            conn.commit()
            
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def get_activity_log(limit: int = 100, offset: int = 0) -> List[Dict]:
        """Get recent activity log entries"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("""
                SELECT * FROM activity_log 
                ORDER BY timestamp DESC 
                LIMIT %s OFFSET %s
            """, (limit, offset))
            
            activities = cursor.fetchall()
            
            # Parse JSON fields
            for activity in activities:
                if activity['details']:
                    activity['details'] = json.loads(activity['details'])
            
            return activities
            
        finally:
            cursor.close()
            conn.close()

# Helper functions for common notification patterns

def notify_all_admins(
    event_type: str,
    title: str,
    variables: Dict[str, str],
    details: Optional[Dict] = None,
    source: str = 'MAIN',
    action_required: bool = False,
    action_type: Optional[str] = None,
    action_payload: Optional[Dict] = None
) -> str:
    """Create notification for all admins"""
    return NotificationsService.create_notification(
        type='admin',
        title=title,
        event_type=event_type,
        variables=variables,
        details=details,
        source=source,
        target_role='admin',
        action_required=action_required,
        action_type=action_type,
        action_payload=action_payload
    )

def notify_user(
    user_id: str,
    event_type: str,
    title: str,
    variables: Dict[str, str],
    details: Optional[Dict] = None,
    source: str = 'MAIN',
    dedup_key: Optional[str] = None
) -> str:
    """Create notification for specific user"""
    return NotificationsService.create_notification(
        type='personal',
        title=title,
        event_type=event_type,
        variables=variables,
        details=details,
        source=source,
        target_user_id=user_id,
        dedup_key=dedup_key
    )

def log_activity(
    event_type: str,
    user_id: str,
    summary: str,
    details: Optional[Dict] = None,
    source: str = 'MAIN'
):
    """Log activity to Recent Activity feed"""
    NotificationsService.create_activity_log(
        event_type=event_type,
        user_id=user_id,
        summary=summary,
        details=details,
        source=source
    )
