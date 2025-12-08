"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { getPartnerDashboard, type PartnerDashboardStats } from "@/lib/partner-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Shield, Activity, LogOut, FileCode, Copy, Download } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Footer from "@/components/Footer";

export default function PartnerDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<PartnerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // If not authenticated, middleware should handle redirect, but safe to check here
    if (status === "unauthenticated") {
      router.push("/partner/login");
      return;
    }

    if (status === "authenticated") {
      const loadData = async () => {
        try {
          const dashboardData = await getPartnerDashboard();
          setData(dashboardData);
        } catch {
          // Error handling
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [status, router]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/partner/login" });
  };

  const handleCopyCode = () => {
    const code = `curl -X POST https://api.thaiscam.zcr.ai/partner/detect \\
  -H "X-API-Key: YOUR_KEY" \\
  -d '{"text": "suspicious message"}'`;
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!", {
      description: "Paste it in your terminal to test the API",
    });
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    // Create CSV content
    const headers = ["Timestamp", "Endpoint", "Status", "Latency"];
    const rows = data.recent_logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.endpoint,
      `${log.status} OK`,
      log.latency
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("CSV exported successfully!", {
      description: "Check your downloads folder",
    });
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Text Requests - Blue */}
              <Card className="bg-card/95 backdrop-blur-xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Text API Usage</CardTitle>
                  <Activity className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-blue-700 dark:text-blue-400 mb-2">
                    {data.total_requests.toLocaleString()}
                  </div>
                  <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mb-3">
                    Limit: {data.requests_limit.toLocaleString()}
                  </p>
                  <div className="h-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ width: `${Math.min((data.total_requests / data.requests_limit) * 100, 100)}%` }} 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Total Image Requests - Purple (New) */}
              <Card className="bg-card/95 backdrop-blur-xl border-2 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-900/10 shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Image API Usage</CardTitle>
                  <FileCode className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-purple-700 dark:text-purple-400 mb-2">
                    {data.total_image_requests.toLocaleString()}
                  </div>
                  <p className="text-xs text-purple-700/70 dark:text-purple-300/70 mb-3">
                    Limit: {data.image_limit.toLocaleString()}
                  </p>
                  <div className="h-2 w-full bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600" 
                      style={{ width: `${Math.min((data.total_image_requests / data.image_limit) * 100, 100)}%` }} 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Scam Detected - Red */}
              <Card className="bg-card/95 backdrop-blur-xl border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10 shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Scam Detected</CardTitle>
                  <Shield className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-red-600 dark:text-red-400 mb-2">
                    {data.scam_detected.toLocaleString()}
                  </div>
                  <p className="text-xs text-red-700/70 dark:text-red-300/70">
                     Global Rate: {(data.total_requests > 0 ? (data.scam_detected / data.total_requests * 100) : 0).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              {/* API Status - Green */}
              <Card className="bg-card/95 backdrop-blur-xl border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">System Status</CardTitle>
                  <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-green-600 dark:text-green-400 mb-2">
                    99.9%
                  </div>
                   <p className="text-xs text-green-700/70 dark:text-green-300/70">
                    Latency: 45ms
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Integration Info */}
            <Card className="bg-slate-950/80 backdrop-blur-xl border-2 border-border shadow-2xl text-white overflow-hidden relative group">
               <div className="absolute inset-0 bg-grid-white/[0.05] -z-10" />
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600/20 p-4 rounded-xl ring-2 ring-blue-600/50">
                      <FileCode className="h-8 w-8 text-blue-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl md:text-3xl font-black flex items-center gap-3">
                        Integration Guide 
                        <Badge variant="outline" className="text-blue-400 border-blue-400/50 text-base">REST API</Badge>
                      </h3>
                      <p className="text-slate-300 text-base max-w-2xl">
                        Connect your application using our secure REST API. Include your unique API Key in the header.
                      </p>
                    </div>
                  </div>
                  {/* Copy Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="bg-white/10 hover:bg-white/20 border-white/20 text-white shrink-0"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Text Example
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Text API */}
                    <div>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs font-semibold text-blue-300">Text Detection</span>
                            <span className="text-[10px] text-slate-500">POST /partner/detect</span>
                        </div>
                        <div className="p-4 bg-black/50 rounded-xl border-2 border-white/10 font-mono text-sm overflow-x-auto h-40">
                            <code className="text-green-400 text-xs leading-relaxed">
                                curl -X POST https://api.thaiscam.zcr.ai/partner/detect \<br/>
                                &nbsp;&nbsp;-H &quot;X-API-Key: YOUR_KEY&quot; \<br/>
                                &nbsp;&nbsp;-d &apos;&#123;&quot;text&quot;: &quot;suspicious message&quot;&#125;&apos;
                            </code>
                        </div>
                    </div>

                    {/* Image API */}
                    <div>
                         <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs font-semibold text-purple-300">Image/Slip Detection</span>
                            <span className="text-[10px] text-slate-500">POST /partner/detect/image</span>
                        </div>
                        <div className="p-4 bg-black/50 rounded-xl border-2 border-white/10 font-mono text-sm overflow-x-auto h-40">
                            <code className="text-purple-300 text-xs leading-relaxed">
                                curl -X POST https://api.thaiscam.zcr.ai/partner/detect/image \<br/>
                                &nbsp;&nbsp;-H &quot;X-API-Key: YOUR_KEY&quot; \<br/>
                                &nbsp;&nbsp;-F &quot;file=@slip.jpg&quot;
                            </code>
                         </div>
                    </div>
                </div>

              </CardContent>
            </Card>

            {/* Recent Logs Table */}
            <Card className="bg-card/95 backdrop-blur-xl border-2 border-border shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black">Recent API Logs</CardTitle>
                    <CardDescription className="text-base mt-1">Real-time transaction history</CardDescription>
                  </div>
                  {/* Export CSV Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="h-10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2 border-border">
                      <TableHead className="font-bold text-base">Timestamp</TableHead>
                      <TableHead className="font-bold text-base">Endpoint</TableHead>
                      <TableHead className="font-bold text-base">Status</TableHead>
                      <TableHead className="font-bold text-base">Latency</TableHead>
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
        <Footer />
      </div>
    </AuroraBackground>
  );
}
