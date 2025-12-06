/* World-Class Design - Deployed on 2025-12-06 */
"use client";

import Link from "next/link";
import { ShieldCheck, Search, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { RecentActivityTicker } from "@/components/recent-activity-ticker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
          <Badge variant="outline" className="mb-8 py-2 px-5 text-sm font-semibold border-primary/20 bg-primary/10 text-primary backdrop-blur-sm rounded-full inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            พัฒนาโดยทีม AI Research
          </Badge>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
            รู้ทันมิจฉาชีพออนไลน์
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%] animate-gradient">ด้วยพลัง AI อัจฉริยะ</span>
          </h1>
          
          <p className="text-lg md:text-xl text-center text-muted-foreground max-w-3xl mx-auto mb-14 leading-relaxed">
            ตรวจสอบข้อความ SMS, ลิงก์เว็บพนัน หรือเลขบัญชีต้องสงสัยได้ทันที<br className="hidden md:block" /> 
            ด้วยระบบประมวลผลภาษาธรรมชาติ (NLP) ที่แม่นยำที่สุดสำหรับภาษาไทย
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
            <Link href="/check" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary-hover shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200">
                <Search className="mr-2 h-5 w-5" />
                ตรวจสอบเลย
              </Button>
            </Link>
            <Link href="/report" className="w-full">
              <Button variant="outline" size="lg" className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 border-4 border-orange-300 hover:border-orange-200 text-white shadow-lg shadow-orange-500/20 backdrop-blur-sm transition-all duration-300">
                <AlertTriangle className="mr-2 h-5 w-5 text-white" />
                แจ้งเบาะแสใหม่
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
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">ทำไมต้อง Thai Scam Detector?</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">เราใช้เทคโนโลยีล่าสุดเพื่อปกป้องคุณจากภัยไซเบอร์</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-border bg-card">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">แม่นยำด้วย AI</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  โมเดล AI ของเราถูกเทรนด้วยข้อมูล Scam ภาษาไทยกว่า 100,000 รายการ เข้าใจบริบทและคำทับศัพท์
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="mb-4 h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">รู้ทันทุกรูปแบบ</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ไม่ว่าจะเป็น SMS หลอกกู้เงิน, แก๊งคอลเซ็นเตอร์, เว็บพนัน หรือหลอกขายของออนไลน์
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="mb-4 h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">อัปเดตตลอดเวลา</h3>
                <p className="text-muted-foreground leading-relaxed">
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
              <div className="flex flex-col gap-4 text-center">
                <div className="text-3xl md:text-5xl font-bold text-primary mb-2">98.5%</div>
                <div className="text-sm text-muted-foreground">เคสที่ตรวจสอบแล้ว</div>
              </div>
              <div>
                <div className="text-3xl md:text-5xl font-bold text-blue-400 mb-2">98.5%</div>
                <div className="text-sm text-muted-foreground">ความแม่นยำ AI</div>
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
