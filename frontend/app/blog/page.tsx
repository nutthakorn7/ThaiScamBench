import { Metadata } from "next";
import BlogList from "./BlogList";
import { blogPosts } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "ศูนย์การเรียนรู้ & ข่าวสารภัยไซเบอร์ | ThaiScamDetector",
  description: "รู้ทันกลโกง อัปเดตข่าวสาร และวิธีป้องกันตัวจากมิจฉาชีพ เพื่อให้คุณปลอดภัยในโลกออนไลน์ อ่านบทความแนะนำเกี่ยวกับการป้องกัน SMS หลอกลวง, บัญชีม้า, และภัยไซเบอร์อื่นๆ",
  openGraph: {
    title: "ศูนย์การเรียนรู้ & ข่าวสารภัยไซเบอร์ | ThaiScamDetector",
    description: "รู้ทันกลโกง อัปเดตข่าวสาร และวิธีป้องกันตัวจากมิจฉาชีพ เพื่อให้คุณปลอดภัยในโลกออนไลน์",
    type: "website",
    url: "https://thaiscam.zcr.ai/blog",
    siteName: "ThaiScamDetector",
    images: [
      {
        url: "/images/og-image.jpg", // Ensure this exists or use a default one
        width: 1200,
        height: 630,
        alt: "ThaiScamDetector Knowledge Hub",
      },
    ],
  },
};

export default function BlogIndexPage() {
  return <BlogList initialPosts={blogPosts} />;
}
