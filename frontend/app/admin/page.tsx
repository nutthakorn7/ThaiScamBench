"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, CheckCircle2, BarChart3, TrendingUp, LogOut, AlertTriangle } from "lucide-react";
import { getAdminSummary, type SummaryStats } from "@/lib/admin-api";
import { isAdminAuthenticated, removeAdminToken } from "@/lib/auth";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { Overview } from "@/components/ui/overview";
import { ActivityTicker } from "@/components/ui/activity-ticker";
import { ScanningRadar } from "@/components/ui/scanning-radar";
import { GlassCard } from "@/components/ui/glass-card";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = useCallback(() => {
    removeAdminToken();
    toast.success('Logged out successfully');
    router.push('/admin/login');
  }, [router]);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getAdminSummary(7);
        setStats(data);
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any).response?.status === 403) {
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
  }, [router, handleLogout]);

  const Content = () => (
    <div className="space-y-8 relative z-10 w-full">
      {/* Header - World-Class */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl md:text-6xl font-black mb-3 text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              สถิติการใช้งานและการวิเคราะห์ระบบ
            </p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>

          {/* Stats Grid - World-Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Text Requests - Blue */}
            <GlassCard className="border-blue-200/30 dark:border-blue-800/30 hover:-translate-y-1 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Total Requests</CardTitle>
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 mb-2">
                  {stats?.total_requests?.toLocaleString() || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  การตรวจสอบข้อความทั้งหมด
                 </p>
              </CardContent>
            </GlassCard>

            {/* Total Image Requests - Purple */}
            <GlassCard className="border-purple-200/30 dark:border-purple-800/30 hover:-translate-y-1 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Image Scans</CardTitle>
                <div className="p-1 bg-purple-500/20 dark:bg-purple-600/30 rounded">
                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400 mb-2">
                  {stats?.total_images?.toLocaleString() || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  การตรวจสอบรูปภาพสลิป
                </p>
              </CardContent>
            </GlassCard>

            {/* Safe Messages - Green */}
            <GlassCard className="border-green-200/30 dark:border-green-800/30 hover:-translate-y-1 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Safe Content</CardTitle>
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-500 mb-2">
                  {stats?.safe_requests?.toLocaleString() || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats ? (100 - stats.scam_percentage).toFixed(1) : 0}% ของทั้งหมด
                </p>
              </CardContent>
            </GlassCard>

            {/* Scam Detected - Red */}
            <GlassCard className="border-red-200/30 dark:border-red-800/30 hover:-translate-y-1 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Scams Found</CardTitle>
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500 mb-2">
                  {stats?.scam_requests?.toLocaleString() || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats?.scam_percentage?.toFixed(1) || 0}% ของทั้งหมด
                </p>
              </CardContent>
            </GlassCard>
            
             {/* Fake Slips - Orange */}
             <GlassCard className="border-orange-200/30 dark:border-orange-800/30 hover:-translate-y-1 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Fake Slips</CardTitle>
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-500 mb-2">
                  {stats?.scam_images?.toLocaleString() || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                   {stats ? ((stats.scam_images / (stats.total_images || 1)) * 100).toFixed(1) : 0}% ของรูปภาพ
                </p>
              </CardContent>
            </GlassCard>

            {/* Detection Rate - Gray/Mixed */}
            <GlassCard className="border-slate-200/30 dark:border-slate-700/30 hover:-translate-y-1 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-slate-600/5 rounded-2xl pointer-events-none" />
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Overall Risk</CardTitle>
                  <TrendingUp className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">
                    {stats?.scam_percentage?.toFixed(1) || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average Risk Score
                  </p>
                </CardContent>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <GlassCard className="col-span-1 lg:col-span-4 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Overview</CardTitle>
                <CardDescription>
                  ยอดการตรวจสอบย้อนหลัง 7 เดือน (Simulated)
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview 
                  data={stats?.requests_per_day?.map(d => ({
                    name: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
                    total: d.count
                  }))} 
                />
              </CardContent>
            </GlassCard>
            <GlassCard className="col-span-1 lg:col-span-3 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
                    <ScanningRadar />
                </div>
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        Recent Activity
                        <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </CardTitle>
                    <CardDescription>
                        Real-time AI Analysis Stream
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] overflow-hidden relative">
                    {/* ActivityTicker will go here */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none h-full" />
                    <ActivityTicker />
                </CardContent>
            </GlassCard>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {stats?.top_categories && stats.top_categories.length > 0 && (
              <GlassCard className="shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-black">Top Scam Categories</CardTitle>
                  <CardDescription className="text-base mt-1">ประเภทการหลอกลวงที่พบบ่อยที่สุด</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {stats.top_categories.map((cat, index) => (
                      <div key={cat.category} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 font-bold text-base shadow-sm">
                              {index + 1}
                            </div>
                            <span className="font-semibold text-base capitalize text-foreground">{cat.category.replace(/_/g, " ")}</span>
                          </div>
                          <span className="text-base font-bold text-muted-foreground">{cat.count.toLocaleString()} cases</span>
                        </div>
                        {/* Premium Progress Bar */}
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500 group-hover:scale-x-105 origin-left"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </GlassCard>
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        <Content />
      </motion.div>
    </AdminLayout>
  );
}
