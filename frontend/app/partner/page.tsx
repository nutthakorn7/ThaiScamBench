"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPartnerDashboard, removePartnerKey, type PartnerDashboardStats } from "@/lib/partner-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Shield, Activity, LogOut, FileCode } from "lucide-react";

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
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-lg">Partner Portal</span>
            <Badge variant="secondary" className="ml-2">{data.plan_tier}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden md:inline">
              {data.company_name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.total_requests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Limit: {data.requests_limit.toLocaleString()} / month
              </p>
              <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(data.total_requests / data.requests_limit) * 100}%` }} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scam Detected</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.scam_detected.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                 {(data.scam_detected / data.total_requests * 100).toFixed(1)}% of total traffic
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Operational</div>
              <p className="text-xs text-muted-foreground">
                Latency: 45ms (avg)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Integration Info */}
        <Card className="bg-slate-900 text-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <FileCode className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Integration Guide</h3>
                <p className="text-slate-300 text-sm mb-4">
                  Connect your application using our REST API. Use your API Key in the `X-API-Key` header.
                </p>
                <code className="bg-black/50 px-3 py-2 rounded text-sm font-mono block w-fit">
                  curl -H "X-API-Key: YOUR_KEY" https://api.thaiscam.zcr.ai/partner/detect
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent API Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {log.status} OK
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{log.latency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
