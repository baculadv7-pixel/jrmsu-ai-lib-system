#!/usr/bin/env python3
"""
Library Session Manager
Handles login/logout tracking with odd/even action counting
"""

import time
import uuid
from flask import request, jsonify
from db import execute_query

def get_user_active_session(user_id: str):
    """Check if user has an active library session"""
    try:
        query = """
            SELECT session_id, user_id, user_type, full_name, login_time, 
                   action_count, status
            FROM library_sessions
            WHERE user_id = %s AND status = 'inside_library'
            ORDER BY login_time DESC
            LIMIT 1
        """
        result = execute_query(query, (user_id,), fetch_one=True)
        return result
    except Exception as e:
        print(f"Error checking active session: {e}")
        return None

def create_login_session(user_id: str, user_type: str, full_name: str, method: str = 'manual'):
    """Create a new login session (ODD action)"""
    try:
        session_id = f"lib-{uuid.uuid4()}"
        login_time = int(time.time())
        
        # Get the last action count for this user
        last_action_query = """
            SELECT action_count FROM library_sessions
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """
        last_action = execute_query(last_action_query, (user_id,), fetch_one=True)
        
        # Calculate new action count (should be ODD for login)
        if last_action and last_action.get('action_count'):
            new_action_count = last_action['action_count'] + 1
        else:
            new_action_count = 1  # First action is always ODD (login)
        
        # Ensure it's ODD
        if new_action_count % 2 == 0:
            new_action_count += 1
        
        # Insert new session
        insert_query = """
            INSERT INTO library_sessions 
            (session_id, user_id, user_type, full_name, login_time, 
             method, status, action_count, created_at)
            VALUES (%s, %s, %s, %s, FROM_UNIXTIME(%s), %s, 'inside_library', %s, NOW())
        """
        execute_query(insert_query, (
            session_id, user_id, user_type, full_name, 
            login_time, method, new_action_count
        ))
        
        # Insert into activity_log
        activity_query = """
            INSERT INTO activity_log 
            (actor_id, actor_name, event, details, source, timestamp)
            VALUES (%s, %s, 'LIBRARY LOGIN', %s, 'MIRROR', FROM_UNIXTIME(%s))
        """
        execute_query(activity_query, (
            user_id, full_name, 
            f'Method: {method}, Action #{new_action_count} (ODD)', 
            login_time
        ))
        
        print(f"✅ Library login: {full_name} ({user_id}) - Action #{new_action_count} (ODD)")
        
        return {
            'sessionId': session_id,
            'userId': user_id,
            'userType': user_type,
            'fullName': full_name,
            'loginTime': login_time,
            'status': 'inside_library',
            'actionCount': new_action_count,
            'actionType': 'ODD'
        }
    except Exception as e:
        print(f"Error creating login session: {e}")
        raise

def create_logout_session(user_id: str, session_id: str = None):
    """End a login session (EVEN action)"""
    try:
        logout_time = int(time.time())
        
        # Get active session
        active_session = get_user_active_session(user_id)
        if not active_session:
            return {'error': 'No active session found'}, 404
        
        session_id = active_session['session_id']
        full_name = active_session['full_name']
        login_action_count = active_session['action_count']
        
        # Calculate logout action count (should be EVEN)
        logout_action_count = login_action_count + 1
        
        # Ensure it's EVEN
        if logout_action_count % 2 != 0:
            logout_action_count += 1
        
        # Update session
        update_query = """
            UPDATE library_sessions
            SET logout_time = FROM_UNIXTIME(%s),
                status = 'logged_out',
                action_count = %s,
                updated_at = NOW()
            WHERE session_id = %s
        """
        execute_query(update_query, (logout_time, logout_action_count, session_id))
        
        # Insert into activity_log
        activity_query = """
            INSERT INTO activity_log 
            (actor_id, actor_name, event, details, source, timestamp)
            VALUES (%s, %s, 'LIBRARY LOGOUT', %s, 'MIRROR', FROM_UNIXTIME(%s))
        """
        execute_query(activity_query, (
            user_id, full_name, 
            f'Session ended, Action #{logout_action_count} (EVEN)', 
            logout_time
        ))
        
        print(f"✅ Library logout: {full_name} ({user_id}) - Action #{logout_action_count} (EVEN)")
        
        return {
            'sessionId': session_id,
            'userId': user_id,
            'fullName': full_name,
            'logoutTime': logout_time,
            'status': 'logged_out',
            'actionCount': logout_action_count,
            'actionType': 'EVEN'
        }
    except Exception as e:
        print(f"Error creating logout session: {e}")
        raise

def notify_all_admins(app, message: str, notification_type: str, meta: dict = None):
    """Send notification to all admins"""
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
                    'actor_id': meta.get('userId', 'system') if meta else 'system',
                }
                lst = _ensure_user_store(admin_id)
                lst.insert(0, notif)
                _emit('notification.new', admin_id, notif)
    except Exception as e:
        print(f"Error notifying admins: {e}")

def check_forgotten_logouts():
    """Check for users who forgot to logout (run at 5 PM)"""
    try:
        current_time = int(time.time())
        
        # Get all active sessions
        query = """
            SELECT session_id, user_id, user_type, full_name, login_time
            FROM library_sessions
            WHERE status = 'inside_library'
        """
        active_sessions = execute_query(query, fetch_all=True) or []
        
        forgotten = []
        for session in active_sessions:
            # Check if logged in for more than 8 hours
            login_time = int(session['login_time'].timestamp()) if hasattr(session['login_time'], 'timestamp') else session['login_time']
            if current_time - login_time > (8 * 3600):
                forgotten.append(session)
        
        return forgotten
    except Exception as e:
        print(f"Error checking forgotten logouts: {e}")
        return []

def register_library_session_endpoints(app):
    """Register all library session endpoints"""
    
    @app.route('/api/library/check-session/<user_id>', methods=['GET'])
    def check_user_session(user_id: str):
        """Check if specific user has active session"""
        try:
            active_session = get_user_active_session(user_id)
            
            if active_session:
                login_time = active_session['login_time']
                if hasattr(login_time, 'timestamp'):
                    login_time = int(login_time.timestamp())
                
                return jsonify({
                    'hasActiveSession': True,
                    'sessionId': active_session['session_id'],
                    'loginTime': login_time,
                    'actionCount': active_session.get('action_count', 1),
                    'actionType': 'ODD'
                })
            else:
                return jsonify({'hasActiveSession': False})
        except Exception as e:
            print(f"Error checking session: {e}")
            return jsonify({'hasActiveSession': False}), 500
    
    @app.route('/api/library/login', methods=['POST'])
    def library_login():
        """Handle library login"""
        try:
            body = request.get_json(force=True)
            user_id = (body.get('userId') or '').strip()
            user_type = (body.get('userType') or '').strip()
            full_name = (body.get('fullName') or '').strip()
            method = (body.get('method') or 'manual').strip()
            
            if not user_id or not user_type:
                return jsonify(error='User ID and type required'), 400
            
            # Check if user already has active session
            active_session = get_user_active_session(user_id)
            if active_session:
                return jsonify(
                    error='User already has active session',
                    hasActiveSession=True,
                    sessionId=active_session['session_id']
                ), 400
            
            # Create new login session
            session_data = create_login_session(user_id, user_type, full_name, method)
            
            # Notify all admins
            notify_all_admins(app, 
                f"{full_name} ({user_id}) logged into the library", 
                'library_login', 
                {
                    'userId': user_id,
                    'userType': user_type,
                    'action': 'login',
                    'actionCount': session_data['actionCount'],
                    'actionType': 'ODD'
                }
            )
            
            return jsonify(session_data)
        except Exception as e:
            print(f"Error in library_login: {e}")
            return jsonify(error=str(e)), 500
    
    @app.route('/api/library/logout', methods=['POST'])
    def library_logout():
        """Handle library logout"""
        try:
            body = request.get_json(force=True)
            user_id = (body.get('userId') or '').strip()
            session_id = (body.get('sessionId') or '').strip()
            
            if not user_id:
                return jsonify(error='User ID required'), 400
            
            # Create logout session
            result = create_logout_session(user_id, session_id)
            
            if isinstance(result, tuple):  # Error case
                return result
            
            # Notify all admins
            notify_all_admins(app, 
                f"{result['fullName']} ({user_id}) logged out from the library", 
                'library_logout', 
                {
                    'userId': user_id,
                    'action': 'logout',
                    'actionCount': result['actionCount'],
                    'actionType': 'EVEN'
                }
            )
            
            return jsonify(result)
        except Exception as e:
            print(f"Error in library_logout: {e}")
            return jsonify(error=str(e)), 500
    
    @app.route('/api/library/forgotten-logouts', methods=['GET'])
    def api_forgotten_logouts():
        """Get users who forgot to logout"""
        try:
            forgotten = check_forgotten_logouts()
            
            # Notify all admins and users
            for session in forgotten:
                user_id = session['user_id']
                full_name = session['full_name']
                
                # Notify admins
                notify_all_admins(app, 
                    f"{full_name} ({user_id}) forgot to logout from the library", 
                    'forgotten_logout', 
                    {
                        'userId': user_id,
                        'userType': session['user_type'],
                        'action': 'forgotten_logout'
                    }
                )
                
                # Notify user
                try:
                    from app import _new_notif_id, _ensure_user_store, _emit
                    notif = {
                        'id': _new_notif_id(),
                        'user_id': user_id,
                        'title': 'Logout Reminder',
                        'body': f"Hi {full_name}! You forgot to logout from the library. Please logout before leaving. The library closes at 5 PM.",
                        'type': 'forgotten_logout',
                        'meta': {'sessionId': session['session_id']},
                        'created_at': int(time.time()),
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
            
            return jsonify(forgotten=[{
                'userId': s['user_id'],
                'fullName': s['full_name'],
                'loginTime': int(s['login_time'].timestamp()) if hasattr(s['login_time'], 'timestamp') else s['login_time']
            } for s in forgotten], count=len(forgotten))
        except Exception as e:
            print(f"Error in forgotten_logouts: {e}")
            return jsonify(error=str(e)), 500
    
    print("✅ Library session endpoints registered")
