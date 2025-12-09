"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Banknote, AlertTriangle, CheckCircle, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SlipVerificationData {
  trust_score: number;
  is_likely_genuine: boolean;
  detected_bank?: string;
  detected_amount?: string;
  checks_passed: number;
  total_checks: number;
  warnings: string[];
  checks: string[]; // Passed checks list
  advice?: string;
  qr_valid?: boolean;
  qr_data?: string;
}

interface SlipVerificationCardProps {
  slip: SlipVerificationData;
}

const BANK_LOGOS: Record<string, { name: string; color: string; bg: string }> = {
  kbank: { name: "ธ.กสิกรไทย", color: "text-green-600", bg: "bg-green-100" },
  scb: { name: "ธ.ไทยพาณิชย์", color: "text-purple-600", bg: "bg-purple-100" },
  ktb: { name: "ธ.กรุงไทย", color: "text-blue-500", bg: "bg-blue-100" },
  bbl: { name: "ธ.กรุงเทพ", color: "text-blue-800", bg: "bg-blue-200" },
  gsb: { name: "ธ.ออมสิน", color: "text-pink-500", bg: "bg-pink-100" },
  ttb: { name: "ธ.ทหารไทยธนชาต", color: "text-blue-700", bg: "bg-white" },
  bay: { name: "ธ.กรุงศรี", color: "text-yellow-700", bg: "bg-yellow-100" },
};

export function SlipVerificationCard({ slip }: SlipVerificationCardProps) {
  // Normalize bank name
  const bankKey = slip.detected_bank?.toLowerCase() || "";
  const bankInfo = BANK_LOGOS[bankKey] 
    ? BANK_LOGOS[bankKey]
    : { name: slip.detected_bank || "ไม่ระบุ", color: "text-gray-600", bg: "bg-gray-100" };

  return (
    <Card className={cn(
      "mt-6 border-2 shadow-lg overflow-hidden transition-all duration-500",
      slip.trust_score >= 0.7 
        ? "border-green-500/30 bg-green-50/30 dark:bg-green-950/20" 
        : slip.trust_score >= 0.4 
        ? "border-orange-500/30 bg-orange-50/30 dark:bg-orange-950/20"
        : "border-red-500/30 bg-red-50/30 dark:bg-red-950/20"
    )}>
      <CardHeader className="bg-white/50 dark:bg-black/20 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className={cn("p-2.5 rounded-xl shadow-sm", 
            slip.trust_score >= 0.7 ? "bg-green-100 text-green-700" :
            slip.trust_score >= 0.4 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
          )}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span>ผลตรวจสอบสลิป</span>
            <span className="text-sm font-normal text-muted-foreground">
              Slip Verification System
            </span>
          </div>
          <div className="ml-auto flex gap-2">
             {/* QR Badge */}
             {slip.qr_data && (
                <Badge variant="secondary" className={cn("text-base px-3 py-1 gap-1", 
                    slip.qr_valid ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"
                )}>
                  <span className="text-xs">QR</span> 
                  {slip.qr_valid ? "✅ ยืนยันยอด" : "⚠️ ตรวจสอบไม่ได้"}
                </Badge>
             )}
             
             <Badge 
              variant={slip.is_likely_genuine ? "outline" : "destructive"}
              className={cn(
                "text-base px-4 py-1",
                slip.is_likely_genuine 
                  ? "border-green-500 text-green-700 bg-green-100" 
                  : "bg-red-600 text-white"
              )}
            >
              {slip.is_likely_genuine ? "✅ ผ่านเกณฑ์" : "⚠️ ไม่ผ่าน"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Trust Score Panel */}
          <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-black/30 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-muted-foreground">ระดับความน่าเชื่อถือ</span>
              <span className={cn("text-2xl font-black", 
                slip.trust_score >= 0.7 ? "text-green-600" : 
                slip.trust_score >= 0.4 ? "text-orange-500" : "text-red-500"
              )}>
                {(slip.trust_score * 100).toFixed(0)}%
              </span>
            </div>
            
            {/* Progress Meter */}
            <div className="relative h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 whileInView={{ width: `${slip.trust_score * 100}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className={cn("h-full rounded-full transition-all",
                   slip.trust_score >= 0.7 ? "bg-gradient-to-r from-green-500 to-emerald-600" :
                   slip.trust_score >= 0.4 ? "bg-gradient-to-r from-orange-400 to-amber-500" :
                   "bg-gradient-to-r from-red-500 to-rose-600"
                 )}
               />
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs font-semibold text-center opacity-60">
              <span className="text-red-500">Fake</span>
              <span className="text-orange-500">Risk</span>
              <span className="text-green-600">Real</span>
            </div>
          </div>

          {/* Extracted Data Panel */}
          <div className="grid grid-cols-2 gap-3">
             <div className="p-4 rounded-2xl bg-white dark:bg-black/30 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                <span className="text-xs text-muted-foreground mb-1">ธนาคาร</span>
                <div className={cn("mb-1 p-2 rounded-full", bankInfo.bg)}>
                  <Banknote className={cn("w-5 h-5", bankInfo.color)} />
                </div>
                <span className={cn("font-bold text-lg leading-tight", bankInfo.color)}>
                  {bankInfo.name}
                </span>
             </div>
             
             <div className="p-4 rounded-2xl bg-white dark:bg-black/30 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                <span className="text-xs text-muted-foreground mb-1">จำนวนเงิน</span>
                <span className="text-2xl font-black text-gray-800 dark:text-gray-200">
                   {slip.detected_amount ? `฿${slip.detected_amount}` : "-"}
                </span>
                <span className="text-xs text-green-600 font-medium">
                  {slip.detected_amount ? "ตรวจพบยอด" : "ไม่พบยอดเงิน"}
                </span>
             </div>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            รายการตรวจสอบ ({slip.checks_passed}/{slip.total_checks})
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Show passed checks */}
            {slip.checks && slip.checks.map((check, i) => (
              <div key={`check-${i}`} className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100/50">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-green-900 dark:text-green-300">{check}</span>
              </div>
            ))}
            
            {/* If checks list is empty (fallback), show placeholder */}
            {(!slip.checks || slip.checks.length === 0) && (
              <div className="text-sm text-muted-foreground italic col-span-2">
                รายละเอียดการตรวจสอบไม่แสดงผล
              </div>
            )}
          </div>
        </div>

        {/* Warnings Section */}
        {slip.warnings && slip.warnings.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 overflow-hidden"
          >
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-red-800 dark:text-red-400 text-sm mb-1">สิ่งที่ต้องระวัง:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                  {slip.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Advice Section */}
        {slip.advice && slip.trust_score < 1.0 && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
              {slip.advice}
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
