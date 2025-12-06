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
              <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.total_requests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Limit: {data.requests_limit.toLocaleString()} / month
                  </p>
                  <div className="mt-3 h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent" 
                      style={{ width: `${Math.min((data.total_requests / data.requests_limit) * 100, 100)}%` }} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scam Detected</CardTitle>
                  <Shield className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">{data.scam_detected.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                     {(data.total_requests > 0 ? (data.scam_detected / data.total_requests * 100) : 0).toFixed(1)}% of total traffic
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Status</CardTitle>
                  <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">Operational</div>
                  <p className="text-xs text-muted-foreground mt-1">
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
      </div>
    </AuroraBackground>
  );
}
