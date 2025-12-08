"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Zap, FileCode, FileImage, Copy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForensicsData {
  enabled: boolean;
  is_manipulated: boolean;
  confidence: number;
  manipulation_type?: string;
  details?: string;
  techniques: {
    ela: {
      suspicious: boolean;
      score: number;
      variance: number;
      reason: string;
    };
    metadata: {
      tampered: boolean;
      confidence: number;
      editing_software?: string[];
      issues?: string[];
    };
    compression: {
      edited: boolean;
      confidence: number;
      estimated_saves: number;
      reason: string;
    };
    cloning: {
      detected: boolean;
      confidence: number;
      clone_regions: number;
      reason: string;
    };
  };
}

interface ForensicsCardProps {
  forensics: ForensicsData;
}

export function ForensicsCard({ forensics }: ForensicsCardProps) {
  if (!forensics?.enabled) return null;

  return (
    <Card className="mt-4 border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <span>🔬 การตรวจสอบความถูกต้องของรูปภาพ</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-black/20 border border-purple-100 dark:border-purple-900/30">
          <span className="font-medium">สถานะรูปภาพ:</span>
          <Badge 
            variant={forensics.is_manipulated ? "destructive" : "outline"}
            className={cn(
              "text-base px-4 py-1.5",
              !forensics.is_manipulated && "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20"
            )}
          >
            {forensics.is_manipulated ? "🚨 ถูกแก้ไข" : "✅ ต้นฉบับ"}
          </Badge>
        </div>
        
        {/* Confidence Score */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-black/20 border border-purple-100 dark:border-purple-900/30">
          <span className="font-medium">ความมั่นใจ:</span>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all",
                  forensics.confidence >= 0.7 ? "bg-red-600" :
                  forensics.confidence >= 0.4 ? "bg-orange-600" :
                  "bg-green-600"
                )}
                style={{ width: `${forensics.confidence * 100}%` }}
              />
            </div>
            <span className="text-2xl font-bold text-purple-600">
              {(forensics.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        
        {/* Manipulation Type */}
        {forensics.manipulation_type && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              ประเภท: <span className="font-bold">{forensics.manipulation_type}</span>
            </p>
          </div>
        )}
        
        {/* Techniques Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ELA */}
          <div className="p-4 rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-sm">ตรวจการบีบอัดภาพ (ELA)</span>
            </div>
            <p className={cn(
              "text-xs mb-2",
              forensics.techniques.ela.suspicious ? "text-red-600" : "text-green-600"
            )}>
              {forensics.techniques.ela.suspicious ? "⚠️ พบความผิดปกติ" : "✅ ปกติ"}
            </p>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500" 
                style={{width: `${forensics.techniques.ela.score * 100}%`}}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Variance: {forensics.techniques.ela.variance.toFixed(1)}
            </p>
          </div>
          
          {/* Metadata */}
          <div className="p-4 rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">ตรวจข้อมูลจำเพาะ (Metadata)</span>
            </div>
            <p className={cn(
              "text-xs mb-2",
              forensics.techniques.metadata.tampered ? "text-red-600" : "text-green-600"
            )}>
              {forensics.techniques.metadata.tampered ? "⚠️ ถูกแก้ไข" : "✅ ต้นฉบับ"}
            </p>
            {forensics.techniques.metadata.editing_software && forensics.techniques.metadata.editing_software.length > 0 && (
              <p className="text-xs text-red-600 font-medium mt-1">
                โปรแกรม: {forensics.techniques.metadata.editing_software.join(", ")}
              </p>
            )}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-blue-500" 
                style={{width: `${forensics.techniques.metadata.confidence * 100}%`}}
              />
            </div>
          </div>
          
          {/* Compression */}
          <div className="p-4 rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <FileImage className="w-4 h-4 text-green-600" />
              <span className="font-medium text-sm">ตรวจการบันทึกซ้ำ</span>
            </div>
            <p className={cn(
              "text-xs mb-2",
              forensics.techniques.compression.edited ? "text-orange-600" : "text-green-600"
            )}>
              บันทึก: ~{forensics.techniques.compression.estimated_saves} ครั้ง
            </p>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{width: `${forensics.techniques.compression.confidence * 100}%`}}
              />
            </div>
          </div>
          
          {/* Cloning */}
          <div className="p-4 rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Copy className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-sm">ตรวจการคัดลอกจุดภาพ</span>
            </div>
            <p className={cn(
              "text-xs mb-2",
              forensics.techniques.cloning.detected ? "text-red-600" : "text-green-600"
            )}>
              {forensics.techniques.cloning.detected ? "⚠️ พบการคัดลอก" : "✅ ไม่พบ"}
            </p>
            {forensics.techniques.cloning.clone_regions > 0 && (
              <p className="text-xs text-orange-600 font-medium">
                พื้นที่: {forensics.techniques.cloning.clone_regions}
              </p>
            )}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-orange-500" 
                style={{width: `${forensics.techniques.cloning.confidence * 100}%`}}
              />
            </div>
          </div>
        </div>
        
        {/* Details */}
        {forensics.details && (
          <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/30">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900 dark:text-purple-300">รายละเอียด</AlertTitle>
            <AlertDescription className="text-purple-800 dark:text-purple-400">
              {forensics.details}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
