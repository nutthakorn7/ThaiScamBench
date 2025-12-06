"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPartnerDashboard, removePartnerKey, type PartnerDashboardStats } from "@/lib/partner-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Shield, Activity, LogOut, FileCode } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";

export default function PartnerDashboard() {
  const [data, setData] = useState<PartnerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dashboardData = await getPartnerDashboard();
      setData(dashboardData);
    } catch (error) {
      router.push("/partner/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removePartnerKey();
    router.push("/partner/login");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <AuroraBackground>
      <div className="min-h-screen relative flex flex-col w-full">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Partner Portal</span>
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">{data.plan_tier}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground hidden md:inline">
                {data.company_name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8 relative z-10">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Total Requests - Blue */}
              <Card className="bg-card/95 backdrop-blur-xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 shadow-2xl hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">Total Requests</CardTitle>
                  <Activity className="h-6 w-6 text-blue-600" />
                </CardHeader>
                <CardContent>
                  {/* HUGE Number */}
                  <div className="text-6xl md:text-8xl font-black text-blue-700 dark:text-blue-400 mb-2">
                    {data.total_requests.toLocaleString()}
                  </div>
                  <p className="text-sm text-blue-700/70 dark:text-blue-300/70 mb-3">
                    Limit: {data.requests_limit.toLocaleString()} / month
                  </p>
                  {/* Gradient Progress Bar */}
                  <div className="mt-4 h-3 w-full bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400" 
                      style={{ width: `${Math.min((data.total_requests / data.requests_limit) * 100, 100)}%` }} 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Scam Detected - Red */}
              <Card className="bg-card/95 backdrop-blur-xl border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10 shadow-2xl hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-semibold text-red-700 dark:text-red-400">Scam Detected</CardTitle>
                  <Shield className="h-6 w-6 text-red-600" />
                </CardHeader>
                <CardContent>
                  {/* HUGE Number */}
                  <div className="text-6xl md:text-8xl font-black text-red-600 dark:text-red-400 mb-2">
                    {data.scam_detected.toLocaleString()}
                  </div>
                  <p className="text-sm text-red-700/70 dark:text-red-300/70">
                     {(data.total_requests > 0 ? (data.scam_detected / data.total_requests * 100) : 0).toFixed(1)}% of total traffic
                  </p>
                </CardContent>
              </Card>

              {/* API Status - Green */}
              <Card className="bg-card/95 backdrop-blur-xl border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 shadow-2xl hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-semibold text-green-700 dark:text-green-400">API Status</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
                </CardHeader>
                <CardContent>
                  {/* HUGE Text */}
                  <div className="text-6xl md:text-8xl font-black text-green-600 dark:text-green-400 mb-2">
                    ✓
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400 mb-1">
                    Operational
                  </div>
                  <p className="text-sm text-green-700/70 dark:text-green-300/70">
                    Latency: 45ms (avg)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Integration Info */}
            <Card className="bg-slate-950/80 backdrop-blur-xl border-border/50 text-white overflow-hidden relative group">
               <div className="absolute inset-0 bg-grid-white/[0.05] -z-10" />
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 p-3 rounded-lg ring-1 ring-primary/50">
                    <FileCode className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      Integration Guide <Badge variant="outline" className="text-primary border-primary/30">REST API</Badge>
                    </h3>
                    <p className="text-slate-400 text-sm max-w-2xl">
                      Connect your application using our secure REST API. Include your unique API Key in the header of every request.
                    </p>
                    <div className="mt-4 p-4 bg-black/50 rounded-lg border border-white/10 font-mono text-sm overflow-x-auto">
                      <div className="flex justify-between items-center mb-2 text-xs text-slate-500">
                        <span>Terminal</span>
                        <span>bash</span>
                      </div>
                      <code className="text-green-400">
                        curl -X POST https://api.thaiscam.zcr.ai/partner/detect \<br/>
                        &nbsp;&nbsp;-H "X-API-Key: YOUR_KEY" \<br/>
                        &nbsp;&nbsp;-d '&#123;"text": "suspicious message"&#125;'
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Logs Table */}
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Recent API Logs</CardTitle>
                <CardDescription>Real-time transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent_logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-white/5 border-border/50">
                        <TableCell className="font-mono text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                        <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            {log.status} OK
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">{log.latency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/40 bg-background/60 backdrop-blur-md mt-auto">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2025 Thai Scam Detector. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </AuroraBackground>
  );
}
