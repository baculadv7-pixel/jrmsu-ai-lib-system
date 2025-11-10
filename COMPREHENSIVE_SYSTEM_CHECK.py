#!/usr/bin/env python3
"""
COMPREHENSIVE SYSTEM CHECK
Tests all backends, databases, APIs, and connectivity
"""
import sys
import os
import time
import requests
import mysql.connector
from typing import Dict, List, Tuple

# ANSI color codes for better readability
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

class SystemChecker:
    def __init__(self):
        self.results = []
        self.warnings = []
        self.errors = []
        
    def check(self, name: str, func):
        """Run a check and record the result"""
        print(f"\n{BLUE}➤ Checking {name}...{RESET}")
        try:
            result, message = func()
            if result:
                print(f"{GREEN}✓ {message}{RESET}")
                self.results.append((name, True, message))
            else:
                print(f"{RED}✗ {message}{RESET}")
                self.errors.append((name, message))
                self.results.append((name, False, message))
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            print(f"{RED}✗ {error_msg}{RESET}")
            self.errors.append((name, error_msg))
            self.results.append((name, False, error_msg))
    
    def warn(self, message: str):
        """Record a warning"""
        print(f"{YELLOW}⚠ WARNING: {message}{RESET}")
        self.warnings.append(message)
    
    def print_summary(self):
        """Print final summary"""
        print(f"\n{'='*80}")
        print(f"{BOLD}SYSTEM CHECK SUMMARY{RESET}")
        print(f"{'='*80}")
        
        passed = sum(1 for _, ok, _ in self.results if ok)
        failed = len(self.results) - passed
        
        print(f"\n{GREEN}✓ Passed: {passed}{RESET}")
        print(f"{RED}✗ Failed: {failed}{RESET}")
        print(f"{YELLOW}⚠ Warnings: {len(self.warnings)}{RESET}")
        
        if self.errors:
            print(f"\n{RED}{BOLD}CRITICAL ISSUES:{RESET}")
            for name, msg in self.errors:
                print(f"  {RED}• {name}: {msg}{RESET}")
        
        if self.warnings:
            print(f"\n{YELLOW}{BOLD}WARNINGS:{RESET}")
            for msg in self.warnings:
                print(f"  {YELLOW}• {msg}{RESET}")
        
        print(f"\n{'='*80}\n")
        return failed == 0

# ============================================================================
# DATABASE CHECKS
# ============================================================================

def check_mysql_connection() -> Tuple[bool, str]:
    """Check MySQL connection"""
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='jrmsu_library',
            connect_timeout=5
        )
        if conn.is_connected():
            server_info = conn.get_server_info()
            conn.close()
            return True, f"MySQL connected (version {server_info})"
        return False, "MySQL connection failed"
    except mysql.connector.Error as e:
        return False, f"MySQL error: {str(e)}"

def check_database_exists() -> Tuple[bool, str]:
    """Check if jrmsu_library database exists"""
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            connect_timeout=5
        )
        cursor = conn.cursor()
        cursor.execute("SHOW DATABASES LIKE 'jrmsu_library'")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            return True, "Database 'jrmsu_library' exists"
        return False, "Database 'jrmsu_library' NOT FOUND"
    except Exception as e:
        return False, f"Error checking database: {str(e)}"

def check_tables() -> Tuple[bool, str]:
    """Check if required tables exist"""
    required_tables = ['students', 'admins', 'notifications', 'activity_log', 
                      'jose_message_templates', 'notification_dedup']
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='jrmsu_library',
            connect_timeout=5
        )
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        existing_tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        
        missing = [t for t in required_tables if t not in existing_tables]
        if not missing:
            return True, f"All required tables exist ({len(existing_tables)} tables total)"
        return False, f"Missing tables: {', '.join(missing)}"
    except Exception as e:
        return False, f"Error checking tables: {str(e)}"

def check_ai_database() -> Tuple[bool, str]:
    """Check AI server database"""
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            connect_timeout=5
        )
        cursor = conn.cursor()
        cursor.execute("SHOW DATABASES LIKE 'library_system_ai'")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            return True, "AI database 'library_system_ai' exists"
        return False, "AI database 'library_system_ai' NOT FOUND (will be created on first AI server start)"
    except Exception as e:
        return False, f"Error checking AI database: {str(e)}"

def check_stored_procedures() -> Tuple[bool, str]:
    """Check if stored procedures exist"""
    required_procedures = ['sp_register_student', 'sp_register_admin', 'sp_update_admin_profile']
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='jrmsu_library',
            connect_timeout=5
        )
        cursor = conn.cursor()
        cursor.execute("SHOW PROCEDURE STATUS WHERE Db = 'jrmsu_library'")
        existing_procs = [row[1] for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        
        missing = [p for p in required_procedures if p not in existing_procs]
        if not missing:
            return True, f"All required stored procedures exist ({len(existing_procs)} total)"
        return False, f"Missing procedures: {', '.join(missing)}"
    except Exception as e:
        return False, f"Error checking procedures: {str(e)}"

# ============================================================================
# API ENDPOINT CHECKS
# ============================================================================

def check_api_endpoint(url: str, name: str, timeout: int = 3) -> Tuple[bool, str]:
    """Check if an API endpoint is reachable"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            return True, f"{name} is RUNNING (status: 200)"
        return False, f"{name} returned status {response.status_code}"
    except requests.exceptions.ConnectionError:
        return False, f"{name} is NOT RUNNING (connection refused)"
    except requests.exceptions.Timeout:
        return False, f"{name} TIMEOUT (no response in {timeout}s)"
    except Exception as e:
        return False, f"{name} error: {str(e)}"

def check_main_backend() -> Tuple[bool, str]:
    """Check main Python backend (port 5001)"""
    return check_api_endpoint('http://localhost:5001/health', 'Main Backend (Port 5001)')

def check_ai_server() -> Tuple[bool, str]:
    """Check AI server (port 5000)"""
    return check_api_endpoint('http://localhost:5000', 'AI Server (Port 5000)')

def check_frontend() -> Tuple[bool, str]:
    """Check main frontend (port 8080)"""
    return check_api_endpoint('http://localhost:8080', 'Main Frontend (Port 8080)')

def check_mirror_page() -> Tuple[bool, str]:
    """Check mirror login page (port 8081)"""
    return check_api_endpoint('http://localhost:8081', 'Mirror Login Page (Port 8081)')

def check_ollama() -> Tuple[bool, str]:
    """Check Ollama service (port 11434)"""
    return check_api_endpoint('http://localhost:11434', 'Ollama AI (Port 11434)')

# ============================================================================
# FILE SYSTEM CHECKS
# ============================================================================

def check_env_files() -> Tuple[bool, str]:
    """Check if .env files exist"""
    env_files = [
        'jrmsu-wise-library-main\\.env',
        'jrmsu-wise-library-main\\python-backend\\.env.example'
    ]
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    missing = []
    
    for env_file in env_files:
        full_path = os.path.join(base_path, env_file)
        if not os.path.exists(full_path):
            missing.append(env_file)
    
    if not missing:
        return True, "All .env files exist"
    return False, f"Missing .env files: {', '.join(missing)}"

def check_python_dependencies() -> Tuple[bool, str]:
    """Check if Python dependencies are installed"""
    required_modules = [
        'flask', 'mysql.connector', 'bcrypt', 'pyotp', 
        'requests', 'bleach', 'flask_socketio', 'PIL'
    ]
    
    missing = []
    for module in required_modules:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)
    
    if not missing:
        return True, f"All Python dependencies installed ({len(required_modules)} modules)"
    return False, f"Missing Python modules: {', '.join(missing)}"

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    print(f"\n{BOLD}{'='*80}")
    print(f"JRMSU LIBRARY SYSTEM - COMPREHENSIVE SYSTEM CHECK")
    print(f"{'='*80}{RESET}\n")
    
    checker = SystemChecker()
    
    # Database checks
    print(f"\n{BOLD}{'='*80}")
    print(f"DATABASE CHECKS")
    print(f"{'='*80}{RESET}")
    checker.check("MySQL Connection", check_mysql_connection)
    checker.check("Main Database", check_database_exists)
    checker.check("AI Database", check_ai_database)
    checker.check("Database Tables", check_tables)
    checker.check("Stored Procedures", check_stored_procedures)
    
    # API endpoint checks
    print(f"\n{BOLD}{'='*80}")
    print(f"API & SERVICE CHECKS")
    print(f"{'='*80}{RESET}")
    checker.check("Main Backend API", check_main_backend)
    checker.check("AI Server", check_ai_server)
    checker.check("Ollama Service", check_ollama)
    checker.check("Main Frontend", check_frontend)
    checker.check("Mirror Login Page", check_mirror_page)
    
    # File system checks
    print(f"\n{BOLD}{'='*80}")
    print(f"FILE SYSTEM CHECKS")
    print(f"{'='*80}{RESET}")
    checker.check("Environment Files", check_env_files)
    checker.check("Python Dependencies", check_python_dependencies)
    
    # Print summary
    success = checker.print_summary()
    
    # Exit code
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
