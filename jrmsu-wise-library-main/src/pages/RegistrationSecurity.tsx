import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/context/RegistrationContext";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const RegistrationSecurity = () => {
  const navigate = useNavigate();
  const { data, update, reset } = useRegistration();
  const passwordsFilled = useMemo(() => Boolean((data.password || "").trim() && (data.confirmPassword || "").trim()), [data.password, data.confirmPassword]);
  const passwordsMatch = useMemo(() => (data.password || "") === (data.confirmPassword || ""), [data.password, data.confirmPassword]);
  const allValid = passwordsFilled && passwordsMatch;
  const [showPwd, setShowPwd] = useState(false);
  const [showCpwd, setShowCpwd] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl shadow-jrmsu-gold">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Phase 4: Account Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pwd">Password *</Label>
              <div className="relative">
                <Input id="pwd" type={showPwd ? "text" : "password"} value={data.password || ""} onChange={(e) => update({ password: e.target.value })} />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth" aria-label={showPwd ? "Hide password" : "Show password"}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpwd">Confirm Password *</Label>
              <div className="relative">
                <Input id="cpwd" type={showCpwd ? "text" : "password"} value={data.confirmPassword || ""} onChange={(e) => update({ confirmPassword: e.target.value })} />
                <button type="button" onClick={() => setShowCpwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth" aria-label={showCpwd ? "Hide password" : "Show password"}>
                  {showCpwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => navigate("/register/institution")}>Previous</Button>
            <Button disabled={!allValid} onClick={async () => {
              // Basic required checks
              const required = [data.password, data.confirmPassword];
              if (required.some((v) => !v)) {
                alert("Please fill in all required (*) fields. These are part of your credentials.");
                return;
              }
              if (data.password !== data.confirmPassword) {
                alert("Passwords do not match.");
                return;
              }
              // Success UX: show message, wait 1s, redirect to login
              alert("Registration Successful!");
              await new Promise((r) => setTimeout(r, 1000));
              reset();
              navigate("/");
            }}>Finish</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationSecurity;


