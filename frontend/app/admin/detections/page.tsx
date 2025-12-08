"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { getDetections, type DetectionLog } from "@/lib/admin-api";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, Download, Loader2, ShieldAlert, ShieldCheck, Image as ImageIcon, MessageSquare, Eye } from "lucide-react";

export default function DetectionsPage() {
  const [detections, setDetections] = useState<DetectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDetections(page, 20); // 20 items per page
      setDetections(data.items);
    } catch (error) {
      console.error("Failed to load detections", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Detection Logs</h2>
            <p className="text-muted-foreground">
              ประวัติการตรวจสอบทั้งหมดในระบบ (Text & Image)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>ล่าสุด 20 รายการ</CardTitle>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input 
                  placeholder="ค้นหาข้อความ หรือ ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button size="icon" variant="ghost">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detections.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                         {item.type === 'image' ? (
                             <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 gap-1">
                                 <ImageIcon className="h-3 w-3" /> Image
                             </Badge>
                         ) : (
                             <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 gap-1">
                                 <MessageSquare className="h-3 w-3" /> Text
                             </Badge>
                         )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('th-TH')}
                      </TableCell>
                      <TableCell>
                        {item.type === 'image' ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm italic text-muted-foreground">Image Analysis</span>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                            <Eye className="h-3 w-3" /> View Source
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl">
                                        <div className="flex flex-col items-center justify-center p-4">
                                            <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border">
                                                {/* In real app, use next/image with item.image_url */}
                                                <div className="text-center p-8">
                                                    <ImageIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                                                    <p className="text-muted-foreground">Original Source Image</p>
                                                    <p className="text-xs text-slate-400 mt-2">{item.id}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        ) : (
                            <div className="max-w-[300px] truncate text-sm font-mono bg-slate-50 dark:bg-slate-900 p-1 px-2 rounded border" title={item.message as string}>
                                {item.message}
                            </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.risk_score > 0.7 ? 'bg-red-500' : item.risk_score > 0.4 ? 'bg-orange-500' : 'bg-green-500'}`} 
                              style={{ width: `${item.risk_score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{(item.risk_score * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.is_scam ? (
                          <div className="flex items-center justify-end gap-1 text-red-600">
                            <ShieldAlert className="h-4 w-4" />
                            <span className="font-medium">Scam</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-green-600">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="font-medium">Safe</span>
                          </div>
                        )}
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
