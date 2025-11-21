import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Shield, Smartphone, Mail, Key, CheckCircle, Eye, EyeOff, Database, FileText, Info, Users, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import TwoFASetup from "@/components/auth/TwoFASetup";
import { pythonApi } from "@/services/pythonApi";
import { ActivityService } from "@/services/activity";

const Settings = () => {
  const { user, disableTwoFactor } = useAuth();
  const userType: "student" | "admin" = user?.role ?? "student";
  const { toast } = useToast();
  const [emailAuth, setEmailAuth] = useState(true);
  const [smsAuth, setSmsAuth] = useState(false);
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(
    localStorage.getItem(`notification_email_${user?.id}`) === 'true'
  );
  const [smsReminders, setSmsReminders] = useState(
    localStorage.getItem(`notification_sms_${user?.id}`) === 'true'
  );
  const [pushNotifications, setPushNotifications] = useState(
    localStorage.getItem(`notification_push_${user?.id}`) === 'true'
  );

  // Keep notification toggles in sync with other UI (e.g. header dropdown)
  useEffect(() => {
    const handler = (event: any) => {
      const detail = event?.detail || {};
      if ('emailNotifications' in detail) {
        setEmailNotifications(!!detail.emailNotifications);
      }
      if ('smsReminders' in detail) {
        setSmsReminders(!!detail.smsReminders);
      }
      if ('pushNotifications' in detail) {
        setPushNotifications(!!detail.pushNotifications);
      }
    };
    window.addEventListener('jrmsu:notifications-updated', handler as EventListener);
    return () => {
      window.removeEventListener('jrmsu:notifications-updated', handler as EventListener);
    };
  }, []);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Overlay states
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showSystemVersion, setShowSystemVersion] = useState(false);
  const [showDevelopers, setShowDevelopers] = useState(false);
  const [backupRestoreMode, setBackupRestoreMode] = useState<'backup' | 'restore' | null>(null);

  // Admin backup confirmation state
  const [showBackupPasswordDialog, setShowBackupPasswordDialog] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [showBackupConfirmDialog, setShowBackupConfirmDialog] = useState(false);
  const [backupConfirmText, setBackupConfirmText] = useState("");
  const [isBackupSubmitting, setIsBackupSubmitting] = useState(false);

  // Admin restore confirmation state
  const [showRestorePasswordDialog, setShowRestorePasswordDialog] = useState(false);
  const [restorePassword, setRestorePassword] = useState("");
  const [showRestoreConfirmDialog, setShowRestoreConfirmDialog] = useState(false);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [isRestoreSubmitting, setIsRestoreSubmitting] = useState(false);

  // Post-confirm action dialogs
  const [showBackupActionDialog, setShowBackupActionDialog] = useState(false);
  const [showRestoreActionDialog, setShowRestoreActionDialog] = useState(false);

  // Admin audit export confirmation state
  const [showAuditPasswordDialog, setShowAuditPasswordDialog] = useState(false);
  const [auditPassword, setAuditPassword] = useState("");
  const [showAuditConfirmDialog, setShowAuditConfirmDialog] = useState(false);
  const [auditConfirmText, setAuditConfirmText] = useState("");
  const [isAuditExporting, setIsAuditExporting] = useState(false);
  const [showAuditExportFormatDialog, setShowAuditExportFormatDialog] = useState(false);

  const handleSave2FA = () => {
    try {
      toast({ title: "Settings Saved", description: "Your 2FA settings have been updated successfully." });
    } catch (error) {
      console.warn('Failed to show toast:', error);
    }
  };

  // Backup & Restore handlers
  const downloadLatestBackup = async () => {
    try {
      // Use a POST JSON endpoint designed to avoid 415/Content-Type issues
      const res = await fetch('http://localhost:5000/api/backup/latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || '' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        if (res.status === 404) {
          toast({ title: 'No backups yet', description: 'Create a backup first before downloading.' });
          return;
        }
        throw new Error(data.error || 'Failed to load latest backup metadata');
      }

      const data = await res.json();
      const latest = data.latest || (data.items || [])[0];
      const name = latest?.filename;
      const target = name || '';
      if (!target) {
        toast({ title: 'No backups yet', description: 'Create a backup first before downloading.' });
        return;
      }

      const dl = await fetch(`http://localhost:5000/api/backup/download/${encodeURIComponent(target)}`);
      if (!dl.ok) {
        throw new Error('Download failed');
      }
      const blob = await dl.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = target;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      const raw = String(e?.message || 'Could not download backup file.');
      const friendly = raw.startsWith('Unexpected token')
        ? 'Download failed. The server did not return a valid backup file.'
        : raw;
      toast({ title: 'Download failed', description: friendly, variant: 'destructive' });
    }
  };

  const handleBackupDatabase = async () => {
    try {
      if (!user?.id) {
        toast({ title: "Not allowed", description: "Only admins can create backups.", variant: "destructive" });
        return;
      }

      if (!backupPassword) {
        toast({ title: "Password required", description: "Please enter your admin password.", variant: "destructive" });
        return;
      }

      setIsBackupSubmitting(true);

      const response = await fetch('http://localhost:5000/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          adminPassword: backupPassword,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Backup Created",
          description: "Database backup has been saved to backupdb folder successfully."
        });
        setShowBackupRestore(false);
        setBackupRestoreMode(null);
        setShowBackupPasswordDialog(false);
        setShowBackupConfirmDialog(false);
        setShowBackupActionDialog(false);
        setBackupPassword("");
        setBackupConfirmText("");
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Backup failed');
      }
    } catch (error: any) {
      toast({
        title: "Backup Failed",
        description: error?.message || "Failed to create database backup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBackupSubmitting(false);
    }
  };

  const handleRestoreDatabase = async () => {
    try {
      if (!user?.id) {
        toast({ title: "Not allowed", description: "Only admins can restore backups.", variant: "destructive" });
        return;
      }

      if (!restorePassword) {
        toast({ title: "Password required", description: "Please enter your admin password.", variant: "destructive" });
        return;
      }

      if (!restoreConfirmText) {
        toast({ title: "Confirmation required", description: "Please type the confirmation phrase.", variant: "destructive" });
        return;
      }

      setIsRestoreSubmitting(true);

      const response = await fetch('http://localhost:5000/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          confirmPhrase: restoreConfirmText,
          adminPassword: restorePassword,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Database Restored",
          description: "Database has been restored successfully from backup."
        });
        setShowBackupRestore(false);
        setBackupRestoreMode(null);
        setShowRestorePasswordDialog(false);
        setShowRestoreConfirmDialog(false);
        setRestorePassword("");
        setRestoreConfirmText("");
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Restore failed');
      }
    } catch (error: any) {
      const message = String(error?.message || 'Failed to restore database. Please try again.');
      const friendly = message.includes('No backup file found to restore')
        ? 'No backup database stored in the backupdb folder.'
        : message;
      toast({
        title: "Restore Failed",
        description: friendly,
        variant: "destructive"
      });
    } finally {
      setIsRestoreSubmitting(false);
    }
  };

  const handleExportAuditLog = async (format: 'csv' | 'xlsx') => {
    try {
      if (!user?.id) {
        toast({ title: "Not allowed", description: "Only admins can export audit logs.", variant: "destructive" });
        return;
      }

      if (!auditPassword) {
        toast({ title: "Password required", description: "Please enter your admin password.", variant: "destructive" });
        return;
      }

      setIsAuditExporting(true);

      const response = await fetch('http://localhost:5000/api/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, adminPassword: auditPassword, format }),
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({} as any));
        // If server reports Excel not available, automatically fall back to CSV
        if (format === 'xlsx' && response.status === 400 && String(data.error || '').includes('Excel export not available')) {
          await handleExportAuditLog('csv');
          return;
        }
        throw new Error(data.error || 'Export failed');
      }

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'xlsx' ? 'xlsx' : 'csv';
        a.download = `audit_log_${new Date().toISOString().split('T')[0]}.${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Audit Log Exported",
          description: format === 'xlsx'
            ? 'Audit log has been downloaded as an Excel (.xlsx) file.'
            : 'Audit log has been downloaded as a CSV file (Excel-compatible).'
        });
        setShowAuditLog(false);
        setShowAuditPasswordDialog(false);
        setShowAuditConfirmDialog(false);
        setShowAuditExportFormatDialog(false);
        setAuditPassword("");
        setAuditConfirmText("");
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Export failed');
      }
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error?.message || "Failed to export audit log. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAuditExporting(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "All password fields are required.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpperCase || !hasNumber) {
      toast({
        title: "Weak Password",
        description: "Password must contain at least one uppercase letter and one number.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsChangingPassword(true);

      // Call backend API to change password
      const response = await pythonApi.changePassword({
        userId: user?.id || '',
        userType: userType,
        currentPassword,
        newPassword
      });

      if (response.success) {
        // Log activity
        try {
          await ActivityService.log(user?.id || '', 'PASSWORD_CHANGED', 'Password updated successfully');
        } catch (e) {
          console.warn('Failed to log activity:', e);
        }

        toast({
          title: "Password Updated",
          description: "Your password has been changed successfully.",
        });

        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          title: "Password Change Failed",
          description: response.message || "Current password is incorrect.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Notification preference handlers
  const handleEmailNotificationChange = async (enabled: boolean) => {
    setEmailNotifications(enabled);
    localStorage.setItem(`notification_email_${user?.id}`, String(enabled));
    
    // Save to backend
    try {
      await pythonApi.updateNotificationPreferences({
        userId: user?.id || '',
        emailNotifications: enabled,
        smsReminders,
        pushNotifications
      });

      // Broadcast update so other components (e.g. settings icon dropdown)
      // can reflect the same toggle state.
      try {
        window.dispatchEvent(new CustomEvent('jrmsu:notifications-updated', {
          detail: {
            emailNotifications: enabled,
            smsReminders,
            pushNotifications,
          },
        }));
      } catch {
        // ignore cross-environment errors
      }
      
      toast({
        title: enabled ? "Email Notifications Enabled" : "Email Notifications Disabled",
        description: enabled 
          ? "You will receive email alerts about overdue books." 
          : "Email notifications have been disabled."
      });
    } catch (error) {
      console.error('Failed to update email notifications:', error);
    }
  };

  const handleSmsReminderChange = async (enabled: boolean) => {
    setSmsReminders(enabled);
    localStorage.setItem(`notification_sms_${user?.id}`, String(enabled));
    
    // Save to backend
    try {
      await pythonApi.updateNotificationPreferences({
        userId: user?.id || '',
        emailNotifications,
        smsReminders: enabled,
        pushNotifications
      });

      try {
        window.dispatchEvent(new CustomEvent('jrmsu:notifications-updated', {
          detail: {
            emailNotifications,
            smsReminders: enabled,
            pushNotifications,
          },
        }));
      } catch {}
      
      toast({
        title: enabled ? "SMS Reminders Enabled" : "SMS Reminders Disabled",
        description: enabled 
          ? "You will receive SMS alerts about overdue books." 
          : "SMS reminders have been disabled."
      });
    } catch (error) {
      console.error('Failed to update SMS reminders:', error);
    }
  };

  const handlePushNotificationChange = async (enabled: boolean) => {
    setPushNotifications(enabled);
    localStorage.setItem(`notification_push_${user?.id}`, String(enabled));
    
    // Request permission for push notifications
    if (enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
        setPushNotifications(false);
        localStorage.setItem(`notification_push_${user?.id}`, 'false');
        return;
      }
    }
    
    // Save to backend
    try {
      await pythonApi.updateNotificationPreferences({
        userId: user?.id || '',
        emailNotifications,
        smsReminders,
        pushNotifications: enabled
      });

      try {
        window.dispatchEvent(new CustomEvent('jrmsu:notifications-updated', {
          detail: {
            emailNotifications,
            smsReminders,
            pushNotifications: enabled,
          },
        }));
      } catch {}
      
      toast({
        title: enabled ? "Push Notifications Enabled" : "Push Notifications Disabled",
        description: enabled 
          ? "You will receive push notifications on your devices about overdue books." 
          : "Push notifications have been disabled."
      });
    } catch (error) {
      console.error('Failed to update push notifications:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                {userType === "admin" ? "Authentication & System Settings" : "Authentication & 2FA Settings"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {userType === "admin" 
                  ? "Manage security settings and system-wide authentication controls"
                  : "Manage your personal security and two-factor authentication"}
              </p>
            </div>

            {/* 2FA Setup & Status (real, persisted) */}
            <TwoFASetup />

            {/* Change Password */}
            <Card className="shadow-jrmsu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>Change Password</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="current-password" 
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with 1 uppercase and 1 number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  className="w-full gap-2"
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                >
                  <CheckCircle className="h-4 w-4" />
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>

            {/* Notifications & Alerts */}
            <Card className="shadow-jrmsu border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle className="text-green-900">Notifications & Alerts</CardTitle>
                    <CardDescription className="text-green-700">
                      Manage how you receive overdue book notifications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Email Notifications</p>
                      <p className="text-sm text-green-700">
                        Receive email alerts about overdue books
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={handleEmailNotificationChange}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">SMS Reminders</p>
                      <p className="text-sm text-green-700">
                        Receive SMS text messages about overdue books
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={smsReminders}
                    onCheckedChange={handleSmsReminderChange}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Push Notifications</p>
                      <p className="text-sm text-green-700">
                        Receive push notifications on desktop, tablet, and mobile devices
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={handlePushNotificationChange}
                  />
                </div>

                <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                  <p className="text-xs text-green-800">
                    <strong>Note:</strong> All notification types will only alert you about <strong>overdue books</strong> in your account. You can manage these preferences anytime.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Recommendations */}
            <Card className="shadow-jrmsu bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Security Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-leaf mt-0.5" />
                    <span className="text-sm">Use a strong password with at least 8 characters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-leaf mt-0.5" />
                    <span className="text-sm">Enable two-factor authentication for enhanced security</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-leaf mt-0.5" />
                    <span className="text-sm">Never share your login credentials with anyone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-leaf mt-0.5" />
                    <span className="text-sm">Log out when using shared or public computers</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Admin-only System Settings */}
            {userType === "admin" && (
              <>
                <Card className="shadow-jrmsu border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-orange-600" />
                      <div>
                        <CardTitle className="text-orange-900">System Authentication Settings</CardTitle>
                        <CardDescription className="text-orange-700">
                          Admin-only controls for system-wide security
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-orange-200">
                      <div>
                        <p className="font-medium text-orange-900">Session Timeout Control</p>
                        <p className="text-sm text-orange-700">
                          Set automatic logout time for inactive users
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          defaultValue={30} 
                          min={5}
                          max={240}
                          className="w-16 text-center" 
                          onBlur={(e) => {
                            const v = Number(e.target.value) || 30;
                            const minutes = Math.min(240, Math.max(5, v));
                            e.target.value = String(minutes);
                            try {
                              localStorage.setItem('jrmsu_session_timeout_minutes', String(minutes));
                              toast({
                                title: 'Session timeout updated',
                                description: `Inactive users will be logged out after ${minutes} minutes.`,
                              });
                            } catch (err) {
                              console.warn('Failed to persist session timeout:', err);
                            }
                          }}
                        />
                        <span className="text-sm text-orange-700">minutes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Administrator Section */}
                <Card className="shadow-jrmsu border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-blue-900">System Administrator</CardTitle>
                        <CardDescription className="text-blue-700">
                          Database management and system information
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-4 border-blue-200 hover:bg-blue-100"
                      onClick={() => setShowBackupRestore(true)}
                    >
                      <Database className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-blue-900">Backup & Restore Database</p>
                        <p className="text-sm text-blue-700">Create or restore database backups</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-4 border-blue-200 hover:bg-blue-100"
                      onClick={() => setShowAuditLog(true)}
                    >
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-blue-900">Audit Log</p>
                        <p className="text-sm text-blue-700">Export chronological activity records</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-4 border-blue-200 hover:bg-blue-100"
                      onClick={() => setShowSystemVersion(true)}
                    >
                      <Info className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-blue-900">System Version/Updates</p>
                        <p className="text-sm text-blue-700">View current system version and updates</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-4 border-blue-200 hover:bg-blue-100"
                      onClick={() => setShowDevelopers(true)}
                    >
                      <Users className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-blue-900">Developers Information</p>
                        <p className="text-sm text-blue-700">Meet the team behind this system</p>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave2FA} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </main>
      </div>

      <AIAssistant />

      {/* Backup & Restore Dialog */}
      <Dialog open={showBackupRestore} onOpenChange={setShowBackupRestore}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Backup & Restore Database
            </DialogTitle>
            <DialogDescription>
              Choose an option to protect your data or recover from a backup.
            </DialogDescription>
          </DialogHeader>
          
          {!backupRestoreMode ? (
            <div className="space-y-3 py-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={() => setBackupRestoreMode('backup')}
              >
                <Download className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">Backup Database</p>
                  <p className="text-sm text-muted-foreground">
                    Create a copy of data to protect it from loss
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={() => setBackupRestoreMode('restore')}
              >
                <Upload className="h-5 w-5 text-orange-600" />
                <div className="text-left">
                  <p className="font-medium">Restore Database</p>
                  <p className="text-sm text-muted-foreground">
                    Retrieve copied data to recover it
                  </p>
                </div>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {backupRestoreMode === 'backup' ? (
                <div className="space-y-4">
                  <p className="text-sm">
                    This will create a backup of your current database and save it to the <code className="bg-muted px-1 py-0.5 rounded">backupdb</code> folder.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The backup will include all users, books, borrowing records, and system data.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can also download the generated backup file for safe keeping.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm">
                    This will restore your database from a backup in the <code className="bg-muted px-1 py-0.5 rounded">backupdb</code> folder.
                  </p>
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Warning: This will overwrite your current database!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You may upload a compatible backup file (.json.gz). If no file is uploaded, the most recent backup will be used.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBackupRestore(false);
                setBackupRestoreMode(null);
              }}
            >
              Cancel
            </Button>
            {backupRestoreMode && (
              <Button
                onClick={backupRestoreMode === 'backup'
                  ? () => {
                      // First step: ask for admin password in a dedicated overlay (backup)
                      setShowBackupPasswordDialog(true);
                    }
                  : () => {
                      // First step: ask for admin password in a dedicated overlay (restore)
                      setShowRestorePasswordDialog(true);
                    }}
                className={backupRestoreMode === 'restore' ? 'bg-destructive hover:bg-destructive/90' : ''}
              >
                {backupRestoreMode === 'backup' ? 'Create Backup' : 'Restore Now'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Audit Log
            </DialogTitle>
            <DialogDescription>
              Export chronological activity records
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <p className="text-sm">
              The audit log contains a chronological record of all activities within the library system, including:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
              <li>User login and logout activities</li>
              <li>Book borrowing and returns</li>
              <li>Reservation changes</li>
              <li>Profile updates</li>
              <li>System configuration changes</li>
            </ul>
            <p className="text-sm">
              The log will be exported as an Excel file documenting <strong>who did what, when, and where</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditLog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // First step: ask for admin password in a dedicated overlay
                setShowAuditPasswordDialog(true);
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Version Dialog */}
      <Dialog open={showSystemVersion} onOpenChange={setShowSystemVersion}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              System Version & Updates
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">System Name:</span>
                <span className="text-sm">JRMSU Library Management System</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Version:</span>
                <Badge className="bg-primary">v1.0.0</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Release Date:</span>
                <span className="text-sm">October 30, 2024</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge className="bg-green-600">Stable</Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Latest Updates:</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>✓ QR Code authentication system</li>
                <li>✓ Two-factor authentication (2FA)</li>
                <li>✓ AI-powered library assistant</li>
                <li>✓ Real-time notifications</li>
                <li>✓ Comprehensive reporting system</li>
                <li>✓ Backup & restore functionality</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSystemVersion(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Backup Password Dialog */}
      <Dialog open={showBackupPasswordDialog} onOpenChange={(open) => {
        setShowBackupPasswordDialog(open);
        if (!open) {
          setBackupPassword("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Admin Password</DialogTitle>
            <DialogDescription>
              Enter your password to confirm database backup. This is required for all admins who create backups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="backup-admin-password">Admin Password</Label>
            <Input
              id="backup-admin-password"
              type="password"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              placeholder="Enter your admin password"
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBackupPasswordDialog(false);
                setBackupPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!backupPassword) {
                  toast({
                    title: "Password required",
                    description: "Please enter your admin password.",
                    variant: "destructive",
                  });
                  return;
                }
                setShowBackupPasswordDialog(false);
                setShowBackupConfirmDialog(true);
              }}
            >
              Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Backup Confirm Phrase Dialog */}
      <Dialog open={showBackupConfirmDialog} onOpenChange={(open) => {
        setShowBackupConfirmDialog(open);
        if (!open) {
          setBackupConfirmText("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Type "Confirm" to proceed</DialogTitle>
            <DialogDescription>
              For safety, please type the word <strong>Confirm</strong> exactly to proceed with creating a backup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={backupConfirmText}
              onChange={(e) => setBackupConfirmText(e.target.value)}
              placeholder="Confirm"
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
        setShowBackupConfirmDialog(false);
        setBackupConfirmText("");
      }}
            >
              Cancel
            </Button>
            <Button
              disabled={isBackupSubmitting}
              onClick={() => {
                if (backupConfirmText !== 'Confirm') {
                  toast({
                    title: "Confirmation required",
                    description: "You must type the word 'Confirm' exactly to proceed.",
                    variant: "destructive",
                  });
                  return;
                }
                setShowBackupConfirmDialog(false);
                setShowBackupActionDialog(true);
              }}
            >
              {isBackupSubmitting ? 'Processing...' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Restore Password Dialog */}
      <Dialog open={showRestorePasswordDialog} onOpenChange={(open) => {
        setShowRestorePasswordDialog(open);
        if (!open) {
          setRestorePassword("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Admin Password</DialogTitle>
            <DialogDescription>
              Enter your password to confirm database restore. This is required for all admins who restore from backups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="restore-admin-password">Admin Password</Label>
            <Input
              id="restore-admin-password"
              type="password"
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
              placeholder="Enter your admin password"
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRestorePasswordDialog(false);
                setRestorePassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!restorePassword) {
                  toast({
                    title: "Password required",
                    description: "Please enter your admin password.",
                    variant: "destructive",
                  });
                  return;
                }
                setShowRestorePasswordDialog(false);
                setShowRestoreConfirmDialog(true);
              }}
            >
              Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Restore Confirm Phrase Dialog */}
      <Dialog open={showRestoreConfirmDialog} onOpenChange={(open) => {
        setShowRestoreConfirmDialog(open);
        if (!open) {
          setRestoreConfirmText("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Type "RESTORE NOW" to proceed</DialogTitle>
            <DialogDescription>
              This will restore your database from the most recent backup and overwrite the current data.
              Type the phrase <strong>RESTORE NOW</strong> exactly to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={restoreConfirmText}
              onChange={(e) => setRestoreConfirmText(e.target.value)}
              placeholder="RESTORE NOW"
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
        setShowRestoreConfirmDialog(false);
        setRestoreConfirmText("");
      }}
            >
              Cancel
            </Button>
            <Button
              disabled={isRestoreSubmitting}
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (restoreConfirmText !== 'RESTORE NOW') {
                  toast({
                    title: "Confirmation required",
                    description: "You must type 'RESTORE NOW' exactly to proceed.",
                    variant: "destructive",
                  });
                  return;
                }
                setShowRestoreConfirmDialog(false);
                setShowRestoreActionDialog(true);
              }}
            >
              {isRestoreSubmitting ? 'Restoring...' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Action Selection Dialog */}
      <Dialog open={showBackupActionDialog} onOpenChange={setShowBackupActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select backup action</DialogTitle>
            <DialogDescription>
              Choose whether to create a new backup or download the latest existing backup file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Button
              className="w-full justify-start"
              onClick={() => {
                setShowBackupActionDialog(false);
                handleBackupDatabase();
              }}
            >
              Create Backup
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                await downloadLatestBackup();
              }}
            >
              Download latest backup file
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupActionDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Action Selection Dialog */}
      <Dialog open={showRestoreActionDialog} onOpenChange={setShowRestoreActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select restore action</DialogTitle>
            <DialogDescription>
              Restore from the backup folder or upload a compatible backup file (.json.gz) first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Button
              className="w-full justify-start bg-destructive hover:bg-destructive/90"
              onClick={() => {
                setShowRestoreActionDialog(false);
                handleRestoreDatabase();
              }}
            >
              Restore Database
            </Button>
            <div className="space-y-2 text-xs text-muted-foreground">
              <label className="text-xs font-medium">Upload backup file (.json.gz)</label>
              <input
                type="file"
                accept=".json.gz"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const form = new FormData();
                  form.append('file', file);
                  try {
                    const res = await fetch('http://localhost:5000/api/backup/upload', {
                      method: 'POST',
                      body: form,
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) {
                      throw new Error(data.error || 'Upload failed');
                    }
                    toast({ title: 'Backup uploaded', description: `File ${data.filename} is now available for restore.` });
                  } catch (err: any) {
                    toast({ title: 'Upload failed', description: err?.message || 'Could not upload backup file.', variant: 'destructive' });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreActionDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Audit Export Password Dialog */}
      <Dialog open={showAuditPasswordDialog} onOpenChange={(open) => {
        setShowAuditPasswordDialog(open);
        if (!open) {
          setAuditPassword("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Admin Password</DialogTitle>
            <DialogDescription>
              Enter your password to export the audit log. This is required for all admins who export audit records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="audit-admin-password">Admin Password</Label>
            <Input
              id="audit-admin-password"
              type="password"
              value={auditPassword}
              onChange={(e) => setAuditPassword(e.target.value)}
              placeholder="Enter your admin password"
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAuditPasswordDialog(false);
                setAuditPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!auditPassword) {
                  toast({
                    title: "Password required",
                    description: "Please enter your admin password.",
                    variant: "destructive",
                  });
                  return;
                }
                setShowAuditPasswordDialog(false);
                setShowAuditConfirmDialog(true);
              }}
            >
              Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Audit Export Confirm Phrase Dialog */}
      <Dialog open={showAuditConfirmDialog} onOpenChange={(open) => {
        setShowAuditConfirmDialog(open);
        if (!open) {
          setAuditConfirmText("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Type "Confirm" to proceed</DialogTitle>
            <DialogDescription>
              For safety, please type the word <strong>Confirm</strong> exactly to proceed with exporting the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={auditConfirmText}
              onChange={(e) => setAuditConfirmText(e.target.value)}
              placeholder="Confirm"
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAuditConfirmDialog(false);
                setAuditConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={isAuditExporting}
              onClick={() => {
                if (auditConfirmText !== 'Confirm') {
                  toast({
                    title: "Confirmation required",
                    description: "You must type the word 'Confirm' exactly to proceed.",
                    variant: "destructive",
                  });
                  return;
                }
                setShowAuditConfirmDialog(false);
                setShowAuditExportFormatDialog(true);
              }}
            >
              {isAuditExporting ? 'Processing...' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Export Format Dialog */}
      <Dialog open={showAuditExportFormatDialog} onOpenChange={setShowAuditExportFormatDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select export format</DialogTitle>
            <DialogDescription>
              Choose how you want to download the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Button
              className="w-full justify-start gap-2"
              onClick={() => handleExportAuditLog('xlsx')}
              disabled={isAuditExporting}
            >
              <Download className="h-4 w-4" />
              Export to Excel (.xlsx)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => handleExportAuditLog('csv')}
              disabled={isAuditExporting}
            >
              <Download className="h-4 w-4" />
              Export to CSV (.csv)
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditExportFormatDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Developers Information Dialog */}
      <Dialog open={showDevelopers} onOpenChange={setShowDevelopers}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Meet the Development Team
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">Hey Dear! 👋</p>
              <p className="text-sm text-muted-foreground">
                We're thrilled to have you using our system. This library management platform was built with passion and dedication by our amazing team.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary">JM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Jhon Mark Suico</p>
                    <p className="text-sm text-muted-foreground">Team Leader & System Engineer</p>
                    <p className="text-xs text-muted-foreground mt-1">Computer Science</p>
                    <p className="text-xs mt-2">
                      Led the development and architecture of the entire system, ensuring seamless integration of all components.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-accent">JE</span>
                  </div>
                  <div>
                    <p className="font-semibold text-accent">Jhon Ernie Alimpong</p>
                    <p className="text-sm text-muted-foreground">System Architect</p>
                    <p className="text-xs mt-2">
                      Designed the system architecture and database structure, creating a robust foundation for scalability.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-secondary">VP</span>
                  </div>
                  <div>
                    <p className="font-semibold text-secondary">Vivien Punay</p>
                    <p className="text-sm text-muted-foreground">Product Manager</p>
                    <p className="text-xs mt-2">
                      Managed project requirements and user experience, ensuring the system meets real-world library needs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-leaf/5 rounded-lg border border-leaf/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-leaf/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-leaf">LM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-leaf">Lenny Mambo</p>
                    <p className="text-sm text-muted-foreground">Data Analyst</p>
                    <p className="text-xs mt-2">
                      Analyzed library data patterns and optimized reporting features for actionable insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2 pt-4 border-t">
              <p className="text-sm font-medium">Need Help or Have Feedback?</p>
              <div className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a 
                  href="mailto:suicojm99@gmail.com" 
                  className="text-sm text-primary hover:underline"
                >
                  suicojm99@gmail.com
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                We'd love to hear from you! Feel free to reach out with questions, suggestions, or just to say hi! 😊
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDevelopers(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
