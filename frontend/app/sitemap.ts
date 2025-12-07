
import { MetadataRoute } from 'next';

const BASE_URL = 'https://thaiscam.zcr.ai';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static Routes
  const routes = [
    '',
    '/check',
    '/report',
    '/stats',
    '/partner/login',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic Routes (Wiki)
  // In a real scenario, we fetch from API: GET /public/wiki-slugs
  // For MVP, we use the same static list as TrendingScams + some extras
  const keywords = [
      '081-234-5678', 
      'SMS กยศ', 
      'งานออนไลน์ ได้เงินจริง', 
      'เว็บพนัน แจกเครดิตฟรี', 
      'คอลเซ็นเตอร์ อ้างเป็นตำรวจ', 
      'ธนาคารออมสิน ปล่อยกู้', 
      'J&T Express พัสดุตกค้าง', 
      'รับสมัครคนกดออเดอร์',
      'เบอร์แปลกโทรมา',
      'กู้เงินออนไลน์',
      'ลงทุน crypto'
  ];

  const wikiRoutes = keywords.map((keyword) => ({
    url: `${BASE_URL}/wiki/${encodeURIComponent(keyword)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...routes, ...wikiRoutes];
}
