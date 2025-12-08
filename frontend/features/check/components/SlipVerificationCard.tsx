"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Banknote, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlipVerificationData {
  is_likely_genuine: boolean;
  trust_score: number;
  confidence: number;
  detected_bank?: string;
  detected_amount?: string;
  warnings: string[];
  checks: string[];
  advice: string;
}

interface SlipVerificationCardProps {
  slip: SlipVerificationData;
}

export function SlipVerificationCard({ slip }: SlipVerificationCardProps) {
  return (
    <Card className="mt-4 border-green-200 bg-green-50/50 dark:bg-green-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <Banknote className="w-5 h-5 text-green-600" />
          </div>
          <span>💳 ผลการตรวจสอบสลิป</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trust Score - BIG */}
        <div className="text-center p-6 rounded-xl bg-white dark:bg-black/20 border border-green-100 dark:border-green-900/30">
          <p className="text-sm text-muted-foreground mb-2">Trust Score</p>
          <p className={cn(
            "text-5xl md:text-6xl font-black",
            slip.trust_score >= 0.7 ? "text-green-600" :
            slip.trust_score >= 0.4 ? "text-orange-600" :
            "text-red-600"
          )}>
            {(slip.trust_score * 100).toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">/ 100</p>
          
          {/* Progress Bar */}
          <div className="mt-4 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                slip.trust_score >= 0.7 ? "bg-green-600" :
                slip.trust_score >= 0.4 ? "bg-orange-600" :
                "bg-red-600"
              )}
              style={{ width: `${slip.trust_score * 100}%` }}
            />
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-black/20 border border-green-100 dark:border-green-900/30">
          <span className="font-medium">สถานะ:</span>
          <Badge 
            variant={slip.is_likely_genuine ? "outline" : "destructive"}
            className={cn(
              "text-lg px-4 py-1.5",
              slip.is_likely_genuine && "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20"
            )}
          >
            {slip.is_likely_genuine ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                ✅ น่าเชื่อถือ
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-1" />
                🚨 น่าสงสัย
              </>
            )}
          </Badge>
        </div>
        
        {/* Detected Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-muted-foreground mb-1">ธนาคาร</p>
            <p className="font-bold text-blue-600 text-lg">
              {slip.detected_bank || "ไม่ระบุ"}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-muted-foreground mb-1">จำนวนเงิน</p>
            <p className="font-bold text-green-600 text-xl">
              {slip.detected_amount ? `฿${slip.detected_amount}` : "ไม่ระบุ"}
            </p>
          </div>
        </div>
        
        {/* Checks Passed */}
        {slip.checks && slip.checks.length > 0 && (
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <p className="font-medium text-sm text-blue-900 dark:text-blue-300">
                การตรวจสอบที่ผ่าน
              </p>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-400">
              {slip.checks.slice(0, 3).map((check, i) => (
                <li key={i}>{check}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Warnings */}
        {slip.warnings && slip.warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>พบความผิดปกติ</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {slip.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Advice */}
        {slip.advice && (
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-purple-900 dark:text-purple-300 mb-1">
                  💡 คำแนะนำ
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-400">
                  {slip.advice}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
