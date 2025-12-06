"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  TrendingDown,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { getUncertainCases, type UncertainCasesResponse, type UncertainCase } from "@/lib/admin-api";
import { isAdminAuthenticated, removeAdminToken } from "@/lib/auth";
import { toast } from "sonner";

export default function ReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<UncertainCasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    fetchData();
  }, [limit, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getUncertainCases(limit, true);
      setData(result);
    } catch (err: any) {
      console.error('Failed to load uncertain cases:', err);
      if (err.response?.status === 403) {
        toast.error("Token หมดอายุ", { description: "กรุณา login ใหม่" });
        removeAdminToken();
        router.push('/admin/login');
      } else {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingDown className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-4">
          ← กลับหน้าแรก
        </Button>
        <h1 className="text-3xl font-bold">Cases for Review</h1>
        <p className="text-muted-foreground">กรณีที่ต้องตรวจสอบเพื่อปรับปรุง Model</p>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.total}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uncertain (40-60%)</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{data.uncertain_count}</div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incorrect Feedback</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.incorrect_feedback_count}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant={limit === 50 ? "default" : "outline"}
            size="sm"
            onClick={() => setLimit(50)}
          >
            Top 50
          </Button>
          <Button
            variant={limit === 100 ? "default" : "outline"}
            size="sm"
            onClick={() => setLimit(100)}
          >
            Top 100
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={fetchData}>
          Refresh
        </Button>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cases List</CardTitle>
          <CardDescription>
            เรียงตาม priority (High → Medium → Low) และจำนวน incorrect feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data && data.cases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Risk Score</TableHead>
                  <TableHead className="text-center">Is Scam</TableHead>
                  <TableHead className="text-center">Feedback</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cases.map((case_: UncertainCase) => (
                  <TableRow key={case_.request_id}>
                    <TableCell>
                      <Badge variant={getPriorityColor(case_.priority)} className="gap-1">
                        {getPriorityIcon(case_.priority)}
                        {case_.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {case_.request_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="capitalize">
                      {case_.category.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {(case_.risk_score * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {case_.is_scam ? (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {case_.incorrect_feedback_count > 0 && (
                        <Badge variant="destructive">
                          {case_.incorrect_feedback_count}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(case_.created_at).toLocaleDateString('th-TH')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              ไม่มีกรณีที่ต้อง review
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
