export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ThaiScamDetector",
  "alternateName": "ตรวจสอบการหลอกลวงด้วย AI",
  "url": "https://thaiscam.zcr.ai",
  "applicationCategory": "SecurityApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "THB"
  },
  "description": "ระบบ AI อัจฉริยะสำหรับตรวจสอบข้อความ SMS, ลิงก์เว็บพนัน, บัญชีม้า และภัยออนไลน์ต่างๆ ปกป้องคุณจากมิจฉาชีพด้วยความแม่นยำสูง",
  "screenshot": "https://thaiscam.zcr.ai/og-image.jpg",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250"
  },
  "featureList": [
    "ตรวจสอบข้อความ SMS",
    "ตรวจสอบลิงก์เว็บไซต์",
    "ตรวจสอบเลขบัญชีธนาคาร",
    "AI ตรวจสอบอัตโนมัติ",
    "สถิติการหลอกลวงแบบเรียลไทม์"
  ]
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ThaiScamDetector",
  "alternateName": "Thai Scam Bench",
  "url": "https://thaiscam.zcr.ai",
  "logo": "https://thaiscam.zcr.ai/logo.png",
  "description": "องค์กรที่พัฒนาระบบตรวจสอบการหลอกลวงออนไลน์ด้วย AI เพื่อปกป้องผู้ใช้งานในประเทศไทย",
  "email": "cloud@monsterconnect.co.th",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "TH",
    "addressLocality": "Thailand"
  },
  "sameAs": [
    "https://thaiscam.zcr.ai"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "cloud@monsterconnect.co.th",
    "contactType": "Customer Support",
    "availableLanguage": ["th", "en"]
  }
};

export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// Common breadcrumbs for different pages
export const homeBreadcrumb = getBreadcrumbSchema([
  { name: "หน้าแรก", url: "https://thaiscam.zcr.ai" }
]);

export const checkBreadcrumb = getBreadcrumbSchema([
  { name: "หน้าแรก", url: "https://thaiscam.zcr.ai" },
  { name: "ตรวจสอบความเสี่ยง", url: "https://thaiscam.zcr.ai/check" }
]);

export const statsBreadcrumb = getBreadcrumbSchema([
  { name: "หน้าแรก", url: "https://thaiscam.zcr.ai" },
  { name: "สถิติการหลอกลวง", url: "https://thaiscam.zcr.ai/stats" }
]);

export const reportBreadcrumb = getBreadcrumbSchema([
  { name: "หน้าแรก", url: "https://thaiscam.zcr.ai" },
  { name: "รายงานเบาะแส", url: "https://thaiscam.zcr.ai/report" }
]);

export const privacyBreadcrumb = getBreadcrumbSchema([
  { name: "หน้าแรก", url: "https://thaiscam.zcr.ai" },
  { name: "นโยบายความเป็นส่วนตัว", url: "https://thaiscam.zcr.ai/privacy" }
]);
