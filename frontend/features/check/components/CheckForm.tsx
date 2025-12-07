"use client";

import { Search, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRef } from "react";

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

  return (
    <div className="max-w-5xl mx-auto w-full">
      <Card className="glass-card shadow-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              
              <div className="relative">
                <Textarea
                  placeholder="วางข้อความ SMS, ลิงก์เว็บพนัน, หรือเลขบัญชีที่ต้องการตรวจสอบ..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setInputError("");
                  }}
                  className={cn(
                    "relative flex min-h-48 w-full resize-none rounded-2xl border-2 bg-white dark:bg-slate-900 px-6 py-5 text-lg ring-offset-background placeholder:text-muted-foreground transition-all duration-200 shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 focus-visible:border-blue-600",
                    inputError && "border-red-500 focus-visible:ring-red-500/20",
                    !inputError && "border-gray-200 dark:border-gray-700",
                    preview && "pb-24" // Extra padding for preview area
                  )}
                  rows={16}
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
              </div>

            </div>
            {inputError && (
              <p className="text-sm text-red-500 mt-1">{inputError}</p>
            )}
            <p className="text-base text-muted-foreground mt-3 flex justify-between items-center">
              <span className="font-medium">
                {input.length} ตัวอักษร {input.length >= 5 || file ? "✓" : "(อย่างน้อย 5)"}
              </span>
              <button
                type="button"
                onClick={handleRandomExample}
                className="text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                🎲 ลองดูตัวอย่าง
              </button>
            </p>

            <Button
              type="submit"
              size="lg"
              className="w-full px-10 py-6 text-xl font-semibold rounded-xl bg-blue-700 hover:bg-blue-800 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || (!file && input.trim().length < 5)}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Search className="mr-2 h-5 w-5" />
              )}
              {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบความเสี่ยง"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
