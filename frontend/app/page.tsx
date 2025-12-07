/* World-Class Design - Deployed on 2025-12-06 */
"use client";

import Link from "next/link";
import { ShieldCheck, Search, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { RecentActivityTicker } from "@/components/recent-activity-ticker";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      {/* Hero Section */}
      <AuroraBackground className="h-auto min-h-[60vh] py-20 px-4">
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-4 items-center justify-center px-4 md:px-10"
        >
          <Badge variant="outline" className="mb-6 py-2 px-5 text-sm font-semibold border-blue-700/20 bg-blue-700/10 text-blue-700 dark:text-blue-400 dark:border-blue-400/30 backdrop-blur-md rounded-full inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_theme(colors.blue.500)]" />
            พัฒนาโดยทีม AI Research
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 leading-[1.1] tracking-tight text-slate-900 dark:text-white font-heading text-center">
            รู้ทัน
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-teal-500 to-blue-600 animate-gradient"> มิจฉาชีพออนไลน์ </span>
          </h1>
          
          <div className="h-20 md:h-24 flex items-center justify-center w-full">
             <TypewriterEffectSmooth
                words={[
                  { text: "ตรวจ", className: "text-slate-900 dark:text-white" },
                  { text: "สอบ", className: "text-slate-900 dark:text-white" },
                  { text: "SMS", className: "text-blue-600 dark:text-blue-500" },
                  { text: "ได้", className: "text-slate-900 dark:text-white" },
                  { text: "ทัน", className: "text-slate-900 dark:text-white" },
                  { text: "ที", className: "text-slate-900 dark:text-white" },
                ]}
                className="text-2xl md:text-4xl lg:text-5xl font-bold font-prompt"
                cursorClassName="bg-blue-500"
             />
          </div>

          <p className="text-lg md:text-xl text-center text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            มั่นใจทุกการโอน ปลอดภัยทุกการคลิก ด้วยระบบ AI ภาษาไทยที่แม่นยำที่สุด
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
            <Link href="/check" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ring-4 ring-blue-600/20">
                <Search className="mr-2 h-5 w-5" />
                ตรวจสอบเลย Free
              </Button>
            </Link>
            <Link href="/report" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-14 text-lg font-bold rounded-2xl border-2 hover:bg-muted/50 transition-all duration-200">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                แจ้งเบาะแส
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
             animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-1/4 left-[10%] opacity-20 dark:opacity-40"
          >
             <ShieldCheck className="w-24 h-24 text-primary" />
             <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
          </motion.div>
          
           <motion.div
             animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
             transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
             className="absolute top-1/3 right-[10%] opacity-20 dark:opacity-40"
          >
             <AlertTriangle className="w-32 h-32 text-orange-500" />
          </motion.div>

          <motion.div
             animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
             transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
             className="absolute bottom-1/4 left-[20%] opacity-10 dark:opacity-20"
          >
             <Search className="w-16 h-16 text-cyan-500" />
          </motion.div>
        </div>
      </AuroraBackground>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tight text-slate-900 dark:text-white">ทำไมต้อง Thai Scam Detector?</h2>
            <p className="text-muted-foreground text-2xl max-w-3xl mx-auto leading-relaxed">เราใช้เทคโนโลยีล่าสุดเพื่อปกป้องคุณจากภัยไซเบอร์</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border-2 border-border bg-card">
              <CardContent className="pt-10 pb-10 px-10">
                <div className="mb-8 h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-700/10 to-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-10 w-10 text-blue-700" />
                </div>
                <h3 className="text-3xl font-black mb-6">แม่นยำด้วย AI</h3>
                <p className="text-muted-foreground leading-relaxed text-xl">
                  โมเดล AI ของเราถูกเทรนด้วยข้อมูล Scam ภาษาไทยกว่า 100,000 รายการ เข้าใจบริบทและคำทับศัพท์
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border-2 border-border bg-card">
              <CardContent className="pt-10 pb-10 px-10">
                <div className="mb-8 h-20 w-20 rounded-2xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-10 w-10 text-orange-500" />
                </div>
                <h3 className="text-3xl font-black mb-6">รู้ทันทุกรูปแบบ</h3>
                <p className="text-muted-foreground leading-relaxed text-xl">
                  ไม่ว่าจะเป็น SMS หลอกกู้เงิน, แก๊งคอลเซ็นเตอร์, เว็บพนัน หรือหลอกขายของออนไลน์
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border-2 border-border bg-card">
              <CardContent className="pt-10 pb-10 px-10">
                <div className="mb-8 h-20 w-20 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-3xl font-black mb-6">อัปเดตตลอดเวลา</h3>
                <p className="text-muted-foreground leading-relaxed text-xl">
                  ฐานข้อมูลของเราอัปเดตแบบ Real-time จากการแจ้งเบาะแสของผู้ใช้งานจริง
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Preview (Mock for now, will connect API later) */}
      <section className="py-20 md:py-32 border-t border-border/40">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 rounded-3xl bg-gradient-to-r from-primary/20 to-accent/20 p-8 md:p-12 border border-primary/20">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                พร้อมเริ่มต้นแล้วหรือยัง?
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                ใช้ฟรีไม่จำกัด ไม่ต้องสมัครสมาชิก
              </p>
              <Link href="/check">
                <Button variant="ghost" className="group mt-4 text-primary hover:text-primary/80 hover:bg-transparent p-0">
                  เริ่มตรวจสอบเลย
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="flex flex-col gap-8 text-center">
                <div>
                  <div className="text-7xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 mb-4">
                    98.5%
                  </div>
                  <div className="text-lg md:text-xl text-muted-foreground font-semibold">เคสที่ตรวจสอบแล้ว</div>
                </div>
                <div>
                  <div className="text-7xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-blue-600 mb-4">
                    98.5%
                  </div>
                  <div className="text-lg md:text-xl text-muted-foreground font-semibold">ความแม่นยำ AI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Social Proof Ticker */}
      <RecentActivityTicker />
    </div>
  );
}
