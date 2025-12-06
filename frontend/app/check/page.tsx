"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, AlertTriangle, Loader2, Copy, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { detectScam, type DetectionResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import dynamic from 'next/dynamic';
// ... other imports

const FeedbackDialog = dynamic(() => import('@/components/FeedbackDialog').then(mod => mod.FeedbackDialog), {
  loading: () => null,
  ssr: false
});

export default function CheckPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [inputError, setInputError] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
      
      // Add Haptic Feedback for Mobile (vibration pattern)
      if (data.is_scam && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

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
    <div className="container px-4 py-8 md:py-12 mx-auto max-w-4xl">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-5xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white">
          ตรวจสอบความเสี่ยง
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
          ใส่ข้อความ SMS, ลิงก์, หรือเลขบัญชีที่น่าสงสัย เพื่อให้ AI ช่วยวิเคราะห์ความปลอดภัย
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 shadow-lg shadow-primary/5 backdrop-blur-sm bg-card/60">
            <CardContent className="pt-6">
              <form onSubmit={handleCheck} className="space-y-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <Textarea
                    placeholder="วางข้อความ SMS, ลิงก์เว็บพนัน, หรือเลขบัญชีที่ต้องการตรวจสอบ..."
                    value={input}
                    onChange={(e) => {
                       setInput(e.target.value);
                       setInputError("");
                    }}
                    className={cn(
                      "relative flex min-h-48 w-full resize-none rounded-2xl border-2 bg-white dark:bg-slate-900 px-6 py-5 text-lg ring-offset-background placeholder:text-muted-foreground transition-all duration-200 shadow-sm",
                      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 focus-visible:border-blue-600",
                      inputError && "border-red-500 focus-visible:ring-red-500/20",
                      !inputError && "border-gray-200 dark:border-gray-700"
                    )}
                    rows={8}
                  />
                </div>
                {inputError && (
                  <p className="text-sm text-red-500 mt-1">{inputError}</p>
                )}
                 <p className="text-xs text-muted-foreground mt-2 flex justify-between items-center">
                   <span>{input.length} ตัวอักษร {input.length >= 5 ? "✓" : "(อย่างน้อย 5)"}</span>
                   <button
                     type="button"
                     onClick={() => {
                        const SCAM_EXAMPLES = [
                            "ยินดีด้วย! คุณได้รับสิทธิ์กู้เงิน 50,000 บาท ดอกเบี้ยต่ำ คลิกเลย bit.ly/fake-loan",
                            "ธ.กสิกร แจ้งบัญชีของท่านมีความเสี่ยง โปรดยืนยันตัวตนที่ kbank-security-update.com",
                            "รับสมัครคนกดไลค์สินค้า รายได้วันละ 300-3000 บาท แอดไลน์ @scammer99",
                            "พัสดุของท่านตกค้าง กรุณาชำระภาษี 50 บาท เพื่อนำจ่าย คลิก th-post-track.vip",
                            "098-765-4321",
                            "123-4-56789-0"
                        ];
                        const randomExample = SCAM_EXAMPLES[Math.floor(Math.random() * SCAM_EXAMPLES.length)];
                        setInput(randomExample);
                        setInputError("");
                     }}
                     className="text-primary hover:text-primary/80 hover:underline cursor-pointer py-1 px-2 rounded hover:bg-primary/10 transition-colors"
                   >
                     🎲 ลองดูตัวอย่าง
                   </button>
                 </p>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full px-10 py-6 text-xl font-semibold rounded-xl bg-blue-700 hover:bg-blue-800 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading || input.trim().length < 5}
                >
                  {loading ? (
                     <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Search className="mr-2 h-5 w-5" />
                  )}
                  {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบความเสี่ยง"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2"
              >
                <AnimatedProgress />
              </motion.div>
            )}
          </AnimatePresence>
      
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-bottom-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
            <Card className={cn(
          "overflow-hidden border-2 duration-500",
          result.risk_score >= 0.7 ? "border-red-500/50 bg-red-500/5" :
          result.risk_score >= 0.4 ? "border-orange-500/50 bg-orange-500/5" :
          "border-green-500/50 bg-green-500/5"
        )}>

          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                {result.risk_score >= 0.7 ? <ShieldAlert className="text-red-500 h-6 w-6" /> :
                 result.risk_score >= 0.4 ? <AlertTriangle className="text-orange-500 h-6 w-6" /> :
                 <CheckCircle2 className="text-green-500 h-6 w-6" />}
                ผลการวิเคราะห์: 
                <span className={cn(
                  "font-bold",
                  result.risk_score >= 0.7 ? "text-red-500" :
                  result.risk_score >= 0.4 ? "text-orange-500" :
                  "text-green-500"
                )}>
                  {result.risk_level}
                </span>
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Badge variant={result.risk_score >= 0.7 ? "destructive" : "outline"} className={cn(
                  "text-base px-3 py-1",
                   result.risk_score < 0.7 && result.risk_score >= 0.4 ? "border-orange-500 text-orange-500 bg-orange-500/10" :
                   result.risk_score < 0.4 ? "border-green-500 text-green-500 bg-green-500/10" : ""
                )}>
                  Score: {Math.round(result.risk_score * 100)}%
                </Badge>
                
                <Button variant="outline" size="sm" onClick={() => setFeedbackOpen(true)} className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">แจ้งเบาะแส/รายงาน</span>
                </Button>
              </div>
            </div>
            <CardDescription className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>ผลการวิเคราะห์โดย AI (เวอร์ชันทดสอบ)</span>
              <span className="font-mono opacity-50">Ref: {result.request_id}</span>
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
        </motion.div>
      )}

      {/* Feedback Dialog */}
      {result && (
        <FeedbackDialog
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          requestId={result.request_id}
        />
      )}
      </div>
      </div>
    </div>
  );
}
