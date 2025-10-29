import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Edit, Trash2, Eye, Shield, Building, Calendar, QrCode, SortAsc, SortDesc, Users, Filter } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import AdminProfileModal from "@/components/AdminProfileModal";
import { databaseService, User } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const userType: "student" | "admin" = "admin";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [admins, setAdmins] = useState<User[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'email' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal state
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Filter states
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Library session tracking
  const [activeLibraryAdmins, setActiveLibraryAdmins] = useState<number>(0);

  // Load active library sessions
  const loadActiveLibrarySessions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/library/active-sessions?userType=admin');
      if (response.ok) {
        const data = await response.json();
        setActiveLibraryAdmins(data.admins || 0);
      }
    } catch (error) {
      console.error('Failed to load active library sessions:', error);
    }
  };

  // Load admins from database and backend
  useEffect(() => {
    loadAdmins();
    loadActiveLibrarySessions();
    
    // Poll for active sessions every 30 seconds
    const sessionInterval = setInterval(loadActiveLibrarySessions, 30000);
    
    let t: any = null;
    const tick = async () => {
      try {
        const mod = await import('@/services/pythonApi');
        const res: any = await (mod as any).pythonApi.listUsers();
        const items = (res?.items || []) as any[];
        const admins = items.filter(u => (u.userType === 'admin')) as User[];
        if (admins?.length) setAdmins(prev => {
          // merge by id to keep local fields
          const map = new Map<string, User>();
          [...prev, ...admins].forEach(u => map.set(u.id, { ...(map.get(u.id) as any), ...u } as User));
          return Array.from(map.values());
        });
      } catch {}
    };
    tick();
    t = setInterval(tick, 5000);
    return () => { if (t) clearInterval(t); };
  }, []);

  // Get unique filter values
  const uniqueDepartments = useMemo(() => {
    const departments = new Set(admins.map(a => a.department).filter(Boolean));
    return Array.from(departments).sort();
  }, [admins]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(admins.map(a => a.role).filter(Boolean));
    return Array.from(roles).sort();
  }, [admins]);

  // Filter and sort admins (real-time)
  const filteredAdmins = useMemo(() => {
    let filtered = admins;
    
    // Search filter
    if (searchTerm.trim()) {
      const lowerQuery = searchTerm.toLowerCase();
      filtered = filtered.filter(admin =>
        admin.fullName.toLowerCase().includes(lowerQuery) ||
        admin.email.toLowerCase().includes(lowerQuery) ||
        admin.id.toLowerCase().includes(lowerQuery) ||
        (admin.department && admin.department.toLowerCase().includes(lowerQuery)) ||
        (admin.role && admin.role.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Department filter
    if (filterDepartment !== "all") {
      filtered = filtered.filter(a => a.department === filterDepartment);
    }
    
    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter(a => a.role === filterRole);
    }
    
    // Status filter
    if (filterStatus === "active") {
      filtered = filtered.filter(a => a.isActive);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter(a => !a.isActive);
    }
    
    // Sort
    return databaseService.sortUsers(filtered, sortBy, sortOrder);
  }, [searchTerm, admins, sortBy, sortOrder, filterDepartment, filterRole, filterStatus]);

  const loadAdmins = () => {
    try {
      const adminUsers = databaseService.getAdmins();
      setAdmins(adminUsers);
      console.log(`📋 Loaded ${adminUsers.length} admin users`);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: "Error loading admins",
        description: "Failed to load administrator data from database.",
        variant: "destructive"
      });
    }
  };

  const handleAddAdmin = () => {
    // Pass context that this registration was initiated from Admin Management
    navigate("/register/personal?type=admin&from=admin-management");
  };

  const handleEditAdmin = (admin: User) => {
    setSelectedAdmin(admin);
    setIsProfileModalOpen(true);
  };

  const handleViewAdmin = (admin: User) => {
    setSelectedAdmin(admin);
    setIsProfileModalOpen(true);
  };

  const handleSaveAdmin = (updatedAdmin: User) => {
    // Update the admin in the local state
    setAdmins(prev => prev.map(a => a.id === updatedAdmin.id ? updatedAdmin : a));
    setIsProfileModalOpen(false);
    setSelectedAdmin(null);
    
    toast({
      title: "Admin updated",
      description: "Administrator profile has been successfully updated.",
    });
  };

  const handleCloseModal = () => {
    setIsProfileModalOpen(false);
    setSelectedAdmin(null);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      const result = databaseService.deleteUser(adminId);
      
      if (result.success) {
        toast({
          title: "Admin deleted",
          description: "Administrator account has been successfully deleted.",
        });
        loadAdmins(); // Reload the list
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete administrator account.",
        variant: "destructive"
      });
    }
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] mx-auto space-y-6 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Administrator Management</h1>
                <p className="text-muted-foreground mt-1">
                  Manage administrator accounts and system access
                </p>
              </div>
              <Button className="gap-2" onClick={handleAddAdmin}>
                <UserPlus className="h-4 w-4" />
                Add New Admin
              </Button>
            </div>

            {/* Real-Time Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-jrmsu">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Admins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-600">{admins.length}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-jrmsu">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Admins (In Library)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600 h-5" />
                    <span className="text-3xl font-bold text-green-600">{activeLibraryAdmins}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-jrmsu">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Deactivated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600 h-5" />
                    <span className="text-3xl font-bold text-red-600">{admins.filter(a => !a.isActive).length}</span>
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
                    <Filter className="h-5 w-5 text-amber-600" />
                    <span className="text-3xl font-bold text-amber-600">{filteredAdmins.length}</span>
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
                      placeholder="Search by admin name, ID, email, department, or role..."
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
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {uniqueDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {uniqueRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                  {(filterDepartment !== "all" || filterRole !== "all" || filterStatus !== "all") && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setFilterDepartment("all");
                        setFilterRole("all");
                        setFilterStatus("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAdmins.map((admin) => (
                <Card key={admin.id} className="shadow-jrmsu hover:shadow-jrmsu-gold transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-blue-200">
                          <AvatarImage src={admin.profilePicture} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                            {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{admin.fullName}</h3>
                          <p className="text-sm text-muted-foreground">{admin.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-blue-600 text-white">
                          <Shield className="h-3 w-3 mr-1" />
                          ADMIN
                        </Badge>
                        {admin.qrCodeActive && (
                          <Badge variant="outline" className="text-xs">
                            <QrCode className="h-2 w-2 mr-1" />
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
                        <span className="font-medium text-right text-xs">{admin.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Department:</span>
                        <span className="font-medium text-right text-xs">{admin.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Role:</span>
                        <span className="font-medium text-right text-xs">{admin.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">System Tag:</span>
                        <Badge variant="secondary" className="text-xs">
                          {admin.systemTag}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">2FA:</span>
                        <Badge 
                          variant={admin.twoFactorEnabled ? "default" : "outline"} 
                          className="text-xs"
                        >
                          {admin.twoFactorEnabled ? "✅ Enabled" : "❌ Disabled"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge 
                          variant={admin.isActive ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          {admin.isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium text-xs">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => handleViewAdmin(admin)}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => handleEditAdmin(admin)}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Administrator</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{admin.fullName}</strong>? 
                              This action cannot be undone and will remove all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Admin
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty state */}
            {filteredAdmins.length === 0 && (
              <Card className="shadow-jrmsu">
                <CardContent className="p-12 text-center">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {searchTerm ? "No administrators found" : "No administrators yet"}
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        {searchTerm ? 
                          `No administrators match your search for "${searchTerm}". Try different keywords.` :
                          "Get started by adding your first administrator account."
                        }
                      </p>
                    </div>
                    {!searchTerm && (
                      <Button onClick={handleAddAdmin} className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add First Admin
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <AIAssistant />
      
      {/* Admin Profile Modal */}
      {selectedAdmin && (
        <AdminProfileModal
          admin={selectedAdmin}
          isOpen={isProfileModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveAdmin}
        />
      )}
    </div>
  );
};

export default AdminManagement;