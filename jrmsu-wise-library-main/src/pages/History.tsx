import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Calendar } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { BorrowService, type BorrowRecord } from "@/services/borrow";
import { NotificationsService } from "@/services/notifications";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { exportToXLSX } from "@/services/reports";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const History = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userType: "student" | "admin" = user?.role ?? "student";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [historyData, setHistoryData] = useState<BorrowRecord[]>([]);
  const [showNoDataModal, setShowNoDataModal] = useState(false);

  useEffect(() => {
    setHistoryData(BorrowService.list());
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return historyData.filter((r) => {
      const matchesQ = [r.bookTitle, r.bookId, r.studentId].some((t) => t.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [historyData, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "returned":
        return "bg-leaf text-white";
      case "borrowed":
        return "bg-primary text-white";
      case "overdue":
        return "bg-destructive text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Borrow/Return History</h1>
              <p className="text-muted-foreground mt-1">
                Track all borrowing and return transactions
              </p>
            </div>

            {/* Filters and Search */}
            <Card className="shadow-jrmsu">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by book title, student name, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="borrowed">Borrowed</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      if (filtered.length === 0) {
                        setShowNoDataModal(true);
                        return;
                      }
                      try {
                        const exportData = filtered.map(r => ({
                          TransactionID: r.id,
                          BookTitle: r.bookTitle,
                          BookID: r.bookId,
                          StudentID: r.studentId,
                          BorrowDate: r.borrowDate,
                          DueDate: r.dueDate,
                          ReturnDate: r.returnDate || 'Not returned',
                          Status: r.status
                        }));
                        exportToXLSX('BorrowHistory', exportData, 'borrow_history.xlsx');
                        toast({
                          title: "Export Successful",
                          description: "Borrow/Return history has been exported to Excel.",
                        });
                      } catch (error) {
                        console.error('Export error:', error);
                        toast({
                          title: "Export Failed",
                          description: "Failed to export report. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* History Table */}
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>Transaction Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Transaction ID</th>
                        <th className="text-left p-3 font-medium">Book Title</th>
                        <th className="text-left p-3 font-medium">Student</th>
                        <th className="text-left p-3 font-medium">Borrow Date</th>
                        <th className="text-left p-3 font-medium">Due Date</th>
                        <th className="text-left p-3 font-medium">Return Date</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium text-primary">{record.id}</td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{record.bookTitle}</p>
                              <p className="text-sm text-muted-foreground">{record.bookId}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{record.studentId}</p>
                              <p className="text-sm text-muted-foreground">ID</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {record.borrowDate}
                            </div>
                          </td>
                          <td className="p-3">{record.dueDate}</td>
                          <td className="p-3">{record.returnDate || "Not returned"}</td>
                          <td className="p-3">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {record.status === "borrowed" || record.status === "overdue" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  BorrowService.returnBook(record.id);
                                  setHistoryData(BorrowService.list());
                                  NotificationsService.add({ receiverId: record.studentId, type: "return", message: `Returned ${record.bookTitle}` });
                                }}
                              >
                                Mark Returned
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* No Data Modal */}
      <Dialog open={showNoDataModal} onOpenChange={setShowNoDataModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Data Available</DialogTitle>
            <DialogDescription>
              There is no borrow/return history data to export yet.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              History records will appear here once books are borrowed and returned.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowNoDataModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AIAssistant />
    </div>
  );
};

export default History;
