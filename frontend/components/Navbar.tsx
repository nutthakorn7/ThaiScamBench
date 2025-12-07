"use client";

import Link from 'next/link';
import { Menu, ShieldAlert, X } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuVariants = {
    closed: { opacity: 0, x: "100%" },
    open: { opacity: 1, x: 0 },
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b-0">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <ShieldAlert className="h-8 w-8 text-blue-700" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-500">
            ThaiScamDetector
          </span>
        </Link>
        
        {/* Desktop Menu */}
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
        
        {/* Mobile Menu Button */}
        <button className="md:hidden p-2" onClick={toggleMenu} aria-label="Toggle menu">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 top-16 z-[999] bg-white dark:bg-neutral-950 border-t border-border md:hidden h-[100dvh]"
          >
            <div className="container mx-auto px-4 py-8 flex flex-col space-y-6">
              <Link href="/" onClick={toggleMenu} className="text-lg font-semibold hover:text-blue-600 transition-colors p-2">
                หน้าแรก
              </Link>
              <Link href="/check" onClick={toggleMenu} className="text-lg font-semibold hover:text-blue-600 transition-colors p-2">
                ตรวจสอบ
              </Link>
              <Link href="/stats" onClick={toggleMenu} className="text-lg font-semibold hover:text-blue-600 transition-colors p-2">
                สถิติ
              </Link>
              <Link href="/report" onClick={toggleMenu} className="text-lg font-semibold hover:text-blue-600 transition-colors p-2">
                แจ้งเบาะแส
              </Link>
              <Link href="/partner/login" onClick={toggleMenu} className="text-lg font-semibold hover:text-blue-600 transition-colors p-2">
                สำหรับพาร์ทเนอร์
              </Link>
              
              <div className="flex items-center justify-between p-2 border-t pt-6">
                <span className="font-medium">Theme Mode</span>
                <ModeToggle />
              </div>
              
              <Link href="/check" onClick={toggleMenu}>
                <Button className="w-full text-lg h-12 bg-blue-700 hover:bg-blue-800 rounded-xl">
                  เริ่มตรวจสอบทันที
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
