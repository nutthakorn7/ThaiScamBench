"use client";

import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CheckFormProps {
  input: string;
  setInput: (value: string) => void;
  inputError: string;
  setInputError: (value: string) => void;
  loading: boolean;
  handleCheck: (e: React.FormEvent) => void;
  handleRandomExample: () => void;
}

export function CheckForm({
  input,
  setInput,
  inputError,
  setInputError,
  loading,
  handleCheck,
  handleRandomExample,
}: CheckFormProps) {
  return (
    <div className="max-w-5xl mx-auto w-full">
      <Card className="glass-card shadow-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
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
                  !inputError && "border-gray-200 dark:border-gray-700"
                )}
                rows={16}
              />
            </div>
            {inputError && (
              <p className="text-sm text-red-500 mt-1">{inputError}</p>
            )}
            <p className="text-base text-muted-foreground mt-3 flex justify-between items-center">
              <span className="font-medium">
                {input.length} ตัวอักษร {input.length >= 5 ? "✓" : "(อย่างน้อย 5)"}
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
              disabled={loading || input.trim().length < 5}
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
