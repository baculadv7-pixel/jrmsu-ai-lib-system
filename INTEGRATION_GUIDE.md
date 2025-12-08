# INTEGRATION GUIDE - New Endpoints
**Status**: Implementation Ready  
**Created**: 2025-12-07  
**Purpose**: Register new Flask blueprints and update frontend to use backend API

---

## Step 1: Register Blueprints in `app.py`

Add these imports at the top of `python-backend/app.py`:

```python
from registration_endpoints import registration_bp
from borrowing_endpoints import borrowing_bp
```

Then register the blueprints after creating the Flask app (around line 43):

```python
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins=list(ALLOWED_ORIGINS) or "*")

# Register blueprints
app.register_blueprint(registration_bp)
app.register_blueprint(borrowing_bp)

# ... rest of app initialization
```

---

## Step 2: Update Frontend Registration Component

**File**: `src/pages/Registration.tsx`

Replace the `handleSubmit` function (around line 87) with:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation checks
  if (activeTab === "student") {
    if (studentIdError) {
      toast({ title: "Invalid Student ID", description: studentIdError, variant: "destructive" });
      return;
    }
  } else {
    if (adminIdError) {
      toast({ title: "Invalid Admin ID", description: adminIdError, variant: "destructive" });
      return;
    }
    if (passwordError) {
      toast({ title: "Invalid Password", description: passwordError, variant: "destructive" });
      return;
    }
  }

  try {
    const endpoint = activeTab === "student" 
      ? "http://localhost:5000/api/students/register"
      : "http://localhost:5000/api/admins/register";

    // Map form field names to backend expectations (camelCase)
    const payload = activeTab === "student" 
      ? {
          studentId: formData.studentId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          birthdate: formData.birthdate,
          gender: formData.gender || "",
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          course: formData.course,
          yearLevel: formData.yearLevel,
          currentStreet: formData.address,
          permanentStreet: formData.addressPermanent,
          sameAsCurrent: true,
          password: formData.password,
        }
      : {
          adminId: formData.adminId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          birthdate: formData.birthdate,
          gender: formData.gender || "",
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          street: formData.address,
          sameAsCurrent: true,
          password: formData.password,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Registration Failed",
        description: data.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: `${activeTab === "student" ? "Student" : "Admin"} Registration Successful`,
      description: `${activeTab === "student" ? "Student" : "Admin"} account has been created successfully. You can now login.`,
    });

    // Redirect after success
    navigate("/");
  } catch (error) {
    toast({
      title: "Error",
      description: `Registration error: ${String(error)}`,
      variant: "destructive",
    });
  }
};
```

---

## Step 3: Update Frontend Login to Use MySQL

**File**: `src/services/database.ts`

Update the `authenticateUser` function (around line 358) to first try MySQL:

```typescript
authenticateUser(id: string, password: string): { success: boolean; user?: User; error?: string } {
  // First, try to authenticate against MySQL via backend API
  try {
    const response = fetch('http://localhost:5000/api/users/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, password })
    });

    if (response && response.ok) {
      const authData = response.json();
      if (authData.success && authData.user) {
        // User authenticated against MySQL
        const dbUser = authData.user;
        // Sync to localStorage for offline support
        const users = this.getAllUsers();
        const idx = users.findIndex(u => u.id === id);
        if (idx >= 0) {
          users[idx] = dbUser;
        } else {
          users.push(dbUser);
        }
        this.saveUsers(users);
        return { success: true, user: dbUser };
      }
    }
  } catch (e) {
    // Backend unavailable, fall back to localStorage
  }

  // Fallback to localStorage for offline mode
  const user = this.getUserById(id);
  
  if (!user) {
    return { success: false, error: "User not found" };
  }
  
  if (!user.isActive) {
    return { success: false, error: "Account is deactivated" };
  }
  
  if (!this.verifyPassword(password, user.passwordHash)) {
    return { success: false, error: "Invalid password" };
  }
  
  return { success: true, user };
}
```

---

## Step 4: Add Return Button to History Component

**File**: `src/pages/History.tsx`

Add this import at the top:

```typescript
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
```

Add this state hook in the History component:

```typescript
const [borrowToReturn, setBorrowToReturn] = useState<string | null>(null);
```

Update the table rendering to include a return button (around the status badge):

```typescript
{userType === 'admin' && record.status === 'borrowed' && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => setBorrowToReturn(record.borrowId)}
  >
    Mark Returned
  </Button>
)}
{record.status === 'returned' && (
  <Badge variant="secondary">✓ Returned</Badge>
)}
```

Add the return confirmation dialog before the closing div:

```typescript
<AlertDialog open={!!borrowToReturn} onOpenChange={(open) => !open && setBorrowToReturn(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Mark Book as Returned?</AlertDialogTitle>
      <AlertDialogDescription>
        This will update the book status and record the return date.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => handleMarkReturned(borrowToReturn!)}>
        Confirm Return
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Add the handler function:

```typescript
const handleMarkReturned = async (borrowId: string) => {
  try {
    const response = await fetch(`${API_BASE}/api/library/mark-returned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrowId })
    });

    if (response.ok) {
      toast({
        title: 'Success',
        description: 'Book marked as returned'
      });
      setBorrowToReturn(null);
      // Reload history
      await loadHistory();
    } else {
      const error = await response.json();
      toast({
        title: 'Error',
        description: error.error || 'Failed to mark as returned',
        variant: 'destructive'
      });
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: String(error),
      variant: 'destructive'
    });
  }
};
```

---

## Step 5: Test the Integration

### Registration Flow Test
1. Open http://localhost:8080/register
2. Fill in student form with test data
3. Click "Register Student"
4. Verify success toast appears
5. Check MySQL `students` table for new record:
   ```sql
   SELECT * FROM jrmsu_library.students WHERE student_id LIKE 'KC-23-%' ORDER BY created_at DESC;
   ```

### Login Flow Test
1. Open http://localhost:8080/
2. Enter the registered student ID and password
3. Verify login succeeds
4. Check that student data appears in AuthContext

### Borrowing Flow Test
1. Login as student
2. Navigate to Books page
3. Click "Borrow" on a book
4. Verify borrow_records entry created:
   ```sql
   SELECT * FROM jrmsu_library.borrow_records ORDER BY borrowed_at DESC LIMIT 1;
   ```

### Return Flow Test
1. Login as admin
2. Navigate to History page
3. Find a borrowed book
4. Click "Mark Returned"
5. Verify status changes to "returned" and returned_at is populated

---

## Step 6: Database Schema Verification

Ensure these tables and columns exist in MySQL:

```sql
-- Check students table
DESCRIBE students;
-- Should have: password_hash column

-- Check admins table
DESCRIBE admins;
-- Should have: password_hash column

-- Check borrow_records table
DESCRIBE borrow_records;
-- Should have:
-- - borrow_id (VARCHAR, PRIMARY KEY)
-- - student_id (VARCHAR, FK)
-- - book_id (VARCHAR, FK)
-- - borrowed_at (DATETIME)
-- - due_date (DATETIME)
-- - returned_at (DATETIME, nullable)
-- - status (ENUM: 'borrowed', 'returned')
-- - overdue_days (INT, default 0)

-- Check books table
DESCRIBE books;
-- Should have:
-- - book_id (VARCHAR, PRIMARY KEY)
-- - available (INT)
-- - status (VARCHAR or ENUM: 'available', 'borrowed')
```

If any columns are missing, run migrations or use phpMyAdmin to add them.

---

## Step 7: Environment Configuration

Ensure `.env` or environment variables are set:

```bash
# Backend
DB_HOST=localhost
DB_PORT=3306
DB_NAME=jrmsu_library
DB_USER=root
DB_PASSWORD=
BACKEND_BASE_URL=http://localhost:5000

# Frontend
VITE_API_BASE_URL=http://localhost:5000
```

---

## Troubleshooting

### Registration Fails with "User not found on login"
- ✅ Check MySQL has the new registration endpoints
- ✅ Verify user was created in MySQL (check `students` or `admins` table)
- ✅ Ensure password is being hashed (bcrypt)

### Password Change Not Persisting
- ✅ Verify `/api/users/<user_id>/change-password` endpoint is registered
- ✅ Check backend is updating MySQL, not just localStorage
- ✅ Use phpMyAdmin to verify `password_hash` field changed

### Return Button Missing
- ✅ Verify History.tsx has the mark-returned button code
- ✅ Check admin user role is "admin" not "student"
- ✅ Verify `/api/library/mark-returned` endpoint exists

### Overdue Calculation Wrong
- ✅ Check `borrow_records.due_date` is set to now + 14 days
- ✅ Verify `overdue_days` is calculated as `(NOW() - due_date).days`
- ✅ Test with a manually set past due_date

---

## Summary of Changes

| Component | Change | Status |
|-----------|--------|--------|
| `registration_endpoints.py` | New file with student/admin registration | ✅ Created |
| `borrowing_endpoints.py` | New file with borrow/return endpoints | ✅ Created |
| `app.py` | Register blueprints | ⏳ TODO |
| `Registration.tsx` | Call backend on submit | ⏳ TODO |
| `History.tsx` | Add return button | ⏳ TODO |
| `database.ts` | Add MySQL auth fallback | ⏳ TODO |
| MySQL | Create/update tables and columns | ✅ Assumed ready |

---

## Next Steps

1. ✅ Copy `registration_endpoints.py` to `python-backend/`
2. ✅ Copy `borrowing_endpoints.py` to `python-backend/`
3. ⏳ Register blueprints in `app.py`
4. ⏳ Update `Registration.tsx` frontend
5. ⏳ Update `History.tsx` frontend
6. ⏳ Update `database.ts` to use backend API
7. ⏳ Test entire flow end-to-end
8. ⏳ Deploy and monitor

