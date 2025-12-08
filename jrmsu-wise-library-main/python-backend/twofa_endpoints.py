#!/usr/bin/env python3
"""
2FA (TOTP) Management Endpoints
Handles enabling, disabling, and verifying 2FA for students and admins
Persists state to database to survive system restarts
"""

from flask import request, jsonify
from db import StudentDB, AdminDB, execute_query, get_db_cursor
from twofa import verify_totp_code
import json

def register_twofa_endpoints(app):
    """Register 2FA endpoints to Flask app"""
    
    @app.route('/api/users/2fa/enable', methods=['POST'])
    def enable_2fa():
        """Enable 2FA for a user and save to database"""
        body = request.get_json(force=True) or {}
        user_id = (body.get('user_id') or '').strip()
        user_type = (body.get('user_type') or '').strip().lower()  # 'student' or 'admin'
        two_factor_secret = (body.get('two_factor_secret') or '').strip()
        
        if not user_id or not user_type or not two_factor_secret:
            return jsonify(error='user_id, user_type, and two_factor_secret are required'), 400
        
        if user_type not in ('student', 'admin'):
            return jsonify(error='user_type must be "student" or "admin"'), 400
        
        try:
            # Determine table and ID column based on user type
            if user_type == 'admin':
                table = 'admins'
                id_field = 'admin_id'
            else:
                table = 'students'
                id_field = 'student_id'
            
            # Update database: set two_factor_enabled=true and store secret
            query = f"""
                UPDATE {table}
                SET two_factor_enabled = TRUE,
                    two_factor_secret = %s,
                    updated_at = NOW()
                WHERE {id_field} = %s
            """
            execute_query(query, (two_factor_secret, user_id))
            
            return jsonify(ok=True, message='2FA enabled successfully'), 200
            
        except Exception as e:
            print(f"⚠️ Failed to enable 2FA for {user_type} {user_id}: {e}")
            return jsonify(error=f'Failed to enable 2FA: {str(e)}'), 500
    
    
    @app.route('/api/users/2fa/disable', methods=['POST'])
    def disable_2fa():
        """Disable 2FA for a user"""
        body = request.get_json(force=True) or {}
        user_id = (body.get('user_id') or '').strip()
        user_type = (body.get('user_type') or '').strip().lower()
        
        if not user_id or not user_type:
            return jsonify(error='user_id and user_type are required'), 400
        
        if user_type not in ('student', 'admin'):
            return jsonify(error='user_type must be "student" or "admin"'), 400
        
        try:
            # Determine table and ID column based on user type
            if user_type == 'admin':
                table = 'admins'
                id_field = 'admin_id'
            else:
                table = 'students'
                id_field = 'student_id'
            
            # Update database: set two_factor_enabled=false and clear secret
            query = f"""
                UPDATE {table}
                SET two_factor_enabled = FALSE,
                    two_factor_secret = NULL,
                    updated_at = NOW()
                WHERE {id_field} = %s
            """
            execute_query(query, (user_id,))
            
            return jsonify(ok=True, message='2FA disabled successfully'), 200
            
        except Exception as e:
            print(f"⚠️ Failed to disable 2FA for {user_type} {user_id}: {e}")
            return jsonify(error=f'Failed to disable 2FA: {str(e)}'), 500
    
    
    @app.route('/api/users/<user_id>/2fa/status', methods=['GET'])
    def get_2fa_status(user_id: str):
        """Get 2FA status for a user"""
        try:
            # Try admin first
            admin = AdminDB.get_admin_by_id(user_id)
            if admin:
                return jsonify({
                    'user_id': user_id,
                    'user_type': 'admin',
                    'two_factor_enabled': bool(admin.get('two_factor_enabled')),
                    'has_secret': bool(admin.get('two_factor_secret'))
                }), 200
            
            # Then student
            student = StudentDB.get_student_by_id(user_id)
            if student:
                return jsonify({
                    'user_id': user_id,
                    'user_type': 'student',
                    'two_factor_enabled': bool(student.get('two_factor_enabled')),
                    'has_secret': bool(student.get('two_factor_secret'))
                }), 200
            
            return jsonify(error='User not found'), 404
            
        except Exception as e:
            print(f"⚠️ Failed to get 2FA status for {user_id}: {e}")
            return jsonify(error=str(e)), 500
    
    
    @app.route('/api/users/2fa/verify', methods=['POST'])
    def verify_2fa():
        """Verify a 2FA code (for login or verification)"""
        body = request.get_json(force=True) or {}
        user_id = (body.get('user_id') or '').strip()
        user_type = (body.get('user_type') or '').strip().lower()
        code = (body.get('code') or '').strip()
        
        if not user_id or not user_type or not code:
            return jsonify(error='user_id, user_type, and code are required'), 400
        
        try:
            # Get user and their 2FA secret
            if user_type == 'admin':
                user = AdminDB.get_admin_by_id(user_id)
            else:
                user = StudentDB.get_student_by_id(user_id)
            
            if not user:
                return jsonify(valid=False, error='User not found'), 404
            
            secret = user.get('two_factor_secret')
            if not secret:
                return jsonify(valid=False, error='2FA not enabled for this user'), 400
            
            # Verify the code (with time window tolerance)
            is_valid = verify_totp_code(secret, code, window=1)
            
            return jsonify(valid=is_valid), 200 if is_valid else 401
            
        except Exception as e:
            print(f"⚠️ Failed to verify 2FA for {user_type} {user_id}: {e}")
            return jsonify(valid=False, error=str(e)), 500
    
    
    print("✅ 2FA endpoints registered")
