"use client";

import { useState, useRef } from "react";
import { Upload, X, FileImage, Loader2, AlertTriangle, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { detectBatchImages, PublicBatchResponse } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface BatchUploaderProps {
  onComplete: (data: PublicBatchResponse) => void;
}

export function BatchUploader({ onComplete }: BatchUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 10;
  const MAX_SIZE_MB = 10;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    let errorMsg = "";

    // Check count limit
    if (files.length + newFiles.length > MAX_FILES) {
      errorMsg = `อัปโหลดได้สูงสุด ${MAX_FILES} รูปเท่านั้น`;
      newFiles = newFiles.slice(0, MAX_FILES - files.length);
    }

    newFiles.forEach((file) => {
      // Check type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} ไม่ใช่ไฟล์รูปภาพ`);
        return;
      }
      // Check size
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} ขนาดเกิน ${MAX_SIZE_MB}MB`);
        return;
      }
      validFiles.push(file);
    });

    if (errorMsg) toast.warning(errorMsg);
    
    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setLoading(true);
    try {
      const result = await detectBatchImages(files);
      onComplete(result);
      toast.success("ตรวจสอบเรียบร้อย!");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบ", {
        description: "โปรดลองใหม่อีกครั้ง"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card shadow-2xl overflow-hidden min-h-[500px]">
      <CardContent className="p-0 flex flex-col h-full min-h-[500px]">
        {/* Drop Zone */}
        <div 
          className={cn(
            "flex-1 p-8 md:p-12 transition-all duration-300 relative group flex flex-col items-center justify-center border-b border-dashed",
            isDragging 
              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-500" 
              : "bg-slate-50/50 dark:bg-slate-900/50 border-gray-200 dark:border-gray-800"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
            />
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                <CloudUpload className="w-12 h-12 text-blue-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                ลากรูปภาพมาวางที่นี่
            </h3>
            <p className="text-muted-foreground text-lg mb-6">
                หรือคลิกเพื่อเลือกไฟล์ (สูงสุด {MAX_FILES} รูป)
            </p>
            
            <Button 
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="min-w-[200px] text-lg rounded-full"
                disabled={loading}
            >
                <Upload className="w-5 h-5 mr-2" />
                เลือกรูปภาพ
            </Button>
        </div>

        {/* File List */}
        <div className="p-6 md:p-8 bg-white dark:bg-slate-950 flex-1">
            <h4 className="text-lg font-semibold mb-4 flex justify-between items-center">
                <span>รายการที่เลือก ({files.length}/{MAX_FILES})</span>
                {files.length > 0 && (
                     <Button variant="ghost" size="sm" onClick={() => setFiles([])} disabled={loading} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        ล้างทั้งหมด
                     </Button>
                )}
            </h4>

            {files.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl border-gray-100 dark:border-gray-800">
                    <p className="text-muted-foreground">ยังไม่มีรูปภาพ</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence>
                        {files.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                            >
                                <img 
                                    src={URL.createObjectURL(file)} 
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                                {!loading && (
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-white truncate">
                                    {file.name}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>

        {/* Action Bar */}
        <div className="p-6 border-t bg-slate-50 dark:bg-slate-900">
            <Button
                size="lg"
                className="w-full text-xl font-bold h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg rounded-xl"
                onClick={handleSubmit}
                disabled={files.length === 0 || loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        กำลังประมวลผล {files.length} รูป...
                    </>
                ) : (
                    <>
                        🚀 เริ่มตรวจสอบทันที
                    </>
                )}
            </Button>
            {loading && (
                 <p className="text-center text-sm text-muted-foreground mt-3 animate-pulse">
                    อาจใช้เวลาสักครู่ กรุณาอย่าปิดหน้าต่างนี้
                 </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
