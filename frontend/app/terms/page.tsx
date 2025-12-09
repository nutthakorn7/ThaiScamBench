"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { FileText, AlertTriangle, Scale, Shield, Users, Bell } from "lucide-react";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-blue-600 to-teal-500 text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Scale className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              เงื่อนไขการให้บริการ
            </h1>
            <p className="text-xl text-blue-100">
              Terms of Service
            </p>
            <p className="mt-4 text-lg text-blue-100">
              มีผลบังคับใช้: 7 ธันวาคม 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-900 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Introduction */}
            <GlassCard className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div>
                    <h2 className="text-3xl font-black mb-4">1. การยอมรับข้อกำหนด</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                      ยินดีต้อนรับสู่ ThaiScamDetector การเข้าใช้งานและใช้บริการของเรา ถือว่าคุณได้อ่าน เข้าใจ และยอมรับ
                      ที่จะปฏิบัติตามเงื่อนไขการให้บริการ (&quot;ข้อกำหนด&quot;) ฉบับนี้
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      หากคุณไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาหยุดการใช้บริการทันที
                    </p>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* Service Description */}
            <GlassCard className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <Shield className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-3xl font-black mb-4">2. คำอธิบายบริการ</h2>
                    
                    <p className="text-lg text-muted-foreground mb-4">
                      ThaiScamDetector ให้บริการตรวจสอบและวิเคราะห์ข้อความ ลิงก์ และข้อมูลอื่นๆ 
                      เพื่อช่วยระบุความเสี่ยงจากการหลอกลวงออนไลน์ด้วยเทคโนโลยี AI
                    </p>

                    <h3 className="text-xl font-bold mt-6 mb-3">บริการที่เรามอบให้:</h3>
                    <ul className="space-y-2 text-lg text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span><strong>การตรวจสอบฟรี:</strong> วิเคราะห์ข้อความและลิงก์โดยไม่เสียค่าใช้จ่าย</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span><strong>สถิติและข้อมูล:</strong> แสดงข้อมูลการหลอกลวงแบบเรียลไทม์</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span><strong>การรายงานเบาะแส:</strong> ช่องทางแจ้งเบาะแสการหลอกลวง</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span><strong>Partner API:</strong> บริการ API สำหรับองค์กร (ต้องสมัครสมาชิก)</span>
                      </li>
                    </ul>

                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-600">
                      <p className="text-lg font-semibold mb-2">⚠️ ข้อจำกัด:</p>
                      <p className="text-muted-foreground">
                        บริการของเราเป็นเครื่องมือช่วยเหลือเท่านั้น ไม่สามารถรับประกันความแม่นยำ 100% 
                        และไม่ควรใช้เป็นข้อมูลเดียวในการตัดสินใจที่สำคัญ
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* User Responsibilities */}
            <GlassCard className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <Users className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-3xl font-black mb-4">3. ความรับผิดชอบของผู้ใช้</h2>

                    <p className="text-lg text-muted-foreground mb-4">
                      ในการใช้บริการของเรา คุณตกลงที่จะ:
                    </p>

                    <div className="space-y-4">
                      <div className="border-l-4 border-green-600 pl-4">
                        <h3 className="text-lg font-bold mb-2">✓ สิ่งที่ควรทำ:</h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• ใช้บริการอย่างถูกต้องตามกฎหมาย</li>
                          <li>• ให้ข้อมูลที่ถูกต้องและเป็นจริง</li>
                          <li>• เคารพสิทธิของผู้อื่น</li>
                          <li>• รักษาความลับของบัญชีและ API Key</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-red-600 pl-4">
                        <h3 className="text-lg font-bold mb-2">✗ สิ่งที่ห้ามทำ:</h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย</li>
                          <li>• ส่งข้อมูลที่เป็นเท็จหรือหลอกลวง</li>
                          <li>• พยายามเจาะระบบหรือทำลายบริการ</li>
                          <li>• ใช้ API เกินอัตราที่กำหนด (rate limit)</li>
                          <li>• นำข้อมูลไปใช้เชิงพาณิชย์โดยไม่ได้รับอนุญาต</li>
                          <li>• ทำ reverse engineering หรือคัดลอกบริการ</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-lg font-semibold mb-2 text-red-800 dark:text-red-300">
                        🚫 ผลของการละเมิด:
                      </p>
                      <p className="text-muted-foreground">
                        เราขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของคุณ หากพบว่ามีการละเมิดข้อกำหนด 
                        โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* Limitations */}
            <GlassCard className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <AlertTriangle className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-3xl font-black mb-4">4. ข้อจำกัดความรับผิด</h2>

                    <p className="text-lg text-muted-foreground mb-4">
                      เราให้บริการตามสภาพปัจจุบัน (&quot;AS IS&quot;) และไม่รับประกันใดๆ ไม่ว่าโดยชัดแจ้งหรือโดยนัย รวมถึง:
                    </p>

                    <div className="space-y-4">
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-2">1. ความแม่นยำของข้อมูล</h3>
                        <p className="text-muted-foreground">
                          เราไม่สามารถรับประกันความแม่นยำ 100% ของผลการวิเคราะห์ 
                          ผลลัพธ์ที่ได้เป็นเพียงข้อมูลอ้างอิงเท่านั้น
                        </p>
                      </div>

                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-2">2. ความพร้อมใช้งาน</h3>
                        <p className="text-muted-foreground">
                          เราไม่รับประกันว่าบริการจะพร้อมใช้งานตลอดเวลา อาจมีการหยุดชะงักเพื่อบำรุงรักษา
                        </p>
                      </div>

                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-2">3. ความเสียหาย</h3>
                        <p className="text-muted-foreground">
                          เราไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการใช้หรือไม่สามารถใช้บริการได้ 
                          ไม่ว่าจะเป็นความเสียหายทางตรงหรือทางอ้อม
                        </p>
                      </div>

                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-2">4. เนื้อหาจากผู้ใช้</h3>
                        <p className="text-muted-foreground">
                          เราไม่รับผิดชอบต่อเนื้อหาที่ผู้ใช้ส่งมาหรือรายงาน 
                          และไม่รับประกันความถูกต้องของข้อมูลดังกล่าว
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-lg">
                        <strong>ขีดจำกัดความรับผิด:</strong> ความรับผิดสูงสุดของเราต่อคุณ (ถ้ามี) 
                        จะไม่เกินจำนวนเงินที่คุณจ่ายให้เราในช่วง 12 เดือนที่ผ่านมา
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* API Terms */}
            <GlassCard className="shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-3xl font-black mb-4">5. เงื่อนไขการใช้ API (สำหรับ Partner)</h2>

                <p className="text-lg text-muted-foreground mb-4">
                  หากคุณใช้บริการ API ของเรา คุณต้องปฏิบัติตามเงื่อนไขเพิ่มเติมดังนี้:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <div>
                      <p className="font-semibold">การรักษา API Key:</p>
                      <p className="text-muted-foreground">
                        API Key เป็นข้อมูลลับ ต้องเก็บรักษาอย่างปลอดภัย ห้ามเปิดเผยหรือแชร์
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <div>
                      <p className="font-semibold">Rate Limits:</p>
                      <p className="text-muted-foreground">
                        ต้องเคารพขีดจำกัดการใช้งาน (rate limits) ตามแพ็กเกจที่สมัคร
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <div>
                      <p className="font-semibold">การแสดงแหล่งที่มา:</p>
                      <p className="text-muted-foreground">
                        หากนำข้อมูลไปใช้แสดงผล ต้องระบุแหล่งที่มาจาก ThaiScamDetector
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <div>
                      <p className="font-semibold">การยกเลิก:</p>
                      <p className="text-muted-foreground">
                        สามารถยกเลิกบริการได้ตลอดเวลา โดยแจ้งล่วงหน้า 30 วัน
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* Changes */}
            <GlassCard className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <Bell className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-3xl font-black mb-4">6. การเปลี่ยนแปลงข้อกำหนด</h2>

                    <p className="text-lg text-muted-foreground mb-4">
                      เราขอสงวนสิทธิ์ในการแก้ไขหรือเปลี่ยนแปลงข้อกำหนดนี้ได้ตลอดเวลา
                    </p>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                      <p className="text-lg font-semibold mb-2">📢 การแจ้งเตือน:</p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• เราจะแจ้งให้คุณทราบผ่านเว็บไซต์หรืออีเมล</li>
                        <li>• การเปลี่ยนแปลงสำคัญจะมีผลหลังจาก 30 วัน</li>
                        <li>• การใช้บริการต่อหลังจากมีการเปลี่ยนแปลง ถือว่ายอมรับข้อกำหนดใหม่</li>
                        <li>• ควรตรวจสอบข้อกำหนดนี้เป็นประจำ</li>
                      </ul>
                    </div>

                    <p className="text-muted-foreground">
                      หากคุณไม่ยอมรับการเปลี่ยนแปลง กรุณาหยุดการใช้บริการ
                    </p>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* Termination */}
            <GlassCard className="shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-3xl font-black mb-4">7. การยกเลิกบริการ</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">โดยคุณ:</h3>
                    <p className="text-muted-foreground">
                      คุณสามารถหยุดใช้บริการได้ตลอดเวลา โดยไม่ต้องแจ้งให้ทราบ สำหรับ Partner ต้องแจ้งยกเลิก 30 วันล่วงหน้า
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-2">โดยเรา:</h3>
                    <p className="text-muted-foreground mb-2">
                      เราอาจระงับหรือยกเลิกบัญชีของคุณได้ หากพบว่า:
                    </p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• มีการละเมิดข้อกำหนด</li>
                      <li>• มีพฤติกรรมที่ไม่เหมาะสม</li>
                      <li>• มีการใช้บริการในทางที่ผิด</li>
                      <li>• ไม่ชำระค่าบริการ (สำหรับ Partner)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* Governing Law */}
            <GlassCard className="shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-3xl font-black mb-4">8. กฎหมายที่ใช้บังคับ</h2>

                <p className="text-lg text-muted-foreground mb-4">
                  ข้อกำหนดนี้อยู่ภายใต้กฎหมายของประเทศไทย และให้ศาลในประเทศไทยมีอำนาจพิจารณาพิพากษา
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <div>
                      <p className="font-semibold">การระงับข้อพิพาท:</p>
                      <p className="text-muted-foreground">
                        ในกรณีมีข้อพิพาท ทั้งสองฝ่ายตกลงที่จะแก้ไขด้วยการเจรจาก่อน
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <div>
                      <p className="font-semibold">ภาษาที่ใช้:</p>
                      <p className="text-muted-foreground">
                        ในกรณีที่มีข้อความขัดแย้งระหว่างภาษาไทยและภาษาอื่น ให้ใช้ฉบับภาษาไทยเป็นหลัก
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* Contact */}
            <GlassCard className="shadow-lg bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950">
              <CardContent className="p-8">
                <h2 className="text-3xl font-black mb-4">9. ติดต่อเรา</h2>

                <p className="text-lg text-muted-foreground mb-4">
                  หากมีคำถามเกี่ยวกับข้อกำหนดนี้ กรุณาติดต่อ:
                </p>

                <div className="space-y-2 bg-white dark:bg-slate-800 p-6 rounded-lg">
                  <div>
                    <p className="font-semibold mb-1">📧 อีเมล:</p>
                    <p className="text-blue-600 font-medium">cloud@monsterconnect.co.th</p>
                  </div>

                  <div>
                    <p className="font-semibold mb-1">🏢 ชื่อบริษัท:</p>
                    <p className="text-muted-foreground">ThaiScamDetector</p>
                  </div>

                  <div>
                    <p className="font-semibold mb-1">🌐 เว็บไซต์:</p>
                    <p className="text-blue-600 font-medium">https://thaiscam.zcr.ai</p>
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* Footer Note */}
            <div className="text-center text-sm text-muted-foreground mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <p className="mb-2">
                <strong>การยอมรับ:</strong> การใช้บริการ ThaiScamDetector ถือว่าคุณได้อ่านและยอมรับเงื่อนไขนี้แล้ว
              </p>
              <p className="mt-2">
                <strong>เอกสารที่เกี่ยวข้อง:</strong> 
                <a href="/privacy" className="text-blue-600 hover:underline ml-2">นโยบายความเป็นส่วนตัว</a>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
