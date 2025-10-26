import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Clock } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { StatsService, type LiveStats } from "@/services/stats";
import { ActivityService, type ActivityRecord } from "@/services/activity";

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
    { title: "Total Books", value: String(live.totalBooks), icon: BookOpen, color: "text-primary" },
    { title: "Active Borrowers", value: String(live.activeBorrowers), icon: Users, color: "text-accent" },
    { title: "Books Borrowed Today", value: String(live.borrowedToday), icon: TrendingUp, color: "text-secondary" },
    { title: "Overdue Returns", value: String(live.overdue), icon: Clock, color: "text-destructive" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] mx-auto space-y-6 overflow-y-auto">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back! Here's what's happening in your library.
              </p>
            </div>

            {/* Stats Grid - real-time */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <Card key={idx} className="shadow-jrmsu">
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
    </div>
  );
};

export default Dashboard;
