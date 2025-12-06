"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFeedbackList, type FeedbackLog } from "@/lib/admin-api";
import { Loader2, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getFeedbackList(page, 20);
      setFeedback(data.items);
    } catch (error) {
      console.error("Failed to load feedback", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Feedback</h2>
          <p className="text-muted-foreground">
            สิ่งที่ผู้ใช้งานรายงานกลับมาเกี่ยวกับผลการตรวจสอบ
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>รายการ Feedback ล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('th-TH')}
                      </TableCell>
                      <TableCell>
                        {item.feedback_type === 'correct' ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                            <ThumbsUp className="h-3 w-3 mr-1" /> Correct
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shadow-none">
                            <ThumbsDown className="h-3 w-3 mr-1" /> Incorrect
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.request_id}
                      </TableCell>
                      <TableCell className="max-w-[400px]">
                        {item.comment ? (
                          <span className="text-sm">{item.comment}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">- No comment -</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost">View Case</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <div className="text-sm font-medium">Page {page}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
