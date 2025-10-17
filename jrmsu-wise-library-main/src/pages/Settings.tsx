import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Smartphone, Mail, Key, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import TwoFASetup from "@/components/auth/TwoFASetup";

const Settings = () => {
  const { user, disableTwoFactor } = useAuth();
  const userType: "student" | "admin" = user?.role ?? "student";
  const { toast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [emailAuth, setEmailAuth] = useState(true);
  const [smsAuth, setSmsAuth] = useState(false);

  const handleSave2FA = () => {
    try {
      toast({ title: "Settings Saved", description: "Your 2FA settings have been updated successfully." });
    } catch (error) {
      console.warn('Failed to show toast:', error);
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

            {/* 2FA Status */}
            <Card className="shadow-jrmsu border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>
                        Add an extra layer of security to your account
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={twoFactorEnabled ? "bg-leaf text-white" : "bg-muted"}>
                    {twoFactorEnabled ? "ENABLED" : "DISABLED"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-muted-foreground">
                        Require a second verification method when logging in
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={(checked) => {
                      setTwoFactorEnabled(checked);
                      if (!checked && disableTwoFactor) {
                        try {
                          disableTwoFactor();
                          toast({ title: "2FA disabled" });
                        } catch (error) {
                          console.warn('Failed to disable 2FA:', error);
                        }
                      }
                    }}
                  />
                </div>

                {twoFactorEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    <TwoFASetup />
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-accent" />
                        <div>
                          <p className="font-medium">Email Authentication</p>
                          <p className="text-sm text-muted-foreground">
                            Receive codes via email
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={emailAuth}
                        onCheckedChange={setEmailAuth}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-secondary" />
                        <div>
                          <p className="font-medium">SMS Authentication</p>
                          <p className="text-sm text-muted-foreground">
                            Receive codes via text message
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={smsAuth}
                        onCheckedChange={setSmsAuth}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <Input id="current-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>

                <Button className="w-full gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Update Password
                </Button>
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
                      <p className="font-medium text-orange-900">2FA Global Control</p>
                      <p className="text-sm text-orange-700">
                        Enable or disable 2FA requirements for all users
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
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
                        className="w-16 text-center" 
                      />
                      <span className="text-sm text-orange-700">minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-orange-900">Password Policy</p>
                      <p className="text-sm text-orange-700">
                        Enforce strong password requirements
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
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
    </div>
  );
};

export default Settings;
