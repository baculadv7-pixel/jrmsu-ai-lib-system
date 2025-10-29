#!/usr/bin/env python3
"""
MySQL Database Connection Module
Provides connection and query utilities for JRMSU Library System
"""
import os
import mysql.connector
from mysql.connector import Error
from typing import Optional, Dict, List, Any, Tuple
from contextlib import contextmanager

# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'database': os.getenv('DB_NAME', 'jrmsu_library'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'autocommit': False,
    'raise_on_warnings': True,
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'use_pure': True  # Use pure Python implementation
}

@contextmanager
def get_db_connection():
    """
    Context manager for database connections.
    Automatically handles connection creation and cleanup.
    
    Usage:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM students")
            results = cursor.fetchall()
    """
    connection = None
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        yield connection
    except Error as e:
        print(f"Database connection error: {e}")
        raise
    finally:
        if connection and connection.is_connected():
            connection.close()

@contextmanager
def get_db_cursor(dictionary=True):
    """
    Context manager for database cursors.
    Automatically handles connection, cursor creation, commit/rollback, and cleanup.
    
    Args:
        dictionary (bool): If True, returns rows as dictionaries. Default is True.
    
    Usage:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM students WHERE id = %s", (student_id,))
            student = cursor.fetchone()
    """
    connection = None
    cursor = None
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=dictionary)
        yield cursor
        connection.commit()
    except Error as e:
        if connection:
            connection.rollback()
        print(f"Database query error: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

def execute_query(query: str, params: Optional[Tuple] = None, fetch_one: bool = False, fetch_all: bool = False) -> Optional[Any]:
    """
    Execute a single query with parameters.
    
    Args:
        query (str): SQL query to execute
        params (tuple): Query parameters
        fetch_one (bool): If True, fetch and return one row
        fetch_all (bool): If True, fetch and return all rows
        
    Returns:
        Query results or None
    """
    with get_db_cursor() as cursor:
        cursor.execute(query, params or ())
        if fetch_one:
            return cursor.fetchone()
        elif fetch_all:
            return cursor.fetchall()
        return None

def call_stored_procedure(proc_name: str, params: List[Any]) -> Tuple[bool, str, Optional[List[Dict]]]:
    """
    Call a stored procedure with parameters.
    
    Args:
        proc_name (str): Name of the stored procedure
        params (list): List of parameters for the procedure
        
    Returns:
        Tuple[bool, str, Optional[List[Dict]]]: (success, message, results)
    """
    try:
        with get_db_cursor() as cursor:
            cursor.callproc(proc_name, params)
            
            # Fetch OUT parameters if any
            results = []
            for result in cursor.stored_results():
                results.extend(result.fetchall())
            
            return True, "Success", results if results else None
    except Error as e:
        error_msg = str(e)
        print(f"Stored procedure error: {error_msg}")
        return False, error_msg, None

def test_connection() -> bool:
    """
    Test database connection.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        with get_db_connection() as conn:
            if conn.is_connected():
                db_info = conn.get_server_info()
                print(f"✓ Connected to MySQL Server version {db_info}")
                
                cursor = conn.cursor()
                cursor.execute("SELECT DATABASE();")
                db_name = cursor.fetchone()
                print(f"✓ Connected to database: {db_name[0]}")
                cursor.close()
                return True
    except Error as e:
        print(f"✗ Connection failed: {e}")
        return False

# Student-specific database operations
class StudentDB:
    """Database operations for student management"""
    
    @staticmethod
    def get_student_by_id(student_id: str) -> Optional[Dict]:
        """Get student by ID"""
        query = "SELECT * FROM students WHERE student_id = %s"
        return execute_query(query, (student_id,), fetch_one=True)
    
    @staticmethod
    def get_student_by_email(email: str) -> Optional[Dict]:
        """Get student by email"""
        query = "SELECT * FROM students WHERE email = %s"
        return execute_query(query, (email,), fetch_one=True)
    
    @staticmethod
    def register_student(
        student_id: str,
        first_name: str,
        middle_name: str,
        last_name: str,
        suffix: str,
        birthdate: str,
        gender: str,
        email: str,
        phone: str,
        department: str,
        course: str,
        year_level: str,
        current_street: str,
        current_barangay: str,
        current_municipality: str,
        current_province: str,
        current_region: str,
        current_zip: str,
        current_landmark: str,
        permanent_street: str,
        permanent_barangay: str,
        permanent_municipality: str,
        permanent_province: str,
        permanent_region: str,
        permanent_zip: str,
        permanent_notes: str,
        same_as_current: bool,
        password_hash: str
    ) -> Tuple[bool, str]:
        """
        Register a new student using stored procedure.
        Returns (success, message)
        """
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # OUT parameters
                success_out = cursor.var(int)
                message_out = cursor.var(str)
                
                cursor.callproc('sp_register_student', [
                    student_id, first_name, middle_name, last_name, suffix,
                    birthdate, gender, email, phone,
                    department, course, year_level,
                    current_street, current_barangay, current_municipality,
                    current_province, current_region, current_zip, current_landmark,
                    permanent_street, permanent_barangay, permanent_municipality,
                    permanent_province, permanent_region, permanent_zip, permanent_notes,
                    same_as_current, password_hash,
                    success_out, message_out
                ])
                
                conn.commit()
                cursor.close()
                
                return True, f"Student {student_id} registered successfully"
                
        except Error as e:
            error_msg = str(e)
            if 'already exists' in error_msg.lower():
                if 'email' in error_msg.lower():
                    return False, "Email already registered"
                else:
                    return False, "Student ID already exists"
            return False, f"Registration failed: {error_msg}"
    
    @staticmethod
    def update_student_profile(
        student_id: str,
        department: str,
        course: str,
        year_level: str,
        block: str,
        current_street: str,
        current_barangay: str,
        current_municipality: str,
        current_province: str,
        current_region: str,
        current_zip: str,
        current_landmark: str
    ) -> Tuple[bool, str]:
        """
        Update student profile using stored procedure.
        Returns (success, message)
        """
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                success_out = cursor.var(int)
                message_out = cursor.var(str)
                
                cursor.callproc('sp_update_student_profile', [
                    student_id, department, course, year_level, block,
                    current_street, current_barangay, current_municipality,
                    current_province, current_region, current_zip, current_landmark,
                    success_out, message_out
                ])
                
                conn.commit()
                cursor.close()
                
                return True, "Profile updated successfully"
                
        except Error as e:
            error_msg = str(e)
            if 'not found' in error_msg.lower():
                return False, "Student not found"
            return False, f"Update failed: {error_msg}"
    
    @staticmethod
    def list_all_students() -> List[Dict]:
        """Get all students"""
        query = "SELECT * FROM v_student_profiles ORDER BY last_name, first_name"
        return execute_query(query, fetch_all=True) or []
    
    @staticmethod
    def list_students_by_department(department: str) -> List[Dict]:
        """Get students by department"""
        query = "SELECT * FROM v_student_profiles WHERE department = %s ORDER BY year_level, block, last_name"
        return execute_query(query, (department,), fetch_all=True) or []

# Admin-specific database operations
class AdminDB:
    """Database operations for admin management"""

    @staticmethod
    def get_admin_by_id(admin_id: str) -> Optional[Dict]:
        """Get admin by ID (admin_id)"""
        # Prefer explicit admins table view; fallback to direct table
        query = "SELECT * FROM admins WHERE admin_id = %s OR id = %s"
        return execute_query(query, (admin_id, admin_id), fetch_one=True)

    @staticmethod
    def list_all_admins() -> List[Dict]:
        """List all admins"""
        query = "SELECT * FROM admins ORDER BY last_name, first_name"
        return execute_query(query, fetch_all=True) or []

    @staticmethod
    def register_admin(
        admin_id: str,
        first_name: str,
        middle_name: str,
        last_name: str,
        suffix: str,
        birthdate: str,
        gender: str,
        email: str,
        phone: str,
        position: str,
        street: str,
        barangay: str,
        municipality: str,
        province: str,
        region: str,
        zip_code: str,
        current_street: str,
        current_barangay: str,
        current_municipality: str,
        current_province: str,
        current_region: str,
        current_zip: str,
        current_landmark: str,
        same_as_current: bool,
        password_hash: str
    ) -> Tuple[bool, str]:
        """
        Register a new admin using stored procedure with current address support.
        Returns (success, message)
        """
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # OUT parameters
                success_out = cursor.var(int)
                message_out = cursor.var(str)
                
                cursor.callproc('sp_register_admin', [
                    admin_id, first_name, middle_name, last_name, suffix,
                    birthdate, gender, email, phone,
                    position,
                    street, barangay, municipality, province, region, zip_code,
                    current_street, current_barangay, current_municipality,
                    current_province, current_region, current_zip, current_landmark,
                    same_as_current, password_hash,
                    success_out, message_out
                ])
                
                conn.commit()
                cursor.close()
                
                return True, f"Admin {admin_id} registered successfully"
                
        except Error as e:
            error_msg = str(e)
            if 'already exists' in error_msg.lower():
                if 'email' in error_msg.lower():
                    return False, "Email already registered"
                else:
                    return False, "Admin ID already exists"
            return False, f"Registration failed: {error_msg}"

    @staticmethod
    def update_admin_profile(
        admin_id: str,
        first_name: str,
        middle_name: str,
        last_name: str,
        suffix: str,
        gender: str,
        age: str,
        birthdate: str,
        email: str,
        phone: str,
        street: str,
        barangay: str,
        municipality: str,
        province: str,
        region: str,
        zip_code: str,
        current_street: str,
        current_barangay: str,
        current_municipality: str,
        current_province: str,
        current_region: str,
        current_zip: str,
        current_landmark: str
    ) -> Tuple[bool, str]:
        """
        Update editable admin profile fields (position and admin_id are read-only).
        Uses stored procedure.
        """
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                success_out = cursor.var(int)
                message_out = cursor.var(str)
                
                cursor.callproc('sp_update_admin_profile', [
                    admin_id, first_name, middle_name, last_name, suffix,
                    gender, age, birthdate, email, phone,
                    street, barangay, municipality, province, region, zip_code,
                    current_street, current_barangay, current_municipality,
                    current_province, current_region, current_zip, current_landmark,
                    success_out, message_out
                ])
                
                conn.commit()
                cursor.close()
                
                return True, "Profile updated successfully"
                
        except Error as e:
            error_msg = str(e)
            if 'not found' in error_msg.lower():
                return False, "Admin not found"
            return False, f"Update failed: {error_msg}"

if __name__ == '__main__':
    # Test connection when run directly
    print("Testing database connection...")
    if test_connection():
        print("\n✓ Database module ready!")
    else:
        print("\n✗ Database connection failed. Please check configuration.")
