import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://thaiscam.zcr.ai'),
  title: {
    default: 'ThaiScamDetector - ตรวจสอบการหลอกลวงด้วย AI',
    template: '%s | ThaiScamDetector'
  },
  description: 'ระบบตรวจสอบข้อความ SMS, ลิงก์, และเลขบัญชีที่น่าสงสัย ด้วยเทคโนโลยี AI ที่แม่นยำสูง ป้องกันการถูกหลอกลวงออนไลน์',
  keywords: ['ตรวจสอบการหลอกลวง', 'AI scam detection', 'Thai scam', 'ตรวจสอบ SMS', 'ตรวจสอบลิงก์', 'cybersecurity', 'online safety', 'fraud detection'],
  authors: [{ name: 'ThaiScamDetector Team' }],
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
    title: 'ThaiScamDetector - ตรวจสอบการหลอกลวงด้วย AI',
    description: 'ระบบตรวจสอบข้อความ SMS, ลิงก์, และเลขบัญชีที่น่าสงสัย ด้วยเทคโนโลยี AI ที่แม่นยำสูง',
    siteName: 'ThaiScamDetector',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ThaiScamDetector - ป้องกันการหลอกลวงออนไลน์',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThaiScamDetector - ตรวจสอบการหลอกลวงด้วย AI',
    description: 'ระบบตรวจสอบข้อความ SMS, ลิงก์, และเลขบัญชีที่น่าสงสัย ด้วยเทคโนโลยี AI',
    images: ['/og-image.png'],
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
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
};

export default metadata;
