"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  LogOut,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { getAdminSummary, type SummaryStats } from "@/lib/admin-api";
import { isAdminAuthenticated, removeAdminToken } from "@/lib/auth";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getAdminSummary(7);
        setStats(data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          toast.error("Token ไม่ถูกต้อง", { description: "กรุณา login ใหม่" });
          handleLogout();
        } else {
          setError("ไม่สามารถโหลดข้อมูลได้");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    removeAdminToken();
    toast.success("Logout สำเร็จ");
    router.push('/admin/login');
  };

  const Content = () => (
    <div className="space-y-8 relative z-10 w-full">
         <div className="flex justify-between items-center bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/50 shadow-sm">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">สถิติการใช้งานระบบ (7 วันล่าสุด)</p>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.total_requests?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">การตรวจสอบทั้งหมด</p>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scam Detected</CardTitle>
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">{stats?.scam_requests?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.scam_percentage?.toFixed(1) || 0}% ของทั้งหมด</p>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Safe Messages</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold text-green-500">{stats?.safe_requests?.toLocaleString() || 0}</div>
                 <p className="text-xs text-muted-foreground mt-1">{stats ? (100 - stats.scam_percentage).toFixed(1) : 0}% ของทั้งหมด</p>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
                 <TrendingUp className="h-4 w-4 text-purple-500" />
               </CardHeader>
               <CardContent>
                 <div className="text-3xl font-bold text-purple-500">{stats?.scam_percentage?.toFixed(1) || 0}%</div>
                 <p className="text-xs text-muted-foreground mt-1">Scam detection percentage</p>
               </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
             {/* Top Categories */}
            {stats?.top_categories && stats.top_categories.length > 0 && (
              <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle>Top Scam Categories</CardTitle>
                  <CardDescription>ประเภทการหลอกลวงที่พบบ่อยที่สุด</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.top_categories.map((cat, index) => (
                      <div key={cat.category} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize text-foreground">{cat.category.replace(/_/g, " ")}</span>
                            <span className="text-sm text-muted-foreground">{cat.count.toLocaleString()} cases</span>
                          </div>
                          <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
    </div>
  );

  if (loading) {
    return (
       <AdminLayout>
         <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
         </div>
       </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-destructive">เกิดข้อผิดพลาด</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>ลองใหม่</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
       <div className="relative min-h-[calc(100vh-100px)]">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5" />
          <Content />
       </div>
    </AdminLayout>
  );
}
