"""
Registration and CRUD Endpoints for Students and Admins
Ensures all user registrations persist to MySQL database
"""

from flask import Blueprint, request, jsonify
from db import StudentDB, AdminDB, execute_query, get_db_cursor
from datetime import datetime
import bcrypt

registration_bp = Blueprint('registration', __name__, url_prefix='/api')

# ============================================================================
# STUDENT REGISTRATION & CRUD ENDPOINTS
# ============================================================================

@registration_bp.route('/students/register', methods=['POST'])
def register_student():
    """
    Register a new student with full persistence to MySQL.
    Called by frontend Registration.tsx after form submission.
    
    Expected payload:
    {
        "studentId": "KC-23-A-00243",
        "firstName": "Juan",
        "lastName": "Dela Cruz",
        "email": "juan@jrmsu.edu.ph",
        "password": "SecurePass123",
        "birthdate": "2003-05-15",
        ... (all other address/academic fields)
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['studentId', 'firstName', 'lastName', 'email', 'password']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
        
        # Check if student already exists
        existing = StudentDB.get_student_by_id(data['studentId'])
        if existing:
            return jsonify({'error': 'Student ID already registered'}), 409
        
        existing_email = StudentDB.get_student_by_email(data['email'])
        if existing_email:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Hash password securely using bcrypt
        password_hash = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt()).decode()
        
        # Register in MySQL
        success, message = StudentDB.register_student(
            student_id=data['studentId'],
            first_name=data.get('firstName', ''),
            middle_name=data.get('middleName', ''),
            last_name=data.get('lastName', ''),
            suffix=data.get('suffix', ''),
            birthdate=data.get('birthdate', ''),
            gender=data.get('gender', ''),
            email=data['email'],
            phone=data.get('phone', ''),
            department=data.get('department', ''),
            course=data.get('course', ''),
            year_level=data.get('yearLevel', ''),
            current_street=data.get('currentStreet', ''),
            current_barangay=data.get('currentBarangay', ''),
            current_municipality=data.get('currentMunicipality', ''),
            current_province=data.get('currentProvince', ''),
            current_region=data.get('currentRegion', ''),
            current_zip=data.get('currentZip', ''),
            current_landmark=data.get('currentLandmark', ''),
            permanent_street=data.get('permanentStreet', ''),
            permanent_barangay=data.get('permanentBarangay', ''),
            permanent_municipality=data.get('permanentMunicipality', ''),
            permanent_province=data.get('permanentProvince', ''),
            permanent_region=data.get('permanentRegion', ''),
            permanent_zip=data.get('permanentZip', ''),
            permanent_notes=data.get('permanentNotes', ''),
            same_as_current=data.get('sameAsCurrent', True),
            password_hash=password_hash
        )
        
        if success:
            print(f"✅ Student {data['studentId']} registered successfully")
            return jsonify({
                'message': message,
                'studentId': data['studentId'],
                'email': data['email']
            }), 201
        
        return jsonify({'error': message}), 400
        
    except Exception as e:
        print(f"❌ Student registration error: {str(e)}")
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@registration_bp.route('/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    """
    Delete a student and cascade delete all related records
    (borrowing history, reservations, etc.)
    Requires admin authentication.
    """
    try:
        # TODO: Add proper authentication check here
        # For now, assume caller is authenticated admin
        
        if not student_id:
            return jsonify({'error': 'Student ID required'}), 400
        
        with get_db_cursor() as cursor:
            # First, check if student exists
            cursor.execute('SELECT * FROM students WHERE student_id = %s', (student_id,))
            student = cursor.fetchone()
            
            if not student:
                return jsonify({'error': f'Student {student_id} not found'}), 404
            
            # Delete in order: borrow_records, reservations, then student
            cursor.execute('DELETE FROM borrow_records WHERE student_id = %s', (student_id,))
            cursor.execute('DELETE FROM reservations WHERE student_id = %s', (student_id,))
            cursor.execute('DELETE FROM students WHERE student_id = %s', (student_id,))
        
        print(f"✅ Student {student_id} deleted successfully with cascade")
        return jsonify({
            'message': f'Student {student_id} and all related records deleted'
        }), 200
        
    except Exception as e:
        print(f"❌ Delete student error: {str(e)}")
        return jsonify({'error': f'Delete failed: {str(e)}'}), 500


# ============================================================================
# ADMIN REGISTRATION & CRUD ENDPOINTS
# ============================================================================

@registration_bp.route('/admins/register', methods=['POST'])
def register_admin():
    """
    Register a new admin with full persistence to MySQL.
    Called by frontend Registration.tsx admin tab.
    
    Expected payload:
    {
        "adminId": "KCL-00001",
        "firstName": "John",
        "lastName": "Santos",
        "email": "john@jrmsu.edu.ph",
        "password": "SecureAdminPass123",
        "position": "Librarian",
        "birthdate": "1990-03-20",
        ... (all address fields)
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['adminId', 'firstName', 'lastName', 'email', 'password', 'position']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
        
        # Check if admin already exists
        existing = AdminDB.get_admin_by_id(data['adminId'])
        if existing:
            return jsonify({'error': 'Admin ID already registered'}), 409
        
        # Check email uniqueness (across both students and admins for simplicity)
        existing_email = AdminDB.get_admin_by_id(data['email']) or \
                         execute_query('SELECT * FROM students WHERE email = %s', (data['email'],), fetch_one=True)
        if existing_email:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Hash password securely
        password_hash = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt()).decode()
        
        # Register in MySQL
        success, message = AdminDB.register_admin(
            admin_id=data['adminId'],
            first_name=data.get('firstName', ''),
            middle_name=data.get('middleName', ''),
            last_name=data.get('lastName', ''),
            suffix=data.get('suffix', ''),
            birthdate=data.get('birthdate', ''),
            gender=data.get('gender', ''),
            email=data['email'],
            phone=data.get('phone', ''),
            position=data['position'],
            street=data.get('street', ''),
            barangay=data.get('barangay', ''),
            municipality=data.get('municipality', ''),
            province=data.get('province', ''),
            region=data.get('region', ''),
            zip_code=data.get('zipCode', ''),
            current_street=data.get('currentStreet', ''),
            current_barangay=data.get('currentBarangay', ''),
            current_municipality=data.get('currentMunicipality', ''),
            current_province=data.get('currentProvince', ''),
            current_region=data.get('currentRegion', ''),
            current_zip=data.get('currentZip', ''),
            current_landmark=data.get('currentLandmark', ''),
            same_as_current=data.get('sameAsCurrent', True),
            password_hash=password_hash
        )
        
        if success:
            print(f"✅ Admin {data['adminId']} registered successfully")
            return jsonify({
                'message': message,
                'adminId': data['adminId'],
                'email': data['email']
            }), 201
        
        return jsonify({'error': message}), 400
        
    except Exception as e:
        print(f"❌ Admin registration error: {str(e)}")
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@registration_bp.route('/admins/<admin_id>', methods=['DELETE'])
def delete_admin(admin_id):
    """
    Delete an admin.
    Requires admin authentication and proper authorization.
    """
    try:
        # TODO: Add proper authentication check
        
        if not admin_id:
            return jsonify({'error': 'Admin ID required'}), 400
        
        with get_db_cursor() as cursor:
            # Check if admin exists
            cursor.execute('SELECT * FROM admins WHERE admin_id = %s OR id = %s', (admin_id, admin_id))
            admin = cursor.fetchone()
            
            if not admin:
                return jsonify({'error': f'Admin {admin_id} not found'}), 404
            
            # Delete the admin
            cursor.execute('DELETE FROM admins WHERE admin_id = %s OR id = %s', (admin_id, admin_id))
        
        print(f"✅ Admin {admin_id} deleted successfully")
        return jsonify({
            'message': f'Admin {admin_id} deleted'
        }), 200
        
    except Exception as e:
        print(f"❌ Delete admin error: {str(e)}")
        return jsonify({'error': f'Delete failed: {str(e)}'}), 500


# ============================================================================
# PASSWORD CHANGE ENDPOINT (for both students and admins)
# ============================================================================

@registration_bp.route('/users/<user_id>/change-password', methods=['POST'])
def change_password(user_id):
    """
    Change user password with verification of old password.
    Requires authentication.
    
    Expected payload:
    {
        "oldPassword": "CurrentPassword123",
        "newPassword": "NewPassword456"
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('oldPassword') or not data.get('newPassword'):
            return jsonify({'error': 'Old password and new password required'}), 400
        
        if len(data['newPassword']) < 8:
            return jsonify({'error': 'New password must be at least 8 characters'}), 400
        
        # Try to find user in students table first, then admins
        with get_db_cursor() as cursor:
            cursor.execute('SELECT * FROM students WHERE student_id = %s LIMIT 1', (user_id,))
            user = cursor.fetchone()
            
            if not user:
                cursor.execute('SELECT * FROM admins WHERE admin_id = %s OR id = %s LIMIT 1', (user_id, user_id))
                user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Verify old password
            old_hash = user.get('password_hash') or user.get('passwordHash')
            if not old_hash:
                return jsonify({'error': 'Unable to verify password'}), 500
            
            # Check if old password matches (bcrypt verify)
            try:
                if not bcrypt.checkpw(data['oldPassword'].encode(), old_hash.encode()):
                    return jsonify({'error': 'Incorrect current password'}), 401
            except:
                # Fallback for legacy hashes
                return jsonify({'error': 'Password verification failed'}), 401
            
            # Hash new password
            new_hash = bcrypt.hashpw(data['newPassword'].encode(), bcrypt.gensalt()).decode()
            
            # Update password
            if 'student_id' in user:
                cursor.execute('UPDATE students SET password_hash = %s WHERE student_id = %s',
                             (new_hash, user_id))
            else:
                cursor.execute('UPDATE admins SET password_hash = %s WHERE admin_id = %s OR id = %s',
                             (new_hash, user_id, user_id))
        
        print(f"✅ Password changed for user {user_id}")
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Change password error: {str(e)}")
        return jsonify({'error': f'Password change failed: {str(e)}'}), 500
