import type { Metadata } from "next";
import { Inter, Outfit, Prompt, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";

// Premium Font Pairing: Outfit (Headings) + Inter (Body)
const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: '--font-inter',
  display: 'swap',
});

const prompt = Prompt({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin", "thai"],
  variable: '--font-prompt',
  display: 'swap',
});

const ibmThai = IBM_Plex_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin", "thai"],
  variable: '--font-ibm',
  display: 'swap',
});

import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ThemeProvider } from "@/components/theme-provider";
import { StructuredData } from "@/components/StructuredData";
import { webApplicationSchema, organizationSchema } from "@/lib/structured-data";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL('https://thaiscam.zcr.ai'),
  title: {
    template: '%s | ThaiScamDetector',
    default: 'ThaiScamDetector - ตรวจสอบการหลอกลวงด้วย AI',
  },
  description: "ระบบ AI อัจฉริยะสำหรับตรวจสอบข้อความ SMS, ลิงก์เว็บพนัน, บัญชีม้า และภัยออนไลน์ต่างๆ ปกป้องคุณจากมิจฉาชีพด้วยความแม่นยำสูง",
  keywords: ["ตรวจสอบมิจฉาชีพ", "เช็คบัญชีคนโกง", "SMS หลอกลวง", "เว็บพนัน", "AI ตรวจสอบ", "Scam Detector", "Cyber Security", "การหลอกลวงออนไลน์", "Thai scam detection"],
  authors: [{ name: "ThaiScamDetector Team" }],
  creator: 'ThaiScamDetector',
  publisher: 'ThaiScamDetector',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: 'https://thaiscam.zcr.ai',
    title: 'ThaiScamDetector - รู้ทันกลโกงด้วย AI',
    description: 'ตรวจสอบความเสี่ยงข้อความและบัญชีต้องสงสัยได้ทันที ป้องกันภัยจากมิจฉาชีพ',
    siteName: 'ThaiScamDetector',
    images: [
      {
        url: '/api/og?title=ThaiScamDetector',
        width: 1200,
        height: 630,
        alt: 'ThaiScamDetector - ป้องกันการหลอกลวงออนไลน์',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThaiScamDetector - ตรวจสอบการหลอกลวงด้วย AI',
    description: 'ตรวจสอบความเสี่ยงข้อความและบัญชีต้องสงสัยได้ทันที',
    images: ['/api/og?title=ThaiScamDetector'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '45767fffe95d9be5',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${outfit.variable} ${inter.variable} ${prompt.variable} ${ibmThai.variable} font-sans antialiased`}>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <StructuredData data={[webApplicationSchema, organizationSchema]} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster position="top-right" richColors />
            <SpeedInsights />
            <Analytics />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
