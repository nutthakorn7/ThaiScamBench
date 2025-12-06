"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps {
  className?: string;
}

export function AnimatedProgress({ className }: AnimatedProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Hold at 90% until done
        const diff = Math.random() * 10;
        return Math.min(prev + diff, 90);
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>กำลังวิเคราะห์ข้อมูล...</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
