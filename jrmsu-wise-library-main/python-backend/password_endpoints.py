#!/usr/bin/env python3
"""
Password Change and Reset Endpoints
Handles user password management with bcrypt hashing
"""

import bcrypt
import time
from flask import request, jsonify
from db import execute_query

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def register_password_endpoints(app):
    """Register password management endpoints"""
    
    @app.route('/api/users/<user_id>/change-password', methods=['POST'])
    def change_password(user_id: str):
        """Change user password (requires current password)"""
        try:
            body = request.get_json(force=True)
            user_type = body.get('userType', '').lower()
            current_password = body.get('currentPassword', '')
            new_password = body.get('newPassword', '')
            
            if not current_password or not new_password:
                return jsonify({
                    'success': False,
                    'message': 'Current password and new password are required'
                }), 400
            
            # Validate password strength
            if len(new_password) < 8:
                return jsonify({
                    'success': False,
                    'message': 'Password must be at least 8 characters long'
                }), 400
            
            # Determine table based on user type
            if user_type == 'admin':
                table = 'admins'
                id_field = 'admin_id'
            elif user_type == 'student':
                table = 'students'
                id_field = 'student_id'
            else:
                return jsonify({
                    'success': False,
                    'message': 'Invalid user type'
                }), 400
            
            # Get current password hash
            query = f"SELECT password_hash, first_name, last_name FROM {table} WHERE {id_field} = %s"
            user = execute_query(query, (user_id,), fetch_one=True)
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Verify current password
            if not verify_password(current_password, user['password_hash']):
                return jsonify({
                    'success': False,
                    'message': 'Current password is incorrect'
                }), 401
            
            # Hash new password
            new_hash = hash_password(new_password)
            
            # Update password
            update_query = f"""
                UPDATE {table}
                SET password_hash = %s,
                    updated_at = NOW()
                WHERE {id_field} = %s
            """
            execute_query(update_query, (new_hash, user_id))
            
            # Log activity
            full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            activity_query = """
                INSERT INTO activity_log (
                    actor_id, actor_name, event, details, source, timestamp
                ) VALUES (%s, %s, %s, %s, %s, NOW())
            """
            execute_query(activity_query, (
                user_id,
                full_name,
                'PASSWORD_CHANGED',
                'User changed their password',
                'MAIN'
            ))
            
            print(f"✅ Password changed for {user_type}: {user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Password changed successfully'
            })
            
        except Exception as e:
            print(f"Error changing password: {e}")
            return jsonify({
                'success': False,
                'message': f'Failed to change password: {str(e)}'
            }), 500
    
    @app.route('/api/users/<user_id>/reset-password', methods=['POST'])
    def reset_password(user_id: str):
        """Reset user password (admin action, no current password required)"""
        try:
            body = request.get_json(force=True)
            user_type = body.get('userType', '').lower()
            new_password = body.get('newPassword', '')
            
            if not new_password:
                return jsonify({
                    'success': False,
                    'message': 'New password is required'
                }), 400
            
            # Validate password strength
            if len(new_password) < 8:
                return jsonify({
                    'success': False,
                    'message': 'Password must be at least 8 characters long'
                }), 400
            
            # Determine table based on user type
            if user_type == 'admin':
                table = 'admins'
                id_field = 'admin_id'
            elif user_type == 'student':
                table = 'students'
                id_field = 'student_id'
            else:
                return jsonify({
                    'success': False,
                    'message': 'Invalid user type'
                }), 400
            
            # Get user info
            query = f"SELECT first_name, last_name FROM {table} WHERE {id_field} = %s"
            user = execute_query(query, (user_id,), fetch_one=True)
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Hash new password
            new_hash = hash_password(new_password)
            
            # Update password
            update_query = f"""
                UPDATE {table}
                SET password_hash = %s,
                    updated_at = NOW()
                WHERE {id_field} = %s
            """
            execute_query(update_query, (new_hash, user_id))
            
            # Log activity
            full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            activity_query = """
                INSERT INTO activity_log (
                    actor_id, actor_name, event, details, source, timestamp
                ) VALUES (%s, %s, %s, %s, %s, NOW())
            """
            execute_query(activity_query, (
                user_id,
                full_name,
                'PASSWORD_RESET',
                'Admin reset user password',
                'MAIN'
            ))
            
            print(f"✅ Password reset for {user_type}: {user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Password reset successfully'
            })
            
        except Exception as e:
            print(f"Error resetting password: {e}")
            return jsonify({
                'success': False,
                'message': f'Failed to reset password: {str(e)}'
            }), 500
    
    print("✅ Password endpoints registered")
