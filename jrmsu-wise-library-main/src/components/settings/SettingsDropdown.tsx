import { useState } from "react";
import { 
  Settings, 
  User, 
  Shield, 
  Moon, 
  Sun, 
  Monitor,
  ChevronRight,
  ChevronDown,
  Lock,
  Mail,
  Smartphone,
  Activity,
  Key,
  Eye,
  EyeOff,
  Timer,
  Bell,
  Volume2,
  Database,
  RefreshCw,
  FileText,
  RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { databaseService } from "@/services/database";
import { ActivityService } from "@/services/activity";
import { NotificationsService } from "@/services/notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { pythonApi } from "@/services/pythonApi";

interface SettingsDropdownProps {
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

const THEME_KEY = 'jrmsu_theme_mode';

function applyTheme(mode: "light" | "dark" | "system") {
  const root = document.documentElement;
  let resolved = mode;
  if (mode === 'system') {
    const hour = new Date().getHours();
    if (hour < 12) resolved = 'light';
    else if (hour < 18) resolved = 'light'; // neutral tone maps to light palette
    else resolved = 'dark';
  }
  if (resolved === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  try { localStorage.setItem(THEME_KEY, mode); } catch { /* noop */ }
}

export function SettingsDropdown({ theme, onThemeChange }: SettingsDropdownProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";
  const { toast } = useToast();

  // Mock settings state - replace with actual context/store
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsReminders: false,
    pushNotifications: true,
    autoLogoutTimer: 30,
    voiceResponse: true,
    assistantMode: "Study Helper" as "Study Helper" | "System Guide" | "Technical Support"
  });

  const [showCpw, setShowCpw] = useState(false);
  const [showNpw, setShowNpw] = useState(false);
  const [showRnpw, setShowRnpw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [recoveryOpen, setRecoveryOpen] = useState<null | 'email' | 'backup' | 'codes'>(null);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [backupData, setBackupData] = useState<{ enabled: boolean; secret?: string; otpauth?: string }>({ enabled: false });

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light": return <Sun className="mr-2 h-4 w-4" />;
      case "dark": return <Moon className="mr-2 h-4 w-4" />;
      default: return <Monitor className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-navy-foreground hover:bg-navy-foreground/10">
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Profile */}
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          {/* Authentication & 2FA */}
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Authentication & 2FA</span>
          </DropdownMenuItem>

          {/* Theme Selection */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {getThemeIcon()}
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => { applyTheme('light'); onThemeChange("light"); }}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { applyTheme('dark'); onThemeChange("dark"); }}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { applyTheme('system'); onThemeChange("system"); }}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Account Settings */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Lock className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-96">
              {/* Change Password */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">Change Password</DropdownMenuLabel>
              <div className="px-2 pb-2 grid grid-cols-1 gap-2">
                <div className="relative">
                  <Input type={showCpw ? "text" : "password"} placeholder="Current Password" id="cpw" />
                  <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowCpw(v=>!v)}>{showCpw ? <Eye /> : <EyeOff />}</Button>
                </div>
                <div className="relative">
                  <Input type={showNpw ? "text" : "password"} placeholder="New Password (min 8 chars)" id="npw" />
                  <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowNpw(v=>!v)}>{showNpw ? <Eye /> : <EyeOff />}</Button>
                </div>
                <div className="relative">
                  <Input type={showRnpw ? "text" : "password"} placeholder="Confirm New Password" id="rnpw" />
                  <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowRnpw(v=>!v)}>{showRnpw ? <Eye /> : <EyeOff />}</Button>
                </div>
                <Button
                  size="sm"
                  disabled={changingPw}
                  onClick={async () => {
                    const cpw = (document.getElementById('cpw') as HTMLInputElement)?.value || '';
                    const npw = (document.getElementById('npw') as HTMLInputElement)?.value || '';
                    const rnpw = (document.getElementById('rnpw') as HTMLInputElement)?.value || '';
                    if (!user?.id) return;
                    if (!cpw || !npw || !rnpw) { toast({ title: "Validation", description: "Please fill all fields", variant: "destructive" }); return; }
                    if (npw !== rnpw) { toast({ title: "Mismatch", description: "New passwords do not match", variant: "destructive" }); return; }
                    if (npw.length < 8) { toast({ title: "Weak Password", description: "Min 8 characters", variant: "destructive" }); return; }
                    setChangingPw(true);
                    const resp = await pythonApi.changePassword({ userId: user.id, userType: user.role || 'student', currentPassword: cpw, newPassword: npw });
                    setChangingPw(false);
                    if (!resp.success) { toast({ title: "Password Change Failed", description: resp.message || "Try again", variant: "destructive" }); return; }
                    ActivityService.log(user.id, 'password_change');
                    NotificationsService.add({ receiverId: user.id, type: 'system', message: 'Your password was changed.' });
                    toast({ title: "Password Updated" });
                  }}
                >{changingPw ? 'Saving...' : 'Save'}</Button>
              </div>

              <Separator className="my-2" />
              {/* Manage Email/Mobile */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">Manage Email / Mobile</DropdownMenuLabel>
              <div className="px-2 pb-2 grid grid-cols-1 gap-2">
                <Input type="email" placeholder="Email" id="acc_email" defaultValue={user?.email || ''} />
                <Input type="tel" placeholder="Mobile" id="acc_mobile" defaultValue={(user as any)?.phone || ''} />
                <Button size="sm" onClick={async () => {
                  if (!user?.id) return;
                  const email = (document.getElementById('acc_email') as HTMLInputElement)?.value || '';
                  const phone = (document.getElementById('acc_mobile') as HTMLInputElement)?.value || '';
                  try {
                    await pythonApi.updateUser(user.id, { email, phone });
                    try { databaseService.updateUser(user.id, { email, phone }); } catch {}
                    ActivityService.log(user.id, 'email_update', email);
                    ActivityService.log(user.id, 'mobile_update', phone);
                    NotificationsService.add({ receiverId: user.id, type: 'system', message: 'Account contact details updated.' });
                    toast({ title: 'Saved', description: 'Contact details updated' });
                  } catch (e:any) {
                    toast({ title: 'Failed', description: e?.message || 'Update failed', variant: 'destructive' });
                  }
                }}>Save</Button>
              </div>

              <Separator className="my-2" />
              {/* Session History */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">Session History</DropdownMenuLabel>
              <div className="px-2 pb-2 max-h-40 overflow-auto text-xs">
                {user && databaseService.getLoginRecords(user.id).slice(-10).reverse().map((r:any)=> (
                  <div key={r.id} className="py-1 border-b last:border-0">
                    <div><b>{r.method}</b> • {new Date(r.timestamp).toLocaleString()}</div>
                    <div className="text-muted-foreground truncate">{r.userAgent || 'device'}</div>
                  </div>
                ))}
              </div>

              <Separator className="my-2" />
              {/* Recovery Options */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">Recovery Options</DropdownMenuLabel>
              <div className="px-2 pb-2 grid grid-cols-1 gap-2 text-sm">
                <Button size="sm" variant="outline" onClick={async () => {
                  if (!user?.id) return;
                  try {
                    const r = await fetch(`http://localhost:5000/api/users/${encodeURIComponent(user.id)}/recovery-email`);
                    const j = await r.json();
                    setRecoveryEmail(j?.recoveryEmail || '');
                  } catch { setRecoveryEmail(''); }
                  setRecoveryOpen('email');
                }}>Recovery Email</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  if (!user?.id) return;
                  try {
                    const r = await fetch(`http://localhost:5000/api/users/${encodeURIComponent(user.id)}/2fa/backup`);
                    const j = await r.json();
                    setBackupData(j || { enabled: false });
                  } catch { setBackupData({ enabled: false }); }
                  setRecoveryOpen('backup');
                }}>2FA Backup</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  if (!user?.id) return;
                  try {
                    const r = await fetch(`http://localhost:5000/api/users/${encodeURIComponent(user.id)}/2fa/backup`);
                    const j = await r.json();
                    setBackupData(j || { enabled: false });
                  } catch { setBackupData({ enabled: false }); }
                  setRecoveryOpen('codes');
                }}>Recovery Codes</Button>
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Privacy & Security */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Shield className="mr-2 h-4 w-4" />
              <span>Privacy & Security</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {/* Management Access */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">Management Access</DropdownMenuLabel>
              <div className="px-2 pb-2 max-h-40 overflow-auto text-xs">
                {user && databaseService.getLoginRecords(user.id).slice(-10).reverse().map((r:any)=> (
                  <div key={r.id} className="py-1 border-b last:border-0">
                    <div>{new Date(r.timestamp).toLocaleString()} • {r.method}</div>
                    <div className="text-muted-foreground truncate">{r.userAgent || 'device'}</div>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              {/* Recent Account Activity */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">Recent Account Activity</DropdownMenuLabel>
              <div className="px-2 pb-2 max-h-40 overflow-auto text-xs">
                {user && ActivityService.list(user.id).slice(0,20).map((a:any)=> (
                  <div key={a.id} className="py-1 border-b last:border-0">
                    <div><b>{a.action}</b> • {new Date(a.timestamp).toLocaleString()}</div>
                    {a.details && <div className="text-muted-foreground truncate">{a.details}</div>}
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              {/* Auto-Logout */}
              <DropdownMenuItem>
                <Timer className="mr-2 h-4 w-4" />
                <span>Auto-Logout Timer</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {settings.autoLogoutTimer}m
                </Badge>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Notification & Alerts */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications & Alerts</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  <span className="text-sm">Email Notifications</span>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => { handleSettingChange("emailNotifications", checked); if (user?.id) ActivityService.log(user.id, 'settings_update', 'email_notifications'); }}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="mr-2 h-4 w-4" />
                  <span className="text-sm">SMS Reminders</span>
                </div>
                <Switch
                  checked={settings.smsReminders}
                  onCheckedChange={(checked) => { handleSettingChange("smsReminders", checked); if (user?.id) ActivityService.log(user.id, 'settings_update', 'sms'); }}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="mr-2 h-4 w-4" />
                  <span className="text-sm">Push Notifications</span>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={async (checked) => {
                    handleSettingChange("pushNotifications", checked);
                    if (checked && 'Notification' in window) {
                      try { await Notification.requestPermission(); } catch { /* noop */ }
                    }
                    if (user?.id) ActivityService.log(user.id, 'settings_update', 'push');
                  }}
                />
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* AI Assistant Customization */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Volume2 className="mr-2 h-4 w-4" />
              <span>AI Assistant</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-96">
              <DropdownMenuLabel>Assistant Mode</DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center justify-between">
                <span>Study Helper</span>
                <Switch
                  checked={Boolean(settings.aiStudyEnabled)}
                  onCheckedChange={(checked) => {
                    handleSettingChange("aiStudyEnabled", checked);
                    // Persist preference; chat opens only when a book is selected to reserve
                  }}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between">
                <span>System Guide</span>
                <Switch
                  checked={Boolean(settings.aiGuideEnabled)}
                  onCheckedChange={(checked) => {
                    handleSettingChange("aiGuideEnabled", checked);
                    if (checked) { try { window.dispatchEvent(new CustomEvent('jrmsu:system-guide')); } catch {} }
                  }}
                />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { try { window.dispatchEvent(new CustomEvent('jrmsu:open-support')); } catch {} }}>
                <span>Technical Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {settings.assistantMode === 'Technical Support' && (
                <div className="px-2 pb-2 text-sm space-y-1">
                  <div><b>Developer:</b> CS-3</div>
                  <div><b>Name:</b> Jhon Mark A. Suico</div>
                  <div><b>Email:</b> suicojm99@gmail.com</div>
                  <div><b>Contact:</b> 0946-886-1715</div>
                </div>
              )}
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center">
                  <Volume2 className="mr-2 h-4 w-4" />
                  <span className="text-sm">Voice Response</span>
                </div>
                <Switch
                  checked={settings.voiceResponse}
                  onCheckedChange={(checked) => handleSettingChange("voiceResponse", checked)}
                />
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* System Administrator (Admin Only) */}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Database className="mr-2 h-4 w-4" />
                  <span>System Administrator</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Admin
                  </Badge>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>
                    <Database className="mr-2 h-4 w-4" />
                    <span>Backup & Restore Database</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Sync or Rebuild QR Codes</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Audit Logs</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <RotateCw className="mr-2 h-4 w-4" />
                    <span>System Version / Updates</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={recoveryOpen === 'email'} onOpenChange={(o)=> setRecoveryOpen(o ? 'email' : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recovery Email</DialogTitle>
            <DialogDescription>Set an email to recover your account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="email" placeholder="Recovery Email" value={recoveryEmail} onChange={(e)=> setRecoveryEmail(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setRecoveryOpen(null)}>Cancel</Button>
            <Button onClick={async ()=>{
              if (!user?.id) return;
              try {
                const r = await fetch(`http://localhost:5000/api/users/${encodeURIComponent(user.id)}/recovery-email`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ recoveryEmail }) });
                if (!r.ok) throw new Error('Failed');
                toast({ title: 'Saved' });
                setRecoveryOpen(null);
              } catch { toast({ title: 'Failed', description: 'Could not save recovery email', variant: 'destructive' }); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={recoveryOpen === 'backup'} onOpenChange={(o)=> setRecoveryOpen(o ? 'backup' : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>2FA Backup</DialogTitle>
            <DialogDescription>View your 2FA secret and QR if 2FA is enabled.</DialogDescription>
          </DialogHeader>
          {backupData.enabled ? (
            <div className="space-y-3">
              <Input readOnly value={backupData.secret || ''} />
              {backupData.otpauth && (
                <img alt="otpauth" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(backupData.otpauth)}`} className="border rounded" />
              )}
              <div className="flex gap-2">
                <Button onClick={() => {
                  try {
                    const blob = new Blob([`Secret: ${backupData.secret}\nURI: ${backupData.otpauth}`], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = '2fa_backup.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                  } catch {}
                }}>Download Info</Button>
              </div>
            </div>
          ) : (
            <div className="opacity-50">2FA is disabled for your account.</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=> setRecoveryOpen(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={recoveryOpen === 'codes'} onOpenChange={(o)=> setRecoveryOpen(o ? 'codes' : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recovery Codes</DialogTitle>
            <DialogDescription>Download your 2FA setup info. Available only if 2FA is enabled.</DialogDescription>
          </DialogHeader>
          {backupData.enabled ? (
            <div className="space-y-3">
              <div className="text-sm">Use these to recover access to your 2FA. Keep them safe.</div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  try {
                    const blob = new Blob([`Secret: ${backupData.secret}\nURI: ${backupData.otpauth}`], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = '2fa_recovery_codes.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                  } catch {}
                }}>Download Codes</Button>
                {backupData.otpauth && (
                  <Button onClick={() => {
                    try {
                      const link = document.createElement('a');
                      link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(backupData.otpauth!)}`;
                      link.download = '2fa_qr.png';
                      link.click();
                    } catch {}
                  }}>Download QR</Button>
                )}
              </div>
            </div>
          ) : (
            <div className="opacity-50">2FA is disabled for your account.</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=> setRecoveryOpen(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}