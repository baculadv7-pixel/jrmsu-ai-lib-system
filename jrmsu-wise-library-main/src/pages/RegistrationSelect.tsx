import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/context/RegistrationContext";

const RegistrationSelect = () => {
  const navigate = useNavigate();
  const { update } = useRegistration();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg shadow-jrmsu-gold text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Choose Account Type</CardTitle>
          <CardDescription>Select how you want to register.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3">
          <Button onClick={() => { update({ role: "student", studentId: "KC-" }); navigate("/register/personal"); }}>
            Register as Student
          </Button>
          <Button variant="outline" onClick={() => { update({ role: "admin" }); navigate("/register/personal"); }}>
            Register as Admin
          </Button>
          <div className="text-xs text-muted-foreground mt-2">or</div>
          <Button variant="ghost" onClick={() => navigate("/")}>Go back to Login Page</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationSelect;


