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
  Eye,
  BrainCircuit,
  Check
} from "lucide-react";
import { getUncertainCases, type UncertainCasesResponse, type UncertainCase } from "@/lib/admin-api";
import { addToKnowledgeBase } from "@/lib/knowledge-base-api";
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

  const handleTeach = async (caseId: string, category: string) => {
      const toastId = toast.loading("Analyzing pattern signature...");
      try {
          // Simulate AI learning
          await addToKnowledgeBase(caseId, `Learned Pattern from ${caseId}`, category);
          toast.success("Pattern added to Knowledge Base", { id: toastId });
          // In a real app we might remove the case from the list or mark as reviewed
          fetchData();
      } catch (error) {
          toast.error("Failed to update vector index", { id: toastId });
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
                        <div className="flex items-center gap-1">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                title="Approve as Safe"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                onClick={() => handleTeach(case_.request_id, case_.category)}
                                title="Teach AI (Add to Knowledge Base)"
                            >
                                <BrainCircuit className="h-4 w-4" />
                            </Button>
                            
                            {/* Level 2: Text Intent Analysis Demo */}
                            {case_.type === 'text' && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            title="AI Intent Analysis (Level 2)"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <AIAnalysisView text={case_.message as string} />
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
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

// Sub-component for Analysis View
import { analyzeTextIntent, type TextAnalysisResult } from "@/lib/admin-api";
import { Sparkles, Brain } from "lucide-react";

function AIAnalysisView({ text }: { text: string }) {
    const [result, setResult] = useState<TextAnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        analyzeTextIntent(text).then(res => {
            setResult(res);
            setLoading(false);
        });
    }, [text]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="relative">
                    <Brain className="h-12 w-12 text-blue-500 animate-pulse" />
                    <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500 animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">AI is deconstructing semantic intent...</p>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">AI Intent Analysis</h3>
                    <p className="text-xs text-muted-foreground">Level 2: Semantic Understanding</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border text-sm italic border-l-4 border-l-blue-500">
                    "{text}"
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Detected Intent</span>
                        <p className="font-medium text-blue-700 dark:text-blue-300">{result.intent}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Urgency Score</span>
                        <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${result.urgency_score > 0.7 ? 'bg-red-500' : 'bg-green-500'}`} 
                                    style={{ width: `${result.urgency_score * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono">{(result.urgency_score * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Psychological Triggers</span>
                    <div className="flex flex-wrap gap-2">
                        {result.triggered_psychology.map(t => (
                            <Badge key={t} variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                {t}
                            </Badge>
                        ))}
                    </div>
                </div>

                 <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm">
                    <span className="font-semibold block mb-1">Analysis:</span>
                    {result.explanation}
                </div>
            </div>
        </div>
    );
}
