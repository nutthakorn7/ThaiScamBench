"use client";

import { useState } from "react";
import { Send, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitReport } from "@/lib/api";

export default function ReportPage() {
  const [formData, setFormData] = useState({
    text: "",
    is_scam_actual: "true",
    comments: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await submitReport({
        text: formData.text,
        is_scam: formData.is_scam_actual === "true",
        additional_info: formData.comments
      });
      
      setSuccess(true);
      setFormData({ text: "", is_scam_actual: "true", comments: "" });
    } catch (err) {
      setError("ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่ภายหลัง");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-4 py-12 mx-auto max-w-2xl">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-5xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white">
          แจ้งเบาะแสการหลอกลวง
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          ช่วยเราป้องกันการหลอกลวงออนไลน์ ข้อมูลของคุณจะช่วยคนอื่นไม่ให้ตกเป็นเหยื่อ
        </p>
      </div>

      <Card className="border-primary/20 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            แบบฟอร์มแจ้งเบาะแส
          </CardTitle>
          <CardDescription>
            ข้อมูลของคุณจะเป็นประโยชน์อย่างมากในการพัฒนาระบบ AI ของเรา
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="text">1. ข้อความ / ลิงก์ / เลขบัญชี ที่ต้องการรายงาน</Label>
              <div className="relative">
                <textarea
                   id="text"
                   className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                   placeholder="เช่น ข้อความ SMS ที่ได้รับ, ลิงก์เว็บพนัน..."
                   value={formData.text}
                   onChange={(e) => setFormData({...formData, text: e.target.value})}
                   required
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>2. สิ่งนี้คือ Scam (มิจฉาชีพ) ใช่หรือไม่?</Label>
              <div className="flex gap-4">
                 <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors flex-1">
                    <input 
                        type="radio" 
                        name="is_scam" 
                        value="true" 
                        checked={formData.is_scam_actual === "true"}
                        onChange={(e) => setFormData({...formData, is_scam_actual: e.target.value})}
                        className="h-4 w-4"
                    />
                    <span>ใช่ (เป็น Scam)</span>
                 </label>
                 <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors flex-1">
                    <input 
                        type="radio" 
                        name="is_scam" 
                        value="false" 
                        checked={formData.is_scam_actual === "false"}
                        onChange={(e) => setFormData({...formData, is_scam_actual: e.target.value})}
                        className="h-4 w-4"
                    />
                    <span>ไม่ใช่ (ปลอดภัย)</span>
                 </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">3. รายละเอียดเพิ่มเติม (ถ้ามี)</Label>
               <Input
                  id="comments"
                  placeholder="เช่น เบอร์โทรที่ส่งมา, ชื่อธนาคาร..."
                  value={formData.comments}
                  onChange={(e) => setFormData({...formData, comments: e.target.value})}
                />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-medium rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 transition-all" disabled={loading}>
              {loading ? "กำลังส่งข้อมูล..." : "ส่งรายงาน"} <Send className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {success && (
        <Alert className="mt-8 border-green-500/50 bg-green-500/10 text-green-600 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>ได้รับข้อมูลแล้ว</AlertTitle>
          <AlertDescription>ขอบคุณที่ช่วยเป็นหูเป็นตาให้สังคมออนไลน์ปลอดภัยขึ้น!</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mt-8 animate-in fade-in slide-in-from-bottom-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
