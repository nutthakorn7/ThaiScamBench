"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, AlertTriangle, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { detectScam, type DetectionResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CheckPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [inputError, setInputError] = useState("");

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    if (!input.trim()) {
      setInputError("กรุณาใส่ข้อความที่ต้องการตรวจสอบ");
      return;
    }
    
    if (input.trim().length < 5) {
      setInputError("ข้อความต้องมีอย่างน้อย 5 ตัวอักษร");
      return;
    }

    setInputError("");
    setLoading(true);
    setError("");
    setResult(null);
    setLoadingMessage("กำลังวิเคราะห์...");

    // Simulate progress
    setTimeout(() => setLoadingMessage("เกือบเสร็จแล้ว..."), 1000);

    try {
      console.log('[DEBUG] Calling detectScam API...');
      const data = await detectScam({ text: input });
      console.log('[DEBUG] API response:', data);
      setResult(data);
      
      // Success toast
      if (data.risk_score >= 0.7) {
        toast.error("พบความเสี่ยงสูง!", { description: "โปรดระวังข้อความนี้" });
      } else if (data.risk_score >= 0.4) {
        toast.warning("น่าสงสัย", { description: "ควรตรวจสอบเพิ่มเติม" });
      } else {
        toast.success("ปลอดภัย", { description: "ไม่พบสัญญาณเสี่ยง" });
      }
    } catch (err) {
      console.error('[ERROR] API call failed:', err);
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง");
      toast.error("เกิดข้อผิดพลาด", { description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์" });
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    
    const textToCopy = `ผลการตรวจสอบ ThaiScamDetector
คะแนนความเสี่ยง: ${(result.risk_score * 100).toFixed(1)}%
ประเภท: ${result.category}
เหตุผล: ${result.reason || result.reasoning || "ไม่มีข้อมูล"}
Request ID: ${result.request_id}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("คัดลอกแล้ว!", { description: "คัดลอกผลลัพธ์ไปยังคลิปบอร์ด" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("ไม่สามารถคัดลอกได้", { description: "กรุณาลองอีกครั้ง" });
    }
  };

  return (
    <div className="container px-4 py-12 mx-auto max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">ตรวจสอบความเสี่ยง</h1>
        <p className="text-muted-foreground">
          กรอกข้อความ SMS, ลิงก์เว็บไซต์ หรือเลขบัญชีธนาคาร เพื่อให้ AI ช่วยวิเคราะห์
        </p>
      </div>

      <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5 mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleCheck} className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="วางข้อความ, ลิงก์ หรือเลขบัญชีที่นี่..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setInputError("");
                  }}
                  className={cn(
                    "h-12 text-lg",
                    inputError && "border-red-500 focus-visible:ring-red-500"
                  )}
                  disabled={loading}
                />
                {inputError && (
                  <p className="text-sm text-red-500 mt-1">{inputError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {input.length} ตัวอักษร {input.length >= 5 ? "✓" : "(อย่างน้อย 5)"}
                </p>
              </div>
              <Button type="submit" size="lg" className="h-12 px-8" disabled={loading || input.trim().length < 5}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">{loadingMessage}</span>
                  </div>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" /> ตรวจสอบ
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-8 animate-in fade-in slide-in-from-bottom-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className={cn(
          "overflow-hidden border-2 animate-in fade-in slide-in-from-bottom-8 duration-500",
          result.risk_score >= 0.7 ? "border-red-500/50 bg-red-500/5" :
          result.risk_score >= 0.4 ? "border-orange-500/50 bg-orange-500/5" :
          "border-green-500/50 bg-green-500/5"
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                {result.risk_score >= 0.7 ? (
                  <>
                    <ShieldAlert className="h-6 w-6 text-red-500" />
                    <span className="text-red-500">อันตราย! พบความเสี่ยงสูง</span>
                  </>
                ) : result.risk_score >= 0.4 ? (
                  <>
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                    <span className="text-orange-500">น่าสงสัย! โปรดระวัง</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-6 w-6 text-green-500" />
                    <span className="text-green-500">ปลอดภัย</span>
                  </>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={
                  result.risk_score >= 0.7 ? "destructive" :
                  result.risk_score >= 0.4 ? "secondary" : 
                  "default"
                } className={cn(
                  "text-sm px-3 py-1",
                  result.risk_score < 0.4 && "bg-green-500 hover:bg-green-600 border-transparent text-white"
                )}>
                  Risk Score: {(result.risk_score * 100).toFixed(1)}%
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      คัดลอก
                    </>
                  )}
                </Button>
              </div>
            </div>
            <CardDescription>
              ผลการวิเคราะห์โดย AI (Request ID: <span className="font-mono text-xs">{result.request_id}</span>)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <h4 className="font-medium mb-2 text-sm text-muted-foreground">เหตุผลการวิเคราะห์:</h4>
                <p className="leading-relaxed">
                  {result.reason || result.reasoning || "ระบบตรวจพบรูปแบบข้อความที่สอดคล้องกับฐานข้อมูล Scam"}
                </p>
              </div>
              
              {result.risk_score >= 0.4 && (
                <div className="bg-background/50 border border-border/50 p-4 rounded-lg">
                   <h4 className="font-medium mb-2 text-sm text-muted-foreground">คำแนะนำ:</h4>
                   <ul className="list-disc list-inside space-y-1 text-sm">
                     <li>ห้ามโอนเงินเด็ดขาด</li>
                     <li>ห้ามกดลิงก์ใดๆ ที่แนบมา</li>
                     <li>บล็อกเบอร์โทรหรือบัญชีผู้ใช้นั้นทันที</li>
                     <li>หากหลงเชื่อโอนเงินไปแล้ว ให้รีบแจ้งธนาคารและแจ้งความออนไลน์ที่ <a href="https://thaipoliceonline.com" target="_blank" className="text-blue-500 hover:underline">thaipoliceonline.com</a></li>
                   </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
