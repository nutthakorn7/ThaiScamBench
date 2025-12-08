"use client";

import { Search, Loader2, Image as ImageIcon, X, Upload, CloudUpload, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckFormProps {
  input: string;
  setInput: (value: string) => void;
  inputError: string;
  setInputError: (value: string) => void;
  loading: boolean;
  handleCheck: (e: React.FormEvent) => void;
  handleRandomExample: () => void;
  file?: File | null;
  preview?: string | null;
  handleFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile?: () => void;
}

export function CheckForm({
  input,
  setInput,
  inputError,
  setInputError,
  loading,
  handleCheck,
  handleRandomExample,
  file,
  preview,
  handleFileSelect,
  handleRemoveFile
}: CheckFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [isDragging, setIsDragging] = useState(false);

  // Auto-switch tab if file is present
  useEffect(() => {
    if (file || preview) {
      setActiveTab("image");
    }
  }, [file, preview]);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      // Create a synthetic event to reuse handleFileSelect
      const syntheticEvent = {
        target: { files: [droppedFile] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      if (handleFileSelect) {
        handleFileSelect(syntheticEvent);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Tab Switcher */}
      <div className="flex justify-center mb-6">
        <div className="bg-muted/50 p-1 rounded-full border border-border inline-flex shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "text" 
                ? "bg-white dark:bg-slate-800 text-blue-600 shadow-md scale-105" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <FileText className="w-4 h-4" />
            ตรวจสอบข้อความ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("image")}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "image" 
                ? "bg-white dark:bg-slate-800 text-purple-600 shadow-md scale-105" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <ImageIcon className="w-4 h-4" />
            ตรวจสอบรูปภาพ
          </button>
        </div>
      </div>

      <Card className="glass-card shadow-2xl overflow-hidden min-h-[400px]">
        <CardContent className="pt-0 p-0">
          <form onSubmit={handleCheck} className="flex flex-col h-full">
            
            <AnimatePresence mode="wait">
              {activeTab === "text" ? (
                <motion.div
                  key="text-tab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 md:p-8 space-y-4 flex-1"
                >
                  <div className="relative group h-full">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                     <Textarea
                      placeholder="วางข้อความ SMS, ลิงก์เว็บพนัน, หรือเลขบัญชีที่ต้องการตรวจสอบ..."
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setInputError("");
                      }}
                      className={cn(
                        "relative flex min-h-[300px] w-full resize-none rounded-xl border-2 bg-white/50 dark:bg-slate-900/50 px-6 py-5 text-lg ring-offset-background placeholder:text-muted-foreground transition-all duration-200 shadow-inner",
                        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 focus-visible:border-blue-600",
                        inputError ? "border-red-500 focus-visible:ring-red-500/20" : "border-gray-100 dark:border-gray-800"
                      )}
                    />
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className={cn(
                      "font-medium transition-colors",
                      inputError ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {inputError || `${input.length} ตัวอักษร (อย่างน้อย 5)`}
                    </span>
                    <button
                      type="button"
                      onClick={handleRandomExample}
                      className="text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1"
                    >
                      🎲 ลองดูตัวอย่าง
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="image-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 md:p-8 flex-1 flex flex-col"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/bmp"
                    onChange={handleFileSelect}
                  />

                  {!preview ? (
                    <div 
                      className={cn(
                        "flex-1 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center p-12 text-center transition-all duration-300 min-h-[300px] cursor-pointer relative overflow-hidden group",
                        isDragging 
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-[0.99]" 
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-400 bg-slate-50/50 dark:bg-slate-900/50"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                        <CloudUpload className="w-12 h-12 text-purple-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                        อัปโหลดรูปภาพ
                      </h3>
                      <p className="text-muted-foreground text-lg mb-6 max-w-sm mx-auto">
                        ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์<br/>
                        <span className="text-sm opacity-70">(รองรับ JPG, PNG, WEBP สูงสุด 10MB)</span>
                      </p>
                      
                      <div className="flex gap-3 relative z-10">
                        <Button type="button" variant="secondary" className="gap-2 pointer-events-none">
                          <Upload className="w-4 h-4" /> เลือกไฟล์
                        </Button>
                         <Button type="button" variant="outline" className="gap-2 pointer-events-none md:hidden">
                          <Camera className="w-4 h-4" /> ถ่ายรูป
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[300px] bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-gray-200 dark:border-gray-800 relative group animate-in zoom-in-95 duration-300 from-gray-200">
                      <div className="relative shadow-2xl rounded-xl overflow-hidden max-h-[400px] border-4 border-white dark:border-slate-700">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="max-h-[350px] w-auto object-contain bg-checkerboard" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (handleRemoveFile) handleRemoveFile();
                            // Keep tab active
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg hover:scale-110"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        {file?.name} ({(file!.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        เปลี่ยนรูปภาพใหม่
                      </Button>
                    </div>
                  )}
                  
                  {inputError && (
                    <p className="text-center text-red-500 mt-4 font-medium animate-pulse">
                      {inputError}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Action Bar */}
            <div className="p-6 md:px-8 border-t bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <Button
                type="submit"
                size="lg"
                className={cn(
                  "w-full h-14 text-xl font-bold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                  activeTab === "text" 
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" 
                    : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                )}
                disabled={loading || (activeTab === "text" && input.trim().length < 5) || (activeTab === "image" && !file)}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-6 w-6" />
                    {activeTab === "text" ? "ตรวจสอบข้อความ" : "ตรวจสอบรูปภาพ"}
                  </>
                )}
              </Button>
               <p className="text-xs text-center text-muted-foreground mt-3">
                  {activeTab === "text" 
                    ? "SMS • ลิงก์ • เบอร์โทร • เลขบัญชี" 
                    : "สลิปโอนเงิน • แคปแชท • โฆษณาหลอกลวง"}
                </p>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[40rem] h-[40rem] bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>
    </div>
  );
}
