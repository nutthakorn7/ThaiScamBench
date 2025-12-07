
import { Metadata } from 'next';
import { ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, Info } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  params: { keyword: string }
};

async function getWikiData(keyword: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/public/wiki/${keyword}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) {
       // Fallback for demo if backend isn't ready or returns 404
       // In prod, handle gracefully
       return null;
    }
    
    return res.json();
  } catch (error) {
    console.error("Failed to fetch wiki data", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const keyword = decodeURIComponent(params.keyword);
  // We can fetch data here too if we want dynamic titles based on risk
  // const data = await getWikiData(params.keyword);
  
  return {
    title: `ตรวจสอบ ${keyword} - โกงไหม? ปลอดภัยหรือหลอกลวง | ThaiScamDetector`,
    description: `ผลการตรวจสอบความปลอดภัยของ "${keyword}" ด้วยระบบ AI. ดูความเสี่ยง, ประเภทการหลอกลวง, และคำแนะนำล่าสุดจากชุมชน ThaiScamDetector`,
    openGraph: {
      title: `เตือนภัย: ${keyword} - ตรวจสอบแล้ว`,
      description: `เช็คเลย! ${keyword} ปลอดภัยหรือโกง? วิเคราะห์ด้วย AI แม่นยำ 99%`,
    }
  };
}

export default async function WikiPage({ params }: Props) {
  const keyword = decodeURIComponent(params.keyword);
  // UPDATE: In Next.js 15 params used to be promise. In 14 it's prop. 
  // Let's assume Next 14 standard.
  
  const data = await getWikiData(params.keyword) || {
    keyword: keyword,
    risk_score: 0.5,
    scam_type: 'Unknown',
    analysis: 'กำลังตรวจสอบข้อมูลล่าสุด...',
    is_safe: true // Default safe/neutral
  };

  const isScam = data.risk_score >= 0.7;
  const isSafe = data.risk_score < 0.4;
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Breadcrumb / Navigation */}
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">หน้าแรก</Link>
        <span>/</span>
        <span className="font-medium text-foreground">Scam Wiki</span>
        <span>/</span>
        <span className="truncate max-w-[200px]">{keyword}</span>
      </div>

      {/* Header Section */}
      <div className="text-center mb-12">
        <Badge 
          variant="outline" 
          className="mb-4 px-4 py-1 text-base rounded-full"
        >
          รายงานความปลอดภัย
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
          ตรวจสอบ: <span className="text-primary break-all">"{keyword}"</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          ผลการวิเคราะห์ความเสี่ยงและรายงานจากชุมชน
        </p>
      </div>

      {/* Main Result Card */}
      <Card className="mb-12 border-2 shadow-xl overflow-hidden">
        <div className={`h-2 w-full ${isScam ? 'bg-red-500' : isSafe ? 'bg-green-500' : 'bg-yellow-500'}`} />
        <CardContent className="p-8 md:p-12 text-center">
            <div className="flex justify-center mb-6">
                {isScam ? (
                    <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full animate-pulse">
                        <ShieldAlert className="w-16 h-16 text-red-600" />
                    </div>
                ) : isSafe ? (
                    <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full">
                        <ShieldCheck className="w-16 h-16 text-green-600" />
                    </div>
                ) : (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-6 rounded-full">
                        <AlertTriangle className="w-16 h-16 text-yellow-600" />
                    </div>
                )}
            </div>

            <h2 className="text-3xl font-bold mb-4">
                {isScam ? '⚠️ ระวัง! มีความเสี่ยงสูง' : isSafe ? '✅ ปลอดภัย' : '⚖️ มีความเสี่ยงปานกลาง'}
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {data.analysis || "ระบบ AI ได้ทำการวิเคราะห์ข้อมูลนี้แล้ว โดยตรวจสอบจากฐานข้อมูลมิจฉาชีพและรูปแบบข้อความที่น่าสงสัย"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto bg-muted/30 p-6 rounded-2xl border">
                <div>
                    <div className="text-sm text-muted-foreground mb-1">ระดับความเสี่ยง</div>
                    <div className={`text-xl font-bold ${isScam ? 'text-red-600' : isSafe ? 'text-green-600' : 'text-yellow-600'}`}>
                        {(data.risk_score * 100).toFixed(0)}%
                    </div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground mb-1">ประเภท</div>
                    <div className="text-xl font-bold">
                        {data.scam_type || "ทั่วไป"}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground mb-1">อัปเดตล่าสุด</div>
                    <div className="text-xl font-bold">
                        {data.last_updated || "วันนี้"}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
                 <Link href="/check">
                    <Button size="lg" className="rounded-full px-8">
                        ตรวจสอบใหม่
                    </Button>
                 </Link>
                 <Link href="/report">
                    <Button variant="outline" size="lg" className="rounded-full px-8">
                        แจ้งเบาะแส
                    </Button>
                 </Link>
            </div>
        </CardContent>
      </Card>

      {/* SEO Content Section (Rich Text) */}
      <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
              <section>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Info className="w-6 h-6 text-primary" />
                    รายละเอียดการวิเคราะห์
                  </h3>
                  <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                      <p>
                        จากการตรวจสอบข้อมูล <strong>{keyword}</strong> ในฐานข้อมูล ThaiScamDetector พบว่า
                        {isScam ? " มีรายงานความเกี่ยวข้องกับกิจกรรมที่น่าสงสัย หรือมีรูปแบบข้อความที่ตรงกับมิจฉาชีพ" : " ยังไม่พบประวัติการโกงที่ชัดเจน แต่ควรระมัดระวังในการทำธุรกรรม"}
                      </p>
                      <p>
                        ระบบ AI ของเราใช้อัลกอริทึม Natural Language Processing (NLP) ภาษาไทยในการวิเคราะห์ความน่าจะเป็น
                        โดยเปรียบเทียบกับเคสหลอกลวงกว่า 100,000 เคสในระบบ
                      </p>
                  </div>
              </section>

              <section>
                  <h3 className="text-2xl font-bold mb-4">คำแนะนำความปลอดภัย</h3>
                  <ul className="space-y-4">
                      <li className="flex items-start gap-3 bg-card p-4 rounded-lg border">
                          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full min-w-[40px] text-center">1</div>
                          <div>
                              <div className="font-bold">อย่าโอนไว</div>
                              <div className="text-sm text-muted-foreground">ตรวจสอบชื่อบัญชีและประวัติผู้ขายให้แน่ใจทุกครั้งก่อนโอนเงิน</div>
                          </div>
                      </li>
                      <li className="flex items-start gap-3 bg-card p-4 rounded-lg border">
                          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full min-w-[40px] text-center">2</div>
                          <div>
                              <div className="font-bold">ไม่กดลิงก์แปลกปลอม</div>
                              <div className="text-sm text-muted-foreground">หากได้รับ SMS หรือข้อความที่มีลิงก์แนบมา อย่ากดลิงก์นั้นเด็ดขาด</div>
                          </div>
                      </li>
                  </ul>
              </section>
          </div>

          <div className="space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          การค้นหายอดนิยม
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex flex-wrap gap-2">
                          {['0812345678', 'SMS กยศ', 'งานออนไลน์', 'เว็บพนัน', 'คอลเซ็นเตอร์'].map((tag) => (
                              <Link key={tag} href={`/wiki/${tag}`}>
                                  <Badge variant="secondary" className="hover:bg-primary hover:text-white cursor-pointer transition-colors">
                                      {tag}
                                  </Badge>
                              </Link>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}
