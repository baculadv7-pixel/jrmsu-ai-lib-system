import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Clock } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { StatsService, type LiveStats } from "@/services/stats";
import { ActivityService, type ActivityRecord } from "@/services/activity";
import { DashboardApi, type TotalBooksResp, type ActiveBorrowersResp, type BorrowedTodayResp, type OverdueResp } from "@/services/dashboardApi";
import { X, RefreshCcw } from "lucide-react";
import { connectDashboardRealtime, type DashboardEvent } from "@/services/dashboardRealtime";

const Dashboard = () => {
  const { user } = useAuth();
  const userType: "student" | "admin" = user?.role ?? "student";

  const [live, setLive] = useState<LiveStats>(StatsService.get());
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  useEffect(() => {
    const unsubStats = StatsService.subscribe(setLive);
    StatsService.start(3000);
    const refresh = () => setActivity(ActivityService.list());
    const unsubAct = ActivityService.subscribe(refresh);
    refresh();
    return () => { unsubStats(); unsubAct(); };
  }, []);

  const stats = [
    { key: 'total' as const, title: "Total Books", value: String(live.totalBooks), icon: BookOpen, color: "text-primary" },
    { key: 'active' as const, title: "Active Borrowers", value: String(live.activeBorrowers), icon: Users, color: "text-accent" },
    { key: 'today' as const, title: "Books Borrowed Today", value: String(live.borrowedToday), icon: TrendingUp, color: "text-secondary" },
    { key: 'overdue' as const, title: "Overdue Returns", value: String(live.overdue), icon: Clock, color: "text-destructive" },
  ];

  type OverlayKey = 'total' | 'active' | 'today' | 'overdue' | null;
  const [overlay, setOverlay] = useState<OverlayKey>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<number | null>(null);
  const [totalBooks, setTotalBooks] = useState<TotalBooksResp | null>(null);
  const [activeBorrowers, setActiveBorrowers] = useState<ActiveBorrowersResp | null>(null);
  const [borrowedToday, setBorrowedToday] = useState<BorrowedTodayResp | null>(null);
  const [overdueReturns, setOverdueReturns] = useState<OverdueResp | null>(null);

  function open(key: OverlayKey) {
    setOverlay(key);
    setSearch("");
  }

  async function load(key: OverlayKey) {
    if (!key) return;
    setLoading(true);
    try {
      if (key === 'total') setTotalBooks(await DashboardApi.totalBooks());
      if (key === 'active') setActiveBorrowers(await DashboardApi.activeBorrowers());
      if (key === 'today') setBorrowedToday(await DashboardApi.borrowedToday());
      if (key === 'overdue') setOverdueReturns(await DashboardApi.overdueReturns());
      setLastLoaded(Date.now());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (overlay) { load(overlay); const id = setInterval(()=> load(overlay), 60000); return ()=> clearInterval(id); } }, [overlay]);

  // Realtime refresh on relevant events
  useEffect(() => {
    const off = connectDashboardRealtime((ev: DashboardEvent) => {
      if (!overlay) return;
      if (ev === 'book.added' || ev === 'book.removed') {
        if (overlay === 'total') load('total');
      } else if (ev === 'book.borrowed') {
        if (overlay === 'active' || overlay === 'today') load(overlay);
      } else if (ev === 'book.returned') {
        if (overlay === 'active' || overlay === 'overdue') load(overlay);
      } else if (ev === 'book.overdue') {
        if (overlay === 'overdue') load('overdue');
      }
    });
    return off;
  }, [overlay]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups = overlay === 'total' ? (totalBooks?.data ?? []) : overlay === 'active' ? activeBorrowers?.data : overlay === 'today' ? borrowedToday?.data : overlay === 'overdue' ? overdueReturns?.data : null;
    if (!groups) return null;
    if (overlay === 'total') {
      return (groups as TotalBooksResp['data']).filter(r => !q || [r.book_id, r.title, r.author, r.category].some(v => (v||'').toLowerCase().includes(q)));
    }
    const out: Record<string, any[]> = {};
    Object.entries(groups as Record<string, any[]>).forEach(([date, rows]) => {
      const keep = rows.filter((r: any) => {
        const fields = overlay === 'today' ? [r.book_id, r.title, r.author, r.category] : [r.user_id, r.fullname, r.course, r.block, r.year];
        return !q || fields.some((v: any) => (String(v||'')).toLowerCase().includes(q));
      });
      if (keep.length) out[date] = keep;
    });
    return out;
  }, [overlay, search, totalBooks, activeBorrowers, borrowedToday, overdueReturns]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6 pb-28">
          <div className="w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] mx-auto space-y-6 overflow-y-auto">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back! Here's what's happening in your library.
              </p>
            </div>

            {/* Stats Grid - real-time */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stats.map((stat, idx) => (
                <Card key={idx} className="shadow-jrmsu cursor-pointer" onClick={()=> open(stat.key)}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Real-time Recent Activity (from backend/local log) */}
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[40vh] overflow-y-auto divide-y">
                  {activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  ) : (
                    activity.slice(0, 25).map((a) => (
                      <div key={a.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{a.action.replace(/_/g,' ')}</p>
                          {a.details && <p className="text-xs text-muted-foreground">{a.details}</p>}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AIAssistant />

      {overlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=> setOverlay(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">
                  {overlay === 'total' && 'Total Books List'}
                  {overlay === 'active' && 'Active Borrowers List'}
                  {overlay === 'today' && 'Books Borrowed Today'}
                  {overlay === 'overdue' && 'Overdue Returns'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e)=> setSearch(e.target.value)}
                    placeholder={overlay === 'total' ? 'Search Book ID, Title, Author, Category' : overlay === 'today' ? 'Search Book ID, Title, Author' : 'Search User ID, Fullname, Course'}
                    className="border rounded-md px-3 py-1.5 text-sm w-72"
                  />
                </div>
                <button title="Refresh" onClick={()=> load(overlay)} className="p-2 rounded-md hover:bg-muted">
                  <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={()=> setOverlay(null)} className="p-2 rounded-md hover:bg-muted" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 56px)' }}>
              {/* Total Books Table */}
              {overlay === 'total' && (
                <div className="border rounded-md">
                  <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-muted text-sm font-semibold">
                    <div>BOOK ID</div>
                    <div>TITLE</div>
                    <div>AUTHOR</div>
                    <div>CATEGORY</div>
                  </div>
                  <div className="divide-y max-h-[60vh] overflow-y-auto">
                    {Array.isArray(filteredGroups) && (filteredGroups as TotalBooksResp['data']).map((r, i) => (
                      <div key={`${r.book_id}-${i}`} className={`grid grid-cols-4 gap-2 px-3 py-2 text-sm ${i % 2 ? 'bg-white' : 'bg-slate-50'}`}>
                        <div className="truncate" title={r.book_id}>{r.book_id}</div>
                        <div className="truncate" title={r.title}>{r.title}</div>
                        <div className="truncate" title={r.author}>{r.author}</div>
                        <div className="truncate" title={r.category}>{r.category}</div>
                      </div>
                    ))}
                    {Array.isArray(filteredGroups) && (filteredGroups as TotalBooksResp['data']).length === 0 && (
                      <div className="p-4 text-sm text-muted-foreground">No books found.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Grouped Lists */}
              {(overlay === 'active' || overlay === 'today' || overlay === 'overdue') && filteredGroups && (
                <div className="space-y-6">
                  {Object.entries(filteredGroups as Record<string, any[]>).map(([date, rows]) => (
                    <div key={date}>
                      <div className="font-bold text-sm tracking-wide text-primary mb-2">{date}</div>
                      <div className="border rounded-md">
                        <div className={`grid ${overlay==='today' ? 'grid-cols-[120px_160px_1fr_1fr_140px]' : 'grid-cols-[120px_160px_1fr_1fr_80px_60px]'} gap-2 px-3 py-2 bg-muted text-sm font-semibold`}>
                          {overlay==='today' ? (
                            <>
                              <div>TIME</div><div>BOOK ID</div><div>TITLE</div><div>AUTHOR</div><div>CATEGORY</div>
                            </>
                          ) : (
                            <>
                              <div>TIME</div><div>USER ID</div><div>FULL NAME</div><div>COURSE</div><div>YEAR</div><div>BLOCK</div>
                            </>
                          )}
                        </div>
                        <div className="divide-y">
                          {rows.map((r:any, i:number) => (
                            <div key={i} className={`grid ${overlay==='today' ? 'grid-cols-[120px_160px_1fr_1fr_140px]' : 'grid-cols-[120px_160px_1fr_1fr_80px_60px]'} gap-2 px-3 py-2 text-sm ${i % 2 ? 'bg-white' : 'bg-slate-50'}`}>
                              {overlay==='today' ? (
                                <>
                                  <div>{r.timestamp}</div>
                                  <div className="truncate" title={r.book_id}>{r.book_id}</div>
                                  <div className="truncate" title={r.title}>{r.title}</div>
                                  <div className="truncate" title={r.author}>{r.author}</div>
                                  <div className="truncate" title={r.category}>{r.category}</div>
                                </>
                              ) : (
                                <>
                                  <div>{r.timestamp}</div>
                                  <div className="truncate" title={r.user_id}>{r.user_id}</div>
                                  <div className="truncate" title={r.fullname}>{r.fullname}</div>
                                  <div className="truncate" title={r.course}>{r.course}</div>
                                  <div>{r.year}</div>
                                  <div>{r.block}</div>
                                </>
                              )}
                            </div>
                          ))}
                          {rows.length === 0 && (
                            <div className="p-4 text-sm text-muted-foreground">No records.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
