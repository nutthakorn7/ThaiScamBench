import Link from "next/link";
import { ShieldCheck, Search, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
        <div className="container px-4 mx-auto relative z-10 text-center">
          <Badge variant="outline" className="mb-6 py-1.5 px-4 text-sm font-medium border-blue-500/30 bg-blue-500/10 text-blue-400 backdrop-blur-sm rounded-full">
            ✨ AI-Powered Scam Detection System
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            รู้ทันทุกกลโกง<br />
            <span className="text-blue-500">ด้วยพลัง AI อัจฉริยะ</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            ตรวจสอบข้อความ SMS, ลิงก์เว็บพนัน หรือเลขบัญชีต้องสงสัยได้ทันที 
            ด้วยระบบประมวลผลภาษาธรรมชาติ (NLP) ที่แม่นยำที่สุดสำหรับภาษาไทย
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            <Link href="/check" className="w-full">
              <Button size="lg" className="w-full h-12 text-base font-medium shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)] transition-shadow">
                <Search className="mr-2 h-5 w-5" />
                ตรวจสอบเลย
              </Button>
            </Link>
            <Link href="/report" className="w-full">
              <Button variant="outline" size="lg" className="w-full h-12 text-base font-medium bg-secondary/50 border-secondary hover:bg-secondary/70">
                <AlertTriangle className="mr-2 h-5 w-5" />
                แจ้งเบาะแสใหม่
              </Button>
            </Link>
          </div>
        </div>

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[128px]" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-secondary/20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ทำไมต้อง Thai Scam Detector?</h2>
            <p className="text-muted-foreground text-lg">เราใช้เทคโนโลยีล่าสุดเพื่อปกป้องคุณจากภัยไซเบอร์</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="mb-4 h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">แม่นยำด้วย AI</h3>
                <p className="text-muted-foreground leading-relaxed">
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 rounded-3xl bg-gradient-to-r from-blue-900/20 to-cyan-900/20 p-8 md:p-12 border border-blue-500/20">
            <div className="space-y-4 max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                ร่วมเป็นส่วนหนึ่งในการหยุดยั้งมิจฉาชีพ
              </h2>
              <p className="text-lg text-muted-foreground">
                การแจ้งเบาะแสของคุณเพียง 1 ครั้ง อาจช่วยป้องกันคนไทยได้นับพันคน
              </p>
              <Link href="/stats">
                <Button variant="ghost" className="group mt-4 text-blue-400 hover:text-blue-300 hover:bg-transparent p-0">
                  ดูสถิติทั้งหมด <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-5xl font-bold text-white mb-2">12.5k+</div>
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
    </div>
  );
}
