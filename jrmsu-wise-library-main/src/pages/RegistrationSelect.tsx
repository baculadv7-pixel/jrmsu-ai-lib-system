import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/context/RegistrationContext";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { GraduationCap, Shield, ArrowLeft } from "lucide-react";

const RegistrationSelect = () => {
  const navigate = useNavigate();
  const { update } = useRegistration();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg shadow-jrmsu-gold">
        <CardHeader className="text-center">
          <NavigationProgress currentStep={1} totalSteps={4} />
          <CardTitle className="text-2xl font-bold text-primary mt-4">
            Choose Account Type
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Select how you want to register.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => { update({ role: "student", studentId: "KC-" }); navigate("/register/personal"); }}
            className="w-full h-16 text-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-3"
            variant="default"
          >
            <GraduationCap className="h-6 w-6" />
            Register as Student
          </Button>
          <Button
            onClick={() => { update({ role: "admin" }); navigate("/register/personal"); }}
            className="w-full h-16 text-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground flex items-center justify-center gap-3"
            variant="secondary"
          >
            <Shield className="h-6 w-6" />
            Register as Admin
          </Button>
          <div className="pt-4 border-t">
            <Button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back to Login Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationSelect;


