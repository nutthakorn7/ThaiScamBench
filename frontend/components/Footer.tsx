export default function Footer() {
    return (
      <footer className="border-t bg-slate-50">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">เกี่ยวกับเรา</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ThaiScamDetector เป็นระบบ AI อัจฉริยะที่ช่วยปกป้องคุณจากการถูกหลอกลวงออนไลน์ 
                โดยการวิเคราะห์ข้อความและลิงก์ที่น่าสงสัยได้อย่างแม่นยำ
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">เมนูลัด</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/" className="hover:text-blue-600">หน้าแรก</a></li>
                <li><a href="/check" className="hover:text-blue-600">ตรวจสอบข้อความ</a></li>
                <li><a href="/report" className="hover:text-blue-600">แจ้งเบาะแส</a></li>
                <li><a href="/privacy" className="hover:text-blue-600">นโยบายความเป็นส่วนตัว</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">ติดต่อเรา</h3>
              <p className="text-sm text-gray-600">
                มีข้อสงสัยหรือต้องการความช่วยเหลือ?
                <br />
                Email: support@scamdetect.th
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
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
