"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import dynamic from 'next/dynamic';
import { StructuredData } from "@/components/StructuredData";
import { checkBreadcrumb } from "@/lib/structured-data";

// Feature imports
import { useScamDetection } from "@/features/check/hooks/useScamDetection";
import { CheckForm } from "@/features/check/components/CheckForm";
import { LoadingOverlay } from "@/features/check/components/LoadingOverlay";
import { DetectionResult } from "@/features/check/components/DetectionResult";

const FeedbackDialog = dynamic(() => import('@/components/FeedbackDialog').then(mod => mod.FeedbackDialog), {
  loading: () => null,
  ssr: false
});

export default function CheckPage() {
  const {
    input,
    setInput,
    inputError,
    setInputError,
    loading,
    result,
    error,
    handleCheck,
    handleRandomExample,
    feedbackOpen,
    setFeedbackOpen,
    file,
    preview,
    handleFileSelect,
    handleRemoveFile
  } = useScamDetection();

  return (
    <>
      <StructuredData data={checkBreadcrumb} />
      <div className="container px-4 py-8 md:py-12 mx-auto max-w-4xl">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white">
            ตรวจสอบความเสี่ยง
          </h1>
          <p className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            ใส่ข้อความ SMS, ลิงก์, เลขบัญชี หรือ <span className="text-blue-600 dark:text-blue-400 font-medium">แนบรูปสลิป/แชท</span> เพื่อให้ AI ช่วยวิเคราะห์
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Centered Input Form - Full Width */}
          <CheckForm 
            input={input}
            setInput={setInput}
            inputError={inputError}
            setInputError={setInputError}
            loading={loading}
            handleCheck={handleCheck}
            handleRandomExample={handleRandomExample}
            file={file}
            preview={preview}
            handleFileSelect={handleFileSelect}
            handleRemoveFile={handleRemoveFile}
          />

          <LoadingOverlay loading={loading} />
      
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-bottom-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DetectionResult 
            result={result}
            setFeedbackOpen={setFeedbackOpen}
          />

          {/* Feedback Dialog */}
          {result && (
            <FeedbackDialog
              open={feedbackOpen}
              onOpenChange={setFeedbackOpen}
              requestId={result.request_id}
            />
          )}
        </div>
      </div>
    </>
  );
}
