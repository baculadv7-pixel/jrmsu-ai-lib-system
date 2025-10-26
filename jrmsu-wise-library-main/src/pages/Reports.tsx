import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, BookOpen, Users, AlertCircle } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { exportToPDF, exportToXLSX } from "@/services/reports";
import { BorrowService } from "@/services/borrow";
import { BooksService } from "@/services/books";
import { useEffect, useMemo, useState } from "react";
import { StatsService, type LiveStats } from "@/services/stats";

const Reports = () => {
  const userType: "student" | "admin" = "admin";
  const [reportType, setReportType] = useState("all");
  const [live, setLive] = useState<LiveStats>(StatsService.get());
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
                      if (reportType === "circulation") exportToPDF("Circulation Report", circulationRows, "circulation.pdf");
                      else if (reportType === "inventory") exportToPDF("Inventory Report", inventoryRows, "inventory.pdf");
                      else if (reportType === "overdue") exportToPDF("Overdue Report", overdueRows, "overdue.pdf");
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>

                  <Button
                    className="gap-2"
                    onClick={() => {
                      if (reportType === "circulation") exportToXLSX("Circulation", circulationRows, "circulation.xlsx");
                      else if (reportType === "inventory") exportToXLSX("Inventory", inventoryRows, "inventory.xlsx");
                      else if (reportType === "overdue") exportToXLSX("Overdue", overdueRows, "overdue.xlsx");
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
                    {[
                      { title: "Introduction to AI", borrows: 45 },
                      { title: "Data Structures", borrows: 38 },
                      { title: "Web Development", borrows: 32 },
                      { title: "Database Systems", borrows: 28 },
                      { title: "Machine Learning", borrows: 25 },
                    ].map((book, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {idx + 1}
                          </div>
                          <span className="font-medium">{book.title}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{book.borrows} borrows</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: "Computer Science", percentage: 35 },
                      { category: "Engineering", percentage: 25 },
                      { category: "Business", percentage: 20 },
                      { category: "Arts & Humanities", percentage: 12 },
                      { category: "Natural Sciences", percentage: 8 },
                    ].map((cat, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{cat.category}</span>
                          <span className="text-muted-foreground">{cat.percentage}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <AIAssistant />
    </div>
  );
};

export default Reports;
