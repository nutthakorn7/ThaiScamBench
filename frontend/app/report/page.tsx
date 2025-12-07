"use client";

import { useState, useEffect, useRef } from "react";
import { Send, AlertTriangle, CheckCircle2, MessageSquare, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitReport } from "@/lib/api";
import { toast } from "sonner";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { cn } from "@/lib/utils"; // Ensure cn is imported or use template literals

export default function ReportPage() {
  const [formData, setFormData] = useState({
    text: "",
    is_scam_actual: "true",
    comments: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  // Image Upload State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("ขนาดรูปภาพต้องไม่เกิน 10MB");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading) {
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await submitReport({
        text: formData.text,
        is_scam: formData.is_scam_actual === "true",
        additional_info: formData.comments,
        file: file || undefined
      });
      
      setSuccess(true);
      setShowConfetti(true);
      setFormData({ text: "", is_scam_actual: "true", comments: "" });
      handleRemoveFile(); // Clear image
      
      // Success toast with celebration
      toast.success("รายงานส่งสำเร็จ! 🎉", {
        description: "ขอบคุณที่ช่วยเป็นหูเป็นตาให้สังคมออนไลน์ปลอดภัยขึ้น!",
        duration: 5000,
      });

      // Stop confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (err) {
      setError("ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่ภายหลัง");
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่ภายหลัง",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Success Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      <div className="container px-4 py-12 mx-auto max-w-2xl">
        {/* Screen reader announcement */}
        <div role="status" aria-live="polite" className="sr-only">
          {loading && "กำลังส่งข้อมูล กรุณารอสักครู่..."}
          {success && "ส่งรายงานสำเร็จแล้ว!"}
        </div>

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
            <div className="space-y-3">
              <Label htmlFor="text" className="text-lg font-semibold">
                1. ข้อความ / ลิงก์ / เลขบัญชี ที่ต้องการรายงาน
              </Label>
              <div className="relative">
                <textarea
                   id="text"
                   aria-label="รายละเอียดการหลอกลวงที่ต้องการแจ้ง"
                   aria-required="true"
                   aria-describedby="text-hint"
                   className={`flex min-h-64 w-full rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-6 py-5 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none ${preview ? 'pb-24' : ''}`}
                   placeholder="เช่น ข้อความ SMS ที่ได้รับ, ลิงก์เว็บพนัน, เลขบัญชีที่น่าสงสัย หรือแนบรูปภาพ..."
                   value={formData.text}
                   onChange={(e) => setFormData({...formData, text: e.target.value})}
                   required={!file} // If file exists, text is optional
                   rows={10}
                />

                {/* Image Upload Button */}
                <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                   <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                   />
                   <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      title="อัปโหลดรูปภาพ"
                   >
                      <ImageIcon className="h-6 w-6" />
                   </Button>
                </div>

                {/* Image Preview Overlay */}
                {preview && (
                  <div className="absolute bottom-4 left-6 z-10 animate-in fade-in zoom-in duration-200">
                    <div className="relative group/preview inline-block">
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="h-20 w-auto object-cover rounded-lg border-2 border-primary/50 shadow-md bg-background"
                        />
                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 shadow-sm hover:bg-destructive/90 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                  </div>
                )}

                {!preview && (
                    <p id="text-hint" className="text-xs text-muted-foreground mt-2 absolute -bottom-6 left-2">
                    กรุณากรอกข้อมูลอย่างละเอียดเพื่อช่วยให้การวิเคราะห์แม่นยำ
                    </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                2. สิ่งนี้คือ Scam (มิจฉาชีพ) ใช่หรือไม่?
              </Label>
              <fieldset aria-label="ประเภทของข้อมูล" className="flex gap-4">
                 <label className="flex items-center space-x-3 border-2 p-4 rounded-xl cursor-pointer hover:bg-accent transition-colors flex-1 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-600">
                    <input 
                        type="radio" 
                        name="is_scam" 
                        value="true" 
                        checked={formData.is_scam_actual === "true"}
                        onChange={(e) => setFormData({...formData, is_scam_actual: e.target.value})}
                        className="h-5 w-5"
                        aria-label="เป็นข้อมูลหลอกลวง"
                    />
                    <span className="text-base font-medium">ใช่ (เป็น Scam)</span>
                 </label>
                 <label className="flex items-center space-x-3 border-2 p-4 rounded-xl cursor-pointer hover:bg-accent transition-colors flex-1 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-600">
                    <input 
                        type="radio" 
                        name="is_scam" 
                        value="false" 
                        checked={formData.is_scam_actual === "false"}
                        onChange={(e) => setFormData({...formData, is_scam_actual: e.target.value})}
                        className="h-5 w-5"
                        aria-label="เป็นข้อมูลปลอดภัย"
                    />
                    <span className="text-base font-medium">ไม่ใช่ (ปลอดภัย)</span>
                 </label>
              </fieldset>
            </div>

            <div className="space-y-3">
              <Label htmlFor="comments" className="text-lg font-semibold">3. รายละเอียดเพิ่มเติม (ถ้ามี)</Label>
               <Input
                  id="comments"
                  placeholder="เช่น เบอร์โทรที่ส่งมา, ชื่อธนาคาร, วิธีการติดต่อ..."
                  value={formData.comments}
                  onChange={(e) => setFormData({...formData, comments: e.target.value})}
                  className="h-14 px-6 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-4 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 transition-all"
                />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-medium rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 transition-all" disabled={loading}>
              {loading ? "กำลังส่งข้อมูล..." : "ส่งรายงาน"} <Send className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {success && (
        <Alert className="mt-8 border-green-500/50 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-bottom-4">
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
    </>
  );
}
