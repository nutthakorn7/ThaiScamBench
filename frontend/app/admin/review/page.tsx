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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  TrendingDown,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  MessageSquare,
  Eye
} from "lucide-react";
import { getUncertainCases, type UncertainCasesResponse, type UncertainCase } from "@/lib/admin-api";
import { isAdminAuthenticated, removeAdminToken } from "@/lib/auth";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";

export default function ReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<UncertainCasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getUncertainCases(limit, true);
      setData(result);
    } catch (err: unknown) {
      console.error('Failed to load uncertain cases:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any).response?.status === 403) {
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

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, router]);

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
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cases for Review</h1>
        <p className="text-muted-foreground">กรณีที่ต้องตรวจสอบเพื่อปรับปรุง Model (Uncertain / Incorrect Feedback)</p>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Risk Score</TableHead>
                  <TableHead className="text-center">Is Scam</TableHead>
                  <TableHead className="text-center">Feedback</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cases.map((case_: UncertainCase) => (
                  <TableRow key={case_.request_id}>
                    <TableCell>
                      <Badge variant={getPriorityColor(case_.priority) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                        {getPriorityIcon(case_.priority)}
                        {case_.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {case_.type === 'image' ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 gap-1 text-[10px]">
                                <ImageIcon className="h-3 w-3" /> Image
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 gap-1 text-[10px]">
                                <MessageSquare className="h-3 w-3" /> Text
                            </Badge>
                        )}
                    </TableCell>
                    <TableCell>
                       {case_.type === 'image' ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Eye className="h-4 w-4 text-purple-500" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <div className="flex flex-col items-center justify-center p-4">
                                        <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border">
                                             <div className="text-center p-8">
                                                <ImageIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                                                <p className="text-muted-foreground">Undecided Image</p>
                                             </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                       ) : (
                           <span className="text-xs text-muted-foreground truncate max-w-[150px] block" title={case_.message as string}>
                               {case_.message || "No content"}
                           </span>
                       )}
                    </TableCell>
                    <TableCell className="capitalize text-xs">
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
                    <TableCell>
                        <Button size="sm" variant="default" className="h-7 text-xs">Review</Button>
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
    </AdminLayout>
  );
}
