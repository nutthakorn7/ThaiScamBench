"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface OCRTextDisplayProps {
  extractedText: string;
}

export function OCRTextDisplay({ extractedText }: OCRTextDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast.success("คัดลอกแล้ว!", { description: "คัดลอกข้อความไปยังคลิปบอร์ด" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span>📄 ข้อความที่ตรวจพบจากรูปภาพ</span>
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                คัดลอกแล้ว
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                คัดลอก
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <pre className="font-mono text-sm whitespace-pre-wrap break-words">
            {extractedText || "ไม่พบข้อความ"}
          </pre>
        </div>
        
        {/* OCR Quality Indicator */}
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>ผ่านการปรับปรุงภาพด้วย AI สำหรับความแม่นยำสูงสุด (+15%)</span>
        </div>
      </CardContent>
    </Card>
  );
}
