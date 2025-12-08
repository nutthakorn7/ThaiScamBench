"use client";

import { PublicBatchResponse, BatchImageResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw, AlertTriangle, CheckCircle, Smartphone, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BatchResultsTableProps {
  result: PublicBatchResponse;
  onReset: () => void;
}

export function BatchResultsTable({ result, onReset }: BatchResultsTableProps) {
  const { summary, results } = result;

  const downloadCSV = () => {
    const headers = ["Filename", "Status", "Is Scam", "Risk Score", "Category", "Reason"];
    const rows = results.map(r => [
      r.filename,
      r.status,
      r.is_scam ? "Yes" : "No",
      (r.risk_score * 100).toFixed(2) + "%",
      r.category,
      `"${r.reason.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `batch_result_${result.batch_id}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="ทั้งหมด" 
          value={summary.total} 
          icon={<FileText className="w-5 h-5" />}
          className="bg-slate-50 dark:bg-slate-900 border-slate-200"
        />
        <SummaryCard 
          title="ความเสี่ยงสูง" 
          value={summary.scam_count} 
          icon={<AlertTriangle className="w-5 h-5" />}
          className="bg-red-50 dark:bg-red-950/30 border-red-200 text-red-600"
          valueClassName="text-red-600"
        />
        <SummaryCard 
          title="ปลอดภัย" 
          value={summary.safe_count} 
          icon={<CheckCircle className="w-5 h-5" />}
          className="bg-green-50 dark:bg-green-950/30 border-green-200 text-green-600"
          valueClassName="text-green-600"
        />
        <SummaryCard 
          title="ถูกดัดแปลง" 
          value={summary.manipulated_count} 
          icon={<Smartphone className="w-5 h-5" />}
          className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 text-purple-600"
          valueClassName="text-purple-600"
        />
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>ผลการตรวจสอบโดยละเอียด</CardTitle>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
                <Button onClick={onReset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    ตรวจสอบใหม่
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                        <TableRow>
                            <TableHead className="w-[100px]">Index</TableHead>
                            <TableHead>Filename</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Risk Score</TableHead>
                            <TableHead>Reason</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.map((item, index) => (
                            <TableRow key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                                <TableCell className="font-medium">{item.filename}</TableCell>
                                <TableCell>
                                    {item.status === 'success' ? (
                                         <Badge 
                                            variant={item.is_scam ? "destructive" : "outline"}
                                            className={cn(
                                                !item.is_scam && "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20"
                                            )}
                                        >
                                            {item.is_scam ? "SCAM" : "SAFE"}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">Error</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {item.category && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {item.category}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.risk_score > 0 && (
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                    "h-full",
                                                    item.risk_score >= 0.7 ? "bg-red-600" :
                                                    item.risk_score >= 0.4 ? "bg-orange-600" :
                                                    "bg-green-600"
                                                    )}
                                                    style={{ width: `${item.risk_score * 100}%` }}
                                                />
                                            </div>
                                            <span className="font-mono font-bold">
                                                {(item.risk_score * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate text-muted-foreground" title={item.reason || item.error}>
                                    {item.reason || item.error || "-"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, icon, className, valueClassName }: any) {
    return (
        <div className={cn("p-6 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow", className)}>
            <div className="p-3 rounded-full bg-white dark:bg-black/20 mb-3 shadow-sm">
                {icon}
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <p className={cn("text-3xl font-black", valueClassName)}>{value}</p>
        </div>
    )
}
