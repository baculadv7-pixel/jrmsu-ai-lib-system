import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, BookOpen, Users, AlertCircle, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { exportToPDF, exportToXLSX } from "@/services/reports";
import React, { useEffect, useMemo, useState } from "react";
import { StatsService, type LiveStats } from "@/services/stats";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API } from "@/config/api";

type TimeRangeKey = 'today' | '7d' | '30d' | '12m';

interface StatsPoint extends LiveStats {
  ts: number;
}

const API_BASE = API.BACKEND.BASE;

const Reports = () => {
  const userType: "student" | "admin" = "admin";
  const { toast } = useToast();
  const [reportType, setReportType] = useState("circulation");
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [live, setLive] = useState<LiveStats>(StatsService.get());
  const [history, setHistory] = useState<StatsPoint[]>([]);
  const [showNoDataModal, setShowNoDataModal] = useState(false);

  const [range, setRange] = useState<TimeRangeKey>('7d');
  const [openTotal, setOpenTotal] = useState(false);
  const [openBorrowed, setOpenBorrowed] = useState(false);
  const [openActive, setOpenActive] = useState(false);
  const [openOverdue, setOpenOverdue] = useState(false);

  const [circulationRows, setCirculationRows] = useState<any[]>([]);
  const [inventoryRows, setInventoryRows] = useState<any[]>([]);

  useEffect(() => {
    const unsub = StatsService.subscribe((stats) => {
      setLive(stats);
      setHistory((prev) => {
        const next: StatsPoint[] = [...prev, { ts: Date.now(), ...stats }];
        return next.slice(-500); // keep last 500 points max
      });
    });
    StatsService.start(5000);
    return unsub;
  }, []);

  // Backend-driven circulation (borrow history) and inventory
  useEffect(() => {
    const load = async () => {
      try {
        const [histRes, booksRes] = await Promise.all([
          fetch(`${API_BASE}/api/library/borrow-history`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/books`, { credentials: 'include' }),
        ]);
        let circ: any[] = [];
        if (histRes.ok) {
          const data = await histRes.json();
          const rows: any[] = Array.isArray(data.history) ? data.history : [];
          circ = rows.map((r: any) => ({
            Transaction: String(r.borrow_id ?? r.id ?? ''),
            Book: String(r.book_title ?? r.title ?? ''),
            BookCode: String(r.book_id ?? ''),
            StudentID: String(r.user_id ?? r.student_id ?? ''),
            Borrowed: String(r.borrowed_at ?? r.borrow_date ?? ''),
            Due: String(r.due_date ?? ''),
            Returned: r.returned_at ?? r.return_date ?? '',
            Status: String(r.status ?? ''),
          }));
        }
        setCirculationRows(circ);

        let inv: any[] = [];
        if (booksRes.ok) {
          const bdata = await booksRes.json();
          const items: any[] = Array.isArray(bdata.items) ? bdata.items : [];
          inv = items.map((b: any) => ({
            Code: String(b.id ?? b.book_code ?? ''),
            Title: String(b.title ?? ''),
            Author: String(b.author ?? ''),
            Category: String(b.category ?? ''),
            ISBN: String(b.isbn ?? ''),
            Copies: Number(b.total_copies ?? b.copies ?? 0),
            Available: Number(b.available_copies ?? b.available ?? 0),
            Status: String(b.status ?? ''),
          }));
        }
        setInventoryRows(inv);
      } catch (err) {
        console.error('Error loading report data from backend:', err);
        setCirculationRows([]);
        setInventoryRows([]);
      }
    };
    load();
  }, []);

  const overdueRows = useMemo(() => circulationRows.filter((r) => r.Status === "overdue"), [circulationRows]);

  // Real-time top borrowed and category distribution recompute when stats tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const unsub = StatsService.subscribe(() => setTick((t)=>t+1));
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
          // Fallback to simple client-side computation using already-loaded rows
          const counts: Record<string, number> = {};
          circulationRows.forEach(b => { counts[b.Book] = (counts[b.Book] || 0) + 1; });
          const tbLocal = Object.entries(counts)
            .map(([title, borrows]) => ({ title, borrows: borrows as number }))
            .sort((a, b) => b.borrows - a.borrows)
            .slice(0, 5);
          setTopBorrowed(tbLocal);
          const counts2: Record<string, number> = {};
          inventoryRows.forEach(b => { counts2[b.Category] = (counts2[b.Category] || 0) + 1; });
          const total = inventoryRows.length || 1;
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

            {/* Summary Stats with interactive overlays */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="shadow-jrmsu cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setOpenTotal(true)}>
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

              <Card className="shadow-jrmsu cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setOpenBorrowed(true)}>
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

              <Card className="shadow-jrmsu cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setOpenActive(true)}>
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

              <Card className="shadow-jrmsu cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setOpenOverdue(true)}>
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

      {/* Analytics Overlays */}
      <ReportsOverlay
        title="Total Books Over Time"
        metricKey="totalBooks"
        unit="Books"
        icon={<TrendingUp className="h-4 w-4" />}
        open={openTotal}
        onOpenChange={setOpenTotal}
        history={history}
        range={range}
        onRangeChange={setRange}
        detailTitle="Current Book Inventory"
        detailColumns={[
          { key: 'Code', label: 'Code' },
          { key: 'Title', label: 'Title' },
          { key: 'Author', label: 'Author' },
          { key: 'Category', label: 'Category' },
          { key: 'Copies', label: 'Copies' },
          { key: 'Available', label: 'Available' },
          { key: 'Status', label: 'Status' },
        ]}
        detailRows={inventoryRows}
      />
      <ReportsOverlay
        title="Borrowed Today Trend"
        metricKey="borrowedToday"
        unit="Borrows"
        icon={<BookOpen className="h-4 w-4" />}
        open={openBorrowed}
        onOpenChange={setOpenBorrowed}
        history={history}
        range={range}
        onRangeChange={setRange}
        detailTitle="Borrowed Today (per transaction)"
        detailColumns={[
          { key: 'Transaction', label: 'Transaction' },
          { key: 'Book', label: 'Book' },
          { key: 'BookCode', label: 'Code' },
          { key: 'StudentID', label: 'Student ID' },
          { key: 'Borrowed', label: 'Borrowed Date' },
          { key: 'Due', label: 'Due Date' },
          { key: 'Returned', label: 'Returned Date' },
          { key: 'Status', label: 'Status' },
        ]}
        detailRows={circulationRows.filter(r => r.Borrowed === new Date().toISOString().slice(0,10))}
      />
      <ReportsOverlay
        title="Active Borrowers Trend"
        metricKey="activeBorrowers"
        unit="Borrowers"
        icon={<Users className="h-4 w-4" />}
        open={openActive}
        onOpenChange={setOpenActive}
        history={history}
        range={range}
        onRangeChange={setRange}
        detailTitle="Active Borrowers (students/admins with unreturned books)"
        detailColumns={[
          { key: 'StudentID', label: 'User ID' },
          { key: 'BorrowedCount', label: 'Borrowed Books' },
        ]}
        detailRows={(() => {
          const active = circulationRows.filter(r => r.Status !== 'returned');
          const map: Record<string, number> = {};
          active.forEach(r => { map[r.StudentID] = (map[r.StudentID] || 0) + 1; });
          return Object.entries(map).map(([StudentID, BorrowedCount]) => ({ StudentID, BorrowedCount }));
        })()}
      />
      <ReportsOverlay
        title="Overdue Items Trend"
        metricKey="overdue"
        unit="Items"
        icon={<AlertCircle className="h-4 w-4" />}
        open={openOverdue}
        onOpenChange={setOpenOverdue}
        history={history}
        range={range}
        onRangeChange={setRange}
        detailTitle="Overdue Borrowed Books"
        detailColumns={[
          { key: 'Transaction', label: 'Transaction' },
          { key: 'Book', label: 'Book' },
          { key: 'BookCode', label: 'Code' },
          { key: 'StudentID', label: 'Student ID' },
          { key: 'Borrowed', label: 'Borrowed Date' },
          { key: 'Due', label: 'Due Date' },
          { key: 'Status', label: 'Status' },
        ]}
        detailRows={overdueRows}
      />

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

interface ReportsOverlayProps {
  title: string;
  metricKey: keyof LiveStats;
  unit: string;
  icon: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: StatsPoint[];
  range: TimeRangeKey;
  onRangeChange: (r: TimeRangeKey) => void;
  // Extra detail table under the visual line chart (books, borrows, etc.)
  detailTitle: string;
  detailColumns: { key: string; label: string }[];
  detailRows: Record<string, any>[];
}

const RANGE_CONFIG: { key: TimeRangeKey; label: string; ms: number }[] = [
  // "today" == 24h window, but we visually focus on 6 AM - 6 PM buckets as requested
  { key: 'today', label: 'Today', ms: 24 * 60 * 60 * 1000 },
  // 7 calendar days, Monday–Sunday style view
  { key: '7d', label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  // 30 calendar days, day 1–31 style view
  { key: '30d', label: '30 days', ms: 30 * 24 * 60 * 60 * 1000 },
  // 12 calendar months, Jan–Dec style view
  { key: '12m', label: '12 months', ms: 365 * 24 * 60 * 60 * 1000 },
];

// Predefined x‑axis domain labels per range, to make charts feel like
// true calendar/time based views regardless of sampling rate.
const DAILY_HOURS = Array.from({ length: 13 }, (_ , i) => 6 + i); // 6 AM .. 18 (6 PM)
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_DAYS = Array.from({ length: 31 }, (_ , i) => i + 1); // 1..31
const YEAR_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatXAxisLabel(ts: number, range: TimeRangeKey): string {
  const d = new Date(ts);
  if (range === 'today') {
    // Clamp to 6 AM – 6 PM window for display, still using real time
    let h = d.getHours();
    if (h < 6) h = 6;
    if (h > 18) h = 18;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}${ampm}`;
  }
  if (range === '7d') {
    // Always show weekday short name (Mon..Sun)
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  if (range === '30d') {
    // Day of month 1..31
    return d.getDate().toString();
  }
  // 12 months view (Jan..Dec)
  return d.toLocaleDateString(undefined, { month: 'short' });
}

function formatFullTimestamp(ts: number): string {
  const d = new Date(ts);
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  return `${time}, ${date}`;
}

const ReportsOverlay: React.FC<ReportsOverlayProps> = ({
  title,
  metricKey,
  unit,
  icon,
  open,
  onOpenChange,
  history,
  range,
  onRangeChange,
  detailTitle,
  detailColumns,
  detailRows,
}) => {
  const now = Date.now();
  const cfg = RANGE_CONFIG.find((c) => c.key === range) ?? RANGE_CONFIG[1];
  const fromTs = now - cfg.ms;
  const filtered = history.filter((p) => p.ts >= fromTs);

  const data = filtered.map((p) => ({
    ts: p.ts,
    label: formatXAxisLabel(p.ts, range),
    value: p[metricKey],
  }));

  const totalInRange = filtered.reduce((acc, p) => acc + (p[metricKey] as number), 0);
  const maxValue = data.reduce((m, p) => Math.max(m, p.value as number), 0);

  // Configure Y-axis ticks based on selected range, matching the requested scales
  function buildTicks(step: number): number[] {
    if (maxValue <= 0) return [0, step, step * 2];
    const top = Math.ceil(maxValue / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= top; v += step) ticks.push(v);
    return ticks;
  }

  let yTicks: number[];
  if (range === 'today') {
    yTicks = buildTicks(5); // 0,5,10,15,20...
  } else if (range === '7d') {
    yTicks = buildTicks(10); // 0,10,20,30,40...
  } else if (range === '30d') {
    yTicks = buildTicks(20); // 0,20,40,60,80...
  } else {
    yTicks = buildTicks(50); // 0,50,100,150,200...
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {icon}
              <div>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                  Total in range: <span className="font-semibold text-foreground">{totalInRange.toLocaleString()} {unit}</span>
                  {" "}| Last updated {formatFullTimestamp(now)}
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {RANGE_CONFIG.map((r) => (
                <Button
                  key={r.key}
                  size="sm"
                  variant={range === r.key ? "default" : "outline"}
                  onClick={() => onRangeChange(r.key)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="h-72 w-full">
            {data.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data available for the selected range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: 8, right: 8, top: 12, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="label"
                    tick={false}
                    label={{ value: "Data", position: "insideBottom", offset: -4 }}
                  />
                  <YAxis
                    label={{ value: unit, angle: -90, position: "insideLeft" }}
                    allowDecimals={false}
                    ticks={yTicks}
                    domain={[0, yTicks[yTicks.length - 1] ?? 0]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0].payload as { ts: number; value: number; label?: string };
                      const axisX = point.label ?? formatXAxisLabel(point.ts, range);
                      const axisY = point.value;
                      return (
                        <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-lg">
                          <div className="font-medium mb-1">
                            {title}
                          </div>
                          {/* Explicit Y-axis information */}
                          <div>
                            <span className="font-semibold mr-1">Y:</span>
                            <span className="font-mono font-semibold mr-1">{axisY.toLocaleString()}</span>
                            <span className="text-muted-foreground">{unit}</span>
                          </div>
                          {/* Explicit X-axis (time / day / month) */}
                          <div className="mt-1">
                            <span className="font-semibold mr-1">X:</span>
                            <span className="text-muted-foreground">{axisX}</span>
                          </div>
                          {/* Full timestamp for clarity */}
                          <div className="mt-1 text-muted-foreground">
                            {formatFullTimestamp(point.ts)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6, className: "animate-pulse" }}
                    isAnimationActive
                    animationDuration={600}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Time-bucketed data in table form, directly under the line chart */}
          <div className="mt-4 max-h-64 overflow-auto rounded-md border bg-background">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Data</th>
                  <th className="px-3 py-2 text-right font-medium">{unit}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.ts} className="border-t">
                    <td className="px-3 py-1.5 text-left text-muted-foreground">
                      {formatFullTimestamp(row.ts)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {row.value.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Metric-specific detail records (books / borrows) below the visual line graph */}
          <div className="mt-4 max-h-64 overflow-auto rounded-md border bg-background">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold" colSpan={detailColumns.length}>
                    {detailTitle}
                  </th>
                </tr>
                <tr>
                  {detailColumns.map((col) => (
                    <th key={col.key} className="px-3 py-1.5 text-left font-medium">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground" colSpan={detailColumns.length}>
                      No data available yet.
                    </td>
                  </tr>
                ) : (
                  detailRows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      {detailColumns.map((col) => (
                        <td key={col.key} className="px-3 py-1.5 text-left">
                          {row[col.key] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
