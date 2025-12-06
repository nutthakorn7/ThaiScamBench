import Link from "next/link";

export default function Footer() {
    return (
      <footer className="border-t bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">เกี่ยวกับเรา</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                ThaiScamDetector เป็นระบบ AI อัจฉริยะที่ช่วยปกป้องคุณจากการถูกหลอกลวงออนไลน์ 
                โดยการวิเคราะห์ข้อความและลิงก์ที่น่าสงสัยได้อย่างแม่นยำ
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">เมนูลัด</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/check" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    ตรวจสอบความเสี่ยง
                  </Link>
                </li>
                <li>
                  <Link href="/stats" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    สถิติ
                  </Link>
                </li>
                <li>
                  <Link href="/report" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    รายงานเบาะแส
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    คำถามที่พบบ่อย
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    เงื่อนไขการใช้งาน
                  </Link>
                </li>
                <li><a href="/partner/login" className="hover:text-amber-600 font-medium">Partner Portal</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">ติดต่อเรา</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                มีข้อสงสัยหรือต้องการความช่วยเหลือ?
                <br />
                Email: cloud@monsterconnect.co.th
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500 dark:text-gray-400 dark:border-slate-800">
          <p>
            &copy; {new Date().getFullYear()} Thai Scam Detector. All rights reserved.
            <span className="mx-2">|</span>
            <a href="/admin/login" className="text-gray-300 hover:text-gray-500 transition-colors text-xs">
              Staff Login
            </a>
          </p>
        </div>
        </div>
      </footer>
    );
  }
