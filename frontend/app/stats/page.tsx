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
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white">
            สถิติภัยไซเบอร์ Real-time
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            เกาะติดสถานการณ์กลโกงออนไลน์ล่าสุด วิเคราะห์จากข้อมูลการตรวจสอบจริงด้วย AI
          </p>
        </div>

        {/* Top KPI Cards (Server Rendered for speed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border-2 border-blue-700/20 bg-blue-700/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-700">
                <Users className="h-6 w-6" /> ตรวจสอบทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-7xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 mb-4">{stats.total_detections.toLocaleString()}</div>
              <p className="text-lg text-muted-foreground font-semibold">รายการ</p>
            </CardContent>
          </Card>

          <Card className="group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border-2 border-red-500/20 bg-red-500/5 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-red-600">
                <AlertTriangle className="h-6 w-6" /> พบความเสี่ยงสูง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-7xl md:text-8xl font-black text-red-600 mb-4">{stats.scam_percentage.toFixed(1)}%</div>
              <p className="text-lg text-muted-foreground font-semibold">ของข้อความทั้งหมด</p>
            </CardContent>
          </Card>

          <Card className="group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border-2 border-green-500/20 bg-green-500/5 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-green-600">
                <Shield className="h-6 w-6" /> ปลอดภัย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-7xl md:text-8xl font-black text-green-600 mb-4">{(100 - stats.scam_percentage).toFixed(1)}%</div>
              <p className="text-lg text-muted-foreground font-semibold">ตรวจสอบแล้วปกติ</p>
            </CardContent>
          </Card>
        </div>

        {/* Image Stats Section */}
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <span className="bg-purple-100 text-purple-600 p-2 rounded-lg dark:bg-purple-900/30">📸</span> 
                สถิติการตรวจสอบรูปภาพ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 border-2 border-purple-500/20 bg-purple-500/5">
                    <CardHeader>
                        <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
                             ตรวจสอบสลิป/รูปภาพ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-4">
                            <div className="text-6xl font-black text-purple-600 dark:text-purple-400">
                                {(stats.total_images || 0).toLocaleString()}
                            </div>
                            <div className="text-xl text-muted-foreground">ใบ</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 border-2 border-orange-500/20 bg-orange-500/5">
                    <CardHeader>
                        <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
                             พบสลิปปลอม
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-baseline gap-4">
                            <div className="text-6xl font-black text-orange-600 dark:text-orange-400">
                                {(stats.scam_slips || 0).toLocaleString()}
                            </div>
                            <div className="text-xl text-muted-foreground">ใบ</div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            คิดเป็น {((stats.scam_slips / (stats.total_images || 1)) * 100).toFixed(1)}% ของรูปภาพทั้งหมด
                        </p>
                    </CardContent>
                </Card>
            </div>
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
