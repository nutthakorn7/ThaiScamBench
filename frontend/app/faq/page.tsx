"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Zap,
  CreditCard,
  Settings,
  Lock,
} from "lucide-react";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { toast } from "sonner";

type FAQCategory = "all" | "general" | "howto" | "api" | "billing" | "technical" | "privacy";

interface FAQItem {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  // General Questions
  {
    id: "g1",
    category: "general",
    question: "ThaiScamDetector คืออะไร?",
    answer: "ThaiScamDetector เป็นระบบตรวจสอบการหลอกลวงออนไลน์ด้วยเทคโนโลยี AI ที่ช่วยวิเคราะห์ข้อความ SMS, ลิงก์, และเลขบัญชีธนาคารที่น่าสงสัย เพื่อให้คุณรู้ทันภัยและป้องกันการถูกหลอกลวง"
  },
  {
    id: "g2",
    category: "general",
    question: "บริการนี้ฟรีหรือเสียเงิน?",
    answer: "การใช้งานพื้นฐาน (ตรวจสอบข้อความ, ดูสถิติ, รายงานเบาะแส) ฟรี 100%! มีบริการ Partner API สำหรับองค์กรที่ต้องการใช้งานในระดับสูง ซึ่งมีค่าบริการ"
  },
  {
    id: "g3",
    category: "general",
    question: "ข้อมูลของฉันปลอดภัยไหม?",
    answer: "ปลอดภัยมากครับ! เราไม่เก็บข้อมูลส่วนบุคคลที่ละเอียดอ่อน และมีนโยบายความเป็นส่วนตัวที่สอดคล้องกับ PDPA เก็บข้อความที่ตรวจสอบไม่เกิน 90 วัน และเข้ารหัสข้อมูลทั้งหมด"
  },
  {
    id: "g4",
    category: "general",
    question: "ทำไมต้องใช้ ThaiScamDetector?",
    answer: "เพราะการหลอกลวงออนไลน์เพิ่มขึ้นทุกวัน! ระบบเราช่วยให้คุณตรวจสอบได้ทันที ก่อนที่จะตกเป็นเหยื่อ ด้วย AI ที่เรียนรู้รูปแบบการหลอกลวงใหม่ๆ อยู่เสมอ"
  },

  // How to Use
  {
    id: "h1",
    category: "howto",
    question: "ใช้งานอย่างไร?",
    answer: "ง่ายมาก! 1) ไปที่หน้า 'ตรวจสอบความเสี่ยง' 2) วางข้อความหรือลิงก์ที่สงสัย 3) กดปุ่ม 'ตรวจสอบ' 4) ดูผลลัพธ์และคะแนนความเสี่ยง ใช้เวลาไม่ถึง 10 วินาที!"
  },
  {
    id: "h2",
    category: "howto",
    question: "สามารถตรวจสอบอะไรได้บ้าง?",
    answer: "ตรวจสอบได้หลายอย่าง: ข้อความ SMS ที่น่าสงสัย, ลิงก์เว็บไซต์ที่อาจเป็นภัย, เลขบัญชีธนาคาร, ข้อความที่อ้างว่าได้รางวัล, ข้อความขอเงิน, และอื่นๆ อีกมากมาย"
  },
  {
    id: "h3",
    category: "howto",
    question: "ผลลัพธ์หมายความว่าอย่างไร?",
    answer: "คะแนนความเสี่ยง 0-30% = ปลอดภัย (เขียว), 31-70% = ระวัง (เหลือง), 71-100% = อันตราย (แดง). เรายังแสดงประเภทการหลอกลวง เหตุผล และคำแนะนำเพิ่มเติมด้วย"
  },
  {
    id: "h4",
    category: "howto",
    question: "ถ้าเจอการหลอกลวงควรทำอย่างไร?",
    answer: "1) อย่าโอนเงินหรือให้ข้อมูลส่วนตัว 2) ใช้ฟีเจอร์ 'รายงานเบาะแส' ของเรา 3) แจ้งความที่สถานีตำรวจ 4) แจ้งธนาคาร (ถ้าเกี่ยวข้อง) 5) แชร์ให้คนอื่นระวัง"
  },
  {
    id: "h5",
    category: "howto",
    question: "มีแอป mobile ไหม?",
    answer: "ตอนนี้ยังไม่มีแอป แต่เว็บไซต์รองรับ mobile ได้ดีมาก! สามารถเข้าใช้ผ่านเบราว์เซอร์บนมือถือได้เลย และทำงานเหมือนแอปทุกประการ"
  },

  // API Questions
  {
    id: "a1",
    category: "api",
    question: "API คืออะไร?",
    answer: "API (Application Programming Interface) คือบริการที่ให้องค์กรหรือนักพัฒนานำระบบตรวจสอบการหลอกลวงของเราไปใช้ในเว็บไซต์หรือแอปของตัวเอง โดยเชื่อมต่อผ่านโปรแกรม"
  },
  {
    id: "a2",
    category: "api",
    question: "ต้องทำอย่างไรถึงจะใช้ API ได้?",
    answer: "1) สมัครบัญชี Partner ที่หน้า Partner Login 2) ติดต่อทีมงานเพื่อขอ API Key 3) เลือกแพ็กเกจที่เหมาะสม 4) อ่าน API Documentation 5) เริ่มใช้งานได้เลย!"
  },
  {
    id: "a3",
    category: "api",
    question: "มี Rate Limit อย่างไร?",
    answer: "แตกต่างกันตามแพ็กเกจ: Starter = 1,000 requests/day, Professional = 10,000/day, Enterprise = Unlimited. มีระบบ queue สำหรับ request ที่เกินจำนวน"
  },
  {
    id: "a4",
    category: "api",
    question: "API มีภาษาอะไรบ้าง?",
    answer: "API เป็น REST API ที่รองรับภาษาโปรแกรมทุกภาษา (Python, JavaScript, PHP, Java, etc.) ส่งข้อมูลเป็น JSON และมี SDK สำหรับภาษายอดนิยม"
  },

  // Billing & Partnership
  {
    id: "b1",
    category: "billing",
    question: "Partner มีกี่แพ็กเกจ?",
    answer: "มี 3 แพ็กเกจ: 1) Starter (1K requests/day) 2) Professional (10K/day + priority support) 3) Enterprise (unlimited + dedicated support + custom features)"
  },
  {
    id: "b2",
    category: "billing",
    question: "ชำระเงินอย่างไร?",
    answer: "รองรับ: โอนธนาคาร, บัตรเครดิต, QR Payment. สามารถออกใบเสร็จ/ใบกำกับภาษีได้ มีระบบ auto-renewal สำหรับสมาชิกรายเดือน"
  },
  {
    id: "b3",
    category: "billing",
    question: "ยกเลิกได้ไหม?",
    answer: "ยกเลิกได้ตลอดเวลา! แจ้งล่วงหน้า 30 วัน จะได้ใช้งานต่อจนครบรอบบิล ไม่มีค่าปรับ คืนเงินตามสัดส่วนถ้ายกเลิกก่อนกำหนด (กรณีจ่ายรายปี)"
  },
  {
    id: "b4",
    category: "billing",
    question: "มี SLA รับประกันไหม?",
    answer: "มี SLA สำหรับ Professional และ Enterprise: Uptime 99.9%, Response time < 200ms, Support response < 24h. มีชดเชย credit ถ้าไม่เป็นไปตาม SLA"
  },

  // Technical Issues
  {
    id: "t1",
    category: "technical",
    question: "ทำไมการตรวจสอบช้า?",
    answer: "ปกติใช้เวลาไม่เกิน 2-3 วินาที ถ้าช้ากว่านี้อาจเพราะ: 1) อินเทอร์เน็ตช้า 2) ระบบกำลัง load สูง 3) ข้อความยาวมาก ลองรีเฟรชหรือรอสักครู่แล้วลองใหม่"
  },
  {
    id: "t2",
    category: "technical",
    question: "แสดงผลผิดพลาดทำอย่างไร?",
    answer: "แก้ไขได้ดังนี้: 1) รีเฟรชหน้าเว็บ 2) ลบ cache เบราว์เซอร์ 3) ลองใช้ browser อื่น 4) ตรวจสอบอินเทอร์เน็ต 5) ถ้ายังไม่ได้ติดต่อทีมงาน"
  },
  {
    id: "t3",
    category: "technical",
    question: "รองรับ browser อะไรบ้าง?",
    answer: "รองรับ browser ทุกตัว: Chrome, Firefox, Safari, Edge (version ล่าสุด). แนะนำ Chrome หรือ Edge สำหรับประสบการณ์ที่ดีที่สุด"
  },
  {
    id: "t4",
    category: "technical",
    question: "API Error 429 หมายความว่าอะไร?",
    answer: "Error 429 = เกิน rate limit! แปลว่าคุณส่ง request มากเกินไป ให้: 1) รอสักครู่ (1-5 นาที) 2) ตรวจสอบว่าไม่มี duplicate requests 3) upgrade แพ็กเกจถ้าใช้งานบ่อย"
  },

  // Privacy & Security
  {
    id: "p1",
    category: "privacy",
    question: "เก็บข้อมูลอะไรบ้าง?",
    answer: "เก็บเฉพาะ: ข้อความที่ตรวจสอบ (90 วัน), ผลการวิเคราะห์, IP address, browser info. ไม่เก็บ: ข้อมูลส่วนตัวที่ละเอียดอ่อน, เลขบัตรประชาชน, รหัสผ่าน"
  },
  {
    id: "p2",
    category: "privacy",
    question: "จะลบข้อมูลได้ไหม?",
    answer: "ได้! ภายใต้ PDPA คุณมีสิทธิ์: ขอดูข้อมูล, ขอแก้ไข, ขอลบข้อมูล ติดต่อ cloud@monsterconnect.co.th เราจะดำเนินการภายใน 30 วัน"
  },
  {
    id: "p3",
    category: "privacy",
    question: "มีการเข้ารหัสหรือไม่?",
    answer: "ใช่! ทุกการสื่อสารใช้ HTTPS/TLS encryption, ข้อมูลที่เก็บถูกเข้ารหัส, API Key เข้ารหัสและเก็บปลอดภัย จำกัดการเข้าถึงเฉพาะผู้มีสิทธิ์"
  },
  {
    id: "p4",
    category: "privacy",
    question: "ขายข้อมูลให้ใครไหม?",
    answer: "ไม่เด็ดขาด! เราไม่ขายข้อมูลของคุณให้ใคร ใช้เฉพาะเพื่อ: 1) ให้บริการ 2) ปรับปรุงระบบ 3) วิเคราะห์การหลอกลวง (แบบ anonymous) 4) ปฏิบัติตามกฎหมาย"
  },
  {
    id: "p5",
    category: "privacy",
    question: "มาตรฐานความปลอดภัยอะไร?",
    answer: "เราปฏิบัติตาม: PDPA (ไทย), ISO 27001 best practices, OWASP security standards, Regular security audits, Penetration testing, 24/7 monitoring"
  },
];

const categories = [
  { id: "all" as FAQCategory, name: "ทั้งหมด", icon: HelpCircle, count: faqs.length },
  { id: "general" as FAQCategory, name: "คำถามทั่วไป", icon: HelpCircle, count: faqs.filter(f => f.category === "general").length },
  { id: "howto" as FAQCategory, name: "วิธีใช้งาน", icon: Zap, count: faqs.filter(f => f.category === "howto").length },
  { id: "api" as FAQCategory, name: "API", icon: Settings, count: faqs.filter(f => f.category === "api").length },
  { id: "billing" as FAQCategory, name: "การชำระเงิน", icon: CreditCard, count: faqs.filter(f => f.category === "billing").length },
  { id: "technical" as FAQCategory, name: "ปัญหาทางเทคนิค", icon: Shield, count: faqs.filter(f => f.category === "technical").length },
  { id: "privacy" as FAQCategory, name: "ความเป็นส่วนตัว", icon: Lock, count: faqs.filter(f => f.category === "privacy").length },
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>("all");
  const [helpful, setHelpful] = useState<Record<string, boolean | null>>({});

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch = search === "" || 
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFeedback = (id: string, isHelpful: boolean) => {
    setHelpful(prev => ({ ...prev, [id]: isHelpful }));
    toast.success(isHelpful ? "ขอบคุณสำหรับ feedback!" : "เราจะพยายามปรับปรุงครับ");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-teal-500 text-white py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <HelpCircle className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              คำถามที่พบบ่อย
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Frequently Asked Questions (FAQ)
            </p>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              รวมคำตอบสำหรับคำถามที่ผู้ใช้งานถามบ่อยๆ หากไม่พบคำตอบ กรุณาติดต่อเราได้เลย
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-900 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Search */}
            <GlassCard className="mb-8 border-2 shadow-lg">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาคำถาม... (เช่น 'ฟรีหรือเสียเงิน', 'API', 'ความปลอดภัย')"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-14 text-lg border-2"
                  />
                </div>
                {search && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    พบ <strong>{filteredFAQs.length}</strong> คำถาม
                  </p>
                )}
              </CardContent>
            </GlassCard>

            {/* Categories */}
            <div className="mb-8 flex flex-wrap gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <Button
                    key={cat.id}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="h-auto py-3 px-4"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {cat.name}
                    <Badge variant="secondary" className="ml-2">
                      {cat.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            {/* FAQs */}
            {filteredFAQs.length > 0 ? (
              <GlassCard className="border-2 shadow-lg">
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="space-y-4">
                    {filteredFAQs.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="border-2 rounded-lg px-4 bg-white dark:bg-slate-800"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="text-lg font-bold pr-4">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <p className="text-muted-foreground leading-relaxed mb-4">
                            {faq.answer}
                          </p>

                          {/* Helpful Feedback */}
                          <div className="flex items-center gap-3 pt-3 border-t">
                            <span className="text-sm text-muted-foreground">
                              คำตอบนี้มีประโยชน์ไหม?
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={helpful[faq.id] === true ? "default" : "outline"}
                                onClick={() => handleFeedback(faq.id, true)}
                                disabled={helpful[faq.id] !== null && helpful[faq.id] !== undefined}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                ใช่
                              </Button>
                              <Button
                                size="sm"
                                variant={helpful[faq.id] === false ? "destructive" : "outline"}
                                onClick={() => handleFeedback(faq.id, false)}
                                disabled={helpful[faq.id] !== null && helpful[faq.id] !== undefined}
                              >
                                <ThumbsDown className="h-4 w-4 mr-1" />
                                ไม่
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </GlassCard>
            ) : (
              <GlassCard className="border-2 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-bold mb-2">ไม่พบคำถามที่คุณหา</h3>
                  <p className="text-muted-foreground mb-6">
                    ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น
                  </p>
                  <Button onClick={() => { setSearch(""); setSelectedCategory("all"); }}>
                    ดูทั้งหมด
                  </Button>
                </CardContent>
              </GlassCard>
            )}

            {/* Contact Card */}
            <GlassCard className="mt-8 border-2 shadow-lg bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-black mb-3">ยังหาคำตอบไม่เจอ?</h3>
                <p className="text-muted-foreground mb-6">
                  ติดต่อทีมงานของเราได้ทันที เรายินดีช่วยเหลือ!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <a href="mailto:cloud@monsterconnect.co.th">
                      📧 ส่งอีเมล
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/privacy">
                      🔒 นโยบายความเป็นส่วนตัว
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/terms">
                      📄 เงื่อนไขการใช้งาน
                    </a>
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
