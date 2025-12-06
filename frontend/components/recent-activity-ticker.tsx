"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Activity } from "lucide-react";

interface ActivityItem {
  type: "report" | "check" | "stat";
  text: string;
  risk: "high" | "safe" | "neutral";
  time?: string;
}

const activities: ActivityItem[] = [
  { type: "report", text: "089-xxx-1234 ถูกรายงานเมื่อ 1 นาทีที่แล้ว (พนันออนไลน์)", risk: "high", time: "1 min ago" },
  { type: "check", text: "SMS 'คุณได้รับสิทธิ์...' ถูกระบุว่าเป็นอันตราย", risk: "high", time: "just now" },
  { type: "stat", text: "วันนี้ตรวจสอบไปแล้ว 1,420 เคส", risk: "neutral" },
  { type: "check", text: "092-xxx-5678 ปลอดภัย", risk: "safe", time: "2 mins ago" },
  { type: "report", text: "บัญชี นายสมชาย xxxx ถูกแจ้งว่าเป็นบัญชีม้า", risk: "high", time: "5 mins ago" },
  { type: "check", text: "ลิงก์ bit.ly/xxxx ถูกระบุว่าเป็น Phishing", risk: "high", time: "3 mins ago" },
  { type: "stat", text: "ระบบ AI อัปเดตฐานข้อมูลล่าสุดเมื่อ 10 นาทีที่แล้ว", risk: "neutral" },
];

export function RecentActivityTicker() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="bg-background/80 backdrop-blur-md border-t border-border/50 py-2.5 overflow-hidden pointer-events-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="relative flex items-center max-w-[100vw]">
            {/* Gradient masks for smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

          <motion.div
            className="flex gap-12 whitespace-nowrap pl-8"
            animate={shouldReduceMotion ? { x: 0 } : { x: [0, -1000] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 35, // Adjust speed here for readability
            }}
          >
            {/* Duplicate list 3 times to ensure seamless infinite scroll */}
            {[...activities, ...activities, ...activities].map((item, index) => (
              <div key={index} className="flex items-center gap-2.5 text-sm">
                {item.type === "report" && <ShieldAlert className="w-4 h-4 text-red-500" />}
                {item.type === "check" && item.risk === "high" && <ShieldAlert className="w-4 h-4 text-orange-500" />}
                {item.type === "check" && item.risk === "safe" && <ShieldCheck className="w-4 h-4 text-green-500" />}
                {item.type === "stat" && <Activity className="w-4 h-4 text-blue-500" />}
                
                <span className={`font-medium ${
                    item.risk === "high" ? "text-red-500 dark:text-red-400" : 
                    item.risk === "safe" ? "text-green-600 dark:text-green-400" : 
                    "text-muted-foreground"
                }`}>
                  {item.text}
                </span>
                
                {/* Separator */}
                <span className="text-muted-foreground/30 mx-2">|</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
