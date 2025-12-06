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
import { ChevronLeft, ChevronRight, Users, TrendingUp } from "lucide-react";
import { getPartnerStats, type PartnerStats } from "@/lib/admin-api";
import { isAdminAuthenticated, removeAdminToken } from "@/lib/auth";
import { toast } from "sonner";

export default function PartnersPage() {
  const router = useRouter();
  const [data, setData] = useState<PartnerStats | null>(null);
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
      const result = await getPartnerStats(pageNum, pageSize);
      setData(result);
    } catch (err: any) {
      console.error('Failed to load partner stats:', err);
      if (err.response?.status === 403) {
        toast.error("Token หมดอายุ", { description: "กรุณา login ใหม่" });
        removeAdminToken();
        router.push('/admin/login');
      } else {
        toast.error("ไม่สามารถโหลดข้อมูล Partner ได้");
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
        <h1 className="text-3xl font-bold">Partner Statistics</h1>
        <p className="text-muted-foreground">การใช้งานของ Partners แต่ละราย</p>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
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
          <CardTitle>Partner List</CardTitle>
          <CardDescription>
            หน้า {page} จาก {totalPages} (รายการทั้งหมด: {data?.total || 0})
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
                    <TableHead>Partner ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Total Requests</TableHead>
                    <TableHead className="text-right">Scam Detected</TableHead>
                    <TableHead className="text-right">Detection Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((partner) => (
                    <TableRow key={partner.partner_id}>
                      <TableCell className="font-mono text-xs">
                        {partner.partner_id}
                      </TableCell>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell className="text-right">
                        {partner.total_requests.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {partner.scam_detected.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {((partner.scam_detected / partner.total_requests) * 100).toFixed(1)}%
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
              ไม่มีข้อมูล Partner
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
