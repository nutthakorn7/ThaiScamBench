import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Shield } from "lucide-react";
import { getStats } from "@/lib/api";
import { StatsCharts } from "@/components/stats-charts";

export default async function StatsPage() {
  const stats = await getStats();

  // Pick data for charts (recharts needs this format)
  const pieData = [
    { name: 'Scam', value: stats.scam_percentage },
    { name: 'Safe', value: 100 - stats.scam_percentage }
  ];

  const barData = stats.top_categories.map(cat => ({
    name: cat.category.replace(/_/g, ' '),
    count: cat.count
  }));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            สถิติภัยไซเบอร์ Real-time
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            เกาะติดสถานการณ์กลโกงออนไลน์ล่าสุด วิเคราะห์จากข้อมูลการตรวจสอบจริงด้วย AI
          </p>
        </div>

        {/* Top KPI Cards (Server Rendered for speed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-blue-500/10 bg-blue-500/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-600">
                <Users className="h-4 w-4" /> ตรวจสอบทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.total_detections.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">รายการ</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/10 bg-red-500/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600">
                <AlertTriangle className="h-4 w-4" /> พบความเสี่ยงสูง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{stats.scam_percentage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">ของข้อความทั้งหมด</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/10 bg-green-500/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-600">
                <Shield className="h-4 w-4" /> ปลอดภัย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{(100 - stats.scam_percentage).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">ตรวจสอบแล้วปกติ</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section (Client Component) */}
        <StatsCharts pieData={pieData} barData={barData} />

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 py-4 rounded-lg">
          <p>ข้อมูลล่าสุด ณ วันที่ {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</p>
          {stats.period && <p>ช่วงเวลาที่เก็บข้อมูล: {stats.period}</p>}
        </div>
      </div>
    </div>
  );
}
