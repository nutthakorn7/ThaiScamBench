import Link from 'next/link';
import { Menu, ShieldAlert } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <ShieldAlert className="h-8 w-8 text-blue-700" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-500">
            ThaiScamDetector
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-blue-700">
            หน้าแรก
          </Link>
          <Link href="/check" className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
            ตรวจสอบ
          </Link>
          <Link href="/stats" className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
            สถิติ
          </Link>

          <Link href="/report" className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
            แจ้งเบาะแส
          </Link>
          <Link href="/partner/login" className="transition-colors hover:text-blue-700">
            สำหรับพาร์ทเนอร์
          </Link>
          <ModeToggle />
          <Link 
            href="/check" 
            className="inline-flex items-center justify-center rounded-full bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            เริ่มตรวจสอบ
          </Link>
        </nav>
        
        <button className="md:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
