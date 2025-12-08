"use client";

import { StructuredData } from "@/components/StructuredData";
import { checkBreadcrumb } from "@/lib/structured-data";
import { BatchUploader } from "@/features/check/components/BatchUploader";
import { BatchResultsTable } from "@/features/check/components/BatchResultsTable";
import { useState } from "react";
import { PublicBatchResponse } from "@/lib/api";

export default function BatchCheckPage() {
  const [batchResult, setBatchResult] = useState<PublicBatchResponse | null>(null);

  return (
    <>
      <StructuredData data={checkBreadcrumb} />
      <div className="container px-4 py-8 md:py-12 mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white">
            ตรวจสอบรูปภาพแบบ Batch
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            อัปโหลดรูปภาพได้สูงสุด 10 รูปพร้อมกัน AI จะวิเคราะห์ทุกรูปในครั้งเดียว
          </p>
        </div>

        {!batchResult ? (
          <BatchUploader onComplete={setBatchResult} />
        ) : (
          <BatchResultsTable result={batchResult} onReset={() => setBatchResult(null)} />
        )}
      </div>
    </>
  );
}
