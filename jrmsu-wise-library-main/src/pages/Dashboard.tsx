import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Clock } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { StatsService, type LiveStats } from "@/services/stats";

const Dashboard = () => {
  const { user } = useAuth();
  const userType: "student" | "admin" = user?.role ?? "student";

  const [live, setLive] = useState<LiveStats>(StatsService.get());
  useEffect(() => {
    const unsub = StatsService.subscribe(setLive);
    StatsService.start(3000);
    return unsub;
  }, []);

  const stats = [
    { title: "Total Books", value: String(live.totalBooks), icon: BookOpen, change: "", color: "text-primary" },
    { title: "Active Borrowers", value: String(live.activeBorrowers), icon: Users, change: "", color: "text-accent" },
    { title: "Books Borrowed Today", value: String(live.borrowedToday), icon: TrendingUp, change: "", color: "text-secondary" },
    { title: "Overdue Returns", value: String(live.overdue), icon: Clock, change: "", color: "text-destructive" },
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

            {/* Recent Activity */}
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Student borrowed "Introduction to AI"</p>
                          <p className="text-sm text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
