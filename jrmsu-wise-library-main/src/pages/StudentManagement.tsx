import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Edit, Trash2, Eye, GraduationCap, SortAsc, SortDesc, Users, Filter } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { databaseService, User } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentProfileModal } from "@/components/student/StudentProfileModal";

const StudentManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const userType: "student" | "admin" = "admin";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<User[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'email' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Filter states
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");

  // Load students from database
  useEffect(() => {
    loadStudents();
  }, []);

  // Get unique filter values
  const uniqueCourses = useMemo(() => {
    const courses = new Set(students.map(s => s.course).filter(Boolean));
    return Array.from(courses).sort();
  }, [students]);

  const uniqueYears = useMemo(() => {
    const years = new Set(students.map(s => s.year).filter(Boolean));
    return Array.from(years).sort();
  }, [students]);

  const uniqueSections = useMemo(() => {
    const sections = new Set(students.map(s => s.section).filter(Boolean));
    return Array.from(sections).sort();
  }, [students]);

  // Filter and sort students (real-time)
  const filteredStudents = useMemo(() => {
    let filtered = students;
    
    // Search filter
    if (searchTerm.trim()) {
      const lowerQuery = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.fullName.toLowerCase().includes(lowerQuery) ||
        student.email.toLowerCase().includes(lowerQuery) ||
        student.id.toLowerCase().includes(lowerQuery) ||
        (student.course && student.course.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Course filter
    if (filterCourse !== "all") {
      filtered = filtered.filter(s => s.course === filterCourse);
    }
    
    // Year filter
    if (filterYear !== "all") {
      filtered = filtered.filter(s => s.year === filterYear);
    }
    
    // Section filter
    if (filterSection !== "all") {
      filtered = filtered.filter(s => s.section === filterSection);
    }
    
    // Sort
    return databaseService.sortUsers(filtered, sortBy, sortOrder);
  }, [searchTerm, students, sortBy, sortOrder, filterCourse, filterYear, filterSection]);

  const loadStudents = () => {
    try {
      const studentUsers = databaseService.getStudents();
      setStudents(studentUsers);
      console.log(`📋 Loaded ${studentUsers.length} student users`);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error loading students",
        description: "Failed to load student data from database.",
        variant: "destructive"
      });
    }
  };

  const handleAddStudent = () => {
    // Pass context that this registration was initiated from Student Management
    navigate("/register/personal?type=student&from=student-management");
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleViewStudent = (student: User) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
  };

  const handleEditStudent = (student: User) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
  };

  const handleSaveStudent = (updatedStudent: User) => {
    // Update the student in the local state
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setIsProfileModalOpen(false);
    setSelectedStudent(null);
    
    toast({
      title: "Student updated",
      description: "Student profile has been successfully updated.",
    });
  };

  const handleCloseModal = () => {
    setIsProfileModalOpen(false);
    setSelectedStudent(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Student Management</h1>
                <p className="text-muted-foreground mt-1">
                  Manage student accounts and library access
                </p>
              </div>
              <Button className="gap-2" onClick={handleAddStudent}>
                <UserPlus className="h-4 w-4" />
                Add New Student
              </Button>
            </div>

            {/* Real-Time Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-jrmsu">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="text-3xl font-bold text-green-600">{students.length}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-jrmsu">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Filtered Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-600">{filteredStudents.length}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-jrmsu">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600 h-5" />
                    <span className="text-3xl font-bold">{students.filter(s => s.isActive).length}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-jrmsu">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    QR Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-amber-600" />
                    <span className="text-3xl font-bold text-amber-600">{students.filter(s => s.qrCodeActive).length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="shadow-jrmsu">
              <CardContent className="p-6 space-y-4">
                {/* Search Bar */}
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student name, ID, email, or course..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="id">ID</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="created">Created</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={toggleSort}>
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Filters */}
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter by:</span>
                  <Select value={filterCourse} onValueChange={setFilterCourse}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {uniqueCourses.map(course => (
                        <SelectItem key={course} value={course}>{course}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {uniqueYears.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterSection} onValueChange={setFilterSection}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {uniqueSections.map(section => (
                        <SelectItem key={section} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(filterCourse !== "all" || filterYear !== "all" || filterSection !== "all") && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setFilterCourse("all");
                        setFilterYear("all");
                        setFilterSection("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="shadow-jrmsu hover:shadow-jrmsu-gold transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-green-200">
                          <AvatarImage src={student.profilePicture} />
                          <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{student.fullName}</h3>
                          <p className="text-sm text-muted-foreground">{student.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-green-600 text-white">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          STUDENT
                        </Badge>
                        {student.qrCodeActive && (
                          <Badge variant="outline" className="text-xs">
                            QR Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium text-right text-xs">{student.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Course:</span>
                        <span className="font-medium text-right text-xs">{student.course}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year:</span>
                        <span className="font-medium text-right text-xs">{student.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">System Tag:</span>
                        <Badge variant="secondary" className="text-xs">
                          {student.systemTag}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge 
                          variant={student.isActive ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          {student.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => handleViewStudent(student)}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) {
                            setStudents(prev => prev.filter(s => s.id !== student.id));
                            toast({
                              title: "Student Deleted",
                              description: `${student.firstName} ${student.lastName} has been removed`,
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))} 
            </div>
          </div>
        </main>
      </div>

      <AIAssistant />
      
      {/* Student Profile Modal */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          isOpen={isProfileModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveStudent}
        />
      )}
    </div>
  );
};

export default StudentManagement;