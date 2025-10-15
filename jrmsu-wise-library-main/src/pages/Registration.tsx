import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, ArrowLeft, Upload, ShieldPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Registration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"student" | "admin">("student");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    birthdate: "",
    age: "",
    email: "",
    phone: "",
    address: "",
    addressPermanent: "",
    department: "",
    course: "",
    yearLevel: "",
    block: "",
    studentId: "KC-",
    // Admin-specific
    adminId: "",
    position: "",
    password: "",
    confirmPassword: "",
  });
  const [studentIdTouched, setStudentIdTouched] = useState(false);
  const [adminIdTouched, setAdminIdTouched] = useState(false);
  const sanitize = (v: string) => v.replace(/\s+/g, "").toUpperCase();

  const studentIdError = useMemo(() => {
    // Enforce KC-<YY>-<BLOCK>-<NNNNN> where NNNNN is exactly 5 digits
    if (!formData.studentId.startsWith("KC-")) return "⚠️ Invalid ID format. Please follow the correct format.";
    const rest = formData.studentId.slice(3);
    const ok = /^\d{2}-[A-D]-\d{5}$/.test(rest);
    return ok ? "" : "⚠️ Invalid ID format. Please follow the correct format.";
  }, [formData.studentId]);

  const adminIdError = useMemo(() => {
    if (!formData.adminId) return "";
    return /^KCL-\d{5}$/.test(formData.adminId) ? "" : "⚠️ Invalid ID format. Please follow the correct format.";
  }, [formData.adminId]);

  const trailingDigitsCount = (value: string) => {
    const last = (value.split("-").pop() || "").match(/\d+/);
    return last ? last[0].length : 0;
  };
  const showStudentIdError = () => Boolean(studentIdError && (studentIdTouched || trailingDigitsCount(formData.studentId) >= 5));
  const showAdminIdError = () => Boolean(adminIdError && (adminIdTouched || trailingDigitsCount(formData.adminId) >= 5));

  const passwordError = useMemo(() => {
    if (!formData.password && !formData.confirmPassword) return "";
    if (formData.password.length < 8) return "Password must be at least 8 characters";
    return formData.password === formData.confirmPassword ? "" : "Passwords do not match";
  }, [formData.password, formData.confirmPassword]);

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthdate = e.target.value;
    setFormData({
      ...formData,
      birthdate,
      age: birthdate ? calculateAge(birthdate).toString() : "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    toast({
      title: `${activeTab === "student" ? "Student" : "Admin"} Registration Successful`,
      description: `${activeTab === "student" ? "Student" : "Admin"} account has been created successfully.`,
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-5xl shadow-jrmsu-gold">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <img
              src="/src/assets/jrmsu-logo.jpg"
              alt="JRMSU Logo"
              className="h-20 w-20 mx-auto object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Registration</CardTitle>
          <CardDescription className="text-base">
            Jose Rizal Memorial State University Library System
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "student" | "admin")} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-auto pr-2" aria-label="Student registration form">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) =>
                      setFormData({ ...formData, middleName: e.target.value })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Birthdate *</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    required
                    value={formData.birthdate}
                    onChange={handleBirthdateChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    readOnly
                    value={formData.age}
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="student@jrmsu.edu.ph"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+63 9XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Current Address *</Label>
                  <Input
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressPermanent">Permanent Address</Label>
                  <Input
                    id="addressPermanent"
                    value={formData.addressPermanent}
                    onChange={(e) =>
                      setFormData({ ...formData, addressPermanent: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">
                Academic Information
              </h3>
              
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    required
                    placeholder="KC-23-A-00243"
                    value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: sanitize(e.target.value) })
                  }
                  onBlur={() => setStudentIdTouched(true)}
                  className={showStudentIdError() ? "border-destructive" : undefined}
                  />
                {showStudentIdError() && (
                    <p className="text-xs text-destructive mt-1">⚠️ Invalid ID format. Please follow the correct format.</p>
                  )}
                <p className="text-xs text-muted-foreground">Student ID format: KC-23-A-00243</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="course">Course/Program *</Label>
                  <Select
                    value={formData.course}
                    onValueChange={(value) =>
                      setFormData({ ...formData, course: value })
                    }
                  >
                    <SelectTrigger id="course">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bscs">BS Computer Science</SelectItem>
                      <SelectItem value="bsit">BS Information Technology</SelectItem>
                      <SelectItem value="bsce">BS Computer Engineering</SelectItem>
                      <SelectItem value="bsee">BS Electrical Engineering</SelectItem>
                      <SelectItem value="bsme">BS Mechanical Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearLevel">Year Level *</Label>
                  <Select
                    value={formData.yearLevel}
                    onValueChange={(value) =>
                      setFormData({ ...formData, yearLevel: value })
                    }
                  >
                    <SelectTrigger id="yearLevel">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">College Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cit">College of Industrial Technology</SelectItem>
                      <SelectItem value="ccs">College of Computing Studies</SelectItem>
                      <SelectItem value="coe">College of Engineering</SelectItem>
                      <SelectItem value="cba">College of Business Administration</SelectItem>
                      <SelectItem value="cas">College of Arts and Sciences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block">Block (A/B/C/D)</Label>
                  <Select
                    value={formData.block}
                    onValueChange={(value) => setFormData({ ...formData, block: value })}
                  >
                    <SelectTrigger id="block">
                      <SelectValue placeholder="Select block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Profile Photo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">
                Profile Photo
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                  <UserPlus className="h-10 w-10 text-muted-foreground" />
                </div>
                <Button type="button" variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
              <Button type="submit" className="flex-1 gap-2">
                <UserPlus className="h-4 w-4" />
                Register Student
              </Button>
            </div>
          </form>
            </TabsContent>

            <TabsContent value="admin" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-auto pr-2" aria-label="Admin registration form">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstNameA">First Name *</Label>
                      <Input id="firstNameA" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleNameA">Middle Name</Label>
                      <Input id="middleNameA" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastNameA">Last Name *</Label>
                      <Input id="lastNameA" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthdateA">Birthdate *</Label>
                      <Input id="birthdateA" type="date" required value={formData.birthdate} onChange={handleBirthdateChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ageA">Age</Label>
                      <Input id="ageA" type="number" readOnly value={formData.age} className="bg-muted" />
                    </div>
                  </div>
                </div>

                {/* Contact & Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">Contact & Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailA">Email Address *</Label>
                      <Input id="emailA" type="email" required placeholder="admin@jrmsu.edu.ph" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneA">Contact Number *</Label>
                      <Input id="phoneA" type="tel" required placeholder="+63 9XX XXX XXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addrA">Current Address *</Label>
                      <Input id="addrA" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addrPA">Permanent Address</Label>
                      <Input id="addrPA" value={formData.addressPermanent} onChange={(e) => setFormData({ ...formData, addressPermanent: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Admin Credentials */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">Admin Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="adminId">Admin ID *</Label>
                      <Input id="adminId" required placeholder="KCL-00001" value={formData.adminId} onChange={(e) => setFormData({ ...formData, adminId: sanitize(e.target.value) })} onBlur={() => setAdminIdTouched(true)} className={showAdminIdError() ? "border-destructive" : undefined} />
                      {showAdminIdError() && (<p className="text-xs text-destructive mt-1">⚠️ Invalid ID format. Please follow the correct format.</p>)}
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="position">Position / Role *</Label>
                      <Input id="position" required placeholder="Librarian" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input id="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input id="confirmPassword" type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                    </div>
                  </div>
                  {passwordError && (<p className="text-xs text-destructive">{passwordError}</p>)}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate("/")} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Button>
                  <Button type="submit" className="flex-1 gap-2">
                    <ShieldPlus className="h-4 w-4" />
                    Register Admin
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Registration;
