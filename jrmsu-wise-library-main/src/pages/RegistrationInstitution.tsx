import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/context/RegistrationContext";
import { useState, useMemo } from "react";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { studentApiService } from "@/services/studentApi";

const RegistrationInstitution = () => {
  const navigate = useNavigate();
  const { data, update } = useRegistration();

  const isStudent = data.role === "student";
  const adminIdOk = data.role !== "admin" || /^KCL-\d{5}$/.test(data.adminId || "");
  const adminPositionOk = data.role !== "admin" || Boolean((data.position || "").trim());
  const adminEmailOk = data.role !== "admin" || (data.email?.includes("@") && data.email?.includes(".com"));
  const adminPhoneOk = data.role !== "admin" || (data.phone && data.phone.length === 11);
  const requiresCourse = data.role === "student" && data.department !== "scje";
  const departmentOk = data.role !== "student" || Boolean(data.department);
  const courseOk = data.role !== "student" || (data.department === "scje" ? true : Boolean(data.course));
  const yearOk = data.role !== "student" || Boolean(data.yearLevel);
  // IMPORTANT: Per spec, Student ID is admin-editable only; do not block student flow on studentId format here
  const studentRequiredOk = data.role !== "student" || (departmentOk && courseOk && yearOk);
  const canProceed = isStudent ? studentRequiredOk : (adminIdOk && adminPositionOk && adminEmailOk && adminPhoneOk);
  const [showErrors, setShowErrors] = useState(false);
  const [sidTouched, setSidTouched] = useState(false);
  const [aidTouched, setAidTouched] = useState(false);
  const sanitize = (v: string) => v.replace(/\s+/g, "").toUpperCase();

  const trailingDigitsCount = (value: string | undefined) => {
    const v = value || "";
    const last = (v.split("-").pop() || "").match(/\d+/);
    return last ? last[0].length : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl shadow-jrmsu-gold">
        <CardHeader>
          <NavigationProgress currentStep={3} totalSteps={4} />
          <CardTitle className="text-2xl text-primary mt-4">Phase 3 of 4: Educational / Institutional Information</CardTitle>
          <CardDescription>
            {isStudent ? "Please provide your student details" : "Please provide your administrative details"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isStudent ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sid">Student ID *</Label>
                <Input
                  id="sid"
                  placeholder="KC-23-A-00762"
                  value={data.studentId || "KC-"}
                  onChange={(e) => {
                    const value = sanitize(e.target.value);
                    // Ensure it always starts with KC-
                    const formattedValue = value.startsWith('KC-') ? value : 'KC-' + value.replace(/^KC-?/, '');
                    update({ studentId: formattedValue });
                    
                    // Extract block automatically when Student ID is complete
                    const validation = studentApiService.validateStudentId(formattedValue);
                    if (validation.isValid && validation.block) {
                      update({ block: validation.block });
                    }
                  }}
                  onBlur={() => setSidTouched(true)}
                  className={(data.studentId && !/^KC-\d{2}-[A-F]-\d{5}$/.test(data.studentId) && (sidTouched || trailingDigitsCount(data.studentId) >= 5)) ? "border-destructive" : undefined}
                  aria-describedby="sid-help sid-error"
                />
                {data.studentId && !/^KC-\d{2}-[A-F]-\d{5}$/.test(data.studentId) && (sidTouched || trailingDigitsCount(data.studentId) >= 5) && (
                  <p id="sid-error" className="text-xs text-destructive">⚠ Invalid ID format. Use KC-23-A-00762 format.</p>
                )}
                <p id="sid-help" className="text-xs text-muted-foreground">Student ID format: KC-23-A-00762 (KATIPUNAN CAMPUS-SCHOOLYEAR-BLOCK-STUDENT ID)</p>
                {data.studentId && studentApiService.validateStudentId(data.studentId).isValid && (
                  <p className="text-xs text-green-600">✓ Block extracted: {studentApiService.extractBlockFromStudentId(data.studentId)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept">College Department *</Label>
                <Select
                  value={data.department}
                  onValueChange={(v) => {
                    // If SCJE, course selection is not required; clear course
                    update({ department: v, course: v === "scje" ? "none" : (data.course || "") });
                  }}
                >
                  <SelectTrigger id="dept"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cte">Teacher Education</SelectItem>
                    <SelectItem value="cba">Business Administration</SelectItem>
                    <SelectItem value="cafse">Agriculture & Forestry</SelectItem>
                    <SelectItem value="scje">Criminal Justice Education</SelectItem>
                    <SelectItem value="ccs">Computing Studies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course / Major {data.department === "scje" ? "" : "*"}</Label>
                <Select 
                  value={data.course} 
                  onValueChange={(v) => update({ course: v })}
                  disabled={data.department === "scje"}
                >
                  <SelectTrigger id="course">
                    <SelectValue placeholder={data.department === "scje" ? "No course required" : "Select course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {data.department === "cte" && (
                      <>
                        <SelectItem value="bsfil">BS Filipino</SelectItem>
                        <SelectItem value="bssci">BS Science</SelectItem>
                        <SelectItem value="bsee">BS Elementary Ed</SelectItem>
                        <SelectItem value="bsmath">BS Math</SelectItem>
                        <SelectItem value="bspe">BS PE</SelectItem>
                      </>
                    )}
                    {data.department === "cba" && (
                      <>
                        <SelectItem value="bhm">BS Hospitality Management</SelectItem>
                        <SelectItem value="bbahrm">BSBA – HR Management</SelectItem>
                        <SelectItem value="bsab">BS Agri-Business</SelectItem>
                      </>
                    )}
                    {data.department === "cafse" && (
                      <>
                        <SelectItem value="bsa">BS Agriculture</SelectItem>
                        <SelectItem value="bsf">BS Forestry</SelectItem>
                        <SelectItem value="bsabe">BS Agri & Biosystems Eng.</SelectItem>
                      </>
                    )}
                    {data.department === "scje" && (
                      <>
                        <SelectItem value="none">No course selection required</SelectItem>
                      </>
                    )}
                    {data.department === "ccs" && (
                      <>
                        <SelectItem value="bsis">BS Information System</SelectItem>
                        <SelectItem value="bscs">BS Computer Science</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year Level *</Label>
                <Select value={data.yearLevel} onValueChange={(v) => update({ yearLevel: v })}>
                  <SelectTrigger id="year"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aid">Admin ID *</Label>
                  <Input
                    id="aid"
                    placeholder="KCL-00045"
                    value={data.adminId || "KCL-"}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Ensure it always starts with KCL-
                      if (!value.startsWith('KCL-')) {
                        value = 'KCL-' + value.replace(/^KCL-?/, '');
                      }
                      update({ adminId: sanitize(value) });
                    }}
                    onBlur={() => setAidTouched(true)}
                    className={(data.adminId && !/^KCL-\d{5}$/.test(data.adminId) && (aidTouched || trailingDigitsCount(data.adminId) >= 5)) ? "border-destructive" : undefined}
                    aria-describedby="aid-help aid-error"
                  />
                  {data.adminId && !/^KCL-\d{5}$/.test(data.adminId) && (aidTouched || trailingDigitsCount(data.adminId) >= 5) && (
                    <p id="aid-error" className="text-xs text-destructive">⚠ Invalid ID format. Use KCL-00045 format.</p>
                  )}
                  <p id="aid-help" className="text-xs text-muted-foreground">Admin ID format: KCL-00045 (Katipunan Campus Library)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pos">Position / Role *</Label>
                  <Select value={data.position} onValueChange={(value) => update({ position: value })}>
                    <SelectTrigger id="pos" className={showErrors && !data.position ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="librarian">Librarian</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                  {showErrors && !data.position && (
                    <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields. These are part of your credentials.</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={data.email || ""}
                    onChange={(e) => update({ email: e.target.value })}
                    className={showErrors && !data.email?.includes("@") ? "border-destructive" : undefined}
                  />
                  {showErrors && !data.email?.includes("@") && (
                    <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields. These are part of your credentials.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-contact">Contact Number *</Label>
                  <Input
                    id="admin-contact"
                    placeholder="09123456789"
                    value={data.phone || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 11) {
                        update({ phone: value });
                      }
                    }}
                    className={showErrors && (!data.phone || data.phone.length !== 11) ? "border-destructive" : undefined}
                  />
                  {showErrors && (!data.phone || data.phone.length !== 11) && (
                    <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields. These are part of your credentials.</p>
                  )}
                  <p className="text-xs text-muted-foreground">11 digits required</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => navigate("/register/personal")}>Previous</Button>
            <Button disabled={!canProceed} onClick={() => { if (!canProceed) { setShowErrors(true); return; } navigate("/register/security"); }}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationInstitution;


