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
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { getCategoryStats, type CategoryStats } from "@/lib/admin-api";
import { isAdminAuthenticated, removeAdminToken } from "@/lib/auth";
import { toast } from "sonner";

export default function CategoriesPage() {
  const router = useRouter();
  const [data, setData] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    fetchData(page);
  }, [page, router]);

  const fetchData = async (pageNum: number) => {
    setLoading(true);
    try {
      const result = await getCategoryStats(pageNum, pageSize);
      setData(result);
    } catch (err: any) {
      console.error('Failed to load category stats:', err);
      if (err.response?.status === 403) {
        toast.error("Token หมดอายุ", { description: "กรุณา login ใหม่" });
        removeAdminToken();
        router.push('/admin/login');
      } else {
        toast.error("ไม่สามารถโหลดข้อมูล Category ได้");
      }
    } finally {
      setLoading(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-4">
          ← กลับหน้าแรก
        </Button>
        <h1 className="text-3xl font-bold">Category Distribution</h1>
        <p className="text-muted-foreground">การกระจายตัวของประเภท Scam</p>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.total}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>
            หน้า {page} จาก {totalPages} (ทั้งหมด: {data?.total || 0} categories)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead>Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((cat, idx) => (
                    <TableRow key={cat.category}>
                      <TableCell>
                        <Badge variant="secondary">
                          #{((page - 1) * pageSize) + idx + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium capitalize">
                        {cat.category.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-right">
                        {cat.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {cat.percentage.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              ไม่มีข้อมูล Category
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
