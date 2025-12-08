"use client";

import { ShieldAlert, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DetectionResponse } from "@/lib/api";
import Confetti from "react-confetti";
import { useState, useEffect } from "react";

// New component imports
import { ForensicsCard } from "./ForensicsCard";
import { SlipVerificationCard } from "./SlipVerificationCard";
import { OCRTextDisplay } from "./OCRTextDisplay";

interface DetectionResultProps {
  result: DetectionResponse | null;
  setFeedbackOpen: (open: boolean) => void;
}

// ... imports same
// removed duplicate motion import here

export function DetectionResult({ result, setFeedbackOpen }: DetectionResultProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (result) {
      if (result.risk_score < 0.4) {
        // Delay slightly to avoid render loop and sync with animation
        const showTimer = setTimeout(() => setShowConfetti(true), 500);
        const hideTimer = setTimeout(() => setShowConfetti(false), 5500);
        return () => {
          clearTimeout(showTimer);
          clearTimeout(hideTimer);
        };
      }
    }
  }, [result]);

  useEffect(() => {
    const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    // Initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!result) return null;

  const isHighRisk = result.risk_score >= 0.7;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn("mt-8 relative", isHighRisk ? "animate-shake" : "")}
    >
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.15}
          />
        </div>
      )}
      
      {/* High Risk Overlay Pulse */}
      {isHighRisk && (
        <div className="absolute -inset-4 bg-red-500/10 rounded-3xl blur-2xl animate-pulse pointer-events-none z-0" />
      )}

      <Card
        className={cn(
          "glass-card overflow-hidden border-2 duration-500 relative z-10",
          result.risk_score >= 0.7
            ? "border-red-500/50 bg-red-500/5 shadow-[0_0_30px_-10px_rgba(220,38,38,0.3)]"
            : result.risk_score >= 0.4
            ? "border-orange-500/50 bg-orange-500/5 shadow-[0_0_30px_-10px_rgba(234,88,12,0.3)]"
            : "border-green-500/50 bg-green-500/5 shadow-[0_0_30px_-10px_rgba(22,163,74,0.3)]"
        )}
      >
        <CardHeader className="pb-8 pt-10">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* HUGE Icon */}
            <motion.div variants={item}
              className={cn(
                "text-9xl font-black drop-shadow-2xl filter",
                result.risk_score >= 0.7
                  ? "text-red-600"
                  : result.risk_score >= 0.4
                  ? "text-orange-600"
                  : "text-green-600"
              )}
            >
              {result.risk_score >= 0.7
                ? "⚠️"
                : result.risk_score >= 0.4
                ? "⚠"
                : "✓"}
            </motion.div>

            {/* Big Status */}
            <motion.div variants={item}>
              <h2
                className={cn(
                  "text-5xl md:text-6xl font-black mb-4 font-heading tracking-tight",
                  result.risk_score >= 0.7
                    ? "text-red-600"
                    : result.risk_score >= 0.4
                    ? "text-orange-600"
                    : "text-green-600"
                )}
              >
                {result.risk_score >= 0.7
                  ? "ระวัง! ความเสี่ยงสูง"
                  : result.risk_score >= 0.4
                  ? "ควรระวัง"
                  : "ปลอดภัย"}
              </h2>
              <div className="flex items-center justify-center gap-4">
                <div
                  className={cn(
                    "text-7xl md:text-8xl font-black font-heading",
                    result.risk_score >= 0.7
                      ? "text-red-600"
                      : result.risk_score >= 0.4
                      ? "text-orange-600"
                      : "text-green-600"
                  )}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                  >
                     {(result.risk_score * 100).toFixed(0)}%
                  </motion.span>
                </div>
                <div className="text-left">
                  <p className="text-xl font-semibold text-muted-foreground font-sans">
                    ความเสี่ยง
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <motion.div variants={item} className="space-y-6">
             {/* ... content remains similar but wrapped in variants ... */}
            <div className="p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/10 backdrop-blur-sm">
              <h4 className="font-bold mb-3 text-lg flex items-center gap-2">
                {result.risk_score >= 0.7 ? (
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                ) : result.risk_score >= 0.4 ? (
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )}
                ผลวิเคราะห์ AI:
              </h4>
              <p className="leading-relaxed text-lg font-medium text-foreground/90">
                {result.reason ||
                  result.reasoning ||
                  "ระบบตรวจพบรูปแบบข้อความที่สอดคล้องกับฐานข้อมูล Scam"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant={result.risk_score >= 0.7 ? "destructive" : "outline"}
                className={cn(
                  "text-base px-4 py-1.5 rounded-full font-bold",
                  result.risk_score < 0.7 && result.risk_score >= 0.4
                    ? "border-orange-500 text-orange-500 bg-orange-500/10"
                    : result.risk_score < 0.4
                    ? "border-green-500 text-green-500 bg-green-500/10"
                    : ""
                )}
              >
                Score: {Math.round(result.risk_score * 100)}%
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackOpen(true)}
                className="gap-2 rounded-full hover:bg-muted/50"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">แจ้งเบาะแส</span>
              </Button>

              <Button
                variant="default" // Primary action
                size="sm"
                onClick={async () => {
                  const shareData = {
                    title: 'Warning - ThaiScamBench',
                    text: `⚠️ เตือนภัย! ฉันเพิ่งตรวจสอบข้อความนี้: "${result.risk_score >= 0.7 ? 'เสี่ยงสูง 🚨' : 'ปลอดภัย ✅'}" เช็คข้อความของคุณที่นี่:`,
                    url: `https://thaiscam.zcr.ai?title=${encodeURIComponent(result.risk_score >= 0.7 ? 'เตือนภัยมิจฉาชีพ! 🚨' : 'ปลอดภัย ✅')}&variant=${result.risk_score >= 0.7 ? 'scam' : 'safe'}`,
                  };

                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                    } else {
                      throw new Error("Web Share API not supported");
                    }
                  } catch (err) {
                    // Fallback: Copy to clipboard
                    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                    // You might want to use a toast here if you have one, or just alert/console
                    // Since we have 'sonner' installed (checked package.json previously or in layout), let's try to import toast or just use native alert for now to be safe, or assumes user can see it's copied.
                    // Actually, let's just use a simple console log + UI feedback if possible.
                    // Given we can't easily add a Toast hook imports here without checking, 
                    // I will trust the user testing it or add a simple browser alert or better yet, assume 'sonner' is available as seen in layout.tsx
                    // Wait, I can't see import for 'sonner' in this file. I'll stick to clipboard write.
                    // Let's add an alert for clarity if this is a raw implementation.
                    // Or better, just relying on the fact it's copied.
                    console.log("Copied to clipboard instead");
                    alert("คัดลอกลิงก์เรียบร้อยแล้ว! (Copied to clipboard)");
                  }
                }}
                className={cn(
                  "gap-2 rounded-full text-white shadow-lg transition-all hover:scale-105",
                  result.risk_score >= 0.7 
                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" 
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                )}
              >
                <span className="text-lg">📢</span>
                <span className="font-bold">เตือนเพื่อน</span>
              </Button>
            </div>
          </motion.div>

          <motion.div variants={item} className="space-y-4">
             {/* ... details ... */}
            {result.risk_score >= 0.4 && (
              <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-6 rounded-2xl">
                <h4 className="font-bold mb-3 text-lg text-red-700 dark:text-red-400">
                  ⚠️ คำแนะนำด่วน:
                </h4>
                <ul className="list-disc list-inside space-y-2 text-base font-medium text-foreground/80">
                  <li>ห้ามโอนเงินเด็ดขาด</li>
                  <li>ห้ามกดลิงก์ใดๆ ที่แนบมา</li>
                  <li>บล็อกเบอร์โทรหรือบัญชีผู้ใช้นั้นทันที</li>
                  <li>
                    หากหลงเชื่อโอนเงินไปแล้ว ให้รีบแจ้งธนาคารและแจ้งความออนไลน์ที่{" "}
                    <a
                      href="https://thaipoliceonline.com"
                      target="_blank"
                      className="text-blue-600 hover:underline font-bold"
                    >
                      thaipoliceonline.com
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* OCR Text Display */}
      {result.extracted_text && (
        <motion.div variants={item}>
          <OCRTextDisplay extractedText={result.extracted_text} />
        </motion.div>
      )}

      {/* Forensics Card */}
      {result.forensics && (
        <motion.div variants={item}>
          <ForensicsCard forensics={result.forensics} />
        </motion.div>
      )}

      {/* Slip Verification */}
      {result.slip_verification && (
        <motion.div variants={item}>
          <SlipVerificationCard slip={result.slip_verification} />
        </motion.div>
      )}
    </motion.div>
  );
}
