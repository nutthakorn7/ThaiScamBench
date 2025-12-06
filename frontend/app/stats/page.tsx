"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Shield, TrendingUp, BarChart3, PieChart as PieIcon } from "lucide-react";
import { getStats } from "@/lib/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface StatsData {
  total_detections: number;
  scam_percentage: number;
  top_categories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  period: string;
}

const COLORS = ['#ef4444', '#22c55e']; // Red for Scam, Green for Safe
const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats:", err);
        setError("ไม่สามารถโหลดสถิติได้");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-500 text-center">{error || "ไม่พบข้อมูล"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Optimize data for charts
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

        {/* Top KPI Cards */}
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Pie Chart: Scam vs Safe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieIcon className="h-5 w-5 text-blue-500" />
                อัตราส่วนความเสี่ยง
              </CardTitle>
              <CardDescription>สัดส่วนข้อความอันตราย vs ปลอดภัย</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart: Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                ประเภทภัยคุกคามยอดนิยม
              </CardTitle>
              <CardDescription>5 อันดับ Scam ที่พบบ่อยที่สุด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground bg-slate-50 py-4 rounded-lg">
          <p>ข้อมูลล่าสุด ณ วันที่ {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</p>
          {stats.period && <p>ช่วงเวลาที่เก็บข้อมูล: {stats.period}</p>}
        </div>
      </div>
    </div>
  );
}
