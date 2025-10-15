import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/context/RegistrationContext";
import { useState } from "react";

const RegistrationInstitution = () => {
  const navigate = useNavigate();
  const { data, update } = useRegistration();

  const isStudent = data.role === "student";
  const adminIdOk = data.role !== "admin" || /^KCL-\d{5}$/.test(data.adminId || "");
  const adminPositionOk = data.role !== "admin" || Boolean((data.position || "").trim());
  const requiresCourse = data.role === "student" && data.department !== "scje";
  const departmentOk = data.role !== "student" || Boolean(data.department);
  const courseOk = data.role !== "student" || (requiresCourse ? Boolean(data.course) : true);
  const yearOk = data.role !== "student" || Boolean(data.yearLevel);
  // IMPORTANT: Per spec, Student ID is admin-editable only; do not block student flow on studentId format here
  const studentRequiredOk = data.role !== "student" || (departmentOk && courseOk && yearOk);
  const canProceed = isStudent ? studentRequiredOk : (adminIdOk && adminPositionOk);
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
          <CardTitle className="text-2xl text-primary">Phase 3 of 4: Educational / Institutional Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isStudent ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sid">Student ID *</Label>
                <Input
                  id="sid"
                  placeholder="KC-23-A-00243"
                  value={data.studentId || "KC-"}
                  onChange={(e) => update({ studentId: sanitize(e.target.value) })}
                  onBlur={() => setSidTouched(true)}
                  className={(data.studentId && !/^KC-\d{2}-[A-D]-\d{5}$/.test(data.studentId) && (sidTouched || trailingDigitsCount(data.studentId) >= 5)) ? "border-destructive" : undefined}
                  aria-describedby="sid-help sid-error"
                />
                {data.studentId && !/^KC-\d{2}-[A-D]-\d{5}$/.test(data.studentId) && (sidTouched || trailingDigitsCount(data.studentId) >= 5) && (
                  <p id="sid-error" className="text-xs text-destructive">⚠️ Invalid ID format. Please follow the correct format.</p>
                )}
                <p id="sid-help" className="text-xs text-muted-foreground">Student ID format: KC-23-A-00243</p>
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
                    <SelectItem value="cte">College of Teacher Education</SelectItem>
                    <SelectItem value="cba">College of Business Administration</SelectItem>
                    <SelectItem value="cafse">College of Agriculture and Forestry and School of Engineering</SelectItem>
                    <SelectItem value="scje">School of Criminal Justice Education</SelectItem>
                    <SelectItem value="ccs">College of Computing Studies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select value={data.course} onValueChange={(v) => update({ course: v })}>
                  <SelectTrigger id="course"><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {data.department === "cte" && (
                      <>
                        <SelectItem value="bsfil">BS Filipino</SelectItem>
                        <SelectItem value="bssci">BS Science</SelectItem>
                        <SelectItem value="bssoc">Social Studies</SelectItem>
                        <SelectItem value="bsee">BS Elementary Education</SelectItem>
                        <SelectItem value="bsmath">BS Mathematics</SelectItem>
                        <SelectItem value="bspe">BS Physical Education</SelectItem>
                      </>
                    )}
                    {data.department === "cba" && (
                      <>
                        <SelectItem value="bhm">BS Hospitality Management</SelectItem>
                        <SelectItem value="bbahrm">BS Business Administration – Human Resource Management</SelectItem>
                        <SelectItem value="bsab">BS Agri-Business</SelectItem>
                      </>
                    )}
                    {data.department === "cafse" && (
                      <>
                        <SelectItem value="bsa">BS Agriculture</SelectItem>
                        <SelectItem value="bsf">BS Forestry</SelectItem>
                        <SelectItem value="bsabe">BS Agricultural and Biosystems Engineering</SelectItem>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aid">Admin ID *</Label>
                <Input
                  id="aid"
                  placeholder="KCL-00045"
                  value={data.adminId || ""}
                  onChange={(e) => update({ adminId: sanitize(e.target.value) })}
                  onBlur={() => setAidTouched(true)}
                  className={(data.adminId && !/^KCL-\d{5}$/.test(data.adminId) && (aidTouched || trailingDigitsCount(data.adminId) >= 5)) ? "border-destructive" : undefined}
                  aria-describedby="aid-help aid-error"
                />
                {data.adminId && !/^KCL-\d{5}$/.test(data.adminId) && (aidTouched || trailingDigitsCount(data.adminId) >= 5) && (
                  <p id="aid-error" className="text-xs text-destructive">⚠️ Invalid ID format. Please follow the correct format.</p>
                )}
                <p id="aid-help" className="text-xs text-muted-foreground">Admin ID format: KCL-00045</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pos">Position / Role *</Label>
                <Input id="pos" placeholder="Librarian" value={data.position || ""} onChange={(e) => update({ position: e.target.value })} />
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


