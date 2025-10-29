# 🔧 Mirror Login Button Dynamic Color Fix

## ❌ Previous Behavior

The login button remained **blue** even when a user with an active session typed their ID.

## ✅ New Behavior

The button now changes color based on the **specific user ID typed** in the input field:

### Blue Button (Login to Library)
- **When:** No ID is typed OR the typed ID has no active library session
- **Action:** Clicking logs the user into the library

### Green Button (Logout from Library)
- **When:** The typed ID matches a user with an active library session
- **Action:** Clicking logs the user out of the library

---

## 🎯 How It Works

### Step-by-Step Flow

1. **User opens Mirror Login Page**
   - Button shows: **Blue "Login to Library"**

2. **User types their ID (e.g., KCL-00001)**
   - System checks if this specific user has an active library session
   - Checks local session first (fast)
   - Then queries backend API (accurate)

3. **If user has active session:**
   - Button changes to: **Green "Logout from Library"**
   - User can click to logout

4. **If user has no active session:**
   - Button remains: **Blue "Login to Library"**
   - User enters password and clicks to login

5. **After login:**
   - Session is created
   - Button automatically changes to green
   - Next time user types their ID, button will be green

6. **After logout:**
   - Session is ended
   - Button changes back to blue
   - Next time user types their ID, button will be blue

---

## 🔧 Technical Changes

### 1. LibraryEntry.tsx

**Added real-time session checking:**
```typescript
// Check if the SPECIFIC typed user ID has an active library session
useEffect(() => {
  const checkTypedUserSession = async () => {
    // If no ID is typed yet, show blue LOGIN button
    if (!formData.id || formData.id.trim() === '') {
      setIsUserLoggedInLibrary(false);
      return;
    }

    // First check local session (fast)
    if (session && session.status === 'active' && session.userId === formData.id) {
      setIsUserLoggedInLibrary(true);
      return;
    }

    // Then check backend for this specific user (accurate)
    const hasActiveSession = await checkUserSessionStatus(formData.id);
    setIsUserLoggedInLibrary(hasActiveSession);
  };

  checkTypedUserSession();
}, [session, formData.id, checkUserSessionStatus]);
```

### 2. LibrarySessionContext.tsx

**Added new function to check specific user session:**
```typescript
const checkUserSessionStatus = async (userId: string): Promise<boolean> => {
  // Check if the current session matches the user ID
  if (session && session.userId === userId && session.status === 'active') {
    return true;
  }

  // Query backend to check if this user has an active session
  const response = await fetch(`${API_BASE}/api/library/check-session/${userId}`);
  const data = await response.json();
  return data.hasActiveSession === true;
};
```

---

## 🔌 Backend API Required

The frontend now calls this endpoint:

```http
GET /api/library/check-session/:userId
```

**Response:**
```json
{
  "hasActiveSession": true,
  "sessionId": "session_123",
  "loginTime": "2025-10-29T10:30:00Z"
}
```

**Backend Implementation Needed:**
```python
@app.route('/api/library/check-session/<user_id>', methods=['GET'])
def check_user_session(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if user has active library session
        cursor.execute("""
            SELECT session_id, user_id, login_time, status
            FROM library_sessions
            WHERE user_id = %s AND status = 'inside_library'
            ORDER BY login_time DESC
            LIMIT 1
        """, (user_id,))
        
        session = cursor.fetchone()
        
        if session:
            return jsonify({
                'hasActiveSession': True,
                'sessionId': session['session_id'],
                'loginTime': session['login_time'].isoformat()
            })
        else:
            return jsonify({
                'hasActiveSession': False
            })
            
    except Exception as e:
        print(f"Error checking session: {e}")
        return jsonify({'hasActiveSession': False}), 500
    finally:
        cursor.close()
        conn.close()
```

---

## 🧪 Testing Scenarios

### Scenario 1: New User Login

1. Open mirror page
2. Type user ID: **KCL-00001**
3. **Expected:** Blue "Login to Library" button
4. Enter password and click login
5. **Expected:** Button changes to green "Logout from Library"

### Scenario 2: User Already Logged In

1. User **KCL-00001** is already logged in
2. Open mirror page
3. Type user ID: **KCL-00001**
4. **Expected:** Green "Logout from Library" button (no password needed)
5. Click logout
6. **Expected:** Button changes to blue "Login to Library"

### Scenario 3: Different User

1. User **KCL-00001** is logged in
2. Type user ID: **KC-23-A-00762** (different user)
3. **Expected:** Blue "Login to Library" button
4. This user can login independently

### Scenario 4: Multiple Concurrent Users

1. User **KCL-00001** logs in → Button green for KCL-00001
2. User **KC-23-A-00762** logs in → Button green for KC-23-A-00762
3. Type **KCL-00001** → Green button
4. Type **KC-23-A-00762** → Green button
5. Type **KC-23-A-00123** (not logged in) → Blue button

---

## 📊 Button State Logic

```
┌─────────────────────────────────────────────────────┐
│ User types ID in input field                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ ID empty?      │
         └────┬───────┬───┘
              │       │
          YES │       │ NO
              │       │
              ▼       ▼
         ┌────────┐  ┌──────────────────────┐
         │ BLUE   │  │ Check local session  │
         │ LOGIN  │  └──────┬───────────────┘
         └────────┘         │
                            ▼
                   ┌─────────────────┐
                   │ Matches local?  │
                   └────┬───────┬────┘
                        │       │
                    YES │       │ NO
                        │       │
                        ▼       ▼
                   ┌────────┐  ┌──────────────────┐
                   │ GREEN  │  │ Check backend    │
                   │ LOGOUT │  └──────┬───────────┘
                   └────────┘         │
                                      ▼
                             ┌─────────────────┐
                             │ Has session?    │
                             └────┬───────┬────┘
                                  │       │
                              YES │       │ NO
                                  │       │
                                  ▼       ▼
                             ┌────────┐  ┌────────┐
                             │ GREEN  │  │ BLUE   │
                             │ LOGOUT │  │ LOGIN  │
                             └────────┘  └────────┘
```

---

## ✅ Summary

**Files Modified:**
1. ✅ `LibraryEntry.tsx` - Real-time session checking based on typed ID
2. ✅ `LibrarySessionContext.tsx` - Added `checkUserSessionStatus` function

**Backend Required:**
- ✅ `GET /api/library/check-session/:userId` endpoint

**Behavior:**
- ✅ Button is **blue** when no ID or ID has no session
- ✅ Button is **green** when typed ID has active session
- ✅ Supports multiple concurrent users
- ✅ Real-time updates as user types

**The mirror login button now dynamically changes color based on the specific user ID typed! 🎉**
