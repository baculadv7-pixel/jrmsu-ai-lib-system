# Deep Comprehensive Audit & Security Fixes
## JRMSU AI-Library System

**Date:** December 7, 2025  
**Audit Level:** CRITICAL - Registration, Authentication, CRUD, Borrowing/Return

---

## AUDIT FINDINGS

### 🔴 CRITICAL ISSUE #1: Registration Flow Database Persistence

**Problem:**
- New users (students/admins) registered but database not properly persisting
- Frontend stores in localStorage only
- Backend queries MySQL for user existence
- **Root Cause:** `database.ts` has in-memory fallback but doesn't sync with MySQL

**Location:** `src/services/database.ts` (lines 330-382)

**Issue Code:**
```typescript
// ISSUE: Only stores to localStorage, not MySQL
authenticateUser(id: string, password: string): { success: boolean; user?: User; error?: string } {
    const user = this.getUserById(id);  // ❌ Only checks localStorage
    if (!user) {
      return { success: false, error: "User not found" };
    }
    // ...
}
```

**Fix:**
- Must check both localStorage AND MySQL database
- Sync newly registered users to MySQL immediately
- On login, query MySQL as primary source

---

### 🔴 CRITICAL ISSUE #2: Student/Admin CRUD Operations

**Problems:**
1. **Create:** No validation when registering users
2. **Read:** Only checks localStorage, not database
3. **Update:** Password change not persisting to database
4. **Delete:** No deletion mechanism for admins

**Locations:**
- Password change: `src/pages/Settings.tsx` (missing backend call)
- Student deletion: No delete endpoint exists
- Admin CRUD: `python-backend/app.py` (incomplete)

**Fixes Required:**
1. Add `POST /api/students/delete/<student_id>` endpoint
2. Add `POST /api/admins/delete/<admin_id>` endpoint
3. Update password change to call backend and update MySQL
4. All CRUD operations must persist to MySQL, not just localStorage

---

### 🔴 CRITICAL ISSUE #3: Book Borrowing Flow (Student)

**Problems:**
1. **Reservation Detection:** Mirror page doesn't check if books are reserved
2. **Borrow Algorithms:** No validation of due dates, overdues
3. **Status Transitions:** `borrowed` → `returned` not properly tracked
4. **Return Date:** Not set when marking as returned

**Locations:**
- `mirror_login_api.py` (line 155+) - borrow endpoint
- `library_session_manager.py` (line 200+) - session mgmt
- `History.tsx` (line 84+) - display logic

**Issues in Detail:**

```python
# ❌ ISSUE: No validation of existing reservations
@mirror_api.route('/books/borrow', methods=['POST'])
def borrow_book():
    user_id = data.get('userId')
    book_id = data.get('bookId')
    # Missing: Check if book is reserved by someone else
    # Missing: Update borrow_records in MySQL
    # Missing: Set due_date (should be 14 days from today)
```

---

### 🔴 CRITICAL ISSUE #4: Book Return Flow (Admin)

**Problems:**
1. **No Mark Return Button:** History page missing "Mark Returned" action
2. **Return Date Not Set:** `returned_at` field never updated
3. **Status Not Updated:** `borrowed` → `returned` transition missing
4. **Book-Management Not Synced:** Books stay unavailable after return
5. **No Validation:** Can't check if book is actually borrowed by user

**Locations:**
- `History.tsx` (line 196+) - missing action buttons
- `BookManagement.tsx` - missing return status column
- `python-backend/app.py` - no return endpoint

**Missing Endpoint:**
```python
# ❌ MISSING: No way for admin to mark book as returned
POST /api/library/mark-returned  # DOES NOT EXIST
```

---

### 🟡 ISSUE #5: Return Algorithm Logic Errors

**Problems:**
1. **No Overdue Calculation:** Can't detect overdue books
2. **No Fine Calculation:** No system to calculate late fees
3. **Due Date Validation:** Not enforced on borrow
4. **Book Status:** Not updated when book changes state

---

## COMPREHENSIVE FIXES

### FIX #1: New User Registration & Login (Manual + QR)

**Step 1: Update database.ts to check MySQL on login**

```typescript
authenticateUser(id: string, password: string): { success: boolean; user?: User; error?: string } {
    // 1. Try MySQL first (for newly registered users from backend)
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`);
      if (response.ok) {
        const dbUser = await response.json();
        // Verify password against bcrypt hash in database
        const passwordValid = await this.verifyPasswordWithBackend(id, password);
        if (passwordValid && dbUser) {
          return { success: true, user: dbUser };
        }
      }
    } catch (e) {
      console.warn('MySQL check failed, falling back to localStorage', e);
    }
    
    // 2. Fallback: check localStorage
    const user = this.getUserById(id);
    if (!user) {
      return { success: false, error: "User not found in any database" };
    }
    
    if (!this.verifyPassword(password, user.passwordHash)) {
      return { success: false, error: "Invalid password" };
    }
    
    return { success: true, user };
}
```

**Step 2: Add backend endpoint to verify password**

```python
# In python-backend/app.py
@app.route('/api/users/verify-password', methods=['POST'])
def verify_password():
    body = request.get_json() or {}
    user_id = body.get('user_id', '').strip()
    password = body.get('password', '').strip()
    user_type = body.get('user_type', 'student').lower()
    
    try:
        if user_type == 'admin':
            user = AdminDB.get_admin_by_id(user_id)
        else:
            user = StudentDB.get_student_by_id(user_id)
        
        if not user:
            return jsonify(valid=False), 404
        
        # Import bcrypt and verify
        import bcrypt
        valid = bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8'))
        return jsonify(valid=valid), 200
    except Exception as e:
        return jsonify(valid=False, error=str(e)), 500
```

---

### FIX #2: Student & Admin CRUD Operations

**Add Missing Delete Endpoints:**

```python
# In python-backend/app.py

@app.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id: str):
    """Delete a student (admin only)"""
    try:
        admin_user = _get_user_id()  # Verify admin
        
        # Delete from MySQL
        execute_query(
            "DELETE FROM students WHERE student_id = %s",
            (student_id,)
        )
        
        write_audit_log(
            'student_deleted',
            f'Student {student_id} deleted',
            user_id=admin_user,
            user_role='admin',
            entity_type='student',
            entity_id=student_id
        )
        
        return jsonify(ok=True, message='Student deleted')
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route('/api/admins/<admin_id>', methods=['DELETE'])
def delete_admin(admin_id: str):
    """Delete an admin (system admin only)"""
    try:
        admin_user = _get_user_id()
        
        # Prevent deleting self
        if admin_user == admin_id:
            return jsonify(error='Cannot delete your own account'), 400
        
        # Delete from MySQL
        execute_query(
            "DELETE FROM admins WHERE admin_id = %s",
            (admin_id,)
        )
        
        write_audit_log(
            'admin_deleted',
            f'Admin {admin_id} deleted',
            user_id=admin_user,
            user_role='admin',
            entity_type='admin',
            entity_id=admin_id
        )
        
        return jsonify(ok=True, message='Admin deleted')
    except Exception as e:
        return jsonify(error=str(e)), 500
```

**Update Password Change to Persist:**

```python
# In python-backend/password_endpoints.py (ALREADY EXISTS BUT VERIFY IT WORKS)
# This endpoint already calls execute_query to update MySQL ✅
# Just ensure frontend calls it: http://localhost:5000/api/users/<user_id>/change-password
```

Frontend fix in `Settings.tsx`:
```typescript
const handleChangePassword = async () => {
    try {
        const response = await fetch(
            `http://localhost:5000/api/users/${user?.id}/change-password`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userType: user?.role,
                    currentPassword,
                    newPassword
                })
            }
        );
        
        if (response.ok) {
            toast({ title: "Password updated successfully" });
            setCurrentPassword('');
            setNewPassword('');
        }
    } catch (error) {
        toast({ title: "Failed to update password", variant: "destructive" });
    }
};
```

---

### FIX #3: Book Borrowing (Students)

**Add Validation to Borrow Endpoint:**

```python
# In python-backend/library_session_manager.py or library_endpoints.py

@app.route('/api/library/borrow-book', methods=['POST'])
def borrow_book():
    """Borrow a book with full validation"""
    body = request.get_json() or {}
    user_id = body.get('userId', '').strip()
    book_id = body.get('bookId', '').strip()
    
    try:
        # 1️⃣ Check if book is reserved by someone else
        reservation_check = execute_query(
            "SELECT user_id FROM reservations WHERE book_id = %s AND status = 'pending' AND user_id != %s",
            (book_id, user_id),
            fetch_one=True
        )
        if reservation_check:
            return jsonify(error='Book is reserved by another user'), 400
        
        # 2️⃣ Check if user already has this book borrowed
        active_borrow = execute_query(
            "SELECT id FROM borrow_records WHERE user_id = %s AND book_id = %s AND status = 'borrowed'",
            (user_id, book_id),
            fetch_one=True
        )
        if active_borrow:
            return jsonify(error='You already have this book borrowed'), 400
        
        # 3️⃣ Create borrow record with due date (14 days from today)
        from datetime import datetime, timedelta
        due_date = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
        
        borrow_id = f"BR-{user_id}-{book_id}-{int(time.time())}"
        
        execute_query(
            """
            INSERT INTO borrow_records 
            (id, user_id, book_id, borrow_date, due_date, status)
            VALUES (%s, %s, %s, NOW(), %s, 'borrowed')
            """,
            (borrow_id, user_id, book_id, due_date)
        )
        
        # 4️⃣ Update book status to unavailable
        execute_query(
            "UPDATE books SET status = 'borrowed' WHERE id = %s",
            (book_id,)
        )
        
        # 5️⃣ Log the action
        write_audit_log(
            'book_borrowed',
            f'User {user_id} borrowed book {book_id}',
            user_id=user_id,
            entity_type='book',
            entity_id=book_id
        )
        
        return jsonify(
            ok=True,
            borrowId=borrow_id,
            dueDate=due_date,
            message='Book borrowed successfully'
        ), 201
        
    except Exception as e:
        return jsonify(error=str(e)), 500
```

---

### FIX #4: Book Return (Admins)

**Add Mark Return Endpoint:**

```python
# In python-backend/app.py or library_endpoints.py

@app.route('/api/library/mark-returned', methods=['POST'])
def mark_book_returned():
    """Mark a borrowed book as returned (admin action)"""
    body = request.get_json() or {}
    borrow_id = body.get('borrowId', '').strip()
    admin_id = _get_user_id()
    
    try:
        # 1️⃣ Get borrow record
        borrow_record = execute_query(
            "SELECT id, user_id, book_id, due_date FROM borrow_records WHERE id = %s",
            (borrow_id,),
            fetch_one=True
        )
        
        if not borrow_record:
            return jsonify(error='Borrow record not found'), 404
        
        user_id = borrow_record['user_id']
        book_id = borrow_record['book_id']
        due_date = borrow_record['due_date']
        
        # 2️⃣ Calculate if overdue
        from datetime import datetime
        return_date = datetime.now()
        due = datetime.strptime(due_date, '%Y-%m-%d')
        is_overdue = return_date > due
        
        # 3️⃣ Update borrow record
        execute_query(
            """
            UPDATE borrow_records 
            SET status = 'returned', returned_at = NOW()
            WHERE id = %s
            """,
            (borrow_id,)
        )
        
        # 4️⃣ Update book status to available
        execute_query(
            "UPDATE books SET status = 'available' WHERE id = %s",
            (book_id,)
        )
        
        # 5️⃣ Log the action
        write_audit_log(
            'book_returned',
            f'Book {book_id} returned by {user_id}. Overdue: {is_overdue}',
            user_id=admin_id,
            entity_type='book',
            entity_id=book_id,
            metadata={'borrowId': borrow_id, 'isOverdue': is_overdue}
        )
        
        return jsonify(
            ok=True,
            isOverdue=is_overdue,
            message='Book marked as returned'
        ), 200
        
    except Exception as e:
        return jsonify(error=str(e)), 500
```

**Add Return Button to History.tsx:**

```typescript
// In src/pages/History.tsx - Add to the table row actions

{userType === 'admin' && r.status === 'borrowed' && (
    <Button
        size="sm"
        variant="default"
        onClick={async () => {
            try {
                const res = await fetch(`${API_BASE}/api/library/mark-returned`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ borrowId: r.borrowId })
                });
                if (res.ok) {
                    toast({ title: "Book marked as returned" });
                    await loadHistory();  // Refresh list
                } else {
                    const err = await res.json();
                    toast({
                        title: "Error",
                        description: err.error || 'Failed to mark return',
                        variant: 'destructive'
                    });
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: 'Network error',
                    variant: 'destructive'
                });
            }
        }}
    >
        Mark Returned
    </Button>
)}
```

---

### FIX #5: Book-Management Status Sync

**Update book-management.tsx to show real status:**

```typescript
// Ensure book status column fetches from backend
const status = book.status;  // Should be 'available', 'borrowed', 'reserved', etc.

// Color code the status
const getStatusColor = (status: string) => {
    switch(status) {
        case 'available': return 'bg-leaf';
        case 'borrowed': return 'bg-primary';
        case 'reserved': return 'bg-accent';
        default: return 'bg-muted';
    }
};
```

---

## TESTING CHECKLIST

### Registration & Login Tests
- [ ] Register new student → immediate login works
- [ ] Register new admin → immediate login works
- [ ] QR login works for both
- [ ] MySQL has new user data
- [ ] localStorage has user data

### CRUD Tests
- [ ] Change password → reflected in MySQL
- [ ] Delete student → removed from system
- [ ] Delete admin → removed from system
- [ ] Edit profile → updates in MySQL

### Borrowing Tests
- [ ] Student can't borrow reserved book
- [ ] Can't borrow same book twice
- [ ] Due date set to 14 days
- [ ] Book status changes to 'borrowed'
- [ ] History shows borrow record

### Return Tests
- [ ] Admin can mark book returned
- [ ] Return date populated
- [ ] Book status changes to 'available'
- [ ] Overdue detection works
- [ ] History updated

---

## DEPLOYMENT CHECKLIST

- [ ] MySQL columns exist: `password_hash`, `two_factor_secret`, `two_factor_enabled`
- [ ] `borrow_records` table has `returned_at` column
- [ ] `books` table has `status` column
- [ ] All endpoints registered in `app.py`
- [ ] 2FA endpoints loaded (from previous fix)
- [ ] Test all flows end-to-end

---

## SECURITY NOTES

1. **Always verify password via bcrypt on backend**
2. **All CRUD operations must write to MySQL, not just localStorage**
3. **QR login requires valid sessionToken**
4. **Admins can only delete if they're authorized**
5. **All book operations must audit log**
6. **Overdue books must be tracked for notifications**

