"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, AlertTriangle, BarChart3, Users } from "lucide-react";
import { getStats } from "@/lib/api";

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

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          สถิติการตรวจสอบ
        </h1>
        <p className="text-muted-foreground text-lg">
          ข้อมูลการใช้งานระบบตรวจสอบกลโกงออนไลน์
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Total Detections */}
        <Card className="border-blue-500/20 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Users className="h-5 w-5" />
              ตรวจสอบทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {stats.total_detections.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">ข้อความที่ผ่านการตรวจสอบ</p>
          </CardContent>
        </Card>

        {/* Scam Percentage */}
        <Card className="border-red-500/20 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              พบการหลอกลวง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2 text-red-600">
              {stats.scam_percentage.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">ของการตรวจสอบทั้งหมด</p>
          </CardContent>
        </Card>

        {/* Safe Percentage */}
        <Card className="border-green-500/20 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Shield className="h-5 w-5" />
              ปลอดภัย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2 text-green-600">
              {(100 - stats.scam_percentage).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">ข้อความปกติ</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ประเภทการหลอกลวงยอดนิยม
          </CardTitle>
          <CardDescription>
            รูปแบบการหลอกลวงที่พบบ่อยที่สุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.top_categories && stats.top_categories.length > 0 ? (
              stats.top_categories.map((cat, index) => (
                <div key={cat.category} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">
                        {cat.category.replace(/_/g, " ")}
                      </span>
                      <Badge variant="secondary">
                        {cat.count.toLocaleString()} ครั้ง
                      </Badge>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cat.percentage.toFixed(1)}% ของการตรวจสอบที่เป็นกลโกง
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                ไม่มีข้อมูลประเภทการหลอกลวง
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Period Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>ข้อมูล ณ วันที่ {new Date().toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })}</p>
        {stats.period && <p className="mt-1">ช่วงเวลา: {stats.period}</p>}
      </div>
    </div>
  );
}
