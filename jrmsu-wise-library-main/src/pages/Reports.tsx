import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, BookOpen, Users, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { exportToPDF, exportToXLSX } from "@/services/reports";
import { BorrowService } from "@/services/borrow";
import { BooksService } from "@/services/books";
import { useEffect, useMemo, useState } from "react";
import { StatsService, type LiveStats } from "@/services/stats";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const userType: "student" | "admin" = "admin";
  const { toast } = useToast();
  const [reportType, setReportType] = useState("circulation");
  const [live, setLive] = useState<LiveStats>(StatsService.get());
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  useEffect(() => {
    const unsub = StatsService.subscribe(setLive);
    StatsService.start(3000);
    return unsub;
  }, []);

  const circulationRows = useMemo(() => {
    const all = BorrowService.list();
    return all.map((r) => ({
      Transaction: r.id,
      Book: r.bookTitle,
      BookCode: r.bookId,
      StudentID: r.studentId,
      Borrowed: r.borrowDate,
      Due: r.dueDate,
      Returned: r.returnDate ?? "",
      Status: r.status,
    }));
  }, []);

  const inventoryRows = useMemo(() => {
    const all = BooksService.list();
    return all.map((b) => ({
      Code: b.id,
      Title: b.title,
      Author: b.author,
      Category: b.category,
      ISBN: b.isbn ?? "",
      Copies: b.copies,
      Available: b.available,
      Status: b.status,
    }));
  }, []);

  const overdueRows = useMemo(() => circulationRows.filter((r) => r.Status === "overdue"), [circulationRows]);

  // Real-time top borrowed and category distribution recompute on stats tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const unsub = StatsService.subscribe(() => setTick((t)=>t+1));
    StatsService.start(3000);
    return unsub;
  }, []);
  const [topBorrowed, setTopBorrowed] = useState<{ title: string; borrows: number }[]>([]);
  const [categoryDist, setCategoryDist] = useState<{ category: string; percentage: number }[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [tb, cd] = await Promise.all([
          fetch('http://localhost:5000/api/reports/top-borrowed').then(r=>r.json()).catch(()=>null),
          fetch('http://localhost:5000/api/reports/category-dist').then(r=>r.json()).catch(()=>null),
        ]);
        if (!alive) return;
        if (tb?.items) setTopBorrowed(tb.items);
        if (cd?.items) setCategoryDist(cd.items);
        if ((!tb?.items || !cd?.items)) {
          // Fallback to client-side computation
          const counts: Record<string, number> = {};
          BorrowService.list().forEach(b => { counts[b.bookTitle] = (counts[b.bookTitle]||0)+1; });
          const tbLocal = Object.entries(counts).map(([title, borrows]) => ({ title, borrows })).sort((a,b)=> b.borrows - a.borrows).slice(0,5);
          setTopBorrowed(tbLocal);
          const counts2: Record<string, number> = {};
          const books = BooksService.list();
          books.forEach(b => { counts2[b.category] = (counts2[b.category]||0)+1; });
          const total = books.length || 1;
          const cdLocal = Object.entries(counts2).map(([category, count]) => ({ category, percentage: Math.round((count/total)*100) }));
          setCategoryDist(cdLocal);
        }
      } catch {}
    };
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [tick]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] mx-auto space-y-6 overflow-y-auto">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Reports & Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Generate and view comprehensive library reports
              </p>
            </div>

            {/* Report Controls */}
            <Card className="shadow-jrmsu">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select defaultValue="monthly">
                    <SelectTrigger>
                      <SelectValue placeholder="Report Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circulation">Circulation Report</SelectItem>
                      <SelectItem value="inventory">Inventory Report</SelectItem>
                      <SelectItem value="overdue">Overdue Report</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      try {
                        let reportName = "Circulation Report";
                        let fileName = "circulation.pdf";
                        let data = circulationRows;
                        
                        if (reportType === "circulation") {
                          reportName = "Circulation Report";
                          fileName = "circulation.pdf";
                          data = circulationRows;
                        } else if (reportType === "inventory") {
                          reportName = "Inventory Report";
                          fileName = "inventory.pdf";
                          data = inventoryRows;
                        } else if (reportType === "overdue") {
                          reportName = "Overdue Report";
                          fileName = "overdue.pdf";
                          data = overdueRows;
                        }
                        
                        if (data.length === 0) {
                          setShowNoDataModal(true);
                          return;
                        }
                        
                        console.log(`Exporting PDF: ${reportName}, Rows: ${data.length}`);
                        exportToPDF(reportName, data, fileName);
                        
                        toast({
                          title: "PDF Exported",
                          description: `${reportName} has been downloaded successfully.`,
                        });
                      } catch (error) {
                        console.error('PDF export error:', error);
                        toast({
                          title: "Export Failed",
                          description: "Failed to export PDF. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>

                  <Button
                    className="gap-2"
                    onClick={() => {
                      try {
                        let sheetName = "Circulation";
                        let fileName = "circulation.xlsx";
                        let data = circulationRows;
                        
                        if (reportType === "circulation") {
                          sheetName = "Circulation";
                          fileName = "circulation.xlsx";
                          data = circulationRows;
                        } else if (reportType === "inventory") {
                          sheetName = "Inventory";
                          fileName = "inventory.xlsx";
                          data = inventoryRows;
                        } else if (reportType === "overdue") {
                          sheetName = "Overdue";
                          fileName = "overdue.xlsx";
                          data = overdueRows;
                        }
                        
                        if (data.length === 0) {
                          setShowNoDataModal(true);
                          return;
                        }
                        
                        console.log(`Exporting Excel: ${sheetName}, Rows: ${data.length}`);
                        exportToXLSX(sheetName, data, fileName);
                        
                        toast({
                          title: "Excel Exported",
                          description: `${sheetName} report has been downloaded successfully.`,
                        });
                      } catch (error) {
                        console.error('Excel export error:', error);
                        toast({
                          title: "Export Failed",
                          description: "Failed to export Excel. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Export Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="shadow-jrmsu">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Books
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{live.totalBooks}</div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Borrowed Today
                  </CardTitle>
                  <BookOpen className="h-5 w-5 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{live.borrowedToday}</div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Borrowers
                  </CardTitle>
                  <Users className="h-5 w-5 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{live.activeBorrowers}</div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Overdue Items
                  </CardTitle>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{live.overdue}</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-jrmsu">
                <CardHeader>
                  <CardTitle>Most Borrowed Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topBorrowed.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No data</p>
                    ) : (
                      topBorrowed.map((book, idx) => (
                        <div key={book.title} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {idx + 1}
                            </div>
                            <span className="font-medium">{book.title}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{book.borrows} borrows</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryDist.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No data</p>
                    ) : (
                      categoryDist.map((cat) => (
                        <div key={cat.category} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{cat.category}</span>
                            <span className="text-muted-foreground">{cat.percentage}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${cat.percentage}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* No Data Modal */}
      <Dialog open={showNoDataModal} onOpenChange={setShowNoDataModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Data Available</DialogTitle>
            <DialogDescription>
              There is no data to export for the selected report type yet.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              {reportType === 'circulation' && 'Circulation data will appear once books are borrowed.'}
              {reportType === 'inventory' && 'Inventory data will appear once books are added to the system.'}
              {reportType === 'overdue' && 'Overdue data will appear when borrowed books pass their due date.'}
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

export default Reports;
