"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Huge 404 */}
        <div className="text-9xl md:text-[200px] font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 mb-8 leading-none">
          404
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 dark:text-white">
          ไม่พบหน้าที่คุณต้องการ
        </h1>

        {/* Description */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
          ขออภัย หน้าที่คุณกำลังมองหาอาจจะถูกย้าย หรือไม่มีอยู่จริง
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-8 py-6 text-lg font-semibold rounded-xl bg-blue-700 hover:bg-blue-800 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <Home className="mr-2 h-5 w-5" />
              กลับหน้าแรก
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-6 text-lg font-semibold rounded-xl border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            ย้อนกลับ
          </Button>
        </div>

        {/* Helpful links */}
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">ลิงก์ที่อาจจะช่วยได้:</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/check" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
              ตรวจสอบความเสี่ยง
            </Link>
            <Link href="/stats" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
              สถิติ
            </Link>
            <Link href="/report" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
              แจ้งเบาะแส
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
