# Notification System Test Guide

## How to Test Notifications

### 1. Test Welcome Notification (Registration)
**Steps:**
1. Go to http://localhost:8080/register
2. Complete all 4 phases of registration (Student or Admin)
3. Click "Finish" button
4. **Expected Result:**
   - ALL admin accounts should see notification: "New student KC-23-A-00762 (John Doe) registered successfully at [timestamp]"
   - The new user should see: "Welcome to JRMSU Library! Your account KC-23-A-00762 is now active."

### 2. Test Password Reset Request
**Steps:**
1. Go to http://localhost:8080 (login page)
2. Click "Forgot Password?"
3. Enter User ID, Full Name, Email
4. Click "Message the Admin" tab
5. Click "Request Password Reset"
6. **Expected Result:**
   - ALL admin accounts should see notification: "Password reset request from John Doe (KC-23-A-00762)"
   - Clicking the notification shows overlay with Grant/Decline buttons

### 3. Test Library Login/Logout (Mirror Page)
**Steps:**
1. Go to http://localhost:8081 (mirror page)
2. Login with credentials (manual or QR code)
3. **Expected Result:**
   - ALL admin accounts should see: "KC-23-A-00762 logged into library using manual login at [timestamp]"
4. Click Logout
5. **Expected Result:**
   - ALL admin accounts should see: "KC-23-A-00762 logged out from library at [timestamp]"

### 4. Check Notification Bell
**Steps:**
1. Login as an admin at http://localhost:8080
2. Look at the notification bell icon (top right)
3. **Expected Result:**
   - Should show a number badge with unread count
   - Clicking bell shows dropdown with notifications
   - Each notification shows AI-generated unique message

### 5. Verify No Duplicates
**Steps:**
1. Perform the same action multiple times (e.g., login/logout)
2. **Expected Result:**
   - Each notification should have a unique AI-generated message
   - Messages should vary: "logged into", "entered library", "accessed library", etc.

## Debugging

### If "No notifications" appears:

1. **Open Browser Console** (F12)
2. Look for: `📢 Notification update detected, reloading...`
3. Check localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('jrmsu_notifications'))
   ```

### If notifications don't appear immediately:

1. Refresh the page (F5)
2. The Navbar now subscribes to NotificationsService broadcast channel
3. New notifications should appear in real-time

### Check Notification Count:

```javascript
// In browser console
const NotificationsService = window.NotificationsService;
const notifications = NotificationsService.list('YOUR_ADMIN_ID');
console.log('Total notifications:', notifications.length);
console.log('Unread:', notifications.filter(n => n.status === 'unread').length);
```

## Current Implementation Status

✅ **Completed:**
- NotificationManager service with AI-generated messages
- Mirror Page login/logout notifications
- Registration notifications (Admin & Student)
- Password reset request notifications
- Navbar reads from local NotificationsService
- Real-time updates via BroadcastChannel

⏳ **Pending:**
- Profile update notifications
- Book operations notifications
- Main system login/logout notifications
- QR code generation notifications
- Profile picture upload notifications

## Notification Types Implemented

### For Admins (ALL admins receive):
1. ✅ Welcome new user
2. ✅ Password reset request
3. ✅ New student registered
4. ✅ New admin registered
5. ✅ Library login (manual/QR)
6. ✅ Library logout (manual/QR)
7. ⏳ Password changed (email/admin/2FA)
8. ⏳ Book operations
9. ⏳ Profile updates
10. ⏳ User management actions

### For Students (Individual):
1. ✅ Welcome message
2. ⏳ Password changed confirmation
3. ⏳ Profile updated
4. ⏳ Book operations

## Next Actions Required

To complete the notification system:

1. **Main System Login/Logout** - Add to Login.tsx
2. **Profile Updates** - Add to EnhancedProfile.tsx
3. **Book Operations** - Add to BookManagement.tsx
4. **QR Code Generation** - Add to profile QR regeneration
5. **Profile Picture Upload** - Add to profile picture upload handler
