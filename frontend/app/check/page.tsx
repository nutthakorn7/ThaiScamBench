"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { detectScam, type DetectionResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function CheckPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState("");

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      console.log('[DEBUG] Calling detectScam API...');
      const data = await detectScam({ text: input });
      console.log('[DEBUG] API response:', data);
      setResult(data);
    } catch (err) {
      console.error('[ERROR] API call failed:', err);
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง");
      console.error(err);
    } finally {
      setLoading(false);
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
          <form onSubmit={handleCheck} className="flex gap-4">
            <Input
              placeholder="วางข้อความ, ลิงก์ หรือเลขบัญชีที่นี่..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-12 text-lg"
            />
            <Button type="submit" size="lg" className="h-12 px-8" disabled={loading}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" /> ตรวจสอบ
                </>
              )}
            </Button>
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
          result.risk_level === 'high_risk' ? "border-red-500/50 bg-red-500/5" :
          result.risk_level === 'suspicious' ? "border-orange-500/50 bg-orange-500/5" :
          "border-green-500/50 bg-green-500/5"
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                {result.risk_level === 'high_risk' ? (
                  <>
                    <ShieldAlert className="h-6 w-6 text-red-500" />
                    <span className="text-red-500">อันตราย! พบความเสี่ยงสูง</span>
                  </>
                ) : result.risk_level === 'suspicious' ? (
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
              <Badge variant={
                result.risk_level === 'high_risk' ? "destructive" :
                result.risk_level === 'suspicious' ? "secondary" : 
                "default" // shadcn badge default is primary (black/white), maybe add distinct green later
              } className={cn(
                "text-sm px-3 py-1",
                result.risk_level === 'safe' && "bg-green-500 hover:bg-green-600 border-transparent text-white"
              )}>
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </Badge>
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
                  {result.reasoning || "ระบบตรวจพบรูปแบบข้อความที่สอดคล้องกับฐานข้อมูล Scam (เช่น การเร่งรัดให้โอนเงิน, ลิงก์ปลอม, หรือบัญชีม้า)"}
                </p>
              </div>
              
              {result.risk_level !== 'safe' && (
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
