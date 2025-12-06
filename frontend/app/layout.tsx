import type { Metadata } from "next";
import { Inter, Prompt, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const prompt = Prompt({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin", "thai"],
  variable: '--font-prompt'
});
const ibmThai = IBM_Plex_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin", "thai"],
  variable: '--font-ibm'
});

export const metadata: Metadata = {
  title: {
    template: '%s | Thai Scam Detector',
    default: 'Thai Scam Detector | ตรวจสอบกลโกงออนไลน์',
  },
  description: "ระบบ AI อัจฉริยะสำหรับตรวจสอบข้อความ SMS, ลิงก์เว็บพนัน, บัญชีม้า และภัยออนไลน์ต่างๆ ปกป้องคุณจากมิจฉาชีพด้วยความแม่นยำสูง",
  keywords: ["ตรวจสอบมิจฉาชีพ", "เช็คบัญชีคนโกง", "SMS หลอกลวง", "เว็บพนัน", "AI ตรวจสอบ", "Scam Detector", "Cyber Security"],
  authors: [{ name: "Thai Scam Bench Team" }],
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: 'https://thaiscam.zcr.ai',
    title: 'Thai Scam Detector | รู้ทันกลโกงด้วย AI',
    description: 'ตรวจสอบความเสี่ยงข้อความและบัญชีต้องสงสัยได้ทันที ป้องกันภัยจากมิจฉาชีพ',
    siteName: 'Thai Scam Detector',
    images: [
      {
        url: '/og-image.jpg', // We will need to ensure this image exists or use a default
        width: 1200,
        height: 630,
        alt: 'Thai Scam Detector Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thai Scam Detector',
    description: 'ตรวจสอบความเสี่ยงข้อความและบัญชีต้องสงสัยได้ทันที',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} ${inter.variable} font-sans`}>
        <Toaster position="top-center" richColors expand={true} />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
