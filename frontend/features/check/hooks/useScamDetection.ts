"use client";

import { useState } from "react";
import { toast } from "sonner";
import { detectScam, type DetectionResponse } from "@/lib/api";

export function useScamDetection() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");
  
  // New state for image upload
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setInputError("ขนาดรูปภาพต้องไม่เกิน 10MB");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setInputError("");
      // Clear text input error when image is selected
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview); // Cleanup memory
      setPreview(null);
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation (Modified for Image support)
    // If no file selected AND (no text OR text too short) -> Error
    if (!file) {
        if (!input.trim()) {
          setInputError("กรุณาใส่ข้อความหรือแนบรูปภาพ");
          return;
        }
        if (input.trim().length < 5) {
          setInputError("ข้อความต้องมีอย่างน้อย 5 ตัวอักษร");
          return;
        }
    }

    setInputError("");
    setLoading(true);
    setError("");
    setResult(null);
    setLoadingMessage(file ? "กำลังอ่านข้อมูลจากรูป..." : "กำลังวิเคราะห์...");

    // Simulate progress
    setTimeout(() => setLoadingMessage("เกือบเสร็จแล้ว..."), 1000);

    try {
      console.log('[DEBUG] Calling detectScam API...');
      // Pass both text and file (if any)
      const data = await detectScam({ 
        text: input,
        file: file || undefined
      });
      console.log('[DEBUG] API response:', data);
      
      // If OCR extracted text, update input field logic could happen here
      // But for now we just show result
      
      setResult(data);
      
      // Add Haptic Feedback for Mobile (vibration pattern)
      if (data.is_scam && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Success toast
      if (data.risk_score >= 0.7) {
        toast.error("พบความเสี่ยงสูง!", { description: "โปรดระวังข้อความนี้" });
      } else if (data.risk_score >= 0.4) {
        toast.warning("น่าสงสัย", { description: "ควรตรวจสอบเพิ่มเติม" });
      } else {
        toast.success("ปลอดภัย", { description: "ไม่พบสัญญาณเสี่ยง" });
      }
    } catch (err) {
      console.error('[ERROR] API call failed:', err);
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง");
      toast.error("เกิดข้อผิดพลาด", { description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์" });
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleRandomExample = () => {
    const SCAM_EXAMPLES = [
       "ยินดีด้วย! คุณได้รับสิทธิ์กู้เงิน 50,000 บาท ดอกเบี้ยต่ำ คลิกเลย bit.ly/fake-loan",
       "ธ.กสิกร แจ้งบัญชีของท่านมีความเสี่ยง โปรดยืนยันตัวตนที่ kbank-security-update.com",
       "รับสมัครคนกดไลค์สินค้า รายได้วันละ 300-3000 บาท แอดไลน์ @scammer99",
       "พัสดุของท่านตกค้าง กรุณาชำระภาษี 50 บาท เพื่อนำจ่าย คลิก th-post-track.vip",
       "098-765-4321",
       "123-4-56789-0"
    ];
    const randomExample = SCAM_EXAMPLES[Math.floor(Math.random() * SCAM_EXAMPLES.length)];
    setInput(randomExample);
    handleRemoveFile(); // Clear file if random example is clicked
    setInputError("");
  };

  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleCopy = async () => {
    if (!result) return;
    
    const textToCopy = `ผลการตรวจสอบ ThaiScamDetector
คะแนนความเสี่ยง: ${(result.risk_score * 100).toFixed(1)}%
ประเภท: ${result.category}
เหตุผล: ${result.reason || result.reasoning || "ไม่มีข้อมูล"}
Request ID: ${result.request_id}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("คัดลอกแล้ว!", { description: "คัดลอกผลลัพธ์ไปยังคลิปบอร์ด" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้", { description: "กรุณาลองอีกครั้ง" });
    }
  };

  return {
    input,
    setInput,
    loading,
    loadingMessage,
    result,
    error,
    inputError,
    setInputError,
    handleCheck,
    handleRandomExample,
    setResult,
    copied,
    handleCopy,
    feedbackOpen,
    setFeedbackOpen,
    // File exports
    file,
    preview,
    handleFileSelect,
    handleRemoveFile
  };
}
