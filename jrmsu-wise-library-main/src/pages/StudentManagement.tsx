import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Edit, Trash2, Eye } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";

const StudentManagement = () => {
  const userType: "student" | "admin" = "admin";
  const [searchTerm, setSearchTerm] = useState("");

  const students = [
    {
      id: "2024-001",
      name: "John Doe",
      email: "john.doe@jrmsu.edu.ph",
      course: "BS Computer Science",
      year: "3rd Year",
      status: "active",
      booksOut: 2,
      avatar: "",
    },
    {
      id: "2024-002",
      name: "Jane Smith",
      email: "jane.smith@jrmsu.edu.ph",
      course: "BS Information Technology",
      year: "2nd Year",
      status: "active",
      booksOut: 1,
      avatar: "",
    },
    {
      id: "2024-003",
      name: "Mike Johnson",
      email: "mike.johnson@jrmsu.edu.ph",
      course: "BS Computer Engineering",
      year: "4th Year",
      status: "suspended",
      booksOut: 0,
      avatar: "",
    },
  ];

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
              <Button className="gap-2">
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
              {students.map((student) => (
                <Card key={student.id} className="shadow-jrmsu hover:shadow-jrmsu-gold transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {student.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">{student.id}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          student.status === "active"
                            ? "bg-leaf text-white"
                            : "bg-destructive text-white"
                        }
                      >
                        {student.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{student.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Course:</span>
                        <span className="font-medium">{student.course}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year Level:</span>
                        <span className="font-medium">{student.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Books Out:</span>
                        <Badge variant="outline" className="font-medium">
                          {student.booksOut}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
    </div>
  );
};

export default StudentManagement;
