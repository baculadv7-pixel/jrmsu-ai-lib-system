#!/usr/bin/env python3
"""
Library Session Manager
Handles login/logout tracking with odd/even action counting
"""

import time
import uuid
from flask import request, jsonify
from db import execute_query, AdminDB, StudentDB

# Fallback in-memory store when MySQL is unavailable
FALLBACK_SESSIONS = {}  # user_id -> session dict

# Cache table readiness to avoid re-running DDL every request
_ACTIVE_READY = False
_LIB_READY = False
_ACTLOG_READY = False


def _mysql_available() -> bool:
    try:
        from app import MYSQL_AVAILABLE
        return bool(MYSQL_AVAILABLE)
    except Exception:
        return True  # default to True if app not loaded yet


def get_user_active_session(user_id: str):
    """Check if user has an active library session"""
    try:
        _ensure_library_sessions_table()
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
        # Fallback to in-memory
        return FALLBACK_SESSIONS.get(user_id)
ACTIVE_TBL = 'active_sessions'

def _ensure_active_sessions_table():
    global _ACTIVE_READY
    if _ACTIVE_READY or not _mysql_available():
        return
    try:
        ddl = """
            CREATE TABLE IF NOT EXISTS active_sessions (
              session_id INT AUTO_INCREMENT PRIMARY KEY,
              user_id VARCHAR(20) NOT NULL,
              fullname VARCHAR(100) NOT NULL,
              usertype ENUM('Student','Admin') NOT NULL,
              login_time DATETIME NOT NULL,
              logout_time DATETIME NULL,
              status ENUM('active','logged_out') NOT NULL DEFAULT 'active',
              login_method ENUM('manual','qrcode') NOT NULL DEFAULT 'manual',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              KEY idx_active (status),
              KEY idx_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        try:
            execute_query(ddl)
        except Exception as ce:
            msg = str(ce)
            # If CREATE IF NOT EXISTS still reports 1050, or 1813 tablespace issue, force drop+create
            if ("1050" in msg) or ("already exists" in msg) or ("1813" in msg) or ("Tablespace" in msg):
                try:
                    execute_query("DROP TABLE IF EXISTS active_sessions")
                except Exception:
                    pass
                execute_query(ddl)
            else:
                raise
        # Validate table is usable; handle "doesn't exist in engine"
        try:
            execute_query("SELECT 1 FROM active_sessions LIMIT 1")
            _ACTIVE_READY = True
        except Exception as e:
            msg = str(e)
            if "doesn't exist in engine" in msg or "42S02" in msg:
                execute_query("DROP TABLE IF EXISTS active_sessions")
                execute_query(ddl)
            else:
                raise
    except Exception as e:
        print(f"Error ensuring active_sessions table: {e}")


def _ensure_library_sessions_table():
    global _LIB_READY
    if _LIB_READY or not _mysql_available():
        return
    try:
        ddl = """
            CREATE TABLE IF NOT EXISTS library_sessions (
              session_id VARCHAR(50) PRIMARY KEY,
              user_id VARCHAR(20) NOT NULL,
              user_type ENUM('student','admin') NOT NULL,
              full_name VARCHAR(100) NOT NULL,
              login_time DATETIME NOT NULL,
              logout_time DATETIME NULL,
              method ENUM('manual','qr') NOT NULL DEFAULT 'manual',
              status ENUM('inside_library','logged_out') NOT NULL DEFAULT 'inside_library',
              action_count INT NOT NULL DEFAULT 1,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              KEY idx_user_status (user_id, status),
              KEY idx_status (status),
              KEY idx_login_time (login_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        try:
            execute_query(ddl)
        except Exception as ce:
            msg = str(ce)
            if ("1050" in msg) or ("already exists" in msg) or ("1813" in msg) or ("Tablespace" in msg):
                try:
                    execute_query("DROP TABLE IF EXISTS library_sessions")
                except Exception:
                    pass
                execute_query(ddl)
            else:
                raise
        # Validate table is usable; handle "doesn't exist in engine"
        try:
            execute_query("SELECT 1 FROM library_sessions LIMIT 1")
            _LIB_READY = True
        except Exception as e:
            msg = str(e)
            if "doesn't exist in engine" in msg or "42S02" in msg:
                execute_query("DROP TABLE IF EXISTS library_sessions")
                execute_query(ddl)
            else:
                raise
    except Exception as e:
        print(f"Error ensuring library_sessions table: {e}")


def _ensure_activity_log_table():
    global _ACTLOG_READY
    if _ACTLOG_READY or not _mysql_available():
        return
    try:
        ddl = """
            CREATE TABLE IF NOT EXISTS activity_log (
              id INT AUTO_INCREMENT PRIMARY KEY,
              actor_id VARCHAR(50) NOT NULL,
              actor_name VARCHAR(100) NOT NULL,
              event VARCHAR(50) NOT NULL,
              details TEXT,
              source VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
              timestamp DATETIME NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              KEY idx_actor (actor_id),
              KEY idx_event (event),
              KEY idx_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        try:
            execute_query(ddl)
        except Exception as ce:
            msg = str(ce)
            if ("1050" in msg) or ("already exists" in msg) or ("1813" in msg) or ("Tablespace" in msg):
                try:
                    execute_query("DROP TABLE IF EXISTS activity_log")
                except Exception:
                    pass
                execute_query(ddl)
            else:
                raise
        # Validate schema columns (upgrade safety)
        try:
            execute_query("SELECT actor_id, actor_name, event, source, timestamp FROM activity_log WHERE 1=0")
            _ACTLOG_READY = True
        except Exception:
            try:
                execute_query("DROP TABLE IF EXISTS activity_log")
            except Exception:
                pass
            execute_query(ddl)
    except Exception as e:
        print(f"Error ensuring activity_log table: {e}")


def _active_tbl() -> str:
    global ACTIVE_TBL
    # Prefer primary table; if unusable, fall back to alternate name
    try:
        execute_query("SELECT 1 FROM active_sessions LIMIT 1")
        ACTIVE_TBL = 'active_sessions'
        return ACTIVE_TBL
    except Exception:
        # Ensure alternate table exists
        try:
            execute_query("SELECT 1 FROM active_sessions_live LIMIT 1")
            ACTIVE_TBL = 'active_sessions_live'
            return ACTIVE_TBL
        except Exception:
            # Create alternate clean table
            try:
                execute_query(
                    """
                    CREATE TABLE IF NOT EXISTS active_sessions_live (
                      session_id INT AUTO_INCREMENT PRIMARY KEY,
                      user_id VARCHAR(20) NOT NULL,
                      fullname VARCHAR(100) NOT NULL,
                      usertype ENUM('Student','Admin') NOT NULL,
                      login_time DATETIME NOT NULL,
                      logout_time DATETIME NULL,
                      status ENUM('active','logged_out') NOT NULL DEFAULT 'active',
                      login_method ENUM('manual','qrcode') NOT NULL DEFAULT 'manual',
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      KEY idx_active (status),
                      KEY idx_user (user_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """
                )
            except Exception:
                pass
            ACTIVE_TBL = 'active_sessions_live'
            return ACTIVE_TBL

def _upsert_active_login(user_id: str, user_type: str, full_name: str, method: str, login_time: int):
    _ensure_active_sessions_table()
    try:
        # If already active, skip insert
        tbl = _active_tbl()
        row = execute_query(
            f"SELECT session_id FROM {tbl} WHERE user_id=%s AND status='active' LIMIT 1",
            (user_id,), fetch_one=True
        )
        if not row:
            execute_query(
                f"""
                INSERT INTO {tbl} (user_id, fullname, usertype, login_time, status, login_method)
                VALUES (%s, %s, %s, FROM_UNIXTIME(%s), 'active', %s)
                """,
                (user_id, full_name, 'Admin' if user_type.lower()=='admin' else 'Student', login_time, 'qrcode' if method=='qr' else 'manual')
            )
        # broadcast
        try:
            from app import socketio
            socketio.emit('session_update', { 'type': 'login', 'userId': user_id }, broadcast=True)
        except Exception:
            pass
    except Exception as e:
        print(f"Error upserting active login: {e}")


def _mark_active_logout(user_id: str, logout_time: int):
    _ensure_active_sessions_table()
    try:
        tbl = _active_tbl()
        execute_query(
            f"""
            UPDATE {tbl}
            SET status='logged_out', logout_time=FROM_UNIXTIME(%s)
            WHERE user_id=%s AND status='active'
            """,
            (logout_time, user_id)
        )
        try:
            from app import socketio
            socketio.emit('session_update', { 'type': 'logout', 'userId': user_id }, broadcast=True)
        except Exception:
            pass
    except Exception as e:
        print(f"Error marking active logout: {e}")


def create_login_session(user_id: str, user_type: str, full_name: str, method: str = 'manual'):
    """Create a new login session (ODD action)"""
    try:
        if _mysql_available():
            _ensure_library_sessions_table()
            _ensure_active_sessions_table()
            _ensure_activity_log_table()
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
        
        # Maintain active_sessions mirror
        _upsert_active_login(user_id, user_type, full_name, method, login_time)
        
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
        # Fallback to in-memory when DB is unavailable
        print(f"Error creating login session: {e} (using fallback store)")
        session_id = f"lib-{uuid.uuid4()}"
        login_time = int(time.time())
        rec = {
            'session_id': session_id,
            'user_id': user_id,
            'user_type': user_type,
            'full_name': full_name,
            'login_time': login_time,
            'status': 'inside_library',
            'action_count': 1,
        }
        FALLBACK_SESSIONS[user_id] = rec
        return {
            'sessionId': session_id,
            'userId': user_id,
            'userType': user_type,
            'fullName': full_name,
            'loginTime': login_time,
            'status': 'inside_library',
            'actionCount': 1,
            'actionType': 'ODD',
            'fallback': True
        }

def create_logout_session(user_id: str, session_id: str = None):
    """End a login session (EVEN action)"""
    try:
        if _mysql_available():
            _ensure_library_sessions_table()
            _ensure_active_sessions_table()
            _ensure_activity_log_table()
        logout_time = int(time.time())
        
        # Get active session from primary table
        active_session = get_user_active_session(user_id)
        fallback_only = False
        if not active_session:
            # Fallback: check active_sessions mirror
            try:
                tbl = _active_tbl()
                row = execute_query(
                    f"SELECT user_id, fullname, usertype, login_time FROM {tbl} WHERE user_id=%s AND status='active' LIMIT 1",
                    (user_id,), fetch_one=True
                )
                if row:
                    # Synthesize values for graceful logout
                    active_session = {
                        'session_id': session_id or f"lib-{uuid.uuid4()}",
                        'user_id': user_id,
                        'full_name': row.get('fullname') or user_id,
                        'action_count': 1,
                        'login_time': row.get('login_time'),
                    }
                    fallback_only = True
                else:
                    # Try in-memory fallback
                    if user_id in FALLBACK_SESSIONS:
                        active_session = FALLBACK_SESSIONS[user_id]
                        fallback_only = True
                    else:
                        return {'error': 'No active session found'}, 404
            except Exception:
                # Try in-memory fallback
                if user_id in FALLBACK_SESSIONS:
                    active_session = FALLBACK_SESSIONS[user_id]
                    fallback_only = True
                else:
                    return {'error': 'No active session found'}, 404
        
        session_id = active_session.get('session_id') or session_id or f"lib-{uuid.uuid4()}"
        full_name = active_session.get('full_name') or active_session.get('fullname') or user_id
        login_action_count = active_session.get('action_count') or 1
        
        # Calculate logout action count (should be EVEN)
        logout_action_count = login_action_count + 1
        if logout_action_count % 2 != 0:
            logout_action_count += 1
        
        # Update primary table if this session exists there, else skip
        if not fallback_only:
            update_query = """
                UPDATE library_sessions
                SET logout_time = FROM_UNIXTIME(%s),
                    status = 'logged_out',
                    action_count = %s,
                    updated_at = NOW()
                WHERE session_id = %s
            """
            execute_query(update_query, (logout_time, logout_action_count, session_id))

        # Mirror to active_sessions
        try:
            _mark_active_logout(user_id, logout_time)
        except Exception:
            pass
        
        # Insert into activity_log
        try:
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
        except Exception:
            pass
        
        # Cleanup fallback store
        FALLBACK_SESSIONS.pop(user_id, None)
        
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
        print(f"Error creating logout session: {e} (using fallback)")
        ts = int(time.time())
        full_name = user_id
        rec = FALLBACK_SESSIONS.pop(user_id, None)
        return {
            'sessionId': (rec or {}).get('session_id') or (session_id or f"lib-{uuid.uuid4()}"),
            'userId': user_id,
            'fullName': full_name,
            'logoutTime': ts,
            'status': 'logged_out',
            'actionCount': 2,
            'actionType': 'EVEN',
            'fallback': True
        }

def notify_all_admins(app, message: str, notification_type: str, meta: dict = None):
    """Send notification to all admins"""
    from db import AdminDB
    try:
        if not _mysql_available():
            return  # skip DB access when down
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
        _ensure_library_sessions_table()
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

def _resolve_fullname(user_id: str, user_type: str, provided_full: str = "") -> str:
    try:
        t = (user_type or '').lower()
        if t == 'admin':
            r = execute_query("SELECT last_name, first_name, middle_name FROM admins WHERE admin_id=%s OR id=%s LIMIT 1", (user_id, user_id), fetch_one=True)
        else:
            r = execute_query("SELECT last_name, first_name, middle_name FROM students WHERE student_id=%s OR id=%s LIMIT 1", (user_id, user_id), fetch_one=True)
        if r:
            last = (r.get('last_name') or '').strip()
            first = (r.get('first_name') or '').strip()
            middle = (r.get('middle_name') or '').strip()
            parts = [p for p in [last, ", " + first if first else '', " " + middle if middle else ''] if p]
            name = ''.join(parts)
            return name or (provided_full or user_id)
        return provided_full or user_id
    except Exception:
        return provided_full or user_id

def register_library_session_endpoints(app):
    """Register all library session endpoints"""
    
    @app.route('/api/library/check-session/<user_id>', methods=['GET'])
    def check_user_session(user_id: str):
        """Check if specific user has active session"""
        try:
            active_session = get_user_active_session(user_id)
            
            if active_session:
                login_time = active_session.get('login_time') if isinstance(active_session, dict) else active_session['login_time']
                if hasattr(login_time, 'timestamp'):
                    login_time = int(login_time.timestamp())
                
                return jsonify({
                    'hasActiveSession': True,
                    'sessionId': active_session.get('session_id') if isinstance(active_session, dict) else active_session['session_id'],
                    'loginTime': login_time,
                    'actionCount': active_session.get('action_count', 1),
                    'actionType': 'ODD'
                })
            else:
                return jsonify({'hasActiveSession': False})
        except Exception:
            # Fallback to in-memory
            s = FALLBACK_SESSIONS.get(user_id)
            if s:
                return jsonify({
                    'hasActiveSession': True,
                    'sessionId': s.get('session_id'),
                    'loginTime': s.get('login_time'),
                    'actionCount': s.get('action_count', 1),
                    'actionType': 'ODD',
                    'fallback': True
                })
            return jsonify({'hasActiveSession': False})
    
    @app.route('/api/library/login', methods=['POST'])
    def library_login():
        """Handle library login"""
        try:
            body = request.get_json(force=True)
            user_id = (body.get('userId') or '').strip()
            user_type = (body.get('userType') or '').strip()
            full_name = _resolve_fullname(user_id, user_type, (body.get('fullName') or '').strip())
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

            # Personal notification to the user
            try:
                from app import _new_notif_id, _ensure_user_store, _emit
                ts = int(time.time())
                d = time.strftime('%m-%d-%Y', time.localtime(ts))
                t = time.strftime('%I:%M:%S %p', time.localtime(ts)).replace('AM','A.M.').replace('PM','P.M.')
                notif = {
                    'id': _new_notif_id(),
                    'user_id': user_id,
                    'title': 'Library Logout',
                    'body': f"You have successfully logged out from the library at {t} on {d}.",
                    'type': 'library_logout',
                    'meta': {'sessionId': result['sessionId']},
                    'created_at': ts,
                    'read': False,
                    'action_required': False,
                    'action_payload': None,
                    'actor_id': user_id,
                }
                lst = _ensure_user_store(user_id)
                lst.insert(0, notif)
                _emit('notification.new', user_id, notif)
            except Exception:
                pass

            # Broadcast update to all clients
            try:
                from app import socketio
                socketio.emit('session_update', { 'type': 'logout', 'userId': user_id }, broadcast=True)
            except Exception:
                pass
            
            return jsonify(result)
        except Exception as e:
            print(f"Error in library_logout: {e}")
            return jsonify(error=str(e)), 500
    
    @app.route('/api/library/active-sessions', methods=['GET'])
    def api_active_sessions():
        """List all currently active sessions"""
        try:
            if not _mysql_available():
                raise RuntimeError("mysql_unavailable")
            _ensure_active_sessions_table()
            q = (request.args.get('q') or '').strip().lower()
            tbl = _active_tbl()
            rows = execute_query(f"SELECT user_id, fullname, usertype, login_time FROM {tbl} WHERE status='active' ORDER BY login_time DESC", fetch_all=True) or []
            # Fallback to library_sessions if no rows (first-run or table absent)
            if not rows:
                rows = execute_query("SELECT user_id, full_name as fullname, user_type as usertype, login_time FROM library_sessions WHERE status='inside_library' ORDER BY login_time DESC", fetch_all=True) or []
            items = []
            for r in rows:
                uid = r.get('user_id')
                name = r.get('fullname')
                utype = (r.get('usertype') or '').lower()
                lt = r.get('login_time')
                ts = int(lt.timestamp()) if hasattr(lt, 'timestamp') else (lt if isinstance(lt, int) else int(time.time()))
                rec = {
                    'userId': uid,
                    'fullname': name,
                    'userType': 'admin' if utype=='admin' else 'student',
                    'loginTime': ts
                }
                if not q or (q in (uid or '').lower()) or (q in (name or '').lower()) or (q in rec['userType']):
                    items.append(rec)
            return jsonify(items=items)
        except Exception:
            # Final fallback to in-memory sessions
            q = (request.args.get('q') or '').strip().lower()
            items = []
            for uid, s in FALLBACK_SESSIONS.items():
                name = s.get('full_name')
                utype = s.get('user_type')
                ts = s.get('login_time') or int(time.time())
                rec = {
                    'userId': uid,
                    'fullname': name,
                    'userType': utype,
                    'loginTime': ts
                }
                if not q or (q in (uid or '').lower()) or (q in (name or '').lower()) or (q in (utype or '')):
                    items.append(rec)
            return jsonify(items=items)

    @app.route('/api/library/force-logout', methods=['POST'])
    def api_force_logout():
        """Force logout a user by ID"""
        try:
            body = request.get_json(force=True)
            user_id = (body.get('userId') or '').strip()
            if not user_id:
                return jsonify(error='userId required'), 400
            res = create_logout_session(user_id)
            if isinstance(res, tuple):
                return res
            # Personal notification to the user (forced)
            try:
                from app import _new_notif_id, _ensure_user_store, _emit
                ts = int(time.time())
                d = time.strftime('%m-%d-%Y', time.localtime(ts))
                t = time.strftime('%I:%M:%S %p', time.localtime(ts)).replace('AM','A.M.').replace('PM','P.M.')
                notif = {
                    'id': _new_notif_id(),
                    'user_id': user_id,
                    'title': 'Library Logout',
                    'body': f"You have been logged out from the library at {t} on {d}.",
                    'type': 'library_logout',
                    'meta': {'sessionId': res.get('sessionId'), 'forced': True},
                    'created_at': ts,
                    'read': False,
                    'action_required': False,
                    'action_payload': None,
                    'actor_id': user_id,
                }
                lst = _ensure_user_store(user_id)
                lst.insert(0, notif)
                _emit('notification.new', user_id, notif)
            except Exception:
                pass
            try:
                from app import socketio
                socketio.emit('session_update', { 'type': 'logout', 'userId': user_id, 'forced': True }, broadcast=True)
            except Exception:
                pass
            return jsonify(ok=True, result=res)
        except Exception as e:
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
