"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ScanningRadar } from "@/components/ui/scanning-radar";

interface LoadingOverlayProps {
  loading: boolean;
}

export function LoadingOverlay({ loading }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-8"
        >
          <Card className="glass-card border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10 overflow-hidden relative">
            {/* Background scanning line */}
            <motion.div 
               animate={{ top: ["0%", "100%", "0%"] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 blur-sm"
            />
            
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center gap-8">
                <ScanningRadar />
                
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 animate-pulse">
                    AI กำลังวิเคราะห์...
                  </h3>
                  <p className="text-lg text-muted-foreground font-medium">
                    กำลังตรวจสอบฐานข้อมูลและรูปแบบข้อความ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
