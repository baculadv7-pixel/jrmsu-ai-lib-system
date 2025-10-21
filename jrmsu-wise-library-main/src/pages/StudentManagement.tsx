import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Edit, Trash2, Eye, GraduationCap, SortAsc, SortDesc } from "lucide-react";
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
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'email' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Load students from database
  useEffect(() => {
    loadStudents();
  }, []);

  // Filter and sort students when search term or sort options change
  useEffect(() => {
    let filtered = students;
    
    if (searchTerm.trim()) {
      filtered = databaseService.searchUsers(searchTerm, "student");
    }
    
    filtered = databaseService.sortUsers(filtered, sortBy, sortOrder);
    setFilteredStudents(filtered);
  }, [searchTerm, students, sortBy, sortOrder]);

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

            {/* Search and Filters */}
            <Card className="shadow-jrmsu">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name, ID, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
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
