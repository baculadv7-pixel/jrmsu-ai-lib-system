🧭 Dashboard & Reports (Real-Time Integration)

Implement real-time dashboard and report updates that dynamically calculate and refresh all statistics based on live data from the database.

Integrate backend synchronization to ensure all counts (students, books, transactions, etc.) reflect accurate data.

Allow the AI system to automatically observe, review, recalculate, and refresh dashboard metrics as part of its periodic functionality check.

The dashboard and reports must always display updated values without requiring a manual page reload.

🔔 Notification Bell Enhancements

Add three buttons to the notification panel:

All – Displays all notifications from latest to oldest.

Unread – Filters and displays only unread notifications from latest to oldest.

Mark as Read – Updates selected notifications as read.

AI should automatically refine repeated notifications by rephrasing or summarizing similar alerts while maintaining the same meaning and context.

Ensure notifications are logged and stored in the database with real-time WebSocket updates.

⚙️ Settings Menu (For Both Admin and Student Users)

The Settings Icon will include the following structured dropdowns and options:

🧍 Profile

View and edit user information (non-sensitive fields).

Manage profile photo and display details.

🔐 Authentication & 2FA

Access 2FA setup and management page (http://localhost:8080/settings).

Allow QR code generation, setup key, and verification.

Keep all UI and design consistent with the existing system layout.

🎨 Theme

Light Mode (Default) – Keep this as the main design and color scheme.

Dark Mode – Provide a dark theme optimized for comfort and readability.

System Mode (Time-Based) – Automatically adapt theme depending on the user’s local time:

Morning → Light

Afternoon → Soft Warm Tone

Evening → Dark

All themes must remain visually comfortable for all users and audiences.

👤 Account Settings

All items open via Dropdown Menu / Popover Menu for easy inline management:

Change Password – Displays a compact form with fields for:
Current Password | New Password | Confirm New Password (same layout as the Authentication & 2FA page).

Manage Email / Mobile Number – Displays Email and Mobile fields with update capability.

Session History – Shows all active device sessions (stored in the database).

Recovery Options – Allows access to Recovery Email, 2FA, and Backup Codes.

📚 Remove Library Preferences Section

Remove the following unnecessary options:

List View

Grid View

Compact View

“Show Available Only” toggle

These functions are now integrated elsewhere in the system.

🔒 Privacy & Security

Each item opens via a Dropdown / Popover Menu with real-time database logs:

Manage Access – Displays all devices currently granted account access.

Recent Account Activity – Shows every user action (Add, Remove, Edit, Activate 2FA, Change Password, Download QR Code, etc.) with times