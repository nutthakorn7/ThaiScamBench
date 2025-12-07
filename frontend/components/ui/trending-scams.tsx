
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const trendingKeywords = [
  { text: "081-234-5678", type: "risk" },
  { text: "SMS กยศ", type: "risk" },
  { text: "งานออนไลน์ ได้เงินจริง", type: "safe" },
  { text: "เว็บพนัน แจกเครดิตฟรี", type: "risk" },
  { text: "คอลเซ็นเตอร์ อ้างเป็นตำรวจ", type: "risk" },
  { text: "ธนาคารออมสิน ปล่อยกู้", type: "safe" },
  { text: "J&T Express พัสดุตกค้าง", type: "risk" },
  { text: "รับสมัครคนกดออเดอร์", type: "risk" },
];

export function TrendingScams() {
  return (
    <section className="py-12 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
           <TrendingUp className="w-5 h-5 text-primary" />
           <h3 className="text-xl font-bold">กำลังถูกตรวจสอบบ่อย (Trending)</h3>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-start gap-3">
          {trendingKeywords.map((item, idx) => (
            <Link key={idx} href={`/wiki/${encodeURIComponent(item.text)}`}>
               <motion.div
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
               >
                  <Badge 
                    variant="secondary" 
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-border/50"
                  >
                    {item.type === 'risk' && <AlertTriangle className="w-3 h-3 mr-1 text-orange-500" />}
                    {item.text}
                  </Badge>
               </motion.div>
            </Link>
          ))}
          <Link href="/stats">
            <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-white transition-colors">
               ดูทั้งหมด &rarr;
            </Badge>
          </Link>
        </div>
      </div>
    </section>
  );
}
